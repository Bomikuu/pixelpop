from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from finance import models
from finance.services.settlements import request_key
from .common import MANILA, ZERO, day, instant, midnight, number, record_event, revision, workspace_lock


def _delta(previous, current, events):
    selected = [e for e in events if previous.recorded_at < e.occurred_at <= current.recorded_at]
    cursor, total = previous.value, ZERO
    for event in selected:
        if event.kind == "replacement":
            return None
        if event.before_value < cursor:
            raise ValidationError({"value": "The reading contradicts a meter event. Correct its before/after values explicitly."})
        total += event.before_value - cursor
        cursor = event.after_value
    if current.value < cursor:
        raise ValidationError({"value": "This creates negative consumption. Record a meter reset, rollover or replacement first."})
    return total + current.value - cursor


def _validate_chronology(meter):
    rows, events = list(meter.readings.order_by("recorded_at", "id")), list(meter.events.order_by("occurred_at", "id"))
    for previous, current in zip(rows, rows[1:]):
        _delta(previous, current, events)


@transaction.atomic
def save_meter(subscription_id, data, actor, meter_id=None, expected_revision=None):
    workspace_lock()
    subscription = models.Subscription.objects.select_for_update().get(pk=subscription_id)
    if subscription.service_type not in ("electricity", "water", "metered", "internet"):
        raise ValidationError({"meter": "Choose a metered utility type in service settings first."})
    meter = models.Meter.objects.select_for_update().get(pk=meter_id, subscription=subscription) if meter_id else models.Meter(subscription=subscription, created_by=actor)
    if meter_id:
        revision(meter, expected_revision)
        if "unit" in data and data["unit"] != meter.unit and meter.readings.exists():
            raise ValidationError({"unit": "Keep the unit once readings exist. Create a replacement meter instead."})
    for key in ("name", "unit", "rollover_modulus", "active", "active_from", "active_until"):
        if key in data:
            setattr(meter, key, data[key])
    if meter.active_from and meter.active_until and meter.active_from > meter.active_until:
        raise ValidationError({"active_until": "Choose an end on or after the start."})
    if not meter.active and not meter.active_until:
        raise ValidationError({"active_until": "Record the last active date when deactivating a meter."})
    if meter_id:
        meter.revision += 1
    meter.full_clean()
    meter.save()
    record_event(subscription, "meter_saved", actor, after={"meter": meter.pk, "name": meter.name, "unit": meter.unit, "active": meter.active})
    return meter


@transaction.atomic
def save_reading(meter_id, data, actor, expected_revision=None):
    workspace_lock()
    meter = models.Meter.objects.select_for_update().select_related("subscription").get(pk=meter_id)
    recorded = instant(data["recorded_at"])
    value = number(data["value"], "value", 6, maximum=10**14)
    key = request_key(data)
    row = meter.readings.select_for_update().filter(pk=data.get("id")).first() if data.get("id") else None
    if data.get("id") and row is None:
        raise ValidationError({"reading": "Choose a reading belonging to this meter."})
    prior = models.MeterReading.objects.filter(request_id=key).first() if not row else None
    if prior:
        if (prior.meter_id, prior.recorded_at, prior.value, prior.note) != (meter.pk, recorded, value, data.get("note", "")):
            raise ValidationError("This request identifier belongs to a different reading.")
        return prior
    local_day = recorded.astimezone(MANILA).date()
    if meter.active_from and local_day < meter.active_from or meter.active_until and local_day > meter.active_until:
        raise ValidationError({"recorded_at": "Choose a date within this meter's active period."})
    if meter.readings.filter(recorded_at=recorded).exclude(pk=row.pk if row else None).exists():
        raise ValidationError({"recorded_at": "A reading already exists at this exact time. Edit that reading or choose another time."})
    before = {"recorded_at": row.recorded_at, "value": row.value, "note": row.note} if row else {}
    if row:
        revision(row, expected_revision)
    else:
        row = models.MeterReading(meter=meter, request_id=key, created_by=actor)
    row.recorded_at, row.value, row.note = recorded, value, data.get("note", "")
    if before:
        row.revision += 1
    row.full_clean()
    row.save()
    _validate_chronology(meter)
    record_event(meter.subscription, "reading_corrected" if before else "reading_added", actor, before,
        {"reading": row.pk, "recorded_at": recorded, "value": value, "note": row.note})
    from .predictions import snapshot_prediction
    for cycle in meter.subscription.cycles.filter(excluded_at__isnull=True, confirmed_at__isnull=True):
        snapshot_prediction(cycle.pk, actor, "reading_changed")
    return row


