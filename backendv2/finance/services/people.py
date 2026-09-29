from django.utils.crypto import salted_hmac
from rest_framework.exceptions import NotFound

from finance.models import LoanReceivable, MoneyMovement, Person, Transaction
from .balances import ZERO, outstanding, today, total
from .queries import month_range


def person_key(name):
    # Legacy private route identifier, retained for migrated contacts.
    return salted_hmac("finance.person", name.strip().casefold()).hexdigest()


def people_summary(month, selected_key=None):
    start, end = month_range(month)
    people = {}
    by_name = {}

    for contact in Person.objects.all().order_by("name", "id"):
        row = {
            "id": contact.pk,
            "key": contact.key,
            "person": contact.name,
            "relationship": contact.relationship,
            "custom_relationship": contact.custom_relationship,
            "notes": contact.notes,
            "given": ZERO,
            "lent": ZERO,
            "repaid": ZERO,
            "outstanding": ZERO,
        }
        people[contact.pk] = row
        by_name[contact.name.strip().casefold()] = row

    def person(name, contact_id):
        if contact_id and contact_id in people:
            return people[contact_id]
        label = name.strip()
        normalized = label.casefold()
        if normalized in by_name:
            return by_name[normalized]
        key = "legacy:" + normalized
        if key not in people:
            people[key] = {
                "id": None, "key": person_key(label), "person": label,
                "relationship": "Other", "custom_relationship": "", "notes": "",
                "given": ZERO, "lent": ZERO, "repaid": ZERO, "outstanding": ZERO,
            }
        return people[key]

    monthly = []
    for offset in range(11, -1, -1):
        year, index = divmod(start.year * 12 + start.month - 1 - offset, 12)
        if year >= 2000:
            first, last = month_range(f"{year}-{index + 1:02d}")
            monthly.append({"month": str(first)[:7], "label": first.strftime("%b %Y"), "given": ZERO, "lent": ZERO, "repaid": ZERO})
    by_month = {row["month"]: row for row in monthly}

    gifts = Transaction.objects.filter(kind="expense").exclude(recipient="").select_related("contact").order_by("id")
    for gift in gifts:
        row = person(gift.recipient, gift.contact_id)
        if selected_key and row["key"] != selected_key:
            continue
        if start <= gift.date <= end:
            row["given"] += gift.amount
        key = str(gift.date)[:7]
        if key in by_month:
            by_month[key]["given"] += gift.amount

    loan_ids = []
    for loan in LoanReceivable.objects.filter(date__lte=today()).select_related("contact").order_by("id"):
        row = person(loan.person, loan.contact_id)
        if selected_key and row["key"] != selected_key:
            continue
        loan_ids.append(loan.pk)
        remaining = outstanding(loan)
        row["lent"] += loan.principal
        row["repaid"] += total(loan.movements.filter(kind="loan_repayment", date__lte=today()))
        row["outstanding"] += remaining
        key = str(loan.date)[:7]
        if key in by_month:
            by_month[key]["lent"] += loan.principal

    for repayment in MoneyMovement.objects.filter(kind="loan_repayment", loan_id__in=loan_ids, date__range=(monthly[0]["month"] + "-01", end)):
        by_month[str(repayment.date)[:7]]["repaid"] += repayment.amount
    rows = sorted((row for row in people.values() if not selected_key or row["key"] == selected_key), key=lambda row: row["person"].casefold())
    if selected_key and not rows:
        raise NotFound("This person has no matching records. Return to People & money to select a person.")
    return {"results": rows, "summary": {key: sum((row[key] for row in rows), ZERO) for key in ("given", "lent", "repaid", "outstanding")}, "charts": {"monthly": monthly, "fields": ["given", "lent", "repaid"], "monetary": True}}
