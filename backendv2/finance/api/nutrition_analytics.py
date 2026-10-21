from datetime import timedelta
from zoneinfo import ZoneInfo

from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from finance.services.nutrition_analytics import nutrition_analytics
from .nutrition import nutrition_date
from .views import PrivateMixin


class NutritionAnalyticsView(PrivateMixin, APIView):
    def get(self, request):
        start = nutrition_date(request.query_params.get("start"))
        requested_end = nutrition_date(request.query_params.get("end"))
        today = timezone.localdate(timezone=ZoneInfo("Asia/Manila"))
        if start > requested_end:
            raise ValidationError({"end": "End must be on or after the start date."})
        if start > today:
            raise ValidationError({"start": "The range must include today or an earlier date."})
        end = min(requested_end, today)
        length = (end - start).days + 1
        if length > 366:
            raise ValidationError({"end": "Choose a range of 366 days or less."})
        try:
            start - timedelta(days=length)
        except OverflowError:
            raise ValidationError({"start": "Choose a later start date so a comparison is available."})
        return Response(nutrition_analytics(request.user, start, end))