@transaction.atomic
def record_meter_event(meter_id, data, actor):
    workspace_lock()
    meter = models.Meter.objects.select_for_update().select_related("subscription").get(pk=meter_id)
    kind, occurred = data["kind"], instant(data["occurred_at"], "occurred_at")
    key = request_key(data)
    before, after = number(data["before_value"], "before_value", 6, maximum=10**14), number(data["after_value"], "after_value", 6, maximum=10**14)
    if kind == "rollover" and (not meter.rollover_modulus or before != meter.rollover_modulus or after != ZERO):
        raise ValidationError({"before_value": "Rollover requires the configured modulus as before value and zero as after value."})
    replacement = models.Meter.objects.filter(pk=data.get("replacement_meter"), subscription=meter.subscription).exclude(pk=meter.pk).first() if data.get("replacement_meter") else None
    if kind == "replacement" and not replacement:
        raise ValidationError({"replacement_meter": "Create and select a different meter for the replacement."})
    existing = models.MeterEvent.objects.filter(request_id=key).first()
    if existing:
        if (existing.meter_id, existing.kind, existing.occurred_at, existing.before_value, existing.after_value, existing.replacement_meter_id) != (meter.pk, kind, occurred, before, after, replacement.pk if replacement else None):
            raise ValidationError("This request identifier belongs to another meter event.")
        return existing
    if meter.events.filter(occurred_at=occurred).exists():
        raise ValidationError({"occurred_at": "A meter event already exists at this time."})
    row = models.MeterEvent.objects.create(meter=meter, kind=kind, occurred_at=occurred, before_value=before,
        after_value=after, replacement_meter=replacement, note=data.get("note", ""), request_id=key, created_by=actor)
    _validate_chronology(meter)
    if kind == "replacement":
        meter.active, meter.active_until = False, occurred.astimezone(MANILA).date()
        meter.save(update_fields=["active", "active_until", "updated_at"])
    record_event(meter.subscription, "meter_event", actor, after={"meter": meter.pk, "kind": kind, "before_value": before, "after_value": after})
    from .predictions import snapshot_prediction
    for cycle in meter.subscription.cycles.filter(excluded_at__isnull=True, confirmed_at__isnull=True):
        snapshot_prediction(cycle.pk, actor, "meter_event")
    return row


def reading_intervals(meter_id):
    meter = models.Meter.objects.get(pk=meter_id)
    rows, events = list(meter.readings.all()), list(meter.events.order_by("occurred_at"))
    result = []
    for previous, current in zip(rows, rows[1:]):
        usage = _delta(previous, current, events)
        days = Decimal(str((current.recorded_at - previous.recorded_at).total_seconds())) / 86400
        result.append({"from": previous.recorded_at, "to": current.recorded_at, "usage": usage,
            "days": days, "daily": usage / days if usage is not None and days else None, "unit": meter.unit})
    return result


def cycle_consumption(cycle_id):
    cycle = models.SubscriptionCycle.objects.select_related("subscription").get(pk=cycle_id)
    result = {"usage": None, "observed_usage": ZERO, "observed_days": ZERO, "coverage": "unknown", "as_of": None, "meters": [], "warnings": []}
    if not cycle.period_start or not cycle.period_end:
        result["warnings"].append("Set the actual billing-period dates to calculate cycle consumption.")
        return result
    start, end = midnight(cycle.period_start), midnight(cycle.period_end)
    units, all_complete, daily_total = set(), True, ZERO
    meters = cycle.subscription.meters.filter(active_from__lte=cycle.period_end) | cycle.subscription.meters.filter(active_from__isnull=True)
    meters = meters.filter(subscription=cycle.subscription).distinct()
    for meter in meters:
        if meter.active_until and meter.active_until < cycle.period_start:
            continue
        units.add(meter.unit)
        observed, days, estimated, last, unknown_gap = ZERO, ZERO, False, None, False
        for interval in reading_intervals(meter.pk):
            left, right = max(start, interval["from"]), min(end, interval["to"])
            if right <= left:
                continue
            if interval["usage"] is None:
                unknown_gap = True
                continue
            clipped = left != interval["from"] or right != interval["to"]
            if clipped and not cycle.subscription.interpolate_boundaries:
                continue
            duration = Decimal(str((right - left).total_seconds())) / 86400
            observed += interval["usage"] * duration / interval["days"]
            days += duration
            estimated |= clipped
            last = max(last, right) if last else right
        first = meter.readings.filter(recorded_at=start).first()
        baseline = first is not None or (cycle.subscription.interpolate_boundaries and meter.readings.filter(recorded_at__lte=start).exists())
        # Gaps and meter replacements cannot masquerade as continuous coverage.
        expected_days = Decimal(str((last - start).total_seconds())) / 86400 if last else ZERO
        complete = bool(baseline and days > 0 and abs(days - expected_days) < Decimal("0.000001"))
        all_complete &= complete
        if days:
            daily_total += observed / days
        result["observed_usage"] += observed
        result["observed_days"] = min(result["observed_days"], days) if result["meters"] else days
        result["as_of"] = min(result["as_of"], last) if result["as_of"] and last else last or result["as_of"]
        result["meters"].append({"id": meter.pk, "name": meter.name, "unit": meter.unit, "usage": observed, "days": days, "baseline_known": complete, "estimated": estimated, "unknown_gap": unknown_gap})
    if len(units) > 1:
        result["warnings"].append("Meters have different units; a combined consumption estimate is unavailable.")
        result["observed_days"] = ZERO
    elif result["meters"]:
        result["unit"] = next(iter(units))
        result["usage"] = result["observed_usage"] if all_complete else None
        result["coverage"] = "estimated" if any(m["estimated"] for m in result["meters"]) else "measured" if all_complete else "partial"
        result["daily"] = daily_total if all(m["days"] > 0 and not m["unknown_gap"] for m in result["meters"]) else None
    return result
