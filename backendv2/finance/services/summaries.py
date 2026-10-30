from datetime import datetime, time, timedelta
from decimal import Decimal
from zoneinfo import ZoneInfo

from django.db.models import Count, Sum
from django.utils import timezone

from finance.models import Account, AssetFinancing, AssetFinancingPayment, CashLoanPosting, Category, Deadline, LoanReceivable, Transaction, WorkspaceSettings, RecurringSchedule
from .asset_financing import installment_paid, materialize_installments
from .balances import ZERO, cash_balance_as_of, financial_position, outstanding, today, total
from .queries import month_range
from .recurrence import materialize
from .quick_entry import unsettled_summary
from .cash_loans.ledger import borrowing_rebates
from .cash_loans.projections import loan_financial_summary


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


def transaction_summary(qs, start=None, end=None, account_id=None, params=None):
    income = total(qs.filter(kind="income", receipt_state="received"))
    rebates = borrowing_rebates(start, end, account_id) if start and end else ZERO
    today_rebate = ZERO
    if params is not None:
        from .cash_loans.reports import cost_rebates
        rows = cost_rebates(params)
        rebates = -(total(rows, "interest") + total(rows, "fees"))
        today_rebate = -(total(rows.filter(date=today()), "interest") + total(rows.filter(date=today()), "fees"))
    expenses = total(qs.filter(kind="expense")) - rebates
    expected = total(qs.filter(kind="income", receipt_state="expected"))
    largest = qs.filter(kind="expense").values("category__name").annotate(amount=Sum("amount")).order_by("-amount").first()
    next_receipt = qs.filter(kind="income", receipt_state="expected").order_by("date").values_list("date", flat=True).first()
    return {"income": income, "expected": expected, "total_income": income + expected, "expenses": expenses, "cost_rebates": rebates, "net": income - expenses, "count": qs.count(), "today_spent": total(qs.filter(kind="expense", date=today())) - today_rebate, "largest_category": (largest["category__name"] or "Other") if largest else None, "next_receipt": str(next_receipt) if next_receipt else None}


def _deadline_rows(qs):
    from .subscriptions.eligibility import visible_obligations
    qs = visible_obligations(qs)
    return list(qs.select_related("loan", "subscription_cycle__subscription__schedule", "cash_loan_installment__statement").prefetch_related("subscription_cycle__allocations__transaction", "cash_loan_installment__allocations__movement", "cash_loan_installment__adjustments"))


def deadline_summary(qs):
    return _summarize_deadlines(_deadline_rows(qs))


def _summarize_deadlines(rows):
    bills = [r for r in rows if r.kind in ("bill", "subscription", "payment") and r.settlement_kind != "loan_collection"]
    priced = [r for r in bills if r.amount is not None and not (r.cash_loan_id and hasattr(r, "cash_loan_installment") and r.cash_loan_installment.statement_id and r.cash_loan_installment.statement.status == "pending")]
    def unpaid_amount(item):
        if hasattr(item, "subscription_cycle"):
            from .subscriptions.payments import cycle_payment_state
            return cycle_payment_state(item.subscription_cycle)["remaining"] or ZERO
        if item.cash_loan_id and hasattr(item, "cash_loan_installment"):
            from .cash_loans.ledger import remaining_components
            return sum(remaining_components(item.cash_loan_installment).values(), ZERO)
        return max(ZERO, item.amount - installment_paid(item)) if item.asset_financing_id else item.amount
    pending = [r for r in rows if r.status == "pending"]
    pending_dated = [r for r in pending if r.due_date is not None]
    return {
        "count": len(rows), "pending": len(pending), "completed": len(rows) - len(pending),
        "today": sum(r.due_date == today() for r in pending),
        "overdue": sum(urgency(r) == "overdue" for r in pending),
        "total": sum((r.amount for r in priced), ZERO),
        "paid": sum((r.amount for r in priced if r.status != "pending"), ZERO) + sum((r.amount - unpaid_amount(r) for r in priced if r.status == "pending" and hasattr(r, "subscription_cycle")), ZERO),
        "unpaid": sum((unpaid_amount(r) for r in priced if r.status == "pending"), ZERO),
        "unpriced": sum(r.amount is None and not (hasattr(r, "subscription_cycle") and r.subscription_cycle.actual_amount is not None) for r in bills),
        "next": min(pending_dated, key=lambda r: (r.due_date, r.due_time or time.max)).title if pending_dated else None,
        "next_date": str(min(r.due_date for r in pending_dated)) if pending_dated else None,
    }


