from django.db import transaction
from django.db.models import F, Q
import uuid
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from finance import models
from finance.services.balances import today
from .common import day, fingerprint, number, plain, record_event, revision, workspace_lock
from .eligibility import eligible_schedules


def ensure_subscription(schedule):
    if not eligible_schedules().filter(pk=schedule.pk).exists():
        return None
    obj, created = models.Subscription.objects.get_or_create(schedule=schedule, defaults={
        "service_type": "variable" if schedule.variable_amount else "fixed",
        "status": "active" if schedule.active else "paused", "created_by": schedule.created_by})
    if created and not schedule.variable_amount and schedule.amount:
        models.SubscriptionPrice.objects.get_or_create(subscription=obj, effective_date=today(),
            defaults={"amount": schedule.amount, "imported": True, "created_by": schedule.created_by})
    return obj


@transaction.atomic
def save_subscription(subscription_id, data, actor, expected_revision=None):
    workspace_lock()
    key = data.get("request_id")
    signature = fingerprint({k: v for k, v in data.items() if k not in ("request_id", "expected_revision")})
    if not subscription_id:
        if not key:
            raise ValidationError({"request_id": "A stable request identifier is required to avoid duplicate services."})
        try:
            key = uuid.UUID(str(key))
        except (TypeError, ValueError):
            raise ValidationError({"request_id": "Use a valid request identifier."})
        prior = models.SubscriptionEvent.objects.filter(request_id=key).first()
        if prior:
            if prior.kind != "created" or prior.after.get("input_hash") != signature:
                raise ValidationError("This request identifier belongs to another service creation.")
            return prior.subscription
    obj = models.Subscription.objects.select_for_update().select_related("schedule").get(pk=subscription_id) if subscription_id else None
    if obj:
        revision(obj, expected_revision)
    from finance.api.serializers import ScheduleSerializer
    schedule_fields = ("title", "amount", "variable_amount", "anchor_date", "frequency", "interval", "category", "account", "notes", "reminder_days", "due_time")
    values = {key: data[key] for key in schedule_fields if key in data}
    if obj is None:
        values.update(kind="bill", settlement_kind="expense")
    service_type = data.get("service_type", obj.service_type if obj else "fixed")
    if service_type not in dict(models.Subscription.TYPES):
        raise ValidationError({"service_type": "Choose a supported service type."})
    variable = service_type in ("electricity", "water", "variable", "metered")
    values["variable_amount"] = variable
    if variable:
        values["amount"] = None
    elif values.get("amount", obj.schedule.amount if obj else None) is None:
        raise ValidationError({"amount": "Enter the fixed bill amount."})
    if data.get("currency", "PHP") != "PHP":
        raise ValidationError({"currency": "Only PHP is supported."})
    validator = ScheduleSerializer(obj.schedule if obj else None, data=values, partial=bool(obj), context={"subscription_write": True})
    validator.is_valid(raise_exception=True)
    metadata_fields = ("service_type", "provider", "plan_name", "description", "payment_method", "expires_on", "monthly_budget", "expected_usage", "interpolate_boundaries", "anomaly_threshold", "reminder_preferences")
    before = {**{key: getattr(obj, key) for key in metadata_fields}, "title": obj.schedule.title,
        "amount": obj.schedule.amount, "frequency": obj.schedule.frequency, "interval": obj.schedule.interval,
        "anchor_date": obj.schedule.anchor_date, "account": obj.schedule.account_id, "category": obj.schedule.category_id} if obj else {}
    if obj:
        schedule = models.RecurringSchedule.objects.select_for_update().get(pk=obj.schedule_id)
        cadence_changed = any(k in validator.validated_data and validator.validated_data[k] != getattr(schedule, k) for k in ("anchor_date", "frequency", "interval"))
        if obj.status != "active" and cadence_changed:
            raise ValidationError({"status": "Resume this service explicitly before changing its recurrence."})
        for key, value in validator.validated_data.items():
            setattr(schedule, key, value)
        schedule.save()
        if cadence_changed:
            from finance.services.recurrence import occurrence
            from datetime import timedelta
            matching = set()
            horizon = today() + timedelta(days=366 * 5)
            for index in range(20000):
                due = occurrence(schedule, index)
                if due > horizon:
                    break
                matching.add(due)
            replaceable = obj.cycles.filter(actual_amount__isnull=True, allocations__isnull=True, deadline__due_date__gte=today())
            replaceable.exclude(deadline__due_date__in=matching).filter(period_start__isnull=True).update(excluded_at=timezone.now(), exclusion_reason="cadence_changed", revision=F("revision") + 1)
            replaceable.filter(deadline__due_date__in=matching, exclusion_reason="cadence_changed").update(excluded_at=None, exclusion_reason="", revision=F("revision") + 1)
    else:
        schedule = models.RecurringSchedule.objects.create(created_by=actor, **validator.validated_data)
        obj = models.Subscription.objects.create(schedule=schedule, created_by=actor)
    obj.service_type = service_type
    for key in ("provider", "plan_name", "description", "payment_method", "interpolate_boundaries", "expires_on", "monthly_budget", "expected_usage", "anomaly_threshold", "reminder_preferences"):
        if key in data:
            setattr(obj, key, data[key])
    if subscription_id:
        obj.revision += 1
    obj.full_clean()
    obj.save()
    future_open = obj.cycles.filter(actual_amount__isnull=True, allocations__isnull=True,
        deadline__status="pending", deadline__due_date__gte=today())
    models.Deadline.objects.filter(subscription_cycle__in=future_open).update(
        title=schedule.title, category=schedule.category, notes=schedule.notes,
        reminder_days=schedule.reminder_days, due_time=schedule.due_time)
    if variable:
        models.Deadline.objects.filter(subscription_cycle__in=future_open).update(amount=None)
        future_open.update(amount_source="unconfirmed", revision=F("revision") + 1)
    if obj.status == "active":
        future_open.filter(exclusion_reason="expiry").update(excluded_at=None, exclusion_reason="", revision=F("revision") + 1)
        if obj.expires_on:
            after_expiry = Q(period_start__gt=obj.expires_on) | Q(period_start__isnull=True, deadline__due_date__gt=obj.expires_on)
            future_open.filter(after_expiry, excluded_at__isnull=True).update(excluded_at=timezone.now(), exclusion_reason="expiry", revision=F("revision") + 1)
    if not variable and schedule.amount:
        price = obj.prices.filter(effective_date__lte=today()).order_by("-effective_date").first()
        if not price or price.amount != schedule.amount:
            if price and price.effective_date == today():
                raise ValidationError({"amount": "A price is already recorded for today. Add the revised price with a new effective date."})
            models.SubscriptionPrice.objects.create(subscription=obj, amount=schedule.amount, effective_date=today(), created_by=actor)
            next_price = obj.prices.filter(effective_date__gt=today()).order_by("effective_date").first()
            open_cycles = obj.cycles.filter(actual_amount__isnull=True, excluded_at__isnull=True, deadline__due_date__gte=today(), allocations__isnull=True, deadline__status="pending")
            if next_price:
                open_cycles = open_cycles.filter(deadline__due_date__lt=next_price.effective_date)
            models.Deadline.objects.filter(subscription_cycle__in=open_cycles).update(amount=schedule.amount)
            open_cycles.update(amount_source="fixed", revision=F("revision") + 1)
    record_event(obj, "saved" if subscription_id else "created", actor, before,
        {**{key: getattr(obj, key) for key in metadata_fields}, "title": schedule.title, "amount": schedule.amount,
            "frequency": schedule.frequency, "interval": schedule.interval, "anchor_date": schedule.anchor_date,
            "account": schedule.account_id, "category": schedule.category_id, "input_hash": signature}, key if not subscription_id else None)
    from finance.services.recurrence import materialize
    materialize()
    return obj


@transaction.atomic
def save_tariff_version(subscription_id, data, actor, expected_revision):
    workspace_lock()
    obj = models.Subscription.objects.select_for_update().get(pk=subscription_id)
    revision(obj, expected_revision)
    from .tariffs import validate_tariff
    config = plain(validate_tariff(data["config"]))
    effective = day(data["effective_date"], "effective_date")
    if obj.tariffs.filter(effective_date=effective).exists():
        raise ValidationError({"effective_date": "A rate version already starts on this date. Choose another effective date; historical versions are kept."})
    tariff = models.UtilityTariff.objects.create(subscription=obj, name=data.get("name") or "Utility rate", config=config, effective_date=effective, created_by=actor)
    obj.revision += 1
    obj.save(update_fields=["revision", "updated_at"])
    record_event(obj, "tariff_added", actor, after={"tariff": tariff.pk, "effective_date": effective, "config": config})
    return tariff
