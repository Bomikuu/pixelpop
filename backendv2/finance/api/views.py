from datetime import timedelta
from decimal import Decimal

from django.db import transaction
from django.db.models import ProtectedError, Q
from django.middleware.csrf import get_token
from rest_framework import status, viewsets
from rest_framework.authentication import SessionAuthentication
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from finance import models
from finance.services.balances import today, total, outstanding, account_balance, ensure_account_capacity, validate_fund_history
from finance.services.queries import filtered, month_range, by_person
from finance.services.recurrence import materialize
from finance.services.settlements import action_date, move_money, settle_deadline
from finance.services.summaries import overview, transaction_summary, deadline_summary
from finance.services.charts import record_charts
from finance.services.account_detail import account_ledger, account_summary
from finance.services.asset_financing import financing_balance, financing_projection, installment_paid, materialize_installments, record_payment, terms_on
from finance.services.audit import log_record, snapshot_record, record_label
from .serializers import AccountSerializer, AssetFinancingPaymentSerializer, AssetFinancingSerializer, AssetFinancingTermsSerializer, AssetSerializer, CategorySerializer, DeadlineSerializer, LoanSerializer, MovementSerializer, PersonSerializer, ScheduleSerializer, SettingsSerializer, TransactionSerializer


def json_money(value):
    if isinstance(value, Decimal):
        return str(value.quantize(Decimal("0.01")))
    if isinstance(value, dict):
        return {k: json_money(v) for k, v in value.items()}
    if isinstance(value, list):
        return [json_money(v) for v in value]
    return value


class PrivateMixin:
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)
        response["Cache-Control"] = "private, no-store"
        response["Vary"] = "Cookie"
        return response


class FinancePagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100

    def get_page_number(self, request, paginator):
        number = super().get_page_number(request, paginator)
        try:
            return min(max(int(number), 1), paginator.num_pages)
        except (ValueError, TypeError):
            return number


class AuditCrudMixin:
    """One semantic event for each successful standard CRUD request."""

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        if response.status_code == status.HTTP_201_CREATED:
            instance = self.queryset.model.objects.get(pk=response.data["id"])
            log_record(instance, actor=request.user, action="added", after=snapshot_record(instance))
        return response

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        before = snapshot_record(instance)
        response = super().update(request, *args, **kwargs)
        instance.refresh_from_db()
        log_record(instance, actor=request.user, action="edited", before=before, after=snapshot_record(instance))
        return response

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        before = snapshot_record(instance)
        subject_id, label = instance.pk, record_label(instance)
        response = super().destroy(request, *args, **kwargs)
        still_exists = self.queryset.model.objects.filter(pk=subject_id).exists()
        if still_exists:
            instance.refresh_from_db()
        after = snapshot_record(instance) if still_exists else None
        if before != after:
            log_record(instance, actor=request.user, action="deleted", before=before,
                       after=after, subject_id=subject_id, label=label)
        return response


class FinanceViewSet(AuditCrudMixin, PrivateMixin, viewsets.ModelViewSet):
    pagination_class = FinancePagination
    filter_backends = []
    date_field = None
    search_fields = ("name",)

    def get_queryset(self):
        qs = super().get_queryset().order_by("-id")
        params = self.request.query_params
        if self.date_field:
            return filtered(qs, params, self.date_field, self.search_fields)
        q = params.get("q", "").strip()
        if len(q) > 160:
            raise ValidationError({"q": "Use at most 160 characters."})
        if q:
            condition = Q()
            for field in self.search_fields:
                condition |= Q(**{field + "__icontains": q})
            qs = qs.filter(condition)
        return qs

    def summary(self, qs):
        return {"count": qs.count()}

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        summary = self.summary(qs)
        page = self.paginate_queryset(qs)
        response = self.get_paginated_response(self.get_serializer(page, many=True).data)
        response.data["summary"] = json_money(summary)
        response.data["charts"] = json_money(record_charts(qs, self.queryset, request.query_params, self.date_field, self.search_fields))
        return response

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


    def create(self, request, *args, **kwargs):
        # Resolve uncertain network retries without applying another ledger write.
        if request.data.get("request_id") and self.queryset.model in (models.Transaction, models.LoanReceivable):
            from finance.services.settlements import request_key
            existing = self.queryset.model.objects.filter(request_id=request_key(request.data)).first()
            if existing:
                serializer = self.get_serializer(existing, data=request.data)
                serializer.is_valid(raise_exception=True)
                if any(value != getattr(existing, field) for field, value in serializer.validated_data.items()):
                    raise ValidationError("This request identifier already belongs to a different record.")
                return Response(self.get_serializer(existing).data)
        return super().create(request, *args, **kwargs)

    def perform_destroy(self, instance):
        try:
            if hasattr(instance, "active"):
                instance.active = False
                instance.save(update_fields=["active", "updated_at"])
            else:
                instance.delete()
        except ProtectedError:
            raise ValidationError("This record has financial history and cannot be deleted.")


