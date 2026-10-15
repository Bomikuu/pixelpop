from datetime import timedelta
from django.db.models import Sum
from finance import models
from finance.services.balances import today
from finance.services.queries import month_range
from finance.services.subscriptions.payments import cycle_payment_state
from finance.services.subscriptions.predictions import predict_cycle
from finance.services.subscriptions.summaries import subscription_analytics, monthly_equivalent
from finance.services.subscriptions.common import ZERO


def cycle_data(cycle, prediction=False):
    state = cycle_payment_state(cycle)
    result = {"id": cycle.pk, "deadline_id": cycle.deadline_id, "revision": cycle.revision,
        "due_date": cycle.deadline.due_date, "period_start": cycle.period_start, "period_end": cycle.period_end,
        "billing_date": cycle.billing_date, "tariff_id": cycle.tariff_id, "actual_amount": cycle.actual_amount,
        "reported_consumption": cycle.reported_consumption, "amount_source": cycle.amount_source,
        "confirmed_at": cycle.confirmed_at, "excluded": bool(cycle.excluded_at), "exclusion_reason": cycle.exclusion_reason, **state}
    if prediction:
        result["prediction"] = predict_cycle(cycle.pk)
    return result


def subscription_data(obj, detail=False):
    schedule = obj.schedule
    cycles = obj.cycles.select_related("deadline", "subscription__schedule", "tariff")
    current = cycles.filter(excluded_at__isnull=True, deadline__due_date__gte=today()).order_by("deadline__due_date").first()
    current = current or cycles.filter(excluded_at__isnull=True).order_by("-deadline__due_date").first()
    next_unpaid = cycles.filter(excluded_at__isnull=True, deadline__status="pending").order_by("deadline__due_date").first()
    result = {"id": obj.pk, "revision": obj.revision, "schedule_id": schedule.pk, "title": schedule.title,
        "amount": schedule.amount, "variable_amount": schedule.variable_amount, "currency": "PHP", "service_type": obj.service_type,
        "provider": obj.provider, "plan_name": obj.plan_name, "description": obj.description, "status": obj.status, "archived": obj.archived,
        "frequency": schedule.frequency, "interval": schedule.interval, "anchor_date": schedule.anchor_date,
        "category": schedule.category_id, "account": schedule.account_id, "payment_method": obj.payment_method,
        "notes": schedule.notes, "reminder_days": schedule.reminder_days, "due_time": schedule.due_time,
        "expires_on": obj.expires_on, "monthly_budget": obj.monthly_budget, "expected_usage": obj.expected_usage,
        "interpolate_boundaries": obj.interpolate_boundaries, "anomaly_threshold": obj.anomaly_threshold,
        "reminder_preferences": obj.reminder_preferences, "planning_assumptions": obj.planning_assumptions,
        "monthly_equivalent": monthly_equivalent(schedule, schedule.amount),
        "current_cycle": cycle_data(current, prediction=detail or obj.schedule.variable_amount) if current else None,
        "next_unpaid": cycle_data(next_unpaid) if next_unpaid else None}
    if detail:
        selected = list(cycles.order_by("-deadline__due_date", "-id")[:24])
        if current and current.pk not in {c.pk for c in selected}:
            selected.append(current)
        result.update(cycles=[cycle_data(c) for c in selected],
            meters=list(obj.meters.order_by("id").values("id", "name", "unit", "active", "active_from", "active_until", "rollover_modulus", "revision")),
            tariffs=list(obj.tariffs.order_by("-effective_date").values("id", "name", "effective_date", "config")),
            prices=list(obj.prices.order_by("-effective_date").values("id", "amount", "effective_date", "imported")),
            appliances=list(obj.appliances.order_by("id").values("id", "name", "watts", "hours_per_day", "days_used", "quantity", "active")),
            payments=list(models.SubscriptionPaymentAllocation.objects.filter(cycle__subscription=obj).select_related("transaction").order_by("-transaction__date", "-id").values(
                "id", "cycle_id", "transaction_id", "transaction__name", "transaction__amount", "transaction__date", "transaction__account__name")[:50]),
            events=list(obj.events.order_by("-id").values("id", "kind", "before", "after", "effective_date", "created_at")[:20]))
        start, end = month_range(today().strftime("%Y-%m"))
        result["analytics"] = subscription_analytics(obj.pk, start - timedelta(days=366), end)
    return result
