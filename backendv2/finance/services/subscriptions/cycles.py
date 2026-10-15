from django.db import transaction
from django.db.models import F, Q
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from finance import models
from finance.services.balances import today
from .catalog import ensure_subscription
from .common import day, number, record_event, revision, workspace_lock


def ensure_cycle(deadline):
    if not deadline.schedule_id or deadline.asset_financing_id or deadline.cash_loan_id or deadline.loan_id:
        return None
    subscription = ensure_subscription(deadline.schedule)
    if not subscription:
        return None
    expense = models.Transaction.objects.filter(deadline=deadline).first()
    known_actual = (deadline.amount if deadline.amount is not None else expense.amount) if expense else deadline.amount if deadline.schedule.variable_amount else None
    cycle, created = models.SubscriptionCycle.objects.get_or_create(deadline=deadline, defaults={
        "subscription": subscription, "actual_amount": known_actual,
        "amount_source": "actual" if known_actual is not None else "fixed" if not deadline.schedule.variable_amount else "unconfirmed",
        "confirmed_at": expense.created_at if expense else deadline.updated_at if known_actual is not None else None,
        "created_by": deadline.created_by})
    if expense:
        models.SubscriptionPaymentAllocation.objects.get_or_create(transaction=expense, defaults={
            "cycle": cycle, "request_id": expense.request_id, "created_by": expense.created_by})
    if created and subscription.inactive_from and subscription.status != "active" and deadline.due_date >= subscription.inactive_from and known_actual is None and not expense:
        cycle.excluded_at, cycle.exclusion_reason = timezone.now(), subscription.status
        cycle.save(update_fields=["excluded_at", "exclusion_reason"])
    return cycle


@transaction.atomic
def set_cycle_period(cycle_id, start, end, billing_date, actor, expected_revision, tariff_id=None):
    workspace_lock()
    cycle = models.SubscriptionCycle.objects.select_for_update().select_related("subscription").get(pk=cycle_id)
    revision(cycle, expected_revision)
    before = {"cycle": cycle.pk, "start": cycle.period_start, "end": cycle.period_end, "tariff": cycle.tariff_id}
    if (cycle.confirmed_at or cycle.allocations.exists()) and cycle.period_start is not None:
        raise ValidationError({"period_start": "Confirmed billing periods are kept unchanged. Correct readings or amend the actual amount explicitly."})
    start, end = day(start, "period_start"), day(end, "period_end")
    if start >= end or (end - start).days > 366 * 5:
        raise ValidationError({"period_end": "Choose an end after the start, within five years."})
    if cycle.subscription.cycles.exclude(pk=cycle.pk).filter(period_start__lt=end, period_end__gt=start).exists():
        raise ValidationError({"period_start": "This period overlaps another billing cycle."})
    tariff = cycle.subscription.tariffs.filter(pk=tariff_id).first() if tariff_id else cycle.subscription.tariffs.filter(effective_date__lte=start).order_by("-effective_date").first()
    if tariff_id and not tariff:
        raise ValidationError({"tariff": "Choose a rate version belonging to this service."})
    cycle.period_start, cycle.period_end, cycle.tariff = start, end, tariff
    cycle.billing_date = day(billing_date, "billing_date") if billing_date else end
    cycle.revision += 1
    cycle.save()
    record_event(cycle.subscription, "cycle_configured", actor, before=before, after={"cycle": cycle.pk, "start": start, "end": end, "tariff": tariff.pk if tariff else None})
    from .predictions import snapshot_prediction
    snapshot_prediction(cycle.pk, actor, "period_changed")
    return cycle


@transaction.atomic
def confirm_cycle(cycle_id, actual_amount, actor, expected_revision, reported_consumption=None):
    workspace_lock()
    cycle = models.SubscriptionCycle.objects.select_for_update().select_related("subscription", "deadline").get(pk=cycle_id)
    revision(cycle, expected_revision)
    if cycle.excluded_at:
        raise ValidationError({"cycle": "This future bill was excluded. Restore the appropriate service period first."})
    actual = number(actual_amount)
    from .payments import cycle_payment_state
    state = cycle_payment_state(cycle)
    if actual < state["paid"]:
        raise ValidationError({"actual_amount": "The amount cannot be below money already paid. Use an explicit financial correction for a refund."})
    from .predictions import snapshot_prediction
    if cycle.final_prediction_id is None:
        cycle.final_prediction = snapshot_prediction(cycle.pk, actor, "bill_confirmation")
    before = {"actual_amount": cycle.actual_amount, "reported_consumption": cycle.reported_consumption}
    cycle.actual_amount, cycle.amount_source = actual, "actual"
    cycle.reported_consumption = number(reported_consumption, "reported_consumption", 6, nullable=True, maximum=10**14)
    cycle.confirmed_at = cycle.confirmed_at or timezone.now()
    cycle.revision += 1
    cycle.save()
    deadline = cycle.deadline
    # A genuine zero bill is closed without creating a zero-value transaction.
    deadline.amount = actual if actual else None
    deadline.status = "paid" if state["paid"] >= actual else "pending"
    deadline.completed_at = timezone.now() if deadline.status == "paid" else None
    deadline.save(update_fields=["amount", "status", "completed_at", "updated_at"])
    record_event(cycle.subscription, "bill_confirmed", actor, before, {"cycle": cycle.pk, "actual_amount": actual, "reported_consumption": cycle.reported_consumption})
    return cycle


@transaction.atomic
def set_price(subscription_id, amount, effective_date, actor, expected_revision):
    workspace_lock()
    obj = models.Subscription.objects.select_for_update().select_related("schedule").get(pk=subscription_id)
    revision(obj, expected_revision)
    if obj.schedule.variable_amount:
        raise ValidationError({"amount": "Variable services use utility rates or an actual bill, not a fixed price."})
    value, effective = number(amount, positive=True), day(effective_date, "effective_date")
    if obj.prices.filter(effective_date=effective).exists():
        raise ValidationError({"effective_date": "A price already starts on this date."})
    row = models.SubscriptionPrice.objects.create(subscription=obj, amount=value, effective_date=effective, created_by=actor)
    next_price = obj.prices.filter(effective_date__gt=effective).order_by("effective_date").first()
    qs = obj.cycles.filter(actual_amount__isnull=True, allocations__isnull=True, excluded_at__isnull=True,
        deadline__status="pending", deadline__due_date__gte=max(today(), effective))
    if next_price:
        qs = qs.filter(deadline__due_date__lt=next_price.effective_date)
    models.Deadline.objects.filter(subscription_cycle__in=qs).update(amount=value)
    qs.update(revision=F("revision") + 1)
    if effective <= today() and not obj.prices.filter(effective_date__gt=effective, effective_date__lte=today()).exists():
        obj.schedule.amount = value
        obj.schedule.save(update_fields=["amount", "updated_at"])
    obj.revision += 1
    obj.save(update_fields=["revision", "updated_at"])
    record_event(obj, "price_added", actor, after={"price": value, "effective_date": effective})
    return row
