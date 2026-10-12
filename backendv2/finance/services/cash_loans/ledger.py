"""Atomic financing postings and credit reservations; no scheduled expense writes."""

import hashlib
import json
import uuid
from datetime import date
from decimal import Decimal

from django.db import transaction
from django.db.models import Q, Sum
from rest_framework.exceptions import ValidationError

from finance.models import Account, CashLoan, CashLoanAdjustment, CashLoanAllocation, CashLoanInstallment, CashLoanOperation, CashLoanPosting, CashLoanSchedule, Transaction
from finance.services.audit import record_change
from finance.services.balances import ZERO, ensure_account_capacity, today
from finance.services.settlements import action_date
from .calculations import calculate_loan, number

TERM_KEYS = ("loan_amount", "rate", "rate_period", "interest_method", "term_months", "fee_kind", "fee_value", "fee_treatment", "monthly_charge", "loan_date", "first_payment_date", "credit_policy")


def json_values(value):
    if isinstance(value, Decimal):
        return format(value, "f")
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, uuid.UUID):
        return str(value)
    if isinstance(value, dict):
        return {key: json_values(item) for key, item in value.items()}
    if isinstance(value, (tuple, list)):
        return [json_values(item) for item in value]
    return value


def total(queryset, field):
    return queryset.aggregate(value=Sum(field))["value"] or ZERO


def paid_allocations(queryset, as_of=None):
    day = as_of or today()
    return queryset.filter(movement__date__lte=day).filter(Q(reversed_on__isnull=True) | Q(reversed_on__gt=day))


def remaining_components(item, as_of=None):
    day = as_of or today()
    cache = getattr(item, "_prefetched_objects_cache", {})
    if "allocations" in cache and "adjustments" in cache:
        allocated = [row for row in cache["allocations"] if row.movement.date <= day and (row.reversed_on is None or row.reversed_on > day)]
        adjusted = [row for row in cache["adjustments"] if row.date <= day]
        return {key: max(ZERO, getattr(item, key) - sum((getattr(row, key) for row in allocated + adjusted), ZERO)) for key in ("principal", "interest", "fees")}
    allocated = paid_allocations(item.allocations, day)
    adjusted = item.adjustments.filter(date__lte=day)
    return {key: max(ZERO, getattr(item, key) - total(allocated, key) - total(adjusted, key)) for key in ("principal", "interest", "fees")}


def fee_remaining(loan, as_of=None):
    if loan.terms.get("fee_treatment", "separate") != "separate":
        return ZERO
    day = as_of or today()
    fee = Decimal(loan.schedules.order_by("version").first().quote["processing_fee"])
    cash_paid = -total(loan.postings.filter(kind="processing_fee", account__kind__in=Account.CASH_KINDS, date__lte=day), "effect")
    paid = total(paid_allocations(loan.allocations.filter(installment__isnull=True), day), "fees")
    adjusted = total(loan.adjustments.filter(installment__isnull=True, date__lte=day), "fees")
    return max(ZERO, fee - cash_paid - paid - adjusted)


def loan_account_effect(account_id, as_of):
    return total(CashLoanPosting.objects.filter(account_id=account_id, date__lte=as_of), "effect")


def installments_as_of(loan, day):
    schedule = loan.schedules.filter(effective_date__lte=day).order_by("-version").first()
    if not schedule:
        return loan.installments.none(), None
    return loan.installments.filter(schedule__version__lte=schedule.version).filter(Q(active=True) | Q(schedule=schedule)), schedule


def borrowing_rebates(start, end, account_id=None):
    rows = CashLoanPosting.objects.filter(kind="rebate", date__range=(start, end))
    if account_id is not None:
        rows = rows.filter(account_id=account_id)
    return -(total(rows, "interest") + total(rows, "fees"))


