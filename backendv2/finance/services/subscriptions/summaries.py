from datetime import timedelta
from decimal import Decimal
from django.db.models import Sum
from finance import models
from finance.services.balances import today
from finance.services.queries import month_range
from .common import ZERO, cash
from .payments import cycle_payment_state


def monthly_equivalent(schedule, amount, rounded=True):
    if amount is None:
        return None
    factors = {"weekly": Decimal(52) / 12, "weeks": Decimal(52) / 12, "monthly": Decimal(1), "months": Decimal(1),
        "quarterly": Decimal(1) / 3, "yearly": Decimal(1) / 12, "years": Decimal(1) / 12, "days": Decimal("365.2425") / 12}
    value = amount * factors[schedule.frequency] / schedule.interval
    return cash(value) if rounded else value


def subscription_summary(month):
    start, end = month_range(month)
    cycles = models.SubscriptionCycle.objects.select_related("subscription__schedule", "deadline").filter(excluded_at__isnull=True)
    chosen = cycles.filter(deadline__due_date__range=(start, end))
    expected, remaining, unknown = ZERO, ZERO, 0
    for cycle in chosen:
        state = cycle_payment_state(cycle)
        value = state["bill_amount"]
        if value is None:
            from .predictions import predict_cycle
            value = predict_cycle(cycle.pk)["projected_amount"]
            unknown += value is None
        expected += value or ZERO
        remaining += state["remaining"] or ZERO
    paid = models.SubscriptionPaymentAllocation.objects.filter(transaction__date__range=(start, end)).aggregate(v=Sum("transaction__amount"))["v"] or ZERO
    overdue = ZERO
    for cycle in cycles.filter(deadline__due_date__lt=today()):
        overdue += cycle_payment_state(cycle)["remaining"] or ZERO
    normalized = sum((monthly_equivalent(s.schedule, s.schedule.amount, rounded=False) or ZERO for s in models.Subscription.objects.select_related("schedule").filter(status="active", schedule__variable_amount=False)), ZERO)
    return {"expected": expected, "paid": paid, "remaining": remaining, "overdue": overdue,
        "monthly_equivalent": cash(normalized), "annual_equivalent": cash(normalized * 12), "unpriced": unknown,
        "upcoming": chosen.filter(deadline__due_date__gte=today(), deadline__status="pending").count(),
        "count": models.Subscription.objects.filter(archived=False).count()}


def subscription_analytics(subscription_id, start, end):
    subscription = models.Subscription.objects.get(pk=subscription_id)
    def consumption_values(item):
        duration = (item.period_end - item.period_start).days if item.period_start and item.period_end else None
        if item.reported_consumption is not None:
            return item.reported_consumption, item.reported_consumption / duration if duration else None
        if not duration:
            return None, None
        from .readings import cycle_consumption
        from .common import midnight
        observed = cycle_consumption(item.pk)
        complete = observed["as_of"] and observed["as_of"] >= midnight(item.period_end)
        return observed["usage"] if complete else None, observed.get("daily")
    rows = []
    for cycle in subscription.cycles.select_related("deadline", "final_prediction").filter(deadline__due_date__range=(start, end), excluded_at__isnull=True).order_by("deadline__due_date"):
        usage, daily = consumption_values(cycle)
        previous_year = list(subscription.cycles.filter(excluded_at__isnull=True, deadline__due_date__year=cycle.deadline.due_date.year - 1,
            deadline__due_date__month=cycle.deadline.due_date.month)[:2])
        year_daily = consumption_values(previous_year[0])[1] if len(previous_year) == 1 else None
        predicted = cycle.final_prediction.projected_amount if cycle.final_prediction_id else None
        actual = cycle.actual_amount
        rows.append({"id": cycle.pk, "label": str(cycle.deadline.due_date), "actual": actual, "predicted": predicted,
            "usage": usage, "daily": daily,
            "daily_year_change_percent": (daily - year_daily) / year_daily * 100 if daily is not None and year_daily else None,
            "error": actual - predicted if actual is not None and predicted is not None else None,
            "error_percent": abs(actual - predicted) / actual * 100 if actual and predicted is not None else None,
            "period_start": cycle.period_start, "period_end": cycle.period_end})
    previous = None
    for row in rows:
        row["daily_change_percent"] = (row["daily"] - previous) / previous * 100 if row["daily"] is not None and previous else None
        previous = row["daily"]
    lifetime = subscription.cycles.aggregate(value=Sum("allocations__transaction__amount"))["value"] or ZERO
    return {"rows": rows, "lifetime_paid": lifetime, "attribution": "Changes can reflect both consumption and tariff changes. No causal attribution is assumed."}
