"""Atomic quick entry and reconciliation of the original ledger records."""
from django.db import IntegrityError, transaction
from rest_framework.exceptions import ValidationError

from finance.models import Account, Transaction
from .audit import log_record, snapshot_record
from .balances import ensure_account_capacity, total


def unsettled_summary():
    rows = Transaction.objects.filter(account__isnull=True)
    expenses = total(rows.filter(kind="expense"))
    income = total(rows.filter(kind="income", receipt_state="received"))
    return {"count": rows.count(), "expenses": expenses, "income": income, "net": income - expenses}


def payment_method_for(account):
    if account is None:
        return "other"
    if account.kind in ("cash", "credit_card"):
        return account.kind
    if account.kind == "ewallet":
        label = (account.institution + " " + account.name).casefold()
        return "gcash" if "gcash" in label else "maya" if "maya" in label else "other"
    return "bank"


def batch_error(field, identity, errors):
    raise ValidationError({"detail": "Nothing was changed. Review this entry.", field: {str(identity): errors}})


def lock_accounts(ids):
    accounts = {a.pk: a for a in Account.objects.select_for_update().filter(pk__in=ids).order_by("pk")}
    return accounts


def check_account(account, field, identity, kind):
    if not account or not account.active or account.kind == "fund":
        batch_error(field, identity, {"account": "Choose an active cash, bank, e-wallet or credit-card account."})
    if kind == "income" and account.kind == "credit_card":
        batch_error(field, identity, {"account": "Income needs a cash, bank or e-wallet account."})


def check_capacity(records, accounts, field, identity_field):
    checked = set()
    for entry in records:
        if entry.account_id is None or entry.kind != "expense" or (entry.account_id, entry.date) in checked:
            continue
        try:
            ensure_account_capacity(accounts[entry.account_id], entry.date)
        except ValidationError as error:
            batch_error(field, getattr(entry, identity_field), error.detail)
        checked.add((entry.account_id, entry.date))


@transaction.atomic
def _save_quick_entries(rows, actor):
    accounts = lock_accounts({r["account"].pk for r in rows if r["account"]})
    existing = {r.request_id: r for r in Transaction.objects.filter(request_id__in=[r["request_id"] for r in rows])}
    records, created = [], []
    for attrs in rows:
        account = accounts.get(attrs["account"].pk) if attrs["account"] else None
        values = {**attrs, "account": account, "receipt_state": "received", "payment_method": payment_method_for(account)}
        entry = existing.get(attrs["request_id"])
        if entry:
            if any(getattr(entry, name) != value for name, value in attrs.items()) or entry.receipt_state != "received" or entry.deadline_id or entry.schedule_id or entry.asset_financing_payment_id or hasattr(entry, "shared_payment"):
                batch_error("transactions", attrs["request_id"], {"request_id": "This identifier already belongs to a different or changed transaction. Review saved transactions before resubmitting."})
        else:
            if attrs["account"]:
                check_account(account, "transactions", attrs["request_id"], attrs["kind"])
            entry = Transaction.objects.create(**values, created_by=actor)
            created.append(entry)
        records.append(entry)
    check_capacity(created, accounts, "transactions", "request_id")
    for entry in created:
        log_record(entry, actor=actor, source="quick_entry", action="added", after=snapshot_record(entry))
    return {"records": records, "created_count": len(created), "replayed_count": len(records) - len(created)}


def save_quick_entries(rows, actor):
    try:
        return _save_quick_entries(rows, actor)
    except IntegrityError:
        # A concurrent identical request may have committed after our lookup.
        if Transaction.objects.filter(request_id__in=[r["request_id"] for r in rows]).count() != len(rows):
            raise
        return _save_quick_entries(rows, actor)


@transaction.atomic
def settle_transactions(assignments, actor):
    records = {r.pk: r for r in Transaction.objects.select_for_update().filter(pk__in=[r["id"] for r in assignments]).order_by("pk")}
    accounts = lock_accounts({r["account"].pk for r in assignments})
    changed, result = [], []
    for attrs in assignments:
        entry = records.get(attrs["id"])
        if not entry:
            batch_error("assignments", attrs["id"], {"id": "This transaction no longer exists. Refresh the list."})
        account = accounts.get(attrs["account"].pk)
        check_account(account, "assignments", entry.pk, entry.kind)
        if entry.deadline_id or entry.schedule_id or entry.asset_financing_payment_id or hasattr(entry, "shared_payment"):
            batch_error("assignments", entry.pk, {"id": "Linked payment history cannot be reconciled here."})
        if entry.account_id is not None:
            if entry.account_id != account.pk:
                batch_error("assignments", entry.pk, {"account": "This entry was already assigned to another account. Refresh the list."})
        else:
            before = snapshot_record(entry)
            entry.account = account
            entry.payment_method = payment_method_for(account)
            entry.save(update_fields=["account", "payment_method", "updated_at"])
            changed.append((entry, before))
        result.append(entry)
    check_capacity([entry for entry, _ in changed], accounts, "assignments", "pk")
    for entry, before in changed:
        log_record(entry, actor=actor, source="quick_entry", action="edited", before=before, after=snapshot_record(entry))
    return result
