import json
import logging
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from finance.models import ReminderDelivery, ReminderPushSubscription, RecurringSchedule, WorkspaceSettings
from finance.services.reminders import DAILY_TASKS, checklist_for


logger = logging.getLogger(__name__)
MANILA = ZoneInfo("Asia/Manila")
CHECK_GRACE = timedelta(minutes=30)


def push_configured():
    return bool(
        getattr(settings, "REMINDER_VAPID_PUBLIC_KEY", "")
        and getattr(settings, "REMINDER_VAPID_PRIVATE_KEY", "")
        and getattr(settings, "REMINDER_VAPID_SUBJECT", "")
        and getattr(settings, "REMINDER_QSTASH_DESTINATION", "")
        and getattr(settings, "REMINDER_QSTASH_CURRENT_SIGNING_KEY", "")
        and getattr(settings, "REMINDER_QSTASH_NEXT_SIGNING_KEY", "")
    )


def due_slots(workspace, now: datetime):
    local = now.astimezone(MANILA)
    candidates = (local.date() - timedelta(days=1), local.date())
    slots = []
    for day in candidates:
        start = datetime.combine(day, workspace.reminder_start_time, tzinfo=MANILA)
        end = datetime.combine(day, workspace.reminder_end_time, tzinfo=MANILA)
        if end <= start:
            end += timedelta(days=1)
        phases = [("start", start), ("recap", end)]
        if workspace.reminder_strict_mode:
            step = timedelta(hours=workspace.reminder_interval_hours)
            point = start + step
            while point < end:
                phases.append(("strict", point))
                point += step
        for phase, point in phases:
            if point <= local <= point + CHECK_GRACE:
                slots.append((day, phase, f"{day.isoformat()}:{phase}:{point.isoformat()}"))
    return slots


def _send_push(delivery):
    from pywebpush import WebPushException, webpush

    payload = json.dumps({"type": "personal-reminder", "delivery_id": delivery.pk})
    for subscription in ReminderPushSubscription.objects.filter(user=delivery.user):
        try:
            webpush(
                subscription_info={
                    "endpoint": subscription.endpoint,
                    "keys": {"p256dh": subscription.p256dh, "auth": subscription.auth},
                },
                data=payload,
                vapid_private_key=settings.REMINDER_VAPID_PRIVATE_KEY,
                vapid_claims={"sub": settings.REMINDER_VAPID_SUBJECT},
                ttl=3600,
                timeout=8,
            )
        except WebPushException as error:
            if error.status_code in (404, 410):
                subscription.delete()
            else:
                logger.warning("Reminder push failed for subscription %s: %s", subscription.pk, error.status_code)
        except Exception:
            logger.exception("Reminder push failed for subscription %s", subscription.pk)


def dispatch_due(now: datetime):
    workspace, _ = WorkspaceSettings.objects.get_or_create(pk=1)
    slots = due_slots(workspace, now)
    if not slots:
        return 0
    user_ids = RecurringSchedule.objects.filter(
        system_key__in=[key for key, _, _ in DAILY_TASKS],
        created_by__isnull=False,
    ).values_list("created_by_id", flat=True).distinct()
    dispatched = 0
    for user in get_user_model().objects.filter(pk__in=user_ids, is_active=True):
        for day, phase, slot_key in slots:
            checklist = checklist_for(user, day)
            if phase == "strict" and checklist["all_complete"]:
                continue
            with transaction.atomic():
                delivery, created = ReminderDelivery.objects.get_or_create(
                    user=user, slot_key=slot_key,
                    defaults={"checklist_date": day, "phase": phase},
                )
            if not created:
                continue
            dispatched += 1
            if push_configured():
                _send_push(delivery)
            delivery.sent_at = timezone.now()
            delivery.save(update_fields=["sent_at"])
    return dispatched
