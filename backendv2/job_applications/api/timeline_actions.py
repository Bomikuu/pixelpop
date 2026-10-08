from zoneinfo import ZoneInfo

from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from job_applications.services.timeline import GROUPS
from .serializers import ActivitySerializer


class WorkflowPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 50


class ApplicationTimelineActionsMixin:
    @action(detail=True, methods=["get"])
    def timeline(self, request, pk=None):
        record = self.get_object()
        today = timezone.localdate(timezone=ZoneInfo("Asia/Manila"))
        group, date_range = request.query_params.get("group", "all"), request.query_params.get("range", "history")
        if group not in {"all", *GROUPS} or date_range not in {"history", "upcoming", "all"}:
            raise ValidationError("Choose a valid timeline group and date range.")
        rows = record.activities.all()
        if group != "all":
            rows = rows.filter(kind__in=GROUPS[group])
        upcoming = rows.filter(occurred_on__gt=today).order_by("occurred_on", "created_at", "id")
        selected = upcoming if date_range == "upcoming" else rows.filter(occurred_on__lte=today) if date_range == "history" else rows
        if date_range != "upcoming":
            selected = selected.order_by("-occurred_on", "-created_at", "-id")
        pager = WorkflowPagination()
        response = pager.get_paginated_response(ActivitySerializer(pager.paginate_queryset(selected, request), many=True).data)
        dates = []
        for field, label in (("applied_on", "Current recorded submission date"), ("follow_up_on", "Current follow-up schedule")):
            value = getattr(record, field)
            if value and (field == "follow_up_on" or not record.activities.filter(details__field=field, details__to=value.isoformat()).exists()):
                dates.append({"field": field, "label": label, "date": value.isoformat(), "upcoming": value > today})
        response.data.update(current_dates=dates, upcoming=ActivitySerializer(upcoming[:5], many=True).data, upcoming_count=upcoming.count())
        return response
