import uuid
from datetime import date
from decimal import Decimal, InvalidOperation

from django.db import transaction as db_transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from finance.models import Account, Deadline, LoanReceivable, MoneyMovement, Transaction
from .balances import account_balance, outstanding, today, validate_fund_history


def amount(value):
    try:
        result = Decimal(str(value))
        if not result.is_finite() or result <= 0 or result.as_tuple().exponent < -2 or result >= Decimal("1000000000000"):
            raise InvalidOperation
        return result
    except (InvalidOperation, ValueError, TypeError):
        raise ValidationError({"amount": "Enter a positive peso amount with at most two decimal places."})


def action_date(value):
    try:
        result = date.fromisoformat(str(value)) if value else today()
    except ValueError:
        raise ValidationError({"date": "Enter a valid date."})
    if result > today():
        raise ValidationError({"date": "Record actual movements today or earlier."})
    return result


def request_key(data):
    try:
        return uuid.UUID(str(data.get("request_id"))) if data.get("request_id") else uuid.uuid4()
    except ValueError:
        raise ValidationError({"request_id": "Invalid request identifier."})


def locked_account(pk, field, cash_only=False):
    account = Account.objects.select_for_update().filter(pk=pk, active=True).first()
    if not account or (cash_only and account.kind not in Account.CASH_KINDS):
        raise ValidationError({field: "Choose an active cash, bank or e-wallet account." if cash_only else "Choose an active account."})
    return account


@db_transaction.atomic
def move_money(data, user, deadline=None, shared_bill=False):
    key = request_key(data)
    existing = MoneyMovement.objects.filter(request_id=key).first()
    if existing:
        refs = (("source", existing.source_id), ("destination", existing.destination_id), ("loan", existing.loan_id))
        if existing.kind != data.get("kind") or existing.amount != amount(data.get("amount")) or existing.date != action_date(data.get("date")) or any(str(data.get(field) or "") != str(value or "") for field, value in refs):
            raise ValidationError("This request identifier was already used for a different movement.")
        return existing
    kind = data.get("kind")
    value = amount(data.get("amount"))
    movement_date = action_date(data.get("date"))
    source = destination = loan = None
    # Stable lock order prevents A->B/B->A transfer deadlocks on PostgreSQL.
    account_ids = sorted({int(pk) for pk in (data.get("source"), data.get("destination")) if pk})
    list(Account.objects.select_for_update().filter(pk__in=account_ids).order_by("pk"))
    # A concurrent retry may have committed while we waited for these locks.
    if MoneyMovement.objects.filter(request_id=key).exists():
        return move_money(data, user, deadline, shared_bill)
    if kind in ("transfer", "credit_card_payment", "loan_disbursement", "fund_contribution"):
        source = locked_account(data.get("source"), "source", cash_only=True)
    if kind in ("transfer", "loan_repayment", "fund_withdrawal"):
        destination = locked_account(data.get("destination"), "destination", cash_only=True)
    if kind in ("fund_contribution", "fund_withdrawal"):
        if data.get("loan"):
            raise ValidationError({"loan": "Fund movements cannot be linked to a loan."})
        field = "destination" if kind == "fund_contribution" else "source"
        fund = locked_account(data.get(field), field)
        if fund.kind != "fund":
            raise ValidationError({field: "Choose an active benefit or investment fund."})
        if kind == "fund_contribution":
            destination = fund
        else:
            source = fund
            if value > account_balance(fund, movement_date):
                raise ValidationError({"amount": "Withdrawal exceeds the recorded fund value on this date."})
    if kind == "credit_card_payment":
        destination = locked_account(data.get("destination"), "destination")
        if destination.kind != "credit_card":
            raise ValidationError({"destination": "Choose a credit card."})
        if value > account_balance(destination, movement_date):
            raise ValidationError({"amount": "Payment exceeds recorded card debt on this date."})
    if kind == "transfer" and source.pk == destination.pk:
        raise ValidationError({"destination": "Choose a different destination account."})
    if kind in ("loan_disbursement", "loan_repayment"):
        loan = LoanReceivable.objects.select_for_update().filter(pk=data.get("loan")).first()
        if not loan:
            raise ValidationError({"loan": "Choose an existing loan."})
        if hasattr(loan, "shared_participant") and not shared_bill:
            raise ValidationError({"loan": "Record this advance's repayment from its shared bill so the breakdown and account remain consistent."})
        if movement_date < loan.date:
            raise ValidationError({"date": "A repayment cannot precede the loan."})
        if kind == "loan_disbursement" and (loan.existing or loan.movements.filter(kind=kind).exists() or value != loan.principal):
            raise ValidationError({"loan": "This loan already has a disbursement or is an opening loan."})
        if kind == "loan_repayment" and value > outstanding(loan):
            raise ValidationError({"amount": "Repayment exceeds outstanding principal."})
    if kind not in dict(MoneyMovement.KINDS):
        raise ValidationError({"kind": "Choose a supported movement."})
    movement = MoneyMovement.objects.create(kind=kind, amount=value, date=movement_date, source=source, destination=destination, loan=loan, deadline=deadline, notes=data.get("notes", ""), request_id=key, created_by=user)
    if kind == "fund_withdrawal":
        validate_fund_history(source, movement_date)
    if loan and kind == "loan_repayment" and outstanding(loan) == 0:
        loan.deadlines.filter(status="pending").update(status="completed", completed_at=timezone.now())
    return movement


@db_transaction.atomic
def settle_deadline(pk, data, user):
    item = Deadline.objects.select_for_update().get(pk=pk)
    if item.asset_financing_id:
        raise ValidationError({"deadline": "Record this installment from its asset page so principal and interest stay separate."})
    if item.status != "pending":
        return item
    if item.kind in ("task", "reminder") and item.settlement_kind == "expense" and item.amount is None:
        item.status = "completed"
    elif item.settlement_kind == "credit_card_payment":
        move_money({**data, "kind": "credit_card_payment", "source": data.get("account"), "destination": item.credit_card_id, "amount": data.get("amount") or item.amount}, user, item)
        item.status = "paid"
    elif item.settlement_kind == "loan_collection":
        # Partial collections belong to loan history; do not consume the unique final settlement link.
        move_money({**data, "kind": "loan_repayment", "destination": data.get("account"), "loan": item.loan_id, "amount": data.get("amount") or outstanding(item.loan)}, user)
        item.status = "completed" if outstanding(item.loan) == 0 else "pending"
    else:
        if data.get("transaction"):
            expense = Transaction.objects.select_for_update().filter(pk=data["transaction"], kind="expense", deadline__isnull=True).first()
            if not expense:
                raise ValidationError({"transaction": "Choose an unlinked expense."})
            if item.amount is not None and expense.amount != item.amount:
                raise ValidationError({"transaction": "The expense amount must match this bill."})
            expense.deadline = item
            expense.save(update_fields=["deadline", "updated_at"])
            item.amount = expense.amount
        else:
            paying = locked_account(data.get("account"), "account")
            if paying.kind == "fund":
                raise ValidationError({"account": "Withdraw to a cash account before paying a bill."})
            value = amount(data.get("amount") or item.amount)
            Transaction.objects.create(kind="expense", name=item.title, account=paying, category=item.category, amount=value, date=action_date(data.get("date")), payment_method=data.get("payment_method", "bank"), deadline=item, created_by=user, request_id=request_key(data))
            item.amount = value
        item.status = "paid"
    item.completed_at = timezone.now() if item.status != "pending" else None
    item.save(update_fields=["amount", "status", "completed_at", "updated_at"])
    return item
