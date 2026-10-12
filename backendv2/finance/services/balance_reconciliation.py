"""Reconcile real balances without duplicate ledger effects or partial batches."""
from decimal import Decimal
from uuid import uuid5

from django.db import IntegrityError, transaction
from rest_framework.exceptions import ValidationError

from finance.models import Account, AuditEvent, BalanceAdjustment, Category, Transaction
from .audit import log_record, record_change, snapshot_record
from .balances import account_balance, today
from .quick_entry import payment_method_for


def money_text(value):
    return str(value.quantize(Decimal("0.01")))


@transaction.atomic
def _reconcile(rows, request_id, actor):
    rows = sorted(rows, key=lambda row: row["account_id"])
    accounts = {a.pk: a for a in Account.objects.select_for_update().filter(
        pk__in=[row["account_id"] for row in rows],
    ).order_by("pk")}
    before = {f"account_{row['account_id']}": money_text(row["expected_balance"]) for row in rows}
    after = {f"account_{row['account_id']}": money_text(row["corrected_balance"]) for row in rows}
    changes = [{"field": key.replace("_", " ").capitalize(), "old": before[key], "new": after[key]} for key in sorted(before)]
    operation_key = f"balance-reconciliation:{request_id}"
    previous = AuditEvent.objects.filter(operation_key=operation_key).first()
    if previous:
        if previous.actor_id != actor.pk or previous.changes != changes:
            raise ValidationError({"detail": "This save identifier was used for different corrections. Refresh before starting a new correction."})
        return {"saved_count": len(rows), "replayed": True}

    day = today()
    for row in rows:
        account = accounts.get(row["account_id"])
        if not account or not account.active or account.kind not in (*Account.CASH_KINDS, "credit_card"):
            raise ValidationError({"detail": "Nothing was saved. Choose active cash, bank, e-wallet or credit-card accounts."})
        if account_balance(account, day) != row["expected_balance"]:
            raise ValidationError({"detail": f"Nothing was saved. {account.name}'s balance has changed. Refresh and review the new balance."})

    for row in rows:
        account = accounts[row["account_id"]]
        difference = row["corrected_balance"] - row["expected_balance"]
        note = f"Balance reconciliation on {day}: {money_text(row['expected_balance'])} to {money_text(row['corrected_balance'])}. Original source is unknown; this is not a dated historical payment."
        identity = uuid5(request_id, f"account:{account.pk}")
        if account.kind == "credit_card" and difference < 0:
            entry = BalanceAdjustment.objects.create(
                account=account, amount=difference, date=day,
                reason=f"Unknown debt correction: {money_text(row['expected_balance'])} to {money_text(row['corrected_balance'])}. No payment or source account inferred.",
                request_id=identity, created_by=actor,
            )
            log_record(entry, actor=actor, action="adjusted", after=snapshot_record(entry))
        else:
            expense = account.kind == "credit_card" or difference < 0
            category, created = Category.objects.get_or_create(name="Unknown", defaults={"created_by": actor})
            if created:
                log_record(category, actor=actor, action="added", after=snapshot_record(category))
            entry = Transaction.objects.create(
                account=account, kind="expense" if expense else "income",
                name="Unknown expense" if expense else "Unknown income",
                category=category, amount=abs(difference), date=day,
                payment_method=payment_method_for(account), notes=note,
                request_id=identity, created_by=actor,
            )
            log_record(entry, actor=actor, action="added", after=snapshot_record(entry))
        if account_balance(account, day) != row["corrected_balance"]:
            raise ValidationError({"detail": "Nothing was saved. The account changed during reconciliation. Refresh and retry."})

    event = record_change(
        actor=actor, source="dashboard", action="adjusted", area="accounts",
        subject_type="BalanceReconciliation", subject_id=request_id,
        label=f"{len(rows)} account balances corrected", before=before, after=after,
        operation_key=operation_key,
    )
    if event is None:
        raise ValidationError({"detail": "Nothing was saved. Another request used this identifier; retry with the same corrections."})
    return {"saved_count": len(rows), "replayed": False}


def reconcile_balances(rows, request_id, actor):
    try:
        return _reconcile(rows, request_id, actor)
    except IntegrityError:
        raise ValidationError({"detail": "Nothing new was saved. A concurrent save was detected. Retry with the same corrections."})
