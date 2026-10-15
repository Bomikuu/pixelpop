import uuid
from datetime import timedelta
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from finance import models
from finance.services.balances import today
from .common import day, plain, record_event, workspace_lock


@transaction.atomic
def change_lifecycle(subscription_id, action, effective_date, actor, next_start=None, request_id=None):
    workspace_lock()
    obj = models.Subscription.objects.select_for_update().select_related("schedule").get(pk=subscription_id)
    try:
        key = uuid.UUID(str(request_id))
    except (ValueError, TypeError):
        raise ValidationError({"request_id": "A stable request identifier is required."})
    effective = day(effective_date or today())
    payload = plain({"action": action, "effective_date": effective, "next_start": next_start})
    prior = models.SubscriptionEvent.objects.filter(request_id=key).first()
    if prior:
        if prior.subscription_id != obj.pk or prior.after != payload:
            raise ValidationError("This request identifier belongs to another lifecycle action.")
        return obj
    if action not in ("pause", "resume", "cancel", "expire", "archive", "restore"):
        raise ValidationError({"action": "Choose pause, resume, cancel, expire, archive or restore."})
    if action in ("pause", "cancel", "expire") and effective > today():
        raise ValidationError({"effective_date": "Apply lifecycle changes today or earlier; use the expiry date for a future expiry."})
    before = {"status": obj.status, "archived": obj.archived}
    if action in ("archive", "restore"):
        obj.archived = action == "archive"
    elif action == "resume":
        start = day(next_start, "next_start")
        if start < today():
            raise ValidationError({"next_start": "Choose today or a future first renewal; paused gaps are not backfilled."})
        if obj.schedule.coverage_id and not obj.schedule.coverage.active:
            raise ValidationError({"status": "Restore the linked coverage before resuming premiums."})
        obj.status, obj.inactive_from = "active", None
        obj.schedule.anchor_date, obj.schedule.active = start, True
        # Restore only generated, still-unpriced future rows on the resumed cadence.
        # Older excluded rows stay as history; no paused gap is silently billed.
        from finance.services.recurrence import occurrence
        until = today() + timedelta(days=366)
        dates = set()
        for index in range(2000):
            due = occurrence(obj.schedule, index)
            if due > until:
                break
            dates.add(due)
        obj.cycles.filter(deadline__due_date__in=dates, actual_amount__isnull=True, allocations__isnull=True).update(excluded_at=None, exclusion_reason="")
    else:
        obj.status = {"pause": "paused", "cancel": "cancelled", "expire": "expired"}[action]
        obj.inactive_from, obj.schedule.active = effective, False
        future_period = Q(period_start__gte=effective) | Q(period_start__isnull=True, deadline__due_date__gte=effective)
        obj.cycles.filter(future_period, actual_amount__isnull=True,
            allocations__isnull=True).update(excluded_at=timezone.now(), exclusion_reason=obj.status)
    obj.schedule.save()
    obj.revision += 1
    obj.save()
    record_event(obj, action, actor, before, payload, key, effective)
    return obj


@transaction.atomic
def change_lifecycle_many(ids, action, effective_date, actor, request_id, next_start=None):
    if not isinstance(ids, list) or not 1 <= len(ids) <= 100 or len(set(ids)) != len(ids):
        raise ValidationError({"ids": "Choose 1-100 distinct services."})
    try:
        namespace = uuid.UUID(str(request_id))
    except (ValueError, TypeError):
        raise ValidationError({"request_id": "A stable request identifier is required."})
    if action not in ("pause", "resume", "archive", "restore"):
        raise ValidationError({"action": "Bulk actions support pause, resume, archive or restore."})
    if models.Subscription.objects.filter(pk__in=ids).count() != len(ids):
        raise ValidationError({"ids": "One or more selected services no longer exist."})
    return [change_lifecycle(pk, action, effective_date, actor, next_start=next_start, request_id=uuid.uuid5(namespace, str(pk))) for pk in sorted(ids)]
