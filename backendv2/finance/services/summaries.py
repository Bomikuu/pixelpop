from datetime import datetime, time, timedelta
from decimal import Decimal
from zoneinfo import ZoneInfo

from django.db.models import Count, Sum
from django.utils import timezone

from finance.models import Account, AssetFinancing, AssetFinancingPayment, Category, Deadline, LoanReceivable, Transaction, WorkspaceSettings, RecurringSchedule
from .asset_financing import installment_paid, materialize_installments
from .balances import ZERO, financial_position, outstanding, today, total
from .queries import month_range
from .recurrence import materialize


def urgency(item, now=None):
    if item.status != "pending":
        return item.status
    if item.due_date is None:
        return "unscheduled"
    now = (now or timezone.now()).astimezone(ZoneInfo("Asia/Manila"))
    if item.due_date < now.date() or (item.due_time and datetime.combine(item.due_date, item.due_time, tzinfo=ZoneInfo("Asia/Manila")) < now):
        return "overdue"
    if item.due_date == now.date():
        return "today"
    if (item.due_date - now.date()).days <= 3:
        return "soon"
    return "upcoming"


def transaction_summary(qs):
    income = total(qs.filter(kind="income", receipt_state="received"))
    expenses = total(qs.filter(kind="expense"))
    expected = total(qs.filter(kind="income", receipt_state="expected"))
    largest = qs.filter(kind="expense").values("category__name").annotate(amount=Sum("amount")).order_by("-amount").first()
    next_receipt = qs.filter(kind="income", receipt_state="expected").order_by("date").values_list("date", flat=True).first()
    return {"income": income, "expected": expected, "total_income": income + expected, "expenses": expenses, "net": income - expenses, "count": qs.count(), "today_spent": total(qs.filter(kind="expense", date=today())), "largest_category": (largest["category__name"] or "Other") if largest else None, "next_receipt": str(next_receipt) if next_receipt else None}


def deadline_summary(qs):
    rows = list(qs.select_related("loan"))
    bills = [r for r in rows if r.kind in ("bill", "subscription", "payment") and r.settlement_kind != "loan_collection"]
    priced = [r for r in bills if r.amount is not None]
    unpaid_amount = lambda item: max(ZERO, item.amount - installment_paid(item)) if item.asset_financing_id else item.amount
    pending = [r for r in rows if r.status == "pending"]
    pending_dated = [r for r in pending if r.due_date is not None]
    return {
        "count": len(rows), "pending": len(pending), "completed": len(rows) - len(pending),
        "today": sum(r.due_date == today() for r in pending),
        "overdue": sum(urgency(r) == "overdue" for r in pending),
        "total": sum((r.amount for r in priced), ZERO),
        "paid": sum((r.amount for r in priced if r.status != "pending"), ZERO),
        "unpaid": sum((unpaid_amount(r) for r in priced if r.status == "pending"), ZERO),
        "unpriced": sum(r.amount is None for r in bills),
        "next": min(pending_dated, key=lambda r: (r.due_date, r.due_time or time.max)).title if pending_dated else None,
        "next_date": str(min(r.due_date for r in pending_dated)) if pending_dated else None,
    }


