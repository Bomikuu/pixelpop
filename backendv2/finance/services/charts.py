from django.db.models import Count, Sum
from django.db.models.functions import TruncMonth

from finance.models import Account, Asset, Category, Deadline, LoanReceivable, RecurringSchedule, Transaction, MoneyMovement
from .balances import account_balance, outstanding, ZERO
from .queries import filtered, month_range


def _bounded(rows):
    """Keep all amounts represented without rendering an unbounded chart."""
    rows = sorted(rows, key=lambda row: abs(row.get("amount", ZERO)), reverse=True)
    if len(rows) <= 20:
        return rows
    keys = [key for key in rows[0] if key != "label"]
    return rows[:19] + [{"label": "Other", **{key: sum((row.get(key, ZERO) for row in rows[19:]), ZERO) for key in keys}}]


def _group(qs, key, amount="amount"):
    return _bounded([{"label": row[key] or "Uncategorized", "amount": row["amount"] or ZERO} for row in qs.order_by().values(key).annotate(amount=Sum(amount))])


def record_charts(qs, base, params, date_field=None, search_fields=()):
    model = qs.model
    if model in (Transaction, Deadline):
        start, _ = month_range(params.get("chart_month") or params.get("month"))
        months = []
        for offset in range(11, -1, -1):
            index = start.year * 12 + start.month - 1 - offset
            year, month = divmod(index, 12)
            if year >= 2000:
                first, last = month_range(f"{year}-{month + 1:02d}")
                months.append((first, last))
        compare_params = params.dict()
        for key in ("month", "chart_month", "start", "end", "page", "page_size"):
            compare_params.pop(key, None)
        series = filtered(base, compare_params, date_field, search_fields)
        if model == Transaction and params.get("account"):
            series = series.filter(account_id=int(params["account"]))
        if model == Transaction and params.get("coverage"):
            series = series.filter(coverage_id=int(params["coverage"]))
        if model == Deadline and params.get("bills") == "1":
            series = series.filter(kind__in=["bill", "subscription", "payment"]).exclude(settlement_kind="loan_collection")
        series = series.filter(**{date_field + "__range": (months[0][0], months[-1][1])})
        rows = [{"month": str(first)[:7], "label": first.strftime("%b %Y"), **{key: ZERO for key in ("income", "expected", "expenses", "paid", "unpaid", "pending", "completed", "unpriced")}} for first, _ in months]
        by_month = {row["month"]: row for row in rows}
        if model == Transaction:
            groups = series.order_by().annotate(period=TruncMonth("date")).values("period", "kind", "receipt_state").annotate(amount=Sum("amount"))
            for group in groups:
                key = "expenses" if group["kind"] == "expense" else "expected" if group["receipt_state"] == "expected" else "income"
                by_month[str(group["period"])[:7]][key] += group["amount"]
            breakdown = _group(qs, "category__name")
            fields = ["income", "expected"] if params.get("kind") == "income" else ["expenses"] if params.get("kind") == "expense" else ["income", "expected", "expenses"]
            return {"monthly": rows, "fields": fields, "breakdown": breakdown, "breakdown_title": "Amount by category", "monetary": True}
        for item in series:
            row = by_month[str(item.due_date)[:7]]
            row["pending" if item.status == "pending" else "completed"] += 1
            if item.kind in ("bill", "subscription", "payment") and item.settlement_kind != "loan_collection":
                if item.amount is None:
                    row["unpriced"] += 1
                else:
                    row["unpaid" if item.status == "pending" else "paid"] += item.amount
        monetary = params.get("bills") == "1"
        breakdown = _group(qs.exclude(settlement_kind="loan_collection"), "category__name") if monetary else [{"label": row["kind"].replace("_", " ").title(), "amount": row["count"]} for row in qs.order_by().values("kind").annotate(count=Count("id"))]
        return {"monthly": rows, "fields": ["paid", "unpaid"] if monetary else ["pending", "completed"], "breakdown": breakdown, "breakdown_title": "Priced bills by category" if monetary else "Items by type", "monetary": monetary, "unpriced": sum(row["unpriced"] for row in rows)}
    if model == Asset:
        labels = dict(Asset.KINDS)
        rows = _group(qs.filter(active=True), "kind", "value")
        for row in rows:
            row["label"] = labels.get(row["label"], row["label"])
        return {"breakdown": rows, "breakdown_title": "Current asset value by type", "monetary": True}
    if model == Account:
        if params.get("kind") == "fund":
            start, _ = month_range(params.get("chart_month") or params.get("month"))
            rows = []
            ids = list(qs.values_list("pk", flat=True))
            for offset in range(11, -1, -1):
                year, index = divmod(start.year * 12 + start.month - 1 - offset, 12)
                if year < 2000:
                    continue
                first, last = month_range(f"{year}-{index + 1:02d}")
                entries = MoneyMovement.objects.filter(date__range=(first, last))
                rows.append({"month": str(first)[:7], "label": first.strftime("%b %Y"), "contributions": entries.filter(kind="fund_contribution", destination_id__in=ids).aggregate(value=Sum("amount"))["value"] or ZERO, "withdrawals": entries.filter(kind="fund_withdrawal", source_id__in=ids).aggregate(value=Sum("amount"))["value"] or ZERO})
            return {"monthly": rows, "fields": ["contributions", "withdrawals"], "monetary": True, "breakdown": _bounded([{"label": row.name, "amount": account_balance(row)} for row in qs]), "breakdown_title": "Current recorded fund values"}
        rows = [{"label": row.name, "amount": account_balance(row)} for row in qs.filter(active=True).exclude(kind="credit_card")]
        cards = [{"label": row.name, "amount": account_balance(row)} for row in qs.filter(active=True, kind="credit_card")]
        return {"breakdown": _bounded(rows), "breakdown_title": "Current account balances", "cards": _bounded(cards), "monetary": True}
    if model == LoanReceivable:
        people = {}
        for loan in qs:
            row = people.setdefault(loan.person.casefold(), {"label": loan.person, "amount": ZERO})
            row["amount"] += outstanding(loan)
        return {"breakdown": _bounded(list(people.values())), "breakdown_title": "Outstanding by person", "monetary": True}
    if model == Category:
        return {"breakdown": _bounded([{"label": row.name, "amount": row.monthly_budget} for row in qs if row.monthly_budget is not None]), "breakdown_title": "Monthly category budgets", "monetary": True}
    if model == RecurringSchedule:
        return {"breakdown": [{"label": row["frequency"].title(), "amount": row["count"]} for row in qs.filter(active=True).order_by().values("frequency").annotate(count=Count("id"))], "breakdown_title": "Active schedules by frequency", "monetary": False}
    return None
