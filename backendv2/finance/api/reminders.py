from datetime import date
from datetime import timedelta
from hashlib import sha256
import os

from django.conf import settings
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from finance.api.views import PrivateMixin
from finance.models import Deadline, ReminderDelivery, ReminderPushSubscription
from finance.services.audit import log_record, snapshot_record
from finance.services.reminder_delivery import dispatch_due, push_configured
from finance.services.reminders import AUTO_KEYS, checklist_for, manila_today
from finance.services.settlements import settle_deadline


class ReminderChecklistView(PrivateMixin, APIView):
    def get(self, request):
        raw = request.query_params.get("date")
        try:
            day = date.fromisoformat(raw) if raw else manila_today()
        except ValueError as error:
            raise ValidationError({"date": "Use a date in YYYY-MM-DD format."}) from error
        if day > manila_today():
            raise ValidationError({"date": "Future checklists are not available."})
        return Response(checklist_for(request.user, day))


class ReminderItemToggleView(PrivateMixin, APIView):
    @transaction.atomic
    def post(self, request, pk):
        item = get_object_or_404(
            Deadline.objects.select_for_update().select_related("schedule"),
            pk=pk, created_by=request.user, important=True, kind__in=("task", "reminder"),
        )
        if item.schedule and item.schedule.system_key in AUTO_KEYS:
            raise ValidationError({"task": "Log the matching EOD, meal, or expense to complete this task."})
        before = snapshot_record(item)
        if item.status == "pending":
            item = settle_deadline(item.pk, {}, request.user)
            action = "settled"
        elif item.status == "completed":
            item.status = "pending"
            item.completed_at = None
            item.save(update_fields=["status", "completed_at", "updated_at"])
            action = "edited"
        else:
            raise ValidationError({"task": "Only tasks can be checked off."})
        log_record(item, actor=request.user, action=action, before=before, after=snapshot_record(item))
        return Response(checklist_for(request.user, manila_today()))


class ReminderStatusView(PrivateMixin, APIView):
    def get(self, request):
        configured = push_configured()
        return Response({
            "enabled": bool(os.getenv("VERCEL") and not settings.DEBUG and configured),
            "push_configured": configured,
            "vapid_public_key": settings.REMINDER_VAPID_PUBLIC_KEY if configured else "",
            "subscribed": ReminderPushSubscription.objects.filter(user=request.user).exists(),
        })


class ReminderSubscriptionView(PrivateMixin, APIView):
    def post(self, request):
        if not (os.getenv("VERCEL") and not settings.DEBUG and push_configured()):
            raise ValidationError({"notification": "Production notifications are not configured yet."})
        endpoint = request.data.get("endpoint", "")
        keys = request.data.get("keys") or {}
        p256dh, auth = keys.get("p256dh", ""), keys.get("auth", "")
        if not isinstance(endpoint, str) or not endpoint.startswith("https://") or len(endpoint) > 2048:
            raise ValidationError({"endpoint": "Choose a valid browser push endpoint."})
        if not isinstance(p256dh, str) or not isinstance(auth, str) or not p256dh or not auth or len(p256dh) > 512 or len(auth) > 512:
            raise ValidationError({"keys": "Browser subscription keys are missing or invalid."})
        digest = sha256(endpoint.encode()).hexdigest()
        with transaction.atomic():
            existing = ReminderPushSubscription.objects.select_for_update().filter(endpoint_hash=digest).first()
            if existing and existing.user_id != request.user.pk:
                raise ValidationError({"endpoint": "This browser belongs to another account."})
            if existing:
                existing.endpoint, existing.p256dh, existing.auth = endpoint, p256dh, auth
                existing.save(update_fields=["endpoint", "p256dh", "auth"])
            else:
                ReminderPushSubscription.objects.create(user=request.user, endpoint=endpoint, endpoint_hash=digest, p256dh=p256dh, auth=auth)
        return Response({"subscribed": True})

    def delete(self, request):
        endpoint = request.data.get("endpoint", "")
        if isinstance(endpoint, str) and endpoint:
            ReminderPushSubscription.objects.filter(user=request.user, endpoint_hash=sha256(endpoint.encode()).hexdigest()).delete()
        return Response({"subscribed": ReminderPushSubscription.objects.filter(user=request.user).exists()})


class ReminderPendingView(PrivateMixin, APIView):
    def get(self, request):
        delivery = ReminderDelivery.objects.filter(
            user=request.user, acknowledged_at__isnull=True,
            created_at__gte=timezone.now() - timedelta(hours=24),
        ).order_by("-created_at", "-id").first()
        return Response({
            "delivery": {
                "id": delivery.pk,
                "phase": delivery.phase,
                "date": delivery.checklist_date.isoformat(),
            } if delivery else None,
        })


class ReminderClaimView(PrivateMixin, APIView):
    @transaction.atomic
    def post(self, request, pk):
        delivery = get_object_or_404(ReminderDelivery.objects.select_for_update(), pk=pk, user=request.user)
        if delivery.acknowledged_at:
            return Response({"claimed": False})
        delivery.acknowledged_at = timezone.now()
        delivery.save(update_fields=["acknowledged_at"])
        ReminderDelivery.objects.filter(
            user=request.user, acknowledged_at__isnull=True,
            created_at__lte=delivery.created_at,
        ).update(acknowledged_at=delivery.acknowledged_at)
        return Response({"claimed": True, "phase": delivery.phase, "checklist": checklist_for(request.user, delivery.checklist_date)})


class ReminderDispatchView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        if not (os.getenv("VERCEL") and not settings.DEBUG and push_configured()):
            return Response({"detail": "Reminder dispatch is unavailable."}, status=503)
        signature = request.headers.get("Upstash-Signature")
        if not signature:
            return Response({"detail": "Invalid scheduler signature."}, status=403)
        from qstash import Receiver
        from qstash.errors import SignatureError

        try:
            Receiver(
                current_signing_key=settings.REMINDER_QSTASH_CURRENT_SIGNING_KEY,
                next_signing_key=settings.REMINDER_QSTASH_NEXT_SIGNING_KEY,
            ).verify(
                signature=signature,
                body=request.body.decode("utf-8"),
                url=settings.REMINDER_QSTASH_DESTINATION,
            )
        except (SignatureError, UnicodeDecodeError):
            return Response({"detail": "Invalid scheduler signature."}, status=403)
        return Response({"dispatched": dispatch_due(timezone.now())})
