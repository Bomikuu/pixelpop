import hashlib
import json
from datetime import date, datetime, time
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from zoneinfo import ZoneInfo

from django.utils import timezone
from rest_framework.exceptions import APIException, ValidationError
from finance import models

MANILA = ZoneInfo("Asia/Manila")
ZERO = Decimal(0)


class Conflict(APIException):
    status_code = 409
    default_detail = "This record changed. Keep your draft, refresh and review before saving again."


def number(value, field="amount", places=2, positive=False, nullable=False, maximum=Decimal("1000000000000")):
    if nullable and value in (None, ""):
        return None
    try:
        if isinstance(value, bool):
            raise ValueError
        result = Decimal(str(value))
        if not result.is_finite() or result < 0 or (positive and not result) or result >= maximum or result.as_tuple().exponent < -places:
            raise ValueError
        return result
    except (ValueError, TypeError, InvalidOperation):
        raise ValidationError({field: f"Use a {'positive' if positive else 'non-negative'} number with at most {places} decimal places."})


def cash(value):
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def day(value, field="date"):
    try:
        return value if isinstance(value, date) and not isinstance(value, datetime) else date.fromisoformat(str(value))
    except (ValueError, TypeError):
        raise ValidationError({field: "Use a valid date in YYYY-MM-DD format."})


def instant(value, field="recorded_at"):
    try:
        result = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        if timezone.is_naive(result):
            result = result.replace(tzinfo=MANILA)
        if result > timezone.now():
            raise ValueError
        return result
    except (ValueError, TypeError):
        raise ValidationError({field: "Use a valid date/time no later than now (Asia/Manila)."})


def midnight(value):
    return datetime.combine(value, time.min, tzinfo=MANILA)


def revision(obj, expected):
    if expected is None or str(expected) != str(obj.revision):
        raise Conflict()


def workspace_lock():
    models.WorkspaceSettings.objects.get_or_create(pk=1)
    models.WorkspaceSettings.objects.select_for_update().get(pk=1)


def plain(value):
    return json.loads(json.dumps(value, default=str))


def fingerprint(value):
    return hashlib.sha256(json.dumps(plain(value), sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def record_event(subscription, kind, actor, before=None, after=None, request_id=None, effective_date=None):
    event = models.SubscriptionEvent.objects.create(subscription=subscription, kind=kind,
        before=plain(before or {}), after=plain(after or {}), request_id=request_id,
        effective_date=effective_date or timezone.now().astimezone(MANILA).date(), created_by=actor)
    from finance.services.audit import log_record
    log_record(subscription, actor=actor, action="paid" if kind == "paid" else "edited",
        before=event.before, after=event.after, operation_key=f"subscription-event:{event.pk}", label=str(subscription))
    return event
