"""Shared breakdowns are not expenses; only explicit owner payments touch the ledger."""
import secrets
import hashlib
from datetime import timedelta
from decimal import Decimal, InvalidOperation

from django.db import transaction
from django.contrib.auth.hashers import check_password, make_password
from django.core.cache import cache
from django.utils import timezone
from rest_framework.exceptions import ValidationError, PermissionDenied, Throttled

from finance import models
from .balances import ZERO, outstanding, today
from .settlements import action_date, amount, locked_account, move_money, request_key


def strict(data, fields):
    if not isinstance(data, dict):
        raise ValidationError("Provide an object.")
    unknown = set(data) - set(fields)
    if unknown:
        raise ValidationError({key: "Unknown field." for key in unknown})


def participant_shares(rows, total):
    if not isinstance(rows, list) or not 2 <= len(rows) <= 50:
        raise ValidationError({"participants": "Choose between 2 and 50 people, including yourself."})
    people, seen, fixed, blanks = [], set(), ZERO, []
    for index, row in enumerate(rows):
        strict(row, ("name", "is_me", "amount"))
        name = row.get("name", "")
        if not isinstance(name, str):
            raise ValidationError({"participants": "Enter a valid person name."})
        name = name.strip()
        if not name or len(name) > 120 or name.casefold() in seen:
            raise ValidationError({"participants": "Names must be unique and contain 1–120 characters."})
        seen.add(name.casefold())
        if not isinstance(row.get("is_me", False), bool):
            raise ValidationError({"participants": "Use a true/false value for is_me."})
        value = row.get("amount")
        if value in (None, ""):
            share = ZERO
            blanks.append(index)
        else:
            try:
                share = Decimal(str(value))
                if not share.is_finite() or share < 0 or share.as_tuple().exponent < -2 or share >= Decimal("1000000000000"):
                    raise InvalidOperation
            except (ValueError, InvalidOperation):
                raise ValidationError({"participants": "Contributions must be non-negative amounts with at most two decimal places."})
            fixed += share
        people.append({"name": name, "is_me": row.get("is_me", False), "share": share, "share_is_fixed": value not in (None, "")})
    if sum(row["is_me"] for row in people) != 1:
        raise ValidationError({"participants": "Include yourself exactly once."})
    if fixed > total or (not blanks and fixed != total):
        raise ValidationError({"participants": "Contributions must total the bill; leave amounts blank to split the remainder."})
    if blanks:
        cents, remainder = divmod(int((total - fixed) * 100), len(blanks))
        for position, index in enumerate(blanks):
            people[index]["share"] = Decimal(cents + (position < remainder)) / 100
    return people


@transaction.atomic
def create_bill(data, user):
    strict(data, ("title", "total", "date", "category", "participants", "request_id"))
    title = data.get("title", "")
    if not isinstance(title, str):
        raise ValidationError({"title": "Enter a valid title."})
    title = title.strip()
    if not title or len(title) > 160:
        raise ValidationError({"title": "Enter a title with at most 160 characters."})
    value, day, key = amount(data.get("total")), action_date(data.get("date")), request_key(data)
    people = participant_shares(data.get("participants"), value)
    category = None
    if data.get("category"):
        try:
            category = models.Category.objects.filter(pk=int(data["category"])).first()
        except (ValueError, TypeError):
            pass
        if not category:
            raise ValidationError({"category": "Choose an existing category."})
    # The workspace row serializes even simultaneous retries before a bill exists.
    models.WorkspaceSettings.objects.get_or_create(pk=1)
    models.WorkspaceSettings.objects.select_for_update().get(pk=1)
    existing = models.SharedBill.objects.filter(request_id=key).first()
    if existing:
        prior = list(existing.participants.order_by("id").values("name", "is_me", "share", "share_is_fixed"))
        if (existing.title, existing.total, existing.date, existing.category_id, prior) != (title, value, day, category.pk if category else None, people):
            raise ValidationError("This request identifier belongs to a different shared bill.")
        return existing
    bill = models.SharedBill.objects.create(title=title, total=value, date=day, category=category, request_id=key, created_by=user)
    models.SharedBillParticipant.objects.bulk_create([models.SharedBillParticipant(bill=bill, **row) for row in people])
    return bill


