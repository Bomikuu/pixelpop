from django.utils.crypto import salted_hmac
from rest_framework.exceptions import NotFound

from finance.models import LoanReceivable, Transaction, MoneyMovement
from .balances import ZERO, outstanding, today, total
from .queries import month_range


def person_key(name):
    # Stable private route identifier; recipient names stay out of browser URLs.
    return salted_hmac("finance.person", name.strip().casefold()).hexdigest()


def people_summary(month, selected_key=None):
    start, end = month_range(month)
    people = {}

    def person(name):
        label = name.strip()
        return people.setdefault(label.casefold(), {"key": person_key(label), "person": label, "given": ZERO, "lent": ZERO, "repaid": ZERO, "outstanding": ZERO})

    monthly = []
    for offset in range(11, -1, -1):
        year, index = divmod(start.year * 12 + start.month - 1 - offset, 12)
        if year >= 2000:
            first, last = month_range(f"{year}-{index + 1:02d}")
            monthly.append({"month": str(first)[:7], "label": first.strftime("%b %Y"), "given": ZERO, "lent": ZERO, "repaid": ZERO})
    by_month = {row["month"]: row for row in monthly}
    gifts = Transaction.objects.filter(kind="expense").exclude(recipient="").order_by("id")
    for gift in gifts:
        if selected_key and person_key(gift.recipient) != selected_key:
            continue
        row = person(gift.recipient)
        if start <= gift.date <= end:
            row["given"] += gift.amount
        key = str(gift.date)[:7]
        if key in by_month:
            by_month[key]["given"] += gift.amount
    loan_ids = []
    for loan in LoanReceivable.objects.filter(date__lte=today()).order_by("id"):
        if selected_key and person_key(loan.person) != selected_key:
            continue
        loan_ids.append(loan.pk)
        row = person(loan.person)
        remaining = outstanding(loan)
        row["lent"] += loan.principal
        row["repaid"] += total(loan.movements.filter(kind="loan_repayment", date__lte=today()))
        row["outstanding"] += remaining
        key = str(loan.date)[:7]
        if key in by_month:
            by_month[key]["lent"] += loan.principal
    for repayment in MoneyMovement.objects.filter(kind="loan_repayment", loan_id__in=loan_ids, date__range=(monthly[0]["month"] + "-01", end)):
        by_month[str(repayment.date)[:7]]["repaid"] += repayment.amount
    rows = sorted(people.values(), key=lambda row: row["person"].casefold())
    if selected_key and not rows:
        raise NotFound("This person has no matching records. Return to People & money to select a person.")
    return {"results": rows, "summary": {key: sum((row[key] for row in rows), ZERO) for key in ("given", "lent", "repaid", "outstanding")}, "charts": {"monthly": monthly, "fields": ["given", "lent", "repaid"], "monetary": True}}
