from decimal import Decimal
from django.db import transaction
from rest_framework.exceptions import ValidationError
from finance import models
from .common import ZERO, number, record_event, revision, workspace_lock
from .tariffs import calculate_tariff


def _appliance_values(data):
    values = {key: data[key] for key in ("name", "active") if key in data}
    for key in ("watts", "hours_per_day"):
        if key in data:
            values[key] = number(data[key], key, 6, maximum=10**8 if key == "watts" else 25)
    if values.get("hours_per_day", ZERO) > 24:
        raise ValidationError({"hours_per_day": "Use no more than 24 hours per day."})
    for key, upper, minimum in (("days_used", 1830, 0), ("quantity", 1000, 1)):
        if key in data:
            value = number(data[key], key, 0, maximum=upper + 1)
            if value < minimum:
                raise ValidationError({key: f"Use an integer from {minimum} to {upper}."})
            values[key] = int(value)
    return values


@transaction.atomic
def save_appliance(subscription_id, data, actor, appliance_id=None):
    workspace_lock()
    subscription = models.Subscription.objects.get(pk=subscription_id)
    if subscription.service_type != "electricity":
        raise ValidationError({"appliance": "Appliance planning belongs to an electricity service."})
    row = models.UtilityAppliance.objects.select_for_update().get(pk=appliance_id, subscription=subscription) if appliance_id else models.UtilityAppliance(subscription=subscription, created_by=actor)
    for key, value in _appliance_values(data).items():
        setattr(row, key, value)
    row.full_clean()
    row.save()
    record_event(subscription, "appliance_saved", actor, after={"appliance": row.pk, "name": row.name, "active": row.active})
    return row


def estimate_appliances(subscription_id, cycle_id, drafts=None):
    cycle = models.SubscriptionCycle.objects.select_related("tariff").get(pk=cycle_id, subscription_id=subscription_id)
    if not cycle.period_start or not cycle.period_end:
        raise ValidationError({"cycle": "Set the billing period before estimating appliances."})
    days = (cycle.period_end - cycle.period_start).days
    sources = drafts if drafts is not None else list(models.UtilityAppliance.objects.filter(subscription_id=subscription_id, active=True).values("id", "name", "watts", "hours_per_day", "days_used", "quantity"))
    if not isinstance(sources, list) or len(sources) > 100:
        raise ValidationError({"appliances": "Use at most 100 appliances."})
    rows, total = [], ZERO
    for source in sources:
        required = {"name", "watts", "hours_per_day", "days_used", "quantity"}
        if not isinstance(source, dict) or not required.issubset(source):
            raise ValidationError({"appliances": "Each appliance needs name, watts, hours_per_day, days_used and quantity."})
        values = _appliance_values(source)
        if values.get("days_used", 0) > days:
            raise ValidationError({"days_used": f"This period has {days} days. Reduce appliance use days before estimating."})
        daily = values["watts"] * values["hours_per_day"] * values["quantity"] / 1000
        usage = (daily * values["days_used"]).quantize(Decimal("0.000001"))
        total += usage
        rows.append({**source, "daily_kwh": daily, "cycle_kwh": usage,
            "usage_cost": calculate_tariff(usage, cycle.tariff.config, usage_only=True)["total"] if cycle.tariff else None})
    return {"rows": rows, "cycle_kwh": total, "combined_cost": calculate_tariff(total, cycle.tariff.config) if cycle.tariff else None,
        "note": "Planning only. Appliance estimates are not added to meter readings or expenses. Tiered individual costs are stand-alone usage estimates; the combined tariff is applied once."}