def breakdown(bill, public=False, reserve_pending=False):
    participants = list(bill.participants.order_by("id"))
    payments = list(bill.payments.select_related("payer", "paid_to").order_by("date", "id"))
    net = {row.pk: ZERO for row in participants}
    merchant = ZERO
    for payment in payments:
        if payment.status != "confirmed" and not (reserve_pending and payment.status == "pending"):
            continue
        net[payment.payer_id] += payment.amount
        if payment.paid_to_id:
            net[payment.paid_to_id] -= payment.amount
        else:
            merchant += payment.amount
    owner_expense_recorded = any(payment.status == "confirmed" and payment.expense_id for payment in payments)
    rows = [{"id": row.pk, "name": row.name, "is_me": row.is_me, "share": row.share,
             "share_is_fixed": row.share_is_fixed or (row.is_me and owner_expense_recorded),
             "paid": net[row.pk], "remaining": max(row.share - net[row.pk], ZERO),
             "to_receive": max(net[row.pk] - row.share, ZERO),
             "status": "paid" if net[row.pk] >= row.share else "partial" if net[row.pk] > 0 else "unpaid"} for row in participants]
    owner = next(row for row in rows if row["is_me"])
    result = {"title": bill.title, "total": bill.total, "date": str(bill.date), "participants": rows,
              "payments": [{"id": p.pk, "payer_id": p.payer_id, "payer_name": p.payer.name,
                            "paid_to_id": p.paid_to_id, "paid_to_name": p.paid_to.name if p.paid_to else "Merchant",
                            "amount": p.amount, "date": str(p.date), "status": p.status} for p in payments],
              "my_share": owner["share"], "my_paid": owner["paid"], "merchant_paid": merchant,
              "remaining_bill": max(bill.total - merchant, ZERO), "has_edit_pin": bool(bill.edit_pin_hash)}
    if public:
        # Public identifiers are local display ordinals, never private database IDs.
        ids = {row["id"]: index + 1 for index, row in enumerate(rows)}
        for row in rows:
            row["id"] = ids[row["id"]]
        for index, payment in enumerate(result["payments"]):
            payment["id"] = index + 1
            payment["payer_id"] = ids[payment["payer_id"]]
            if payment["paid_to_id"]:
                payment["paid_to_id"] = ids[payment["paid_to_id"]]
    else:
        result.update(id=bill.pk, category=bill.category_id, category_name=bill.category.name if bill.category else "Other",
                      archived=bill.archived, share_token=bill.share_token,
                      allocation_confirmed=bill.allocation_confirmed,
                      share_expires_at=bill.share_expires_at.isoformat() if bill.share_expires_at else None,
                      ledger_recorded=any(p.record_ledger for p in payments))
        for row, participant in zip(rows, participants):
            row["has_advance"] = bool(participant.advance_id)
        for row, payment in zip(result["payments"], payments):
            row["record_ledger"] = payment.record_ledger
    return result


