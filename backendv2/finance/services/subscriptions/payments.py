from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from finance import models
from finance.services.balances import ensure_account_capacity, today
from finance.services.settlements import action_date, locked_account, request_key
from .common import ZERO, cash, fingerprint, number, record_event, revision, workspace_lock


def cycle_payment_state(cycle):
    if not isinstance(cycle, models.SubscriptionCycle):
        cycle = models.SubscriptionCycle.objects.select_related("deadline", "subscription__schedule").get(pk=cycle)
    cache = getattr(cycle, "_prefetched_objects_cache", {})
    paid = sum((row.transaction.amount for row in cache["allocations"]), ZERO) if "allocations" in cache else cycle.allocations.aggregate(value=Sum("transaction__amount"))["value"] or ZERO
    bill = cycle.actual_amount
    if bill is None and not cycle.subscription.schedule.variable_amount:
        bill = cycle.deadline.amount
    remaining = max(ZERO, bill - paid) if bill is not None else None
    needs_review = (cycle.deadline.status != "pending" and (remaining is None or remaining > ZERO)) or (bill is not None and paid > bill)
    status = "excluded" if cycle.excluded_at else "review" if needs_review else "paid" if remaining == ZERO else "overdue" if cycle.deadline.due_date < today() else "partial" if paid else "pending" if bill is not None else "unpriced"
    return {"actual": cycle.actual_amount, "bill_amount": bill, "paid": paid, "remaining": remaining, "status": status, "needs_review": needs_review}


def payment_candidates(cycle_id, params=None):
    cycle = models.SubscriptionCycle.objects.select_related("subscription__schedule").get(pk=cycle_id)
    qs = models.Transaction.objects.filter(kind="expense", receipt_state="received", deadline__isnull=True,
        subscription_allocation__isnull=True, asset_financing_payment__isnull=True, cash_loan_posting__isnull=True,
        shared_payment__isnull=True, account__isnull=False)
    coverage = cycle.subscription.schedule.coverage_id
    qs = qs.filter(coverage_id__in=[coverage]) if coverage else qs.filter(coverage__isnull=True)
    if params and params.get("q"):
        qs = qs.filter(name__icontains=params["q"][:160])
    return qs.select_related("account", "category").order_by("-date", "-id")


@transaction.atomic
def pay_cycle(cycle_id, data, actor):
    workspace_lock()
    # Workspace lock serializes every subscription mutation on PostgreSQL.
    reference = models.SubscriptionCycle.objects.get(pk=cycle_id)
    models.RecurringSchedule.objects.select_for_update().get(pk=reference.subscription.schedule_id)
    deadline = models.Deadline.objects.select_for_update().get(pk=reference.deadline_id)
    cycle = models.SubscriptionCycle.objects.select_for_update().select_related("subscription__schedule", "deadline").get(pk=cycle_id)
    key = request_key(data)
    if not data.get("request_id"):
        raise ValidationError({"request_id": "A stable request identifier is required to avoid duplicate payments."})
    candidate_id = data.get("transaction")
    value = number(data["amount"], positive=True) if not candidate_id else None
    # Keep retries deterministic, including existing-expense links across midnight.
    candidate = models.Transaction.objects.filter(pk=candidate_id).first() if candidate_id else None
    existing = models.SubscriptionPaymentAllocation.objects.select_related("transaction").filter(request_id=key).first()
    payment_day = action_date(data.get("date") or (candidate.date if candidate else existing.transaction.date if existing else None))
    payload = {"cycle": cycle.pk, "transaction": str(candidate_id or ""), "amount": str(cash(value)) if value is not None else None,
        "account": str(data.get("account") or ""), "date": str(payment_day), "payment_method": data.get("payment_method", "bank"),
        "confirm_existing_transaction": data.get("confirm_existing_transaction", False), "expected_revision": data.get("expected_revision")}
    signature = fingerprint(payload)
    if existing:
        if existing.cycle_id != cycle.pk or existing.request_signature != signature:
            raise ValidationError("This request identifier belongs to a different payment. Refresh its history before trying again.")
        return existing
    revision(cycle, data.get("expected_revision"))
    if cycle.excluded_at:
        raise ValidationError({"cycle": "This future obligation is excluded. Resume its billing period before paying."})
    state = cycle_payment_state(cycle)
    if state["needs_review"]:
        raise ValidationError({"cycle": "The legacy paid state and payment history disagree. Review the original bill and ledger before confirming a correction; do not pay it again automatically."})
    if cycle.actual_amount is None:
        if cycle.subscription.schedule.variable_amount or state["bill_amount"] is None:
            raise ValidationError({"actual_amount": "Confirm the actual utility bill before making a payment. A prediction is not a charge."})
        from .predictions import snapshot_prediction
        cycle.final_prediction = cycle.final_prediction or snapshot_prediction(cycle.pk, actor, "payment_confirmation")
        cycle.actual_amount, cycle.amount_source, cycle.confirmed_at = state["bill_amount"], "actual", timezone.now()
    account_id = data.get("account")
    if candidate_id:
        candidate = models.Transaction.objects.filter(pk=candidate_id).first()
        if not candidate:
            raise ValidationError({"transaction": "This expense no longer exists."})
        account_id = candidate.account_id
    account = locked_account(account_id, "account")
    if account.kind == "fund":
        raise ValidationError({"account": "Use a cash, bank, e-wallet or credit-card account."})
    if candidate_id:
        expense = payment_candidates(cycle.pk).select_for_update(of=("self",)).filter(pk=candidate_id).first()
        if not expense:
            raise ValidationError({"transaction": "Choose an unallocated ordinary expense. Linked bill, coverage, financing and shared-payment history cannot be reused."})
        if not data.get("confirm_existing_transaction"):
            raise ValidationError({"confirm_existing_transaction": "Review and confirm the existing expense's account, category, date and amount. It will not be charged again."})
        value = expense.amount
    if value > max(ZERO, cycle.actual_amount - state["paid"]):
        raise ValidationError({"amount": "This exceeds the confirmed bill's remaining balance."})
    if not candidate_id:
        expense = models.Transaction.objects.create(kind="expense", name=deadline.title, amount=value, account=account,
            category=deadline.category, coverage=cycle.subscription.schedule.coverage, date=payment_day,
            payment_method=data.get("payment_method", "bank"), request_id=key, created_by=actor)
        ensure_account_capacity(account, payment_day)
    allocation = models.SubscriptionPaymentAllocation.objects.create(cycle=cycle, transaction=expense,
        request_id=key, request_signature=signature, created_by=actor)
    cycle.revision += 1
    cycle.save()
    state = cycle_payment_state(cycle)
    deadline.amount = cycle.actual_amount
    deadline.status = "paid" if state["remaining"] == ZERO else "pending"
    deadline.completed_at = timezone.now() if deadline.status == "paid" else None
    deadline.save(update_fields=["amount", "status", "completed_at", "updated_at"])
    record_event(cycle.subscription, "paid", actor, after={"cycle": cycle.pk, "transaction": expense.pk,
        "amount": value, "account": expense.account_id, "date": expense.date, "request_id": str(key),
        "remaining": state["remaining"], "linked_existing": bool(candidate_id)})
    return allocation
