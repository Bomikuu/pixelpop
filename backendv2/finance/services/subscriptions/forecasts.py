from datetime import timedelta
from decimal import Decimal
from django.db import transaction
from rest_framework.exceptions import ValidationError
from finance import models
from finance.services.recurrence import occurrence
from finance.services.balances import account_balance
from .common import ZERO, cash, day, number, record_event, revision, workspace_lock
from .payments import cycle_payment_state
from .predictions import predict_cycle


def forecast_obligations(start, end, scenario="normal", multiplier=None):
    start, end = day(start, "start"), day(end, "end")
    if end < start or (end - start).days > 366:
        raise ValidationError({"end": "Choose an ordered range of at most twelve months."})
    if scenario not in ("normal", "high", "low", "custom"):
        raise ValidationError({"scenario": "Choose normal, high, low or custom."})
    factor = {"normal": Decimal(1), "high": Decimal("1.2"), "low": Decimal("0.8")}.get(scenario)
    if factor is None:
        factor = number(multiplier, "multiplier", 6, maximum=100)
    rows, buckets, total, unknown = [], {}, ZERO, 0
    # Archive changes catalog visibility, never financial obligations.
    for subscription in models.Subscription.objects.select_related("schedule").all():
        schedule = subscription.schedule
        existing = {c.deadline.due_date: c for c in subscription.cycles.select_related("deadline", "subscription__schedule").filter(deadline__due_date__range=(start, end))}
        dates = set(existing)
        if subscription.status == "active" and schedule.active:
            for index in range(20000):
                due = occurrence(schedule, index)
                if due > end:
                    break
                if due >= start and (not subscription.expires_on or due <= subscription.expires_on):
                    dates.add(due)
        historical = list(subscription.cycles.filter(actual_amount__isnull=False, excluded_at__isnull=True).order_by("-deadline__due_date")[:3])
        for due in sorted(dates):
            cycle = existing.get(due)
            if cycle and cycle.excluded_at:
                continue
            confirmed = bool(cycle and cycle.actual_amount is not None)
            paid = ZERO
            model = "fixed_price"
            if cycle:
                state = cycle_payment_state(cycle)
                paid = state["paid"]
                value = state["bill_amount"]
                if value is None:
                    prediction = predict_cycle(cycle.pk, scenario=scenario, usage_multiplier=factor)
                    value, model = prediction["projected_amount"], prediction["model"]
            elif not schedule.variable_amount:
                price = subscription.prices.filter(effective_date__lte=due).order_by("-effective_date").first()
                value = price.amount if price else schedule.amount
            else:
                value = None
            if value is None and schedule.variable_amount and historical:
                # A billed-cost fallback is not described as measured consumption.
                value = cash(sum((c.actual_amount for c in historical), ZERO) / len(historical))
                model = "historical_billed_cost"
                if factor != 1:
                    # Without a tariff/usage split, do not scale unknown fixed fees.
                    model = "historical_billed_cost_unscaled"
            remaining = max(ZERO, value - paid) if value is not None else None
            key = str(due)[:7]
            bucket = buckets.setdefault(key, {"month": key, "confirmed": ZERO, "estimated": ZERO, "unknown": 0})
            if remaining is None:
                unknown += 1
                bucket["unknown"] += 1
            else:
                total += remaining
                bucket["confirmed" if confirmed else "estimated"] += remaining
            rows.append({"subscription_id": subscription.pk, "name": schedule.title, "due_date": due, "remaining": remaining,
                "confirmed": confirmed, "model": model, "paid": paid})
    cash_balance = sum((account_balance(a) for a in models.Account.objects.filter(active=True, kind__in=models.Account.CASH_KINDS)), ZERO)
    return {"rows": rows, "months": sorted(buckets.values(), key=lambda r: r["month"]), "total": total, "unknown": unknown,
        "cash_available": cash_balance, "projected_after_subscriptions": cash_balance - total,
        "scenario": scenario, "multiplier": factor, "note": "Subscription obligations only; other spending is not subtracted here. Account balances are unchanged. Unknown costs are excluded from the numerical projection."}


@transaction.atomic
def save_forecast_assumptions(subscription_id, scenario, multiplier, actor, expected_revision):
    workspace_lock()
    subscription = models.Subscription.objects.select_for_update().get(pk=subscription_id)
    revision(subscription, expected_revision)
    if scenario not in ("normal", "high", "low", "custom"):
        raise ValidationError({"scenario": "Choose a supported scenario."})
    value = number(multiplier, "multiplier", 6, maximum=100)
    subscription.planning_assumptions = {"scenario": scenario, "multiplier": str(value)}
    subscription.revision += 1
    subscription.save(update_fields=["planning_assumptions", "revision", "updated_at"])
    record_event(subscription, "planning_saved", actor, after=subscription.planning_assumptions)
    return subscription