@transaction.atomic
def pay_bill(bill_id, data, user, pending=False, approving=None):
    strict(data, ("payer_id", "paid_to_id", "amount", "date", "record_ledger", "account", "payment_method", "request_id"))
    models.WorkspaceSettings.objects.get_or_create(pk=1)
    models.WorkspaceSettings.objects.select_for_update().get(pk=1)
    bill = models.SharedBill.objects.select_for_update().get(pk=bill_id)
    key, value, day = request_key(data), amount(data.get("amount")), action_date(data.get("date"))
    record_ledger = data.get("record_ledger", False)
    if not isinstance(record_ledger, bool):
        raise ValidationError({"record_ledger": "Choose true or false."})
    method = data.get("payment_method", "bank")
    if method not in dict(models.Transaction._meta.get_field("payment_method").choices):
        raise ValidationError({"payment_method": "Choose a supported payment method."})
    try:
        payer_id = int(data.get("payer_id"))
        recipient_id = int(data["paid_to_id"]) if data.get("paid_to_id") not in (None, "") else None
        account_id = int(data["account"]) if data.get("account") not in (None, "") else None
    except (ValueError, TypeError):
        raise ValidationError("Choose a valid person and account.")
    existing = models.SharedBillPayment.objects.filter(request_id=key).first()
    if existing and not approving:
        matches = (existing.bill_id, existing.payer_id, existing.paid_to_id, existing.amount, existing.date) == (bill.pk, payer_id, recipient_id, value, day)
        if not pending:
            matches = matches and (existing.record_ledger, existing.account_id, existing.payment_method) == (record_ledger, account_id, method)
        if not matches:
            raise ValidationError("This request identifier belongs to a different payment.")
        return bill
    if bill.archived:
        raise ValidationError("Restore this shared bill before adding payments.")
    if day < bill.date:
        raise ValidationError({"date": "Payment cannot precede the bill date."})
    people = {p.pk: p for p in bill.participants.select_related("advance")}
    payer, recipient = people.get(payer_id), people.get(recipient_id)
    if not payer or (recipient_id is not None and not recipient):
        raise ValidationError("Choose people belonging to this bill.")
    if payer_id == recipient_id:
        raise ValidationError({"paid_to_id": "A person cannot pay themselves."})
    # Pending reports reserve capacity, but never count as confirmed paid totals.
    state = breakdown(bill, reserve_pending=pending)
    rows = {p["id"]: p for p in state["participants"]}
    full_advance = payer.is_me and recipient is None and value == bill.total and not bill.payments.filter(status__in=["confirmed", "pending"]).exclude(pk=approving.pk if approving else None).exists()
    if recipient:
        if value > rows[recipient_id]["to_receive"] or value > rows[payer_id]["remaining"]:
            raise ValidationError({"amount": "Payment exceeds this person's remaining contribution or the recipient's recoverable advance."})
    elif value > state["remaining_bill"]:
        raise ValidationError({"amount": "Payment exceeds the amount still owed to the merchant."})
    # Other participants may advance the bill as well; their excess is reimbursable.
    if payer.is_me and not full_advance and value > rows[payer_id]["remaining"]:
        raise ValidationError({"amount": "Pay up to your remaining contribution, or use Pay entire bill before any payments are recorded."})
    # Do not backdate a settlement ahead of the advance it reimburses.
    if recipient and day < max((p.date for p in bill.payments.filter(payer=recipient, status="confirmed")), default=bill.date):
        raise ValidationError({"date": "A reimbursement cannot precede the recipient's recorded advance."})
    expense = repayment = account = None
    if record_ledger:
        if not payer.is_me and not (recipient and recipient.is_me):
            raise ValidationError({"record_ledger": "Payments between other people must not touch your account."})
        account = locked_account(account_id, "account", cash_only=full_advance or not payer.is_me)
        if account.kind == "fund":
            raise ValidationError({"account": "Withdraw from the fund to a cash account before paying your contribution."})
        if payer.is_me:
            expense_value = payer.share if full_advance else value
            if expense_value:
                expense = models.Transaction.objects.create(kind="expense", name=(bill.title + " — my contribution")[:160],
                    amount=expense_value, date=day, account=account, category=bill.category,
                    payment_method=method, created_by=user)
                payer.share_is_fixed = True
                payer.save(update_fields=["share_is_fixed"])
            if full_advance:
                for participant in people.values():
                    if participant.is_me or not participant.share:
                        continue
                    loan = models.LoanReceivable.objects.create(person=participant.name, principal=participant.share,
                        date=day, account=account, notes="Shared bill advance: " + bill.title, created_by=user)
                    participant.advance = loan
                    participant.save(update_fields=["advance"])
                    move_money({"kind": "loan_disbursement", "amount": participant.share, "source": account.pk,
                                "loan": loan.pk, "date": str(day)}, user, shared_bill=True)
        else:
            if not any(person.advance_id for person in people.values()):
                raise ValidationError({"record_ledger": "This advance was not recorded in your accounts. Leave Record in my account off."})
            latest = bill.debt_adjustments.order_by("-date").first()
            if latest and day < latest.date:
                raise ValidationError({"date": "Record this reimbursement on or after the latest contribution reallocation."})
            prepare_collection(bill, payer, people, value, day, user)
            repayment = move_money({"kind": "loan_repayment", "amount": value, "destination": account.pk,
                                    "loan": payer.advance_id, "date": str(day)}, user, shared_bill=True)
    elif account_id is not None:
        raise ValidationError({"account": "Select an account only when recording a ledger payment."})
    if recipient and recipient.is_me and any(person.advance_id for person in people.values()) and not record_ledger and not pending:
        raise ValidationError({"record_ledger": "This advance belongs to your ledger. Record its collection so both histories remain accurate."})
    values = dict(bill=bill, payer=payer, paid_to=recipient, amount=value, date=day,
        record_ledger=record_ledger, account=account, payment_method=method, expense=expense, repayment=repayment,
        request_id=key, created_by=user, status="pending" if pending else "confirmed")
    if approving:
        for field, value in values.items():
            setattr(approving, field, value)
        approving.save()
    else:
        models.SharedBillPayment.objects.create(**values)
    if not pending:
        synchronize_debts(bill, user)
    return bill


