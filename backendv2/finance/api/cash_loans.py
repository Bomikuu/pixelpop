"""Private cash-loan endpoints, using domain services rather than generic CRUD."""

from django.db import transaction
from decimal import Decimal
from django.shortcuts import get_object_or_404
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from finance.models import CashLoan, CashLoanAllocation, Deadline
from finance.services.balances import today
from finance.services.cash_loans.calculations import calculate_loan, compare_terms
from finance.services.cash_loans.ledger import create_cash_loan, json_values, operation, post_charges, record_event
from finance.services.cash_loans.lifecycle import amend_cash_loan, cancel_cash_loan, preview_settlement, settle_cash_loan
from finance.services.cash_loans.payments import allocate_payment, reverse_allocation
from finance.services.cash_loans.projections import loan_detail, loan_history, payment_candidates
from .views import FinancePagination, PrivateMixin


class QuoteSerializer(serializers.Serializer):
    loan_amount = serializers.DecimalField(max_digits=14, decimal_places=2, min_value=Decimal("0.01"))
    rate = serializers.DecimalField(max_digits=12, decimal_places=6, min_value=0)
    rate_period = serializers.ChoiceField(choices=("monthly", "annual_nominal"), default="monthly")
    interest_method = serializers.ChoiceField(choices=("add_on", "diminishing"), default="add_on")
    term_months = serializers.IntegerField(min_value=1, max_value=1200)
    fee_kind = serializers.ChoiceField(choices=("fixed", "percentage"), default="fixed")
    fee_value = serializers.CharField(default="0")
    fee_treatment = serializers.ChoiceField(choices=("upfront", "separate", "financed"), default="separate")
    monthly_charge = serializers.DecimalField(max_digits=14, decimal_places=2, min_value=0, default=0)
    loan_date = serializers.DateField()
    first_payment_date = serializers.DateField()
    credit_policy = serializers.ChoiceField(choices=("principal", "full_installments"), default="principal")


class CreateSerializer(QuoteSerializer):
    name = serializers.CharField(max_length=160)
    card_id = serializers.IntegerField(min_value=1)
    receiving_account_id = serializers.IntegerField(min_value=1)
    request_id = serializers.UUIDField()


class AllocationSerializer(serializers.Serializer):
    installment_id = serializers.IntegerField(min_value=1, allow_null=True, required=False, default=None)
    principal = serializers.CharField(default="0")
    interest = serializers.CharField(default="0")
    fees = serializers.CharField(default="0")


class PostingSerializer(serializers.Serializer):
    installment_id = serializers.IntegerField(min_value=1, required=False)
    interest = serializers.CharField(default="0")
    fees = serializers.CharField(default="0")


class PaymentSerializer(serializers.Serializer):
    request_id = serializers.UUIDField()
    movement_id = serializers.IntegerField(min_value=1, required=False)
    source_account_id = serializers.IntegerField(min_value=1, required=False)
    amount = serializers.CharField(required=False)
    date = serializers.DateField(required=False, default=today)
    allocations = AllocationSerializer(many=True)
    postings = PostingSerializer(many=True, required=False, default=list)

    def validate(self, attrs):
        if attrs.get("movement_id") and (attrs.get("source_account_id") or attrs.get("amount")):
            raise serializers.ValidationError("Choose either an existing payment or a new payment, not both.")
        if not attrs.get("movement_id") and (not attrs.get("source_account_id") or not attrs.get("amount")):
            raise serializers.ValidationError({"source_account_id": "Choose a paying account and enter the payment amount."})
        return attrs


def validated(cls, data):
    serializer = cls(data=data)
    serializer.is_valid(raise_exception=True)
    return json_values(serializer.validated_data)


class CashLoanQuoteView(PrivateMixin, APIView):
    def post(self, request):
        values = validated(QuoteSerializer, request.data)
        return Response(json_values(calculate_loan(values)))


class CashLoanCompareView(PrivateMixin, APIView):
    def post(self, request):
        values = validated(QuoteSerializer, request.data)
        return Response(json_values(compare_terms(values, request.data.get("months", [6, 12, 18, 24, 36]))))


class CashLoanListView(PrivateMixin, APIView):
    def get(self, request):
        rows = CashLoan.objects.order_by("-pk")
        if request.query_params.get("card_id"):
            field = serializers.IntegerField(min_value=1)
            rows = rows.filter(card_id=field.run_validation(request.query_params["card_id"]))
        paginator = FinancePagination()
        page = paginator.paginate_queryset(rows, request, view=self)
        return paginator.get_paginated_response([loan_detail(row.pk, compact=True) for row in page])

    def post(self, request):
        result = create_cash_loan(validated(CreateSerializer, request.data), request.user)
        return Response(loan_detail(result["loan_id"]), status=status.HTTP_201_CREATED)


