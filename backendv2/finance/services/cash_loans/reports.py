"""Signed cost reversals, never financing income or another cash movement."""
from datetime import date

from finance.models import CashLoanPosting
from finance.services.queries import month_range


def cost_rebates(params):
    rows = CashLoanPosting.objects.filter(kind="rebate")
    if params.get("kind") == "income" or any(params.get(key) for key in ("category", "coverage", "recipient", "giving")):
        return rows.none()
    if params.get("account"):
        rows = rows.filter(account_id=int(params["account"]))
    if params.get("month"):
        rows = rows.filter(date__range=month_range(params["month"]))
    if params.get("start"):
        rows = rows.filter(date__gte=date.fromisoformat(params["start"]))
    if params.get("end"):
        rows = rows.filter(date__lte=date.fromisoformat(params["end"]))
    q = params.get("q", "").strip()
    if q and q.casefold() not in ("fee", "fees", "interest", "interest & fees"):
        rows = rows.filter(loan__name__icontains=q)
    return rows
