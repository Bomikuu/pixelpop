from datetime import timedelta
from hashlib import sha256
from django.utils import timezone
from finance import models
from .common import MANILA, ZERO, plain
from .predictions import predict_cycle


def subscription_reminder_events(actor, as_of):
    """Service-specific alerts only; ordinary due/overdue reminders remain in Bills."""
    local_day = as_of.astimezone(MANILA).date()
    events = []
    services = models.Subscription.objects.select_related("schedule").filter(
        status="active", archived=False, created_by=actor)
    for service in services:
        prefs = service.reminder_preferences
        if not prefs.get("enabled", True):
            continue
        destination = f"/dashboard/bills/subscriptions/{service.pk}"

        def add(kind, identity, message, cycle=None):
            key = sha256(f"{service.pk}:{kind}:{identity}".encode()).hexdigest()
            events.append({"key": "subscription:" + key, "message": message[:500], "title": service.schedule.title[:160],
                "destination": destination + (f"?cycle={cycle.pk}" if cycle else ""), "kind": kind})

        cycle = service.cycles.filter(excluded_at__isnull=True, deadline__status="pending").order_by("deadline__due_date").first()
        if cycle:
            if prefs.get("cycle_end", True) and cycle.period_end and 0 <= (cycle.period_end - local_day).days <= 2:
                add("cycle_end", cycle.pk, "Billing period ends soon. Record a closing reading and confirm the actual bill.", cycle)
            prediction = predict_cycle(cycle.pk)
            budget = prediction.get("budget") or {}
            if prefs.get("budget", True) and budget.get("variance") is not None and budget["variance"] > ZERO:
                add("budget", f"{cycle.pk}:{service.monthly_budget}:{cycle.tariff_id}",
                    f"Projected bill ₱{prediction['projected_amount']} exceeds your ₱{service.monthly_budget} budget.", cycle)
        cadence = prefs.get("reading_days")
        if cadence and service.service_type in ("electricity", "water", "metered", "internet"):
            for meter in service.meters.filter(active=True):
                latest = meter.readings.order_by("-recorded_at").first()
                reference = (latest.recorded_at if latest else meter.created_at).astimezone(MANILA).date()
                elapsed = (local_day - reference).days
                if elapsed >= cadence:
                    add("reading", f"{meter.pk}:{reference}:{elapsed // cadence}", f"Record a new {meter.name} reading. Your last reading is {elapsed} days old." if latest else f"Add the first reading for {meter.name}.", cycle)
        if prefs.get("expiry", True) and service.expires_on and 0 <= (service.expires_on - local_day).days <= 7:
            add("expiry", service.expires_on, f"This service expires on {service.expires_on}. Review whether to renew.")
        prices = list(service.prices.filter(effective_date__lte=local_day).order_by("-effective_date")[:2])
        if len(prices) == 2 and prices[0].effective_date >= local_day - timedelta(days=7):
            change = (prices[0].amount - prices[1].amount) / prices[1].amount * 100
            threshold = prefs.get("price_increase_percent", 10)
            if change >= threshold:
                add("price", f"{prices[0].pk}:{threshold}", f"The recorded price increased by {change:.1f}%. Review the new renewal price.")
    return plain(events[:100])
