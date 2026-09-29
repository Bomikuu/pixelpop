import calendar
from datetime import date, timedelta
from decimal import Decimal, ROUND_HALF_UP

from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from finance.models import Account, AssetFinancingPayment, Deadline, Transaction
from .balances import ZERO, ensure_account_capacity, today


CENT = Decimal("0.01")


def monthly_date(anchor, index):
    month_index = anchor.year * 12 + anchor.month - 1 + index
    year, month = divmod(month_index, 12)
    return date(year, month + 1, min(anchor.day, calendar.monthrange(year, month + 1)[1]))


def terms_on(financing, day):
    change = financing.term_changes.filter(effective_date__lte=day).order_by("-effective_date", "-pk").first()
    return (change.annual_rate, change.monthly_due) if change else (financing.annual_rate, financing.monthly_due)


def financing_balance(financing):
    paid = financing.payments.filter(historical=False).aggregate(principal=Sum("principal"), extra=Sum("extra_principal"))
    return max(ZERO, financing.opening_principal - (paid["principal"] or ZERO) - (paid["extra"] or ZERO))


def advance_balance(financing):
    totals = financing.payments.filter(historical=False).aggregate(reserved=Sum("advance_reserved"), applied=Sum("advance_applied"))
    return (totals["reserved"] or ZERO) - (totals["applied"] or ZERO)


def materialize_installments(financing):
    if financing_balance(financing) == ZERO:
        for item in financing.installments.filter(status="pending"):
            if item.financing_payments.exists():
                item.status = "completed"
                item.completed_at = timezone.now()
                item.save(update_fields=["status", "completed_at", "updated_at"])
            else:
                item.delete()
        return
    horizon = today() + timedelta(days=366 * 5)
    existing = set(financing.installments.values_list("installment_index", flat=True))
    for index in range(financing.remaining_months):
        due = monthly_date(financing.next_due_date, index)
        if due > horizon:
            break
        if index not in existing:
            _, monthly_due = terms_on(financing, due)
            Deadline.objects.get_or_create(
                asset_financing=financing, installment_index=index,
                defaults={
                    "title": financing.asset.name + " financing",
                    "kind": "payment", "amount": monthly_due, "due_date": due,
                    "created_by": financing.created_by,
                },
            )


def installment_paid(deadline):
    totals = deadline.financing_payments.filter(historical=False).aggregate(principal=Sum("principal"), interest=Sum("interest"), fees=Sum("fees"))
    return sum((totals[field] or ZERO for field in ("principal", "interest", "fees")), ZERO)


def financing_projection(financing):
    materialize_installments(financing)
    balance = financing_balance(financing)
    advance = advance_balance(financing)
    schedule = []
    estimated_interest = ZERO
    estimated_payments = ZERO
    for item in financing.installments.order_by("due_date", "pk"):
        rate, _ = terms_on(financing, item.due_date)
        paid = installment_paid(item)
        remaining_due = max(ZERO, item.amount - paid)
        projected_interest = ZERO
        projected_principal = ZERO
        if item.status == "pending" and balance > ZERO:
            projected_interest = (balance * rate / Decimal(1200)).quantize(CENT, rounding=ROUND_HALF_UP)
            projected_principal = min(balance, max(ZERO, remaining_due - projected_interest))
            estimated_interest += projected_interest
            estimated_payments += min(remaining_due, projected_interest + projected_principal)
            balance -= projected_principal
        schedule.append({
            "id": item.pk, "index": item.installment_index + 1,
            "due_date": str(item.due_date), "due": str(item.amount),
            "paid": str(paid), "remaining_due": str(remaining_due),
            "status": item.status,
            "overdue": item.status == "pending" and item.due_date < today() and remaining_due > ZERO,
            "estimated_interest": str(projected_interest),
            "estimated_principal": str(projected_principal),
            "estimated_balance_after": str(balance),
        })
    return {
        "current_principal": str(financing_balance(financing)),
        "advance_credit": str(advance),
        "estimated_five_year_interest": str(estimated_interest),
        "estimated_five_year_payments": str(estimated_payments),
        "estimated_balance_after_schedule": str(balance),
        "schedule": schedule,
    }