def overview(month=None):
    start, end = month_range(month)
    previous_end = start - timedelta(days=1)
    previous_start = previous_end.replace(day=1)
    materialize(end + timedelta(days=95))
    for financing in AssetFinancing.objects.select_related("asset"):
        materialize_installments(financing)
    now = today()
    settings, _ = WorkspaceSettings.objects.get_or_create(pk=1)
    expenses = Transaction.objects.filter(kind="expense", date__range=(start, end))
    income = Transaction.objects.filter(kind="income", date__range=(start, end))
    spent = total(expenses)
    financing_cash = total(AssetFinancingPayment.objects.filter(historical=False, date__range=(start, end)), "cash_amount")
    financing_costs = total(expenses.filter(asset_financing_payment__isnull=False))
    previous_expenses = Transaction.objects.filter(kind="expense", date__range=(previous_start, previous_end))
    previous_spent = total(previous_expenses)
    previous_financing_cash = total(AssetFinancingPayment.objects.filter(historical=False, date__range=(previous_start, previous_end)), "cash_amount")
    previous_financing_costs = total(previous_expenses.filter(asset_financing_payment__isnull=False))
    previous_income = total(Transaction.objects.filter(kind="income", date__range=(previous_start, previous_end)))
    earned = total(income.filter(receipt_state="received"))
    expected = total(income.filter(receipt_state="expected"))
    deadlines = Deadline.objects.filter(due_date__range=(start, end))
    ordinary_bills = deadlines.filter(status="pending", kind__in=["bill", "subscription", "payment"]).exclude(settlement_kind="loan_collection")
    remaining = settings.monthly_budget - spent if settings.monthly_budget is not None else None
    days_left = (end - now).days + 1 if start <= now <= end else None
    categories = list(expenses.values("category__name", "category_id").annotate(amount=Sum("amount"), count=Count("id")).order_by("-amount"))
    budgets = {c.pk: c.monthly_budget for c in Category.objects.all()}
    for row in categories:
        row["name"] = row.pop("category__name") or "Other"
        row["percentage"] = (row["amount"] / spent * 100).quantize(Decimal("0.1")) if spent else ZERO
        row["budget"] = budgets.get(row["category_id"])
    for category in Category.objects.filter(monthly_budget__isnull=False).exclude(pk__in=[r["category_id"] for r in categories]):
        categories.append({"name": category.name, "category_id": category.pk, "amount": ZERO, "count": 0, "percentage": ZERO, "budget": category.monthly_budget})
    daily_totals = {row["date"]: row for row in expenses.values("date").annotate(amount=Sum("amount"), count=Count("id"))}
    daily = []
    cursor = start
    while cursor <= end:
        row = daily_totals.get(cursor, {})
        daily.append({"date": str(cursor), "label": cursor.strftime("%d"), "amount": row.get("amount", ZERO), "count": row.get("count", 0)})
        cursor += timedelta(days=1)
    weekly = {}
    for row in daily:
        day = datetime.fromisoformat(row["date"]).date()
        key = str(day - timedelta(days=day.weekday()))
        value = weekly.setdefault(key, {"date": key, "label": key[5:], "amount": ZERO, "count": 0})
        value["amount"] += row["amount"]
        value["count"] += row["count"]
    history = []
    for offset in range(11, -1, -1):
        index = start.year * 12 + start.month - 1 - offset
        year, m = divmod(index, 12)
        if year < 2000:
            continue
        first, last = month_range(str(year) + "-" + str(m + 1).zfill(2))
        monthly = Transaction.objects.filter(date__range=(first, last))
        summary = transaction_summary(monthly)
        history.append({"month": first.strftime("%Y-%m"), "label": first.strftime("%b %Y"), **summary, "count": monthly.filter(kind="expense").count(), "income": summary["income"] + summary["expected"], "remaining": summary["income"] + summary["expected"] - summary["expenses"]})
    pending_all = list(Deadline.objects.filter(status="pending", due_date__isnull=False).order_by("due_date", "due_time", "id"))
    monthly_deadlines = []
    for offset in range(-2, 4):
        index = start.year * 12 + start.month - 1 + offset
        year, m = divmod(index, 12)
        if year < 2000 or year > now.year + 5:
            continue
        first, last = month_range(str(year) + "-" + str(m + 1).zfill(2))
        monthly_deadlines.append({"month": first.strftime("%Y-%m"), "label": first.strftime("%b %Y"), **deadline_summary(Deadline.objects.filter(due_date__range=(first, last)))})
    loans = list(LoanReceivable.objects.all())
    average = spent / max(1, min((now - start).days + 1, (end - start).days + 1)) if now >= start else ZERO
    insights = []
    if spent:
        insights.append("Your highest spending category is " + categories[0]["name"] + ".")
        previous = history[-2]["expenses"]
        if previous:
            change = ((spent - previous) / previous * 100).quantize(Decimal("0.1"))
            insights.append("Spending is " + str(abs(change)) + "% " + ("higher" if change >= 0 else "lower") + " than the prior month (whole-month comparison).")
    return {
        "as_of": str(now), "selected_month": start.strftime("%Y-%m"),
        "position": financial_position(),
        "month": {"income": earned + expected, "received": earned, "expected": expected, "expenses": spent, "financing_cash": financing_cash, "cash_outflow": spent - financing_costs + financing_cash, "remaining": earned + expected - (spent - financing_costs + financing_cash) - sum((max(ZERO, r.amount - installment_paid(r)) if r.asset_financing_id else r.amount for r in ordinary_bills if r.amount is not None), ZERO)},
        "previous_month": {"month": previous_start.strftime("%Y-%m"), "income": previous_income, "expenses": previous_spent, "cash_outflow": previous_spent - previous_financing_costs + previous_financing_cash},
        "today": {"spent": total(Transaction.objects.filter(kind="expense", date=now)), "tasks": sum(r.due_date == now and r.kind in ("task", "reminder") for r in pending_all), "bills": sum(r.due_date == now and r.kind in ("bill", "subscription", "payment") and r.settlement_kind != "loan_collection" for r in pending_all), "next": pending_all[0].title if pending_all else None},
        "attention": {"overdue": sum(urgency(r) == "overdue" for r in pending_all)},
        "bills": deadline_summary(deadlines),
        "budget": {"limit": settings.monthly_budget, "used": spent, "remaining": remaining, "daily": max(remaining, ZERO) / days_left if remaining is not None and days_left else None, "percentage": spent / settings.monthly_budget * 100 if settings.monthly_budget else None},
        "charts": {"daily": daily, "weekly": list(weekly.values()), "monthly": history, "categories": categories, "bills": monthly_deadlines},
        "insights": insights,
        "average_daily": average,
        "projected_expenses": average * ((end - start).days + 1),
        "subscriptions": {"count": deadlines.filter(kind="subscription").count(), "amount": total(deadlines.filter(kind="subscription"))},
        "loans": {"outstanding": sum((outstanding(r) for r in loans), ZERO), "lent": sum((r.principal for r in loans), ZERO), "repaid": sum((r.principal - outstanding(r) for r in loans), ZERO), "people": len({r.person.casefold() for r in loans}), "overdue": sum((outstanding(r) for r in loans if r.due_date and r.due_date < now), ZERO)},
        "configuration": {"accounts": Account.objects.count(), "category_budgets": Category.objects.filter(monthly_budget__isnull=False).count(), "schedules": RecurringSchedule.objects.filter(active=True).count()},
    }