def additional_credit_reservation(card_id, as_of=None):
    day = as_of or today()
    value = ZERO
    for loan in CashLoan.objects.filter(card_id=card_id).prefetch_related("installments__postings", "installments__adjustments"):
        if date.fromisoformat(loan.terms["loan_date"]) > day:
            continue
        items, schedule = installments_as_of(loan, day)
        if not schedule or schedule.terms.get("credit_policy", "principal") != "full_installments":
            continue
        for item in items:
            for key in ("interest", "fees"):
                adjusted = total(item.adjustments.filter(date__lte=day), key)
                posted = total(item.postings.filter(date__lte=day), key)
                value += max(ZERO, getattr(item, key) - adjusted - max(ZERO, posted))
    return value


def available_credit(account, as_of=None):
    from finance.services.balances import account_balance
    if account.kind != "credit_card" or account.credit_limit is None:
        return None
    return account.credit_limit - account_balance(account, as_of) - additional_credit_reservation(account.pk, as_of)


def lock_accounts(ids):
    wanted = sorted({int(pk) for pk in ids if pk is not None})
    rows = {row.pk: row for row in Account.objects.select_for_update().filter(pk__in=wanted).order_by("pk")}
    if len(rows) != len(wanted):
        raise ValidationError({"account": "Choose existing accounts."})
    return rows


def record_event(loan, actor, action, details, key):
    record_change(actor=actor, source="dashboard", action=action, area="accounts", subject_type="CashLoan", subject_id=loan.pk, label=loan.name, after=json_values(details), operation_key=key)


@transaction.atomic
def operation(data, action, actor, callback):
    try:
        key = uuid.UUID(str(data.get("request_id")))
    except (ValueError, TypeError, AttributeError):
        raise ValidationError({"request_id": "A valid request identifier is required for safe retry."})
    digest = hashlib.sha256(json.dumps(json_values(data), sort_keys=True, separators=(",", ":")).encode()).hexdigest()
    receipt, created = CashLoanOperation.objects.get_or_create(request_id=key, defaults={"action": action, "payload_hash": digest, "created_by": actor})
    receipt = CashLoanOperation.objects.select_for_update().get(pk=receipt.pk)
    if receipt.action != action or receipt.payload_hash != digest or receipt.created_by_id != getattr(actor, "pk", None):
        raise ValidationError({"request_id": "This identifier belongs to a different action. Retry the original request or start a new action."})
    if not created:
        return receipt.result
    result = callback()
    receipt.result = json_values(result)
    receipt.save(update_fields=["result"])
    return receipt.result


def add_schedule(loan, terms, quote, day, actor, offset=0):
    schedule = CashLoanSchedule.objects.create(loan=loan, version=loan.version, terms=json_values(terms), quote=json_values(quote), effective_date=day, created_by=actor)
    for row in quote["schedule"]:
        CashLoanInstallment.objects.create(loan=loan, schedule=schedule, index=row["index"] + offset, due_date=row["due_date"], principal=row["principal"], interest=row["interest"], fees=row["charges"], remaining_principal=row["remaining_principal"], created_by=actor)
    return schedule


def add_posting(loan, account, day, kind, effect, actor, *, installment=None, interest=ZERO, fees=ZERO, notes=""):
    row = CashLoanPosting.objects.create(loan=loan, account=account, date=day, kind=kind, effect=effect, installment=installment, interest=interest, fees=fees, notes=notes, created_by=actor)
    cost = interest + fees
    if cost > 0:
        Transaction.objects.create(kind="expense", name=loan.name + (" interest & fees" if interest else " fee"), amount=cost, account=account, date=day, cash_loan_posting=row, payment_method="credit_card" if account.kind == "credit_card" else "bank", created_by=actor)
    return row