@transaction.atomic
def share_bill(bill_id):
    bill = models.SharedBill.objects.select_for_update().get(pk=bill_id)
    if bill.archived:
        raise ValidationError("Restore this bill before sharing its breakdown.")
    bill.share_token = secrets.token_urlsafe(32)
    bill.share_expires_at = timezone.now() + timedelta(days=30)
    bill.edit_pin_hash = ""
    bill.save(update_fields=["share_token", "share_expires_at", "edit_pin_hash", "updated_at"])
    return bill


def confirm_allocation(bill, consent=False):
    if bill.allocation_confirmed:
        return
    if consent is not True:
        raise ValidationError({"confirm_resplit_legacy": "Confirm: keep your contribution fixed and split the remainder equally among everyone else for this older bill."})
    bill.participants.filter(is_me=True).update(share_is_fixed=True)
    bill.participants.filter(is_me=False).update(share_is_fixed=False)
    bill.allocation_confirmed = True
    bill.save(update_fields=["allocation_confirmed", "updated_at"])


@transaction.atomic
def generate_pin(bill_id, data):
    strict(data, ("confirm_resplit_legacy",))
    bill = models.SharedBill.objects.select_for_update().get(pk=bill_id)
    if bill.archived or not bill.share_token or not bill.share_expires_at or bill.share_expires_at <= timezone.now():
        raise ValidationError("Create an active share link before generating its PIN.")
    confirm_allocation(bill, data.get("confirm_resplit_legacy", False))
    pin = str(secrets.randbelow(100000000)).zfill(8)
    bill.edit_pin_hash = make_password(pin)
    bill.save(update_fields=["edit_pin_hash", "updated_at"])
    return bill, pin


def verify_pin(bill, pin, ident):
    key = "finance-shared-pin:" + hashlib.sha256((ident + ":" + str(bill.share_token)).encode()).hexdigest()
    if cache.get(key + ":locked"):
        raise Throttled(wait=1800, detail="Too many PIN attempts. Try again later.")
    valid = isinstance(pin, str) and len(pin) == 8 and pin.isascii() and pin.isdigit() and bool(bill.edit_pin_hash) and check_password(pin, bill.edit_pin_hash)
    if not valid:
        cache.add(key, 0, timeout=1800)
        try:
            attempts = cache.incr(key)
        except ValueError:
            cache.set(key, 1, timeout=1800)
            attempts = 1
        if attempts >= 5:
            cache.set(key + ":locked", True, timeout=1800)
        raise PermissionDenied("A valid edit PIN is required.")
    cache.delete(key)


@transaction.atomic
def add_participant(bill_id, data, user=None):
    strict(data, ("name", "amount", "request_id", "confirm_resplit_legacy"))
    models.WorkspaceSettings.objects.get_or_create(pk=1)
    models.WorkspaceSettings.objects.select_for_update().get(pk=1)
    bill = models.SharedBill.objects.select_for_update().get(pk=bill_id)
    if bill.archived:
        raise ValidationError("Restore this bill before adding people.")
    key = request_key(data)
    name = data.get("name", "")
    if not isinstance(name, str) or not 1 <= len(name.strip()) <= 120:
        raise ValidationError({"name": "Enter a name with 1–120 characters."})
    name = name.strip()
    fixed = data.get("amount") not in (None, "")
    value = ZERO
    if fixed:
        try:
            value = Decimal(str(data["amount"]))
            if not value.is_finite() or value < ZERO or value.as_tuple().exponent < -2 or value >= Decimal("1000000000000"):
                raise InvalidOperation
        except (ValueError, InvalidOperation):
            raise ValidationError({"amount": "Use a non-negative contribution with at most two decimal places."})
    existing = models.SharedBillParticipant.objects.filter(membership_request_id=key).first()
    if existing:
        if existing.bill_id != bill.pk or existing.name != name or existing.share_is_fixed != fixed or (fixed and existing.share != value):
            raise ValidationError("This request identifier belongs to a different participant.")
        return bill
    confirm_allocation(bill, data.get("confirm_resplit_legacy", False))
    people = list(bill.participants.order_by("id"))
    if len(people) >= 50 or any(person.name.strip().casefold() == name.casefold() for person in people):
        raise ValidationError({"name": "Choose a new person; this bill supports up to 50 people."})
    # Once the owner's expense is recorded, preserve it even if it was originally equal-split.
    if bill.payments.filter(status="confirmed", expense__isnull=False).exists():
        owner = next(person for person in people if person.is_me)
        owner.share_is_fixed = True
        owner.save(update_fields=["share_is_fixed"])
    rows = [{"name": p.name, "is_me": p.is_me, "amount": str(p.share) if p.share_is_fixed else None} for p in people]
    shares = participant_shares(rows + [{"name": name, "amount": data.get("amount"), "is_me": False}], bill.total)
    for person, share in zip(people, shares):
        person.share = share["share"]
        person.save(update_fields=["share"])
    models.SharedBillParticipant.objects.create(bill=bill, membership_request_id=key, **shares[-1])
    synchronize_debts(bill, user)
    return bill


