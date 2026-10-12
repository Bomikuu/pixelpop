from django.db import transaction
from django.utils.crypto import salted_hmac
from rest_framework.exceptions import NotFound, ValidationError

from finance.models import LoanReceivable, MoneyMovement, Person, Transaction
from .balances import ZERO, outstanding, today, total
from .queries import month_range


def find_contact(name):
    normalized = name.strip().casefold()
    matches = [person for person in Person.objects.only("id", "name").iterator()
               if person.name.strip().casefold() == normalized]
    if len(matches) > 1:
        raise ValidationError({"contact": "Several people have this name. Select the saved person by their identifying details."})
    return matches[0] if matches else None


@transaction.atomic
def contact_for_name(name, user=None, create_new=False):
    label = name.strip()
    if not label:
        return None

    # Name-only legacy requests are serialized, but never choose between duplicates.
    from finance.models import WorkspaceSettings
    WorkspaceSettings.objects.get_or_create(pk=1)
    WorkspaceSettings.objects.select_for_update().get(pk=1)
    existing = None if create_new else find_contact(label)
    if existing:
        return existing
    return Person.objects.create(name=label, relationship="Other", created_by=user)


def person_key(name):
    # Legacy private route identifier, retained for migrated contacts.
    return salted_hmac("finance.person", name.strip().casefold()).hexdigest()


def person_avatar_url(contact):
    return f"/api/v1/finance/contacts/{contact.pk}/avatar/?v={contact.avatar_hash}" if contact.avatar_hash else None


def people_summary(month, selected_key=None):
    start, end = month_range(month)
    people = {}
    by_name = {}

    for contact in Person.objects.defer("avatar_blob").order_by("name", "id"):
        row = {
            "id": contact.pk,
            "key": contact.key,
            "person": contact.name,
            "nickname": contact.nickname,
            "relationship": contact.relationship,
            "custom_relationship": contact.custom_relationship,
            "email": contact.email,
            "phone": contact.phone,
            "organization": contact.organization,
            "avatar_url": person_avatar_url(contact),
            "notes": contact.notes,
            "given": ZERO,
            "lent": ZERO,
            "repaid": ZERO,
            "outstanding": ZERO,
        }
        people[contact.pk] = row
        by_name.setdefault(contact.name.strip().casefold(), []).append(row)

    def person(name, contact_id):
        if contact_id and contact_id in people:
            return people[contact_id]
        label = name.strip()
        normalized = label.casefold()
        matches = by_name.get(normalized, [])
        key = "legacy:" + normalized
        if key not in people:
            people[key] = {
                "id": None, "key": (salted_hmac("finance.unlinked-person", normalized).hexdigest() if matches else person_key(label)), "person": label,
                "nickname": "",
                "relationship": "Other", "custom_relationship": "", "notes": "",
                "email": "", "phone": "", "organization": "", "avatar_url": None,
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