class PersonViewSet(AuditCrudMixin, PrivateMixin, viewsets.ModelViewSet):
    queryset = models.Person.objects.all().order_by("name", "id")
    serializer_class = PersonSerializer
    pagination_class = FinancePagination
    http_method_names = ["get", "post", "patch", "head", "options"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class AccountViewSet(FinanceViewSet):
    queryset = models.Account.objects.all()
    serializer_class = AccountSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.query_params.get("kind"):
            qs = qs.filter(kind=self.request.query_params["kind"])
        if self.request.query_params.get("coverage") == "1":
            qs = qs.filter(kind="fund", fund_type__in=models.Account.COVERAGE_TYPES)
        elif self.request.query_params.get("coverage") == "0":
            qs = qs.exclude(kind="fund", fund_type__in=models.Account.COVERAGE_TYPES)
        if self.request.query_params.get("exclude_funds") == "1":
            qs = qs.exclude(kind="fund")
        return qs

    def summary(self, qs):
        rows = list(qs)
        limited = [r for r in rows if r.kind == "credit_card" and r.credit_limit]
        limit = sum((r.credit_limit for r in limited), Decimal(0))
        debt = sum((account_balance(r) for r in limited), Decimal(0))
        start, end = month_range(self.request.query_params.get("chart_month") or self.request.query_params.get("month"))
        fund_ids = [r.pk for r in rows if r.kind == "fund" and r.fund_type not in models.Account.COVERAGE_TYPES]
        movements = models.MoneyMovement.objects.filter(date__range=(start, end))
        return {"count": len(rows), "available": sum((account_balance(r) for r in rows if r.kind in models.Account.CASH_KINDS), Decimal(0)), "funds": sum((account_balance(r) for r in rows if r.pk in fund_ids), Decimal(0)), "contributions": total(movements.filter(kind="fund_contribution", destination_id__in=fund_ids)), "withdrawals": total(movements.filter(kind="fund_withdrawal", source_id__in=fund_ids)), "debt": sum((account_balance(r) for r in rows if r.kind == "credit_card"), Decimal(0)), "utilization": debt / limit * 100 if limit else None}

    @action(detail=True, methods=["get"], url_path="detail", url_name="detail")
    def account_detail(self, request, pk=None):
        account = self.get_object()
        month = request.query_params.get("month") or today().strftime("%Y-%m")
        is_coverage = account.kind == "fund" and account.fund_type in models.Account.COVERAGE_TYPES
        result = {"summary": {}, "charts": {}} if is_coverage else account_summary(account, month)
        details = {"account": self.get_serializer(account).data, **result}
        if is_coverage:
            start, end = month_range(month)
            premiums = models.Transaction.objects.filter(coverage=account, kind="expense")
            details["premium_summary"] = {
                "paid_this_month": total(premiums.filter(date__range=(start, end))),
                "paid_total": total(premiums),
                "payment_count": premiums.count(),
            }
            schedule = models.RecurringSchedule.objects.filter(coverage=account).first()
            if schedule:
                if schedule.active:
                    materialize(today() + timedelta(days=100))
                dues = list(schedule.deadlines.filter(status="pending").order_by("due_date", "id")[:4])
                details["premium_schedule"] = ScheduleSerializer(schedule).data
                details["premium_dues"] = DeadlineSerializer(dues, many=True).data
                details["next_premium_due"] = str(dues[0].due_date) if dues else str(schedule.anchor_date) if schedule.active and schedule.anchor_date > today() else None
        return Response(json_money(details))

    @action(detail=True, methods=["get"])
    def ledger(self, request, pk=None):
        account = self.get_object()
        entries = account_ledger(account, request.query_params.get("month") or None)
        page = self.paginate_queryset(entries)
        return self.get_paginated_response(json_money(page))

    @transaction.atomic
    def perform_create(self, serializer):
        data = serializer.validated_data
        opening = data.pop("opening_balance", 0)
        opening_date = data.pop("opening_date", today())
        account = serializer.save(created_by=self.request.user)
        models.BalanceAdjustment.objects.create(account=account, amount=opening, date=opening_date, reason="Opening balance" if account.kind != "credit_card" else "Opening debt", created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.validated_data.pop("opening_balance", None)
        serializer.validated_data.pop("opening_date", None)
        serializer.save()

    @transaction.atomic
    def perform_destroy(self, instance):
        super().perform_destroy(instance)
        schedule = models.RecurringSchedule.objects.filter(coverage=instance, active=True).first()
        if schedule:
            schedule.active = False
            schedule.save(update_fields=["active", "updated_at"])
            schedule.deadlines.filter(status="pending", due_date__gte=today()).delete()

    @action(detail=True, methods=["post"])
    @transaction.atomic
    def adjust(self, request, pk=None):
        account = models.Account.objects.select_for_update().get(pk=self.get_object().pk)
        if account.kind == "fund" and account.fund_type in models.Account.COVERAGE_TYPES:
            raise ValidationError({"account": "Coverage has no cash value to adjust."})
        try:
            value = Decimal(str(request.data["amount"]))
            if not value.is_finite() or value.as_tuple().exponent < -2 or abs(value) >= Decimal("1000000000000"):
                raise ValueError
        except (KeyError, ValueError, ArithmeticError):
            raise ValidationError({"amount": "Enter a signed amount with at most two decimal places."})
        reason = str(request.data.get("reason", "")).strip()
        if not reason or len(reason) > 240:
            raise ValidationError({"reason": "Explain this correction in at most 240 characters."})
        from finance.services.settlements import request_key
        key = request_key(request.data)
        day = action_date(request.data.get("date"))
        existing = models.BalanceAdjustment.objects.filter(request_id=key).first()
        if existing:
            if (existing.account_id, existing.amount, existing.date, existing.reason) != (account.pk, value, day, reason):
                raise ValidationError("This request identifier was already used for a different correction.")
        else:
            adjustment = models.BalanceAdjustment.objects.create(request_id=key, account=account, amount=value, date=day, reason=reason, created_by=request.user)
            if account.kind == "fund":
                validate_fund_history(account, day)
            log_record(adjustment, actor=request.user, action="adjusted",
                       after=snapshot_record(adjustment), operation_key=f"adjustment:{key}")
        return Response(self.get_serializer(account).data)

    @action(detail=True, methods=["get"])
    def history(self, request, pk=None):
        account = self.get_object()
        entries = [{"id": r.pk, "date": str(r.date), "name": r.name, "kind": r.kind, "amount": str(r.amount)} for r in account.transactions.filter(asset_financing_payment__isnull=True).order_by("-date")[:100]]
        entries += [{"id": r.pk, "date": str(r.date), "name": r.kind.replace("_", " ") + " — " + ((r.destination.name if r.destination else "") if r.source_id == account.pk else (r.source.name if r.source else "")), "kind": r.kind, "amount": str(-r.amount if r.source_id == account.pk and account.kind == "fund" else r.amount)} for r in models.MoneyMovement.objects.select_related("source", "destination").filter(Q(source=account) | Q(destination=account)).order_by("-date", "-pk")[:100]]
        entries += [{"id": r.pk, "date": str(r.date), "name": r.reason, "kind": "adjustment", "amount": str(r.amount)} for r in account.adjustments.order_by("-date")[:100]]
        entries += [{"id": r.pk, "date": str(r.date), "name": r.financing.asset.name + " financing payment", "kind": "asset_financing_payment", "amount": str(r.cash_amount)} for r in account.asset_financing_payments.filter(historical=False, cash_amount__gt=0).select_related("financing__asset").order_by("-date", "-pk")[:100]]
        return Response(sorted(entries, key=lambda r: r["date"], reverse=True)[:100])


class TransactionViewSet(FinanceViewSet):
    queryset = models.Transaction.objects.select_related("account", "category", "coverage")
    serializer_class = TransactionSerializer
    date_field = "date"
    search_fields = ("name", "recipient", "notes", "category__name")

    def get_queryset(self):
        qs = super().get_queryset()
        coverage_id = self.request.query_params.get("coverage")
        if coverage_id is not None:
            try:
                identifier = int(coverage_id)
                if identifier <= 0:
                    raise ValueError
            except (TypeError, ValueError):
                raise ValidationError({"coverage": "Choose a valid coverage record."})
            qs = qs.filter(coverage_id=identifier, kind="expense")
        account_id = self.request.query_params.get("account")
        if account_id is None:
            return qs
        try:
            identifier = int(account_id)
            if identifier <= 0:
                raise ValueError
        except (TypeError, ValueError):
            raise ValidationError({"account": "Choose a valid account."})
        return qs.filter(account_id=identifier)

    def summary(self, qs):
        return transaction_summary(qs)

    @transaction.atomic
    def perform_create(self, serializer):
        account = serializer.validated_data["account"]
        account = models.Account.objects.select_for_update().get(pk=account.pk)
        entry = serializer.save(created_by=self.request.user)
        if entry.kind == "expense":
            ensure_account_capacity(account, entry.date)

    @transaction.atomic
    def perform_update(self, serializer):
        previous = serializer.instance
        old_account_id, old_amount, old_date, old_kind = previous.account_id, previous.amount, previous.date, previous.kind
        next_account = serializer.validated_data.get("account", previous.account)
        locked = {
            account.pk: account for account in models.Account.objects.select_for_update()
            .filter(pk__in={old_account_id, next_account.pk}).order_by("pk")
        }
        entry = serializer.save()
        if entry.kind == "expense" and not (
            old_kind == "expense" and entry.account_id == old_account_id
            and entry.amount <= old_amount and entry.date >= old_date
        ):
            ensure_account_capacity(locked[entry.account_id], entry.date)

    def perform_destroy(self, instance):
        if instance.deadline_id or instance.schedule_id or instance.asset_financing_payment_id or hasattr(instance, "shared_payment"):
            raise ValidationError("Linked settlement/schedule history cannot be deleted. Use an explicit correction.")
        super().perform_destroy(instance)


class DeadlineViewSet(FinanceViewSet):
    queryset = models.Deadline.objects.select_related("category", "loan", "credit_card", "asset_financing")
    serializer_class = DeadlineSerializer
    date_field = "due_date"
    search_fields = ("title", "notes", "category__name")

    def get_queryset(self):
        if self.request.query_params.get("undated") == "1":
            params = self.request.query_params.copy()
            params.pop("month", None)
            params.pop("chart_month", None)
            qs = filtered(self.queryset.filter(due_date__isnull=True, kind__in=("task", "reminder")), params, self.date_field, self.search_fields)
            return qs.order_by("-created_at", "-id")
        _, end = month_range(self.request.query_params.get("chart_month") or self.request.query_params.get("month"))
        materialize(end + timedelta(days=95))
        for financing in models.AssetFinancing.objects.select_related("asset"):
            materialize_installments(financing)
        qs = super().get_queryset()
        if self.request.query_params.get("bills") == "1":
            qs = qs.filter(kind__in=["bill", "subscription", "payment"]).exclude(settlement_kind="loan_collection")
        if self.request.query_params.get("urgency") == "overdue":
            from finance.services.summaries import urgency
            qs = qs.filter(pk__in=[r.pk for r in qs.filter(status="pending") if urgency(r) == "overdue"])
        return qs.order_by("due_date", "due_time", "id")

    def summary(self, qs):
        return deadline_summary(qs)

    @action(detail=True, methods=["post"])
    @transaction.atomic
    def settle(self, request, pk=None):
        item = self.get_object()
        before = snapshot_record(item)
        try:
            result = settle_deadline(item.pk, request.data, request.user)
        except (ValueError, TypeError):
            raise ValidationError("Choose a valid account, amount and date.")
        log_record(result, actor=request.user, action="settled", before=before,
                   after=snapshot_record(result), operation_key=f"deadline-settled:{item.pk}")
        return Response(self.get_serializer(result).data)

    def perform_destroy(self, instance):
        if instance.status != "pending" or instance.schedule_id or instance.loan_id or instance.asset_financing_id:
            raise ValidationError("Settled, recurring or loan-linked history cannot be deleted.")
        super().perform_destroy(instance)


class LoanViewSet(FinanceViewSet):
    queryset = models.LoanReceivable.objects.all()
    serializer_class = LoanSerializer
    search_fields = ("person", "notes")

    def perform_destroy(self, instance):
        if hasattr(instance, "shared_participant"):
            raise ValidationError("Archive the shared bill instead of its linked advance.")
        super().perform_destroy(instance)

    def get_queryset(self):
        qs = super().get_queryset()
        person = self.request.query_params.get("person", "").strip()
        if person:
            qs = by_person(qs, "person", person)
        return qs

    def summary(self, qs):
        rows = list(qs)
        dates = [r.due_date for r in rows if r.due_date and outstanding(r) > 0]
        return {"count": len(rows), "outstanding": sum((outstanding(r) for r in rows), Decimal(0)), "lent": total(qs, "principal"), "repaid": total(models.MoneyMovement.objects.filter(loan__in=qs, kind="loan_repayment", date__lte=today())), "people": len({r.person.casefold() for r in rows}), "overdue": sum((outstanding(r) for r in rows if r.due_date and r.due_date < today()), Decimal(0)), "next_collection": str(min(dates)) if dates else None}

    @transaction.atomic
    def perform_create(self, serializer):
        loan = serializer.save(created_by=self.request.user)
        if not loan.existing:
            move_money({"kind": "loan_disbursement", "amount": loan.principal, "source": loan.account_id, "loan": loan.pk, "date": loan.date}, self.request.user)
        if loan.due_date:
            models.Deadline.objects.create(title="Collect from " + loan.person, kind="payment", amount=loan.principal, due_date=loan.due_date, loan=loan, settlement_kind="loan_collection", created_by=self.request.user)

    @transaction.atomic
    def perform_update(self, serializer):
        loan = serializer.save()
        if loan.due_date and outstanding(loan) > 0:
            loan.deadlines.filter(status="pending").update(title="Collect from " + loan.person, due_date=loan.due_date)
            if not loan.deadlines.filter(status="pending").exists():
                models.Deadline.objects.create(title="Collect from " + loan.person, kind="payment", due_date=loan.due_date, loan=loan, settlement_kind="loan_collection", created_by=self.request.user)
        elif not loan.due_date:
            loan.deadlines.filter(status="pending").delete()

    @action(detail=True, methods=["get"])
    def history(self, request, pk=None):
        return Response(MovementSerializer(self.get_object().movements.order_by("-date", "-pk")[:100], many=True).data)


class AssetViewSet(FinanceViewSet):
    queryset = models.Asset.objects.select_related("financing")
    serializer_class = AssetSerializer
    search_fields = ("name", "notes")

    def perform_update(self, serializer):
        asset = serializer.save()
        if hasattr(asset, "financing"):
            asset.financing.installments.filter(status="pending").update(title=asset.name + " financing")

    def perform_destroy(self, instance):
        if hasattr(instance, "financing") and financing_balance(instance.financing) > 0:
            raise ValidationError("Pay off or resolve the linked financing before archiving this asset.")
        super().perform_destroy(instance)

    def summary(self, qs):
        financed = [asset.financing for asset in qs.filter(active=True) if hasattr(asset, "financing")]
        financing_debt = sum((financing_balance(f) for f in financed), Decimal(0))
        return {"count": qs.count(), "value": total(qs.filter(active=True), "value"), "house": total(qs.filter(active=True, kind__in=["house", "condo", "land"]), "value"), "car": total(qs.filter(active=True, kind__in=["car", "motorcycle"]), "value"), "other": total(qs.filter(active=True).exclude(kind__in=["house", "condo", "land", "car", "motorcycle"]), "value"), "financing_debt": financing_debt, "estimated_equity": total(qs.filter(active=True), "value") - financing_debt}

    def financing_response(self, asset):
        financing = asset.financing if hasattr(asset, "financing") else None
        if not financing:
            return {"asset": self.get_serializer(asset).data, "financing": None}
        return {
            "asset": self.get_serializer(asset).data,
            "financing": {
                **AssetFinancingSerializer(financing).data,
                **financing_projection(financing),
                "term_changes": AssetFinancingTermsSerializer(financing.term_changes.order_by("effective_date", "pk"), many=True).data,
                "payments": AssetFinancingPaymentSerializer(financing.payments.select_related("account", "deadline").order_by("-date", "-pk"), many=True).data,
            },
        }

    @action(detail=True, methods=["get", "post"], url_path="financing")
    @transaction.atomic
    def financing(self, request, pk=None):
        asset = self.get_object()
        if request.method == "GET":
            return Response(self.financing_response(asset))
        asset = models.Asset.objects.select_for_update().get(pk=asset.pk)
        if not asset.active or hasattr(asset, "financing"):
            raise ValidationError({"asset": "Choose an active asset without financing. Update existing terms from its detail page."})
        serializer = AssetFinancingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        financing = serializer.save(asset=asset, created_by=request.user)
        log_record(financing, actor=request.user, action="added", after=snapshot_record(financing))
        return Response(self.financing_response(models.Asset.objects.get(pk=asset.pk)), status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="financing/terms")
    @transaction.atomic
    def financing_terms(self, request, pk=None):
        financing = models.AssetFinancing.objects.select_for_update().filter(asset_id=self.get_object().pk).first()
        if not financing:
            raise ValidationError({"asset": "Add financing to this asset first."})
        if not financing.asset.active:
            raise ValidationError({"asset": "Archived assets cannot change financing terms."})
        serializer = AssetFinancingTermsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        effective = serializer.validated_data["effective_date"]
        existing = financing.term_changes.filter(effective_date=effective).first()
        if existing:
            if existing.annual_rate == serializer.validated_data["annual_rate"] and existing.monthly_due == serializer.validated_data["monthly_due"]:
                return Response(self.financing_response(financing.asset))
            raise ValidationError({"effective_date": "A different terms update already exists for this date."})
        pending = financing.installments.filter(status="pending", due_date__gte=effective)
        terms = serializer.save(financing=financing, created_by=request.user)
        for item in pending:
            next_due = terms_on(financing, item.due_date)[1]
            if installment_paid(item) > next_due:
                raise ValidationError({"monthly_due": "The new due cannot be below an amount already paid toward an installment."})
            item.amount = next_due
            item.save(update_fields=["amount", "updated_at"])
        log_record(terms, actor=request.user, action="added", after=snapshot_record(terms))
        return Response(self.financing_response(financing.asset))

    @action(detail=True, methods=["post"], url_path="financing/payments")
    @transaction.atomic
    def financing_payments(self, request, pk=None):
        financing = models.AssetFinancing.objects.filter(asset_id=self.get_object().pk).first()
        if not financing:
            raise ValidationError({"asset": "Add financing to this asset first."})
        serializer = AssetFinancingPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payment = record_payment(financing, serializer.validated_data, request.user)
        log_record(payment, actor=request.user, action="paid", after=snapshot_record(payment),
                   operation_key=f"asset-payment:{payment.request_id}")
        return Response({"payment": AssetFinancingPaymentSerializer(payment).data, **self.financing_response(financing.asset)})


class CategoryViewSet(FinanceViewSet):
    queryset = models.Category.objects.all()
    serializer_class = CategorySerializer


class ScheduleViewSet(FinanceViewSet):
    queryset = models.RecurringSchedule.objects.all()
    serializer_class = ScheduleSerializer
    search_fields = ("title", "notes")

    @transaction.atomic
    def perform_create(self, serializer):
        schedule = serializer.save(created_by=self.request.user)
        if schedule.coverage_id:
            materialize(today() + timedelta(days=100))

    @transaction.atomic
    def perform_update(self, serializer):
        schedule = serializer.save()
        schedule.deadlines.filter(status="pending").update(important=schedule.important)
        # Pending future occurrences are projections, not settlement history.
        if schedule.coverage_id:
            schedule.deadlines.filter(status="pending", due_date__gte=today()).delete()
        else:
            schedule.deadlines.filter(status="pending", due_date__gt=today()).delete()
        models.Transaction.objects.filter(schedule=schedule, receipt_state="expected", date__gt=today()).delete()
        if schedule.coverage_id:
            materialize(today() + timedelta(days=100))
        else:
            materialize()

    @transaction.atomic
    def perform_destroy(self, instance):
        super().perform_destroy(instance)
        instance.deadlines.filter(status="pending", due_date__gt=today()).delete()
        models.Transaction.objects.filter(schedule=instance, receipt_state="expected", date__gt=today()).delete()


class MovementViewSet(PrivateMixin, viewsets.ReadOnlyModelViewSet):
    queryset = models.MoneyMovement.objects.select_related("source", "destination").order_by("-date", "-id")
    serializer_class = MovementSerializer
    pagination_class = FinancePagination
    filter_backends = []

    def get_queryset(self):
        qs = filtered(super().get_queryset(), self.request.query_params, "date", ("notes", "source__name", "destination__name"))
        if self.request.query_params.get("person"):
            qs = by_person(qs.filter(kind="loan_repayment", loan__isnull=False), "loan__person", self.request.query_params["person"])
        return qs

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        summary = {"count": qs.count(), "card_payments": total(qs.filter(kind="credit_card_payment")), "lent": total(qs.filter(kind="loan_disbursement")), "collected": total(qs.filter(kind="loan_repayment"))}
        summary["contributions"] = total(qs.filter(kind="fund_contribution"))
        summary["withdrawals"] = total(qs.filter(kind="fund_withdrawal"))
        summary["net_cash"] = summary["collected"] + summary["withdrawals"] - summary["lent"] - summary["card_payments"] - summary["contributions"]
        response = super().list(request, *args, **kwargs)
        response.data["summary"] = json_money(summary)
        return response

    @transaction.atomic
    def create(self, request):
        serializer = self.get_serializer(data=request.data)
        # Identifier uniqueness is checked by the atomic service to support safe retry.
        serializer.fields["request_id"].validators = []
        serializer.is_valid(raise_exception=True)
        values = {k: v.pk if isinstance(v, (models.Account, models.LoanReceivable)) else v for k, v in serializer.validated_data.items()}
        result = move_money(values, request.user)
        log_record(result, actor=request.user, action="added", after=snapshot_record(result),
                   operation_key=f"movement:{result.request_id}")
        return Response(self.get_serializer(result).data, status=status.HTTP_201_CREATED)


class SessionView(PrivateMixin, APIView):
    def get(self, request):
        return Response({"user": {"id": request.user.pk, "name": request.user.get_full_name() or request.user.get_username(), "can_backup": request.user.is_staff}, "csrfToken": get_token(request)})


class DatabaseBackupView(PrivateMixin, APIView):
    # Full snapshots include password hashes and sessions, unlike finance-only data.
    permission_classes = [IsAdminUser]

    def get(self, request):
        from finance.services.backup import database_backup
        return database_backup()


class OverviewView(PrivateMixin, APIView):
    def get(self, request):
        return Response(json_money(overview(request.query_params.get("month"))))


class PeopleView(PrivateMixin, APIView):
    def get(self, request):
        from finance.services.people import people_summary
        data = people_summary(request.query_params.get("month"), request.query_params.get("person_key"))
        paginator = FinancePagination()
        rows = paginator.paginate_queryset(data.pop("results"), request, view=self)
        response = paginator.get_paginated_response(json_money(rows))
        response.data.update(json_money(data))
        return response


class SettingsView(PrivateMixin, APIView):
    def get(self, request):
        obj, _ = models.WorkspaceSettings.objects.get_or_create(pk=1)
        return Response(SettingsSerializer(obj).data)

    @transaction.atomic
    def patch(self, request):
        obj, _ = models.WorkspaceSettings.objects.get_or_create(pk=1)
        before = snapshot_record(obj)
        serializer = SettingsSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        log_record(obj, actor=request.user, action="edited", before=before, after=snapshot_record(obj))
        return Response(serializer.data)


class SearchView(PrivateMixin, APIView):
    def get(self, request):
        q = request.query_params.get("q", "").strip()
        if not q:
            return Response([])
        if len(q) > 160:
            raise ValidationError({"q": "Use at most 160 characters."})
        rows = []
        for model, field, tab in ((models.Transaction, "name", "transactions"), (models.Deadline, "title", "deadlines"), (models.Account, "name", "accounts"), (models.Asset, "name", "assets"), (models.LoanReceivable, "person", "loans"), (models.Category, "name", "settings")):
            condition = Q(**{field + "__icontains": q})
            if any(f.name == "notes" for f in model._meta.fields):
                condition |= Q(notes__icontains=q)
            if model == models.Transaction:
                condition |= Q(recipient__icontains=q)
            rows += [{"id": r.pk, "label": getattr(r, field), "tab": "funds" if model == models.Account and r.kind == "fund" else tab} for r in model.objects.filter(condition).order_by("-id")[:10]]
        return Response(rows[:50])


class CalendarView(PrivateMixin, APIView):
    def get(self, request):
        start, end = month_range(request.query_params.get("month"))
        materialize(end)
        deadlines = models.Deadline.objects.filter(due_date__range=(start, end)).select_related("category", "loan", "credit_card", "asset_financing").order_by("due_date", "due_time", "id")
        income = models.Transaction.objects.filter(kind="income", date__range=(start, end)).order_by("date", "id")
        days = sorted({str(d) for d in deadlines.values_list("due_date", flat=True)} | {str(d) for d in income.values_list("date", flat=True)})
        selected = request.query_params.get("day", str(today()))
        from datetime import date
        try:
            selected = date.fromisoformat(selected)
        except ValueError:
            raise ValidationError({"day": "Choose a valid date."})
        view = request.query_params.get("view", "day")
        if view not in {"day", "month"}:
            raise ValidationError({"view": "Choose day or month."})
        shown_deadlines = deadlines if view == "month" else deadlines.filter(due_date=selected)
        shown_income = income if view == "month" else income.filter(date=selected)
        rows = [{**r, "calendar_kind": "deadline"} for r in DeadlineSerializer(shown_deadlines, many=True).data]
        rows += [{"id": r.pk, "title": r.name, "amount": str(r.amount), "due_date": str(r.date), "urgency": r.receipt_state, "calendar_kind": "income"} for r in shown_income]
        summary = deadline_summary(deadlines)
        summary["income_count"] = income.count()
        return Response(json_money({"days": days, "results": rows, "summary": summary}))