@transaction.atomic
def record_payment(financing, values, user):
    financing = type(financing).objects.select_for_update().select_related("asset").get(pk=financing.pk)
    request_id = values["request_id"]
    existing = AssetFinancingPayment.objects.filter(request_id=request_id).first()
    if existing:
        if existing.financing_id != financing.pk or any(
            getattr(existing, field) != values[field]
            for field in ("account", "deadline", "date", "cash_amount", "advance_applied", "principal", "extra_principal", "interest", "fees", "advance_reserved", "historical", "notes")
        ):
            raise ValidationError({"request_id": "This payment identifier was already used for different details."})
        return existing
    account = values["account"]
    account = Account.objects.select_for_update().get(pk=account.pk)
    historical = values["historical"]
    if account.kind not in account.CASH_KINDS or (not historical and not account.active):
        raise ValidationError({"account": "Choose a cash, bank or e-wallet account; current payments need an active account."})
    day = values["date"]
    if day > today():
        raise ValidationError({"date": "Record payments after they happen."})
    if historical != (day < financing.balance_as_of):
        raise ValidationError({"date": "Earlier history must precede the confirmed balance date; current payments must follow it."})
    last_live = financing.payments.filter(historical=False).order_by("-date", "-pk").first()
    if not historical and last_live and day < last_live.date:
        raise ValidationError({"date": "Record current payments in date order so the principal and advance balances stay correct."})
    deadline = values["deadline"]
    if deadline and (historical or deadline.asset_financing_id != financing.pk or deadline.status != "pending"):
        raise ValidationError({"deadline": "Choose an unpaid installment for this asset."})
    if not deadline and any(values[field] for field in ("principal", "interest", "fees")) and not historical:
        raise ValidationError({"deadline": "Choose an installment for the regular principal, interest or fees. Use extra principal for a separate lump sum."})
    if historical and (values["advance_applied"] or values["advance_reserved"]):
        raise ValidationError({"historical": "Earlier history cannot change today's advance credit."})
    cash = values["cash_amount"]
    applied = values["advance_applied"]
    allocation = sum((values[field] for field in ("principal", "extra_principal", "interest", "fees", "advance_reserved")), ZERO)
    if cash + applied <= ZERO or allocation != cash + applied:
        raise ValidationError({"cash_amount": "Cash plus advance credit must equal principal, interest, fees and new advance credit."})
    if values["advance_reserved"] > cash:
        raise ValidationError({"advance_reserved": "New advance credit cannot exceed cash paid now."})
    if not historical:
        if financing_balance(financing) == ZERO:
            raise ValidationError({"principal": "This financing is already paid off."})
        if values["principal"] + values["extra_principal"] > financing_balance(financing):
            raise ValidationError({"principal": "Principal paid exceeds the remaining loan balance."})
        if applied > advance_balance(financing):
            raise ValidationError({"advance_applied": "Not enough recorded advance credit is available."})
        if (
            values["principal"] + values["extra_principal"] == financing_balance(financing)
            and advance_balance(financing) + values["advance_reserved"] - applied > ZERO
        ):
            raise ValidationError({"advance_applied": "Apply existing advance credit before paying off the remaining principal."})
        if deadline and values["principal"] + values["interest"] + values["fees"] > deadline.amount - installment_paid(deadline):
            raise ValidationError({"deadline": "The regular portion exceeds this installment's remaining due. Put the excess in principal or advance credit."})
    payment = AssetFinancingPayment.objects.create(financing=financing, created_by=user, **values)
    if not historical:
        ensure_account_capacity(account, day)
        costs = values["interest"] + values["fees"]
        if costs:
            Transaction.objects.create(
                kind="expense", name=financing.asset.name + " financing interest & fees",
                account=account, amount=costs, date=day,
                payment_method="cash" if account.kind == "cash" else "bank" if account.kind == "bank" else "other",
                asset_financing_payment=payment, created_by=user,
            )
        if deadline and installment_paid(deadline) >= deadline.amount:
            deadline.status = "paid"
            deadline.completed_at = timezone.now()
            deadline.save(update_fields=["status", "completed_at", "updated_at"])
        materialize_installments(financing)
    return payment
