from zoneinfo import ZoneInfo

from django.db import transaction
from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from job_applications.models import JobApplication
from job_applications.services.followups import ELIGIBLE_STATUSES, apply_follow_up
from .action_serializers import FollowUpActionSerializer
from .serializers import ApplicationSerializer
from .timeline_actions import WorkflowPagination


class ApplicationFollowUpActionsMixin:
    @action(detail=False, methods=["get"], url_path="follow-ups")
    def follow_ups(self, request):
        selected = request.query_params.get("range", "due")
        if selected not in ("due", "upcoming"):
            raise ValidationError({"range": "Choose due or upcoming follow-ups."})
        today = timezone.localdate(timezone=ZoneInfo("Asia/Manila"))
        rows = JobApplication.objects.filter(owner=request.user, status__in=ELIGIBLE_STATUSES, follow_up_on__isnull=False).select_related("linked_project__client")
        rows = rows.filter(follow_up_on__lte=today) if selected == "due" else rows.filter(follow_up_on__gt=today)
        rows = rows.order_by("follow_up_on", "id")
        pager = WorkflowPagination()
        response = pager.get_paginated_response(ApplicationSerializer(pager.paginate_queryset(rows, request), many=True).data)
        response.data["today"] = today.isoformat()
        return response

    @action(detail=True, methods=["post"], url_path="follow-up")
    @transaction.atomic
    def follow_up(self, request, pk=None):
        scoped = self.get_object()
        record = JobApplication.objects.select_for_update().get(pk=scoped.pk)
        data = FollowUpActionSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        return Response(apply_follow_up(record, data.validated_data))
