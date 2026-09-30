from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo

from django.db.models import Count
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework.views import APIView

from finance.models import AuditEvent
from finance.services.audit import ACTIONS, AREA_LABELS
from finance.services.queries import month_range
from .views import FinancePagination, PrivateMixin


MANILA = ZoneInfo("Asia/Manila")


class AuditEventsView(PrivateMixin, APIView):
    http_method_names = ["get", "head", "options"]

    def get(self, request):
        start, end = month_range(request.query_params.get("month"))
        action = request.query_params.get("action", "")
        area = request.query_params.get("area", "")
        if action and action not in ACTIONS:
            raise ValidationError({"action": "Choose a valid action."})
        if area and area not in AREA_LABELS:
            raise ValidationError({"area": "Choose a valid dashboard area."})
        lower = timezone.make_aware(datetime.combine(start, time.min), MANILA)
        upper = timezone.make_aware(datetime.combine(end + timedelta(days=1), time.min), MANILA)
        rows = AuditEvent.objects.filter(created_at__gte=lower, created_at__lt=upper)
        if action:
            rows = rows.filter(action=action)
        if area:
            rows = rows.filter(area=area)

        grouped_actions = dict(rows.order_by().values("action").annotate(count=Count("pk")).values_list("action", "count"))
        summary = {
            "total": sum(grouped_actions.values()),
            "added": grouped_actions.get("added", 0),
            "edited": grouped_actions.get("edited", 0),
            "deleted": grouped_actions.get("deleted", 0),
        }
        summary["other"] = summary["total"] - summary["added"] - summary["edited"] - summary["deleted"]

        grouped_days = rows.order_by().annotate(local_day=TruncDate("created_at", tzinfo=MANILA)).values("local_day", "action").annotate(count=Count("pk"))
        days = {}
        for item in grouped_days:
            key = item["local_day"].isoformat()
            bucket = item["action"] if item["action"] in ("added", "edited", "deleted") else "other"
            days.setdefault(key, {"date": key, "added": 0, "edited": 0, "deleted": 0, "other": 0})[bucket] += item["count"]
        timeline = []
        day = start
        while day <= end:
            timeline.append(days.get(day.isoformat(), {"date": day.isoformat(), "added": 0, "edited": 0, "deleted": 0, "other": 0}))
            day += timedelta(days=1)
        areas = [
            {"area": item["area"], "label": AREA_LABELS.get(item["area"], item["area"].title()), "count": item["count"]}
            for item in rows.order_by().values("area").annotate(count=Count("pk")).order_by("-count", "area")
        ]

        paginator = FinancePagination()
        page = paginator.paginate_queryset(rows.order_by("-created_at", "-pk"), request, view=self)
        response = paginator.get_paginated_response([
            {
                "id": row.pk, "created_at": row.created_at.isoformat(), "actor_label": row.actor_label,
                "source": row.source, "action": row.action, "area": row.area,
                "area_label": AREA_LABELS.get(row.area, row.area.title()),
                "subject_type": row.subject_type, "subject_id": row.subject_id,
                "label": row.label, "changes": row.changes,
            }
            for row in page
        ])
        response.data["summary"] = summary
        response.data["charts"] = {"timeline": timeline, "areas": areas}
        return response