def overview(month=None):
    from .subscriptions.eligibility import visible_obligations
    start, end = month_range(month)
    previous_end = start - timedelta(days=1)
    previous_start = previous_end.replace(day=1)
    materialize(end + timedelta(days=95))
    for financing in AssetFinancing.objects.select_related("asset"):
        materialize_installments(financing)
    now = today()
    # The current position is independent of the reporting-month selector.
    previous_balance_date = now.replace(day=1) - timedelta(days=1)
    settings, _ = WorkspaceSettings.objects.get_or_create(pk=1)
    expenses = Transaction.objects.filter(kind="expense", date__range=(start, end))
    income = Transaction.objects.filter(kind="income", date__range=(start, end))
    spent = total(expenses) - borrowing_rebates(start, end)
    cash_loans = loan_financial_summary(now, start, end)
    cash_loan_costs = total(expenses.filter(cash_loan_posting__isnull=False, account__kind="credit_card")) - borrowing_rebates(start, end)
    financing_cash = total(AssetFinancingPayment.objects.filter(historical=False, date__range=(start, end)), "cash_amount")
    financing_costs = total(expenses.filter(asset_financing_payment__isnull=False))
    previous_expenses = Transaction.objects.filter(kind="expense", date__range=(previous_start, previous_end))
    previous_spent = total(previous_expenses) - borrowing_rebates(previous_start, previous_end)
    previous_cash_loans = loan_financial_summary(now, previous_start, previous_end)
    previous_cash_loan_costs = total(previous_expenses.filter(cash_loan_posting__isnull=False, account__kind="credit_card")) - borrowing_rebates(previous_start, previous_end)
    previous_financing_cash = total(AssetFinancingPayment.objects.filter(historical=False, date__range=(previous_start, previous_end)), "cash_amount")
    previous_financing_costs = total(previous_expenses.filter(asset_financing_payment__isnull=False))
    previous_income = total(Transaction.objects.filter(kind="income", date__range=(previous_start, previous_end)))
    earned = total(income.filter(receipt_state="received"))
    expected = total(income.filter(receipt_state="expected"))
    deadline_periods = []
    for offset in range(-2, 4):
        index = start.year * 12 + start.month - 1 + offset
        year, m = divmod(index, 12)
        if 2000 <= year <= now.year + 5:
            deadline_periods.append(month_range(str(year) + "-" + str(m + 1).zfill(2)))
    reporting_deadlines = _deadline_rows(Deadline.objects.filter(due_date__range=(deadline_periods[0][0], deadline_periods[-1][1])))
    deadlines = [row for row in reporting_deadlines if start <= row.due_date <= end]
    ordinary_bills = [row for row in deadlines if row.status == "pending" and row.kind in ("bill", "subscription", "payment") and row.settlement_kind != "loan_collection" and not row.cash_loan_id]
    ordinary_remaining = _summarize_deadlines(ordinary_bills)["unpaid"]
    remaining = settings.monthly_budget - spent if settings.monthly_budget is not None else None
    days_left = (end - now).days + 1 if start <= now <= end else None
    categories = list(expenses.values("category__name", "category_id").annotate(amount=Sum("amount"), count=Count("id")).order_by("-amount"))
    rebates = borrowing_rebates(start, end)
    if rebates:
        other = next((row for row in categories if row["category_id"] is None), None)
        if other is None:
            other = {"category__name": None, "category_id": None, "amount": ZERO, "count": 0}
            categories.append(other)
        other["amount"] -= rebates
        categories.sort(key=lambda row: row["amount"], reverse=True)
    budgets = {c.pk: c.monthly_budget for c in Category.objects.all()}
    for row in categories:
        row["name"] = row.pop("category__name") or "Other"
        row["percentage"] = (row["amount"] / spent * 100).quantize(Decimal("0.1")) if spent else ZERO
        row["budget"] = budgets.get(row["category_id"])
    for category in Category.objects.filter(monthly_budget__isnull=False).exclude(pk__in=[r["category_id"] for r in categories]):
        categories.append({"name": category.name, "category_id": category.pk, "amount": ZERO, "count": 0, "percentage": ZERO, "budget": category.monthly_budget})
    daily_totals = {row["date"]: row for row in expenses.values("date").annotate(amount=Sum("amount"), count=Count("id"))}
    for rebate in CashLoanPosting.objects.filter(kind="rebate", date__range=(start, end)):
        row = daily_totals.setdefault(rebate.date, {"amount": ZERO, "count": 0})
        row["amount"] += rebate.interest + rebate.fees
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
    first_history_year, first_history_month = divmod(start.year * 12 + start.month - 12, 12)
    history_start = start.replace(year=max(2000, first_history_year), month=first_history_month + 1 if first_history_year >= 2000 else 1)
    history_rows = list(Transaction.objects.filter(date__range=(history_start, end)).order_by().values("date", "kind", "receipt_state", "category__name").annotate(amount=Sum("amount"), count=Count("id")))
    history_rebates = list(CashLoanPosting.objects.filter(kind="rebate", date__range=(history_start, end)).order_by().values("date").annotate(interest_total=Sum("interest"), fees_total=Sum("fees")))
    for offset in range(11, -1, -1):
        index = start.year * 12 + start.month - 1 - offset
        year, m = divmod(index, 12)
        if year < 2000:
            continue
        first, last = month_range(str(year) + "-" + str(m + 1).zfill(2))
        rows = [row for row in history_rows if first <= row["date"] <= last]
        received = sum((row["amount"] for row in rows if row["kind"] == "income" and row["receipt_state"] == "received"), ZERO)
        expected_income = sum((row["amount"] for row in rows if row["kind"] == "income" and row["receipt_state"] == "expected"), ZERO)
        rebate = -sum((row["interest_total"] + row["fees_total"] for row in history_rebates if first <= row["date"] <= last), ZERO)
        expense_rows = [row for row in rows if row["kind"] == "expense"]
        expense_total = sum((row["amount"] for row in expense_rows), ZERO) - rebate
        category_totals = {}
        for row in expense_rows:
            name = row["category__name"]
            category_totals[name] = category_totals.get(name, ZERO) + row["amount"]
        largest = max(category_totals, key=category_totals.get) if category_totals else None
        next_receipt = min((row["date"] for row in rows if row["kind"] == "income" and row["receipt_state"] == "expected"), default=None)
        history.append({
            "month": first.strftime("%Y-%m"), "label": first.strftime("%b %Y"),
            "income": received + expected_income, "expected": expected_income, "total_income": received + expected_income,
            "expenses": expense_total, "cost_rebates": rebate, "net": received - expense_total,
            "count": sum(row["count"] for row in expense_rows),
            "today_spent": sum((row["amount"] for row in expense_rows if row["date"] == now), ZERO),
            "largest_category": (largest or "Other") if category_totals else None,
            "next_receipt": str(next_receipt) if next_receipt else None,
            "remaining": received + expected_income - expense_total,
        })
    pending_all = list(visible_obligations(Deadline.objects.filter(status="pending", due_date__isnull=False)).order_by("due_date", "due_time", "id"))
    monthly_deadlines = []
    for first, last in deadline_periods:
        monthly_deadlines.append({"month": first.strftime("%Y-%m"), "label": first.strftime("%b %Y"), **_summarize_deadlines([row for row in reporting_deadlines if first <= row.due_date <= last])})
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
        "previous_position": {
            "as_of": str(previous_balance_date),
            "available": cash_balance_as_of(previous_balance_date),
        },
        "unsettled": unsettled_summary(),
        "cash_loans": cash_loans,
        "month": {"income": earned + expected, "received": earned, "expected": expected, "expenses": spent, "financing_cash": financing_cash, "cash_outflow": spent - financing_costs - cash_loan_costs + financing_cash + cash_loans["repayments"], "remaining": earned + expected - (spent - financing_costs - cash_loan_costs + financing_cash + cash_loans["repayments"]) - ordinary_remaining - cash_loans["scheduled"]},
        "previous_month": {"month": previous_start.strftime("%Y-%m"), "income": previous_income, "expenses": previous_spent, "cash_outflow": previous_spent - previous_financing_costs - previous_cash_loan_costs + previous_financing_cash + previous_cash_loans["repayments"]},
        "today": {"spent": total(Transaction.objects.filter(kind="expense", date=now)) - borrowing_rebates(now, now), "tasks": sum(r.due_date == now and r.kind in ("task", "reminder") for r in pending_all), "bills": sum(r.due_date == now and r.kind in ("bill", "subscription", "payment") and r.settlement_kind != "loan_collection" for r in pending_all), "next": pending_all[0].title if pending_all else None},
        "attention": {"overdue": sum(urgency(r) == "overdue" for r in pending_all)},
        "bills": _summarize_deadlines(deadlines),
        "budget": {"limit": settings.monthly_budget, "used": spent, "remaining": remaining, "daily": max(remaining, ZERO) / days_left if remaining is not None and days_left else None, "percentage": spent / settings.monthly_budget * 100 if settings.monthly_budget else None},
        "charts": {"daily": daily, "weekly": list(weekly.values()), "monthly": history, "categories": categories, "bills": monthly_deadlines},
        "insights": insights,
        "average_daily": average,
        "projected_expenses": average * ((end - start).days + 1),
        "subscriptions": {"count": sum(row.kind == "subscription" for row in deadlines), "amount": sum((row.amount or ZERO for row in deadlines if row.kind == "subscription"), ZERO)},
        "loans": {"outstanding": sum((outstanding(r) for r in loans), ZERO), "lent": sum((r.principal for r in loans), ZERO), "repaid": sum((r.principal - outstanding(r) for r in loans), ZERO), "people": len({r.person.casefold() for r in loans}), "overdue": sum((outstanding(r) for r in loans if r.due_date and r.due_date < now), ZERO)},
        "configuration": {"accounts": Account.objects.count(), "category_budgets": Category.objects.filter(monthly_budget__isnull=False).count(), "schedules": RecurringSchedule.objects.filter(active=True).count()},
    }