class CashLoanDetailView(PrivateMixin, APIView):
    def get(self, request, pk):
        get_object_or_404(CashLoan, pk=pk)
        return Response(loan_detail(pk))

    @transaction.atomic
    def patch(self, request, pk):
        loan = get_object_or_404(CashLoan.objects.select_for_update(), pk=pk)
        if set(request.data) - {"name", "version"}:
            raise serializers.ValidationError("Financial terms require an explicit amendment.")
        version = serializers.IntegerField(min_value=1).run_validation(request.data.get("version"))
        if version != loan.version:
            return Response({"version": "This loan changed. Refresh before saving."}, status=409)
        name = serializers.CharField(max_length=160).run_validation(request.data.get("name"))
        before = loan.name
        loan.name = name
        loan.version += 1
        loan.save(update_fields=["name", "version", "updated_at"])
        from finance.services.cash_loans.projections import materialize_cash_loan_deadlines
        materialize_cash_loan_deadlines(pk)
        record_event(loan, request.user, "edited", {"previous_name": before, "name": name}, f"cash-name:{pk}:{loan.version}")
        return Response(loan_detail(pk))


class CashLoanActionView(PrivateMixin, APIView):
    action = ""

    def get(self, request, pk):
        loan = get_object_or_404(CashLoan, pk=pk)
        if self.action == "history":
            rows = loan_history(pk, request.query_params.get("month"))
            paginator = FinancePagination()
            page = paginator.paginate_queryset(rows, request, view=self)
            return paginator.get_paginated_response(page)
        if self.action == "payment-candidates":
            statements = Deadline.objects.filter(credit_card=loan.card, cash_loan__isnull=True, settlement_kind="credit_card_payment", status="pending").order_by("due_date")
            return Response({"payments": payment_candidates(loan.card_id), "statements": [{"id": s.pk, "title": s.title, "due_date": s.due_date, "amount": s.amount} for s in statements]})
        return Response(status=405)

    def post(self, request, pk):
        loan = get_object_or_404(CashLoan, pk=pk)
        if self.action == "payments":
            values = validated(PaymentSerializer, request.data)
            result = allocate_payment({**values, "loan_id": pk}, request.user)
        elif self.action == "settlement-preview":
            return Response(preview_settlement(pk, request.data))
        else:
            # Validate action identifiers before domain services see raw ids.
            values = dict(request.data)
            values["request_id"] = str(serializers.UUIDField().run_validation(values.get("request_id")))
            for key in ("account_id", "installment_id", "source_account_id", "movement_id", "version", "statement_id"):
                if values.get(key) is not None:
                    values[key] = serializers.IntegerField(min_value=1).run_validation(values[key])
            if self.action == "post":
                result = post_charges(pk, values, request.user)
            elif self.action in ("settle", "cancel"):
                if not values.get("source_account_id") and not values.get("movement_id"):
                    raise serializers.ValidationError({"source_account_id": "Choose a paying account or existing payment."})
                result = (settle_cash_loan if self.action == "settle" else cancel_cash_loan)(pk, values, request.user)
            elif self.action == "amend":
                result = amend_cash_loan(pk, values, request.user)
            elif self.action == "link-statement":
                def link():
                    locked = CashLoan.objects.select_for_update().get(pk=pk)
                    item = get_object_or_404(locked.installments, pk=values.get("installment_id"), active=True)
                    statement = get_object_or_404(Deadline, pk=values["statement_id"], credit_card=locked.card, cash_loan__isnull=True, settlement_kind="credit_card_payment", status="pending") if values.get("statement_id") else None
                    item.statement = statement
                    item.save(update_fields=["statement"])
                    record_event(locked, request.user, "allocated", {"installment": item.pk, "statement": statement.pk if statement else None}, f"cash-statement:{values['request_id']}")
                    return {"loan_id": pk}
                result = operation({**values, "loan_id": pk}, "link_statement", request.user, link)
            else:
                return Response(status=405)
        return Response({**result, "loan": loan_detail(pk)})


class CashLoanAllocationReverseView(PrivateMixin, APIView):
    def post(self, request, pk, allocation_id):
        get_object_or_404(CashLoanAllocation, pk=allocation_id, loan_id=pk)
        key = str(serializers.UUIDField().run_validation(request.data.get("request_id")))
        result = reverse_allocation(allocation_id, {"request_id": key}, request.user)
        return Response({**result, "loan": loan_detail(pk)})
