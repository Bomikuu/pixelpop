from datetime import date

from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from finance.api.views import PrivateMixin
from finance.models import Deadline
from finance.services.audit import log_record, snapshot_record
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