def create_cash_loan(data, actor):
    def create():
        name = str(data.get("name", "")).strip()
        if not name or len(name) > 160:
            raise ValidationError({"name": "Enter a loan name of at most 160 characters."})
        terms = {key: data[key] for key in TERM_KEYS if key in data}
        quote = calculate_loan(terms)
        day = action_date(terms["loan_date"])
        accounts = lock_accounts([data.get("card_id"), data.get("receiving_account_id")])
        card = accounts.get(int(data.get("card_id", 0)))
        receiver = accounts.get(int(data.get("receiving_account_id", 0)))
        if not card or card.kind != "credit_card" or not card.active:
            raise ValidationError({"card_id": "Choose an active credit card."})
        if not receiver or receiver.kind not in Account.CASH_KINDS or not receiver.active:
            raise ValidationError({"receiving_account_id": "Choose an active cash, bank or e-wallet account."})
        loan = CashLoan.objects.create(name=name, card=card, receiving_account=receiver, terms=json_values(terms), created_by=actor)
        add_schedule(loan, terms, quote, day, actor)
        fee = quote["processing_fee"] if terms.get("fee_treatment") in ("upfront", "financed") else ZERO
        add_posting(loan, card, day, "release", quote["financed_principal"], actor, fees=fee, notes="Financing liability; not a purchase")
        add_posting(loan, receiver, day, "disbursement", quote["net_cash_received"], actor, notes="Borrowed cash; not earned income")
        ensure_account_capacity(card, day, "card_id")
        from .projections import materialize_cash_loan_deadlines
        materialize_cash_loan_deadlines(loan.pk)
        record_event(loan, actor, "added", {"principal": quote["financed_principal"], "cash_received": quote["net_cash_received"], "credit_policy": terms.get("credit_policy", "principal")}, f"cash-loan:{data['request_id']}")
        return {"loan_id": loan.pk}
    return operation(data, "create", actor, create)


def post_installment_charges(item, day, actor, values):
    if day < date.fromisoformat(item.loan.terms["loan_date"]):
        raise ValidationError({"date": "A charge cannot precede loan release."})
    if day < item.schedule.effective_date:
        raise ValidationError({"date": "A charge cannot precede this schedule's effective date."})
    remaining = remaining_components(item, day)
    components = {}
    for key in ("interest", "fees"):
        value = number(values.get(key, "0"), key)
        posted = total(item.postings.all(), key)
        adjusted = total(item.adjustments.all(), key)
        if value > max(ZERO, getattr(item, key) - adjusted - max(ZERO, posted)):
            raise ValidationError({key: "This exceeds the unposted contractual charge."})
        components[key] = value
    if sum(components.values()) <= 0:
        raise ValidationError({"postings": "Enter an actual interest or fee charge to post."})
    row = add_posting(item.loan, item.loan.card, day, "charges", sum(components.values()), actor, installment=item, **components)
    ensure_account_capacity(item.loan.card, day, "card_id")
    return row


def post_charges(loan_id, data, actor):
    def post():
        loan = CashLoan.objects.get(pk=loan_id)
        lock_accounts([loan.card_id, data.get("account_id")])
        loan = CashLoan.objects.select_for_update().get(pk=loan_id)
        if loan.cancelled:
            raise ValidationError("This loan is cancelled.")
        day = action_date(data.get("date"))
        if day < date.fromisoformat(loan.terms["loan_date"]):
            raise ValidationError({"date": "A charge cannot precede loan release."})
        if data.get("processing_fee"):
            value = fee_remaining(loan)
            if value <= 0 or loan.postings.filter(kind="processing_fee").exists():
                raise ValidationError({"processing_fee": "This fee is already posted or paid."})
            payer = lock_accounts([data.get("account_id")])[int(data.get("account_id", 0))]
            if payer.pk != loan.card_id and (payer.kind not in Account.CASH_KINDS or not payer.active):
                raise ValidationError({"account_id": "Choose the loan card or an active cash account."})
            row = add_posting(loan, payer, day, "processing_fee", value if payer.kind == "credit_card" else -value, actor, fees=value)
            ensure_account_capacity(payer, day, "account_id")
        else:
            item = loan.installments.filter(pk=data.get("installment_id"), active=True).first()
            if not item:
                raise ValidationError({"installment_id": "Choose a current installment."})
            row = post_installment_charges(item, day, actor, data)
        record_event(loan, actor, "adjusted", {"posting": row.pk, "amount": abs(row.effect)}, f"cash-post:{data['request_id']}")
        loan.version += 1
        loan.save(update_fields=["version", "updated_at"])
        return {"loan_id": loan.pk, "posting_id": row.pk}
    return operation({**data, "loan_id": loan_id}, "post", actor, post)
