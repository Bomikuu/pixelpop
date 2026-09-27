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
from finance.services.balances import today, total, outstanding, account_balance, validate_fund_history
from finance.services.queries import filtered, month_range, by_person
from finance.services.recurrence import materialize
from finance.services.settlements import action_date, move_money, settle_deadline
from finance.services.summaries import overview, transaction_summary, deadline_summary
from finance.services.charts import record_charts
from .serializers import AccountSerializer, AssetSerializer, CategorySerializer, DeadlineSerializer, LoanSerializer, MovementSerializer, ScheduleSerializer, SettingsSerializer, TransactionSerializer


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


class FinanceViewSet(PrivateMixin, viewsets.ModelViewSet):
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


class AccountViewSet(FinanceViewSet):
    queryset = models.Account.objects.all()
    serializer_class = AccountSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.query_params.get("kind"):
            qs = qs.filter(kind=self.request.query_params["kind"])
        if self.request.query_params.get("exclude_funds") == "1":
            qs = qs.exclude(kind="fund")
        return qs

    def summary(self, qs):
        rows = list(qs)
        limited = [r for r in rows if r.kind == "credit_card" and r.credit_limit]
        limit = sum((r.credit_limit for r in limited), Decimal(0))
        debt = sum((account_balance(r) for r in limited), Decimal(0))
        start, end = month_range(self.request.query_params.get("chart_month") or self.request.query_params.get("month"))
        fund_ids = [r.pk for r in rows if r.kind == "fund"]
        movements = models.MoneyMovement.objects.filter(date__range=(start, end))
        return {"count": len(rows), "available": sum((account_balance(r) for r in rows if r.kind in models.Account.CASH_KINDS), Decimal(0)), "funds": sum((account_balance(r) for r in rows if r.kind == "fund"), Decimal(0)), "contributions": total(movements.filter(kind="fund_contribution", destination_id__in=fund_ids)), "withdrawals": total(movements.filter(kind="fund_withdrawal", source_id__in=fund_ids)), "debt": sum((account_balance(r) for r in rows if r.kind == "credit_card"), Decimal(0)), "utilization": debt / limit * 100 if limit else None}

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

    @action(detail=True, methods=["post"])
    @transaction.atomic
    def adjust(self, request, pk=None):
        account = models.Account.objects.select_for_update().get(pk=self.get_object().pk)
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
            models.BalanceAdjustment.objects.create(request_id=key, account=account, amount=value, date=day, reason=reason, created_by=request.user)
            if account.kind == "fund":
                validate_fund_history(account, day)
        return Response(self.get_serializer(account).data)

    @action(detail=True, methods=["get"])
    def history(self, request, pk=None):
        account = self.get_object()
        entries = [{"id": r.pk, "date": str(r.date), "name": r.name, "kind": r.kind, "amount": str(r.amount)} for r in account.transactions.order_by("-date")[:100]]
        entries += [{"id": r.pk, "date": str(r.date), "name": r.kind.replace("_", " ") + " — " + ((r.destination.name if r.destination else "") if r.source_id == account.pk else (r.source.name if r.source else "")), "kind": r.kind, "amount": str(-r.amount if r.source_id == account.pk and account.kind == "fund" else r.amount)} for r in models.MoneyMovement.objects.select_related("source", "destination").filter(Q(source=account) | Q(destination=account)).order_by("-date", "-pk")[:100]]
        entries += [{"id": r.pk, "date": str(r.date), "name": r.reason, "kind": "adjustment", "amount": str(r.amount)} for r in account.adjustments.order_by("-date")[:100]]
        return Response(sorted(entries, key=lambda r: r["date"], reverse=True)[:100])


class TransactionViewSet(FinanceViewSet):
    queryset = models.Transaction.objects.select_related("account", "category")
    serializer_class = TransactionSerializer
    date_field = "date"
    search_fields = ("name", "recipient", "notes", "category__name")

    def summary(self, qs):
        return transaction_summary(qs)

    def perform_destroy(self, instance):
        if instance.deadline_id or instance.schedule_id or hasattr(instance, "shared_payment"):
            raise ValidationError("Linked settlement/schedule history cannot be deleted. Use an explicit correction.")
        super().perform_destroy(instance)


class DeadlineViewSet(FinanceViewSet):
    queryset = models.Deadline.objects.select_related("category", "loan", "credit_card")
    serializer_class = DeadlineSerializer
    date_field = "due_date"
    search_fields = ("title", "notes", "category__name")

    def get_queryset(self):
        _, end = month_range(self.request.query_params.get("chart_month") or self.request.query_params.get("month"))
        materialize(end + timedelta(days=95))
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
    def settle(self, request, pk=None):
        item = self.get_object()
        try:
            result = settle_deadline(item.pk, request.data, request.user)
        except (ValueError, TypeError):
            raise ValidationError("Choose a valid account, amount and date.")
        return Response(self.get_serializer(result).data)

    def perform_destroy(self, instance):
        if instance.status != "pending" or instance.schedule_id or instance.loan_id:
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
    queryset = models.Asset.objects.all()
    serializer_class = AssetSerializer
    search_fields = ("name", "notes")

    def summary(self, qs):
        return {"count": qs.count(), "value": total(qs.filter(active=True), "value"), "house": total(qs.filter(active=True, kind__in=["house", "condo", "land"]), "value"), "car": total(qs.filter(active=True, kind__in=["car", "motorcycle"]), "value"), "other": total(qs.filter(active=True).exclude(kind__in=["house", "condo", "land", "car", "motorcycle"]), "value")}


class CategoryViewSet(FinanceViewSet):
    queryset = models.Category.objects.all()
    serializer_class = CategorySerializer


class ScheduleViewSet(FinanceViewSet):
    queryset = models.RecurringSchedule.objects.all()
    serializer_class = ScheduleSerializer
    search_fields = ("title", "notes")

    @transaction.atomic
    def perform_update(self, serializer):
        schedule = serializer.save()
        # Pending future occurrences are projections, not settlement history.
        schedule.deadlines.filter(status="pending", due_date__gt=today()).delete()
        models.Transaction.objects.filter(schedule=schedule, receipt_state="expected", date__gt=today()).delete()
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

    def create(self, request):
        serializer = self.get_serializer(data=request.data)
        # Identifier uniqueness is checked by the atomic service to support safe retry.
        serializer.fields["request_id"].validators = []
        serializer.is_valid(raise_exception=True)
        values = {k: v.pk if isinstance(v, (models.Account, models.LoanReceivable)) else v for k, v in serializer.validated_data.items()}
        result = move_money(values, request.user)
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

    def patch(self, request):
        obj, _ = models.WorkspaceSettings.objects.get_or_create(pk=1)
        serializer = SettingsSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
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
        deadlines = models.Deadline.objects.filter(due_date__range=(start, end)).select_related("category", "loan", "credit_card").order_by("due_date", "due_time", "id")
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