def synchronize_debts(bill, user):
    """Distribute remaining recoverable owner cash without pretending it was repaid."""
    people = list(bill.participants.select_related("advance").order_by("id"))
    owner = next(person for person in people if person.is_me)
    if not any(person.advance_id for person in people):
        return
    state = breakdown(bill)
    rows = {row["id"]: row for row in state["participants"]}
    pool = rows[owner.pk]["to_receive"]
    debtors = [person for person in people if not person.is_me and rows[person.pk]["remaining"] > ZERO]
    weight = sum((rows[person.pk]["remaining"] for person in debtors), ZERO)
    targets, allocated = {}, ZERO
    for person in debtors:
        target = (pool * rows[person.pk]["remaining"] / weight).quantize(Decimal("0.01"), rounding="ROUND_DOWN")
        targets[person.pk] = target
        allocated += target
    cents = int((pool - allocated) * 100)
    for person in debtors[:cents]:
        targets[person.pk] += Decimal("0.01")
    account = next(person.advance.account for person in people if person.advance_id)
    for person in people:
        if person.is_me:
            continue
        target = targets.get(person.pk, ZERO)
        if not person.advance_id and target:
            person.advance = models.LoanReceivable.objects.create(person=person.name, principal=ZERO, date=today(), account=account, existing=True,
                notes="Reassigned shared bill advance: " + bill.title, created_by=user)
            person.save(update_fields=["advance"])
        if person.advance_id:
            change = target - outstanding(person.advance)
            if change:
                models.SharedBillDebtAdjustment.objects.create(bill=bill, loan=person.advance, amount=change, date=today(),
                    reason="Shared bill contribution reallocation", created_by=user)


def prepare_collection(bill, payer, people, value, day, user):
    """The actual payer may settle more than their proportional owner allocation."""
    account = next(person.advance.account for person in people.values() if person.advance_id)
    if not payer.advance_id:
        payer.advance = models.LoanReceivable.objects.create(person=payer.name, principal=ZERO, date=day,
            account=account, existing=True, notes="Reassigned shared bill advance: " + bill.title, created_by=user)
        payer.save(update_fields=["advance"])
    missing = max(value - outstanding(payer.advance), ZERO)
    if missing and day < today():
        raise ValidationError({"date": "Record a reimbursement requiring contribution reallocation today."})
    for person in people.values():
        if person.pk == payer.pk or not person.advance_id or not missing:
            continue
        moved = min(missing, outstanding(person.advance))
        if moved:
            models.SharedBillDebtAdjustment.objects.create(bill=bill, loan=person.advance, amount=-moved, date=day,
                reason="Receivable reassigned to actual reimbursement payer", created_by=user)
            models.SharedBillDebtAdjustment.objects.create(bill=bill, loan=payer.advance, amount=moved, date=day,
                reason="Receivable reassigned to actual reimbursement payer", created_by=user)
            missing -= moved
    if missing:
        raise ValidationError({"amount": "Reimbursement exceeds the remaining recorded shared advance."})


@transaction.atomic
def decide_payment(bill_id, payment_id, data, user, approve):
    models.WorkspaceSettings.objects.get_or_create(pk=1)
    models.WorkspaceSettings.objects.select_for_update().get(pk=1)
    bill = models.SharedBill.objects.select_for_update().get(pk=bill_id)
    payment = models.SharedBillPayment.objects.select_for_update().filter(pk=payment_id, bill=bill).first()
    if not payment:
        raise ValidationError("Choose a payment belonging to this bill.")
    if not approve:
        strict(data, ())
        if payment.status == "confirmed":
            raise ValidationError("Confirmed payments cannot be rejected or erased.")
        payment.status = "rejected"
        payment.save(update_fields=["status", "updated_at"])
        return bill
    strict(data, ("record_ledger", "account", "payment_method"))
    if payment.status == "confirmed":
        return bill
    if payment.status != "pending":
        raise ValidationError("Only pending reports can be approved.")
    payload = {"payer_id": payment.payer_id, "paid_to_id": payment.paid_to_id, "amount": str(payment.amount), "date": str(payment.date),
               "request_id": str(payment.request_id), **data}
    return pay_bill(bill.pk, payload, user, approving=payment)
