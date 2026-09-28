from datetime import date
from zoneinfo import ZoneInfo

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from finance.models import Meal, NutritionProfile, WeightEntry
from finance.services.nutrition import nutrition_period_summary, nutrition_summary
from .nutrition_serializers import MealSerializer, NutritionProfileSerializer, NutritionSetupSerializer, WeightEntrySerializer
from .views import PrivateMixin


def nutrition_date(value):
    try:
        return date.fromisoformat(value)
    except (TypeError, ValueError):
        raise ValidationError({"date": "Use YYYY-MM-DD."})


class NutritionProfileView(PrivateMixin, APIView):
    def get(self, request):
        profile = NutritionProfile.objects.filter(user=request.user).first()
        return Response(NutritionProfileSerializer(profile or NutritionProfile(user=request.user)).data)

    def patch(self, request):
        profile, _ = NutritionProfile.objects.get_or_create(user=request.user)
        serializer = NutritionProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class NutritionSetupView(PrivateMixin, APIView):
    def post(self, request):
        serializer = NutritionSetupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        values = serializer.validated_data
        today = timezone.localdate(timezone=ZoneInfo("Asia/Manila"))
        with transaction.atomic():
            profile, _ = NutritionProfile.objects.update_or_create(
                user=request.user,
                defaults={
                    "height_cm": values["height_cm"],
                    "daily_target_kcal": values["daily_target_kcal"],
                    "daily_target_protein_g": values["daily_target_protein_g"],
                    "daily_target_carbs_g": values["daily_target_carbs_g"],
                    "daily_target_fat_g": values["daily_target_fat_g"],
                },
            )
            weight, _ = WeightEntry.objects.update_or_create(
                user=request.user,
                date=today,
                defaults={"weight_kg": values["weight_kg"]},
            )
        return Response({"profile": NutritionProfileSerializer(profile).data, "weight": WeightEntrySerializer(weight).data}, status=status.HTTP_201_CREATED)


class NutritionWeightListView(PrivateMixin, APIView):
    def get(self, request):
        end = nutrition_date(request.query_params["end"]) if "end" in request.query_params else None
        rows = WeightEntry.objects.filter(user=request.user)
        if end:
            rows = rows.filter(date__lte=end)
        return Response(WeightEntrySerializer(rows, many=True).data)


class NutritionWeightDetailView(PrivateMixin, APIView):
    def put(self, request, day):
        selected_date = nutrition_date(day)
        if selected_date > timezone.localdate(timezone=ZoneInfo("Asia/Manila")):
            raise ValidationError({"date": "Choose today or an earlier weight date."})
        entry = WeightEntry.objects.filter(user=request.user, date=selected_date).first()
        serializer = WeightEntrySerializer(entry, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user, date=selected_date)
        return Response(serializer.data, status=status.HTTP_200_OK if entry else status.HTTP_201_CREATED)

    def delete(self, request, day):
        entry = get_object_or_404(WeightEntry, user=request.user, date=nutrition_date(day))
        entry.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class NutritionMealListView(PrivateMixin, APIView):
    def get(self, request):
        selected_date = nutrition_date(request.query_params["date"]) if "date" in request.query_params else timezone.localdate(timezone=ZoneInfo("Asia/Manila"))
        rows = Meal.objects.filter(user=request.user, date=selected_date).prefetch_related("items")
        return Response(MealSerializer(rows, many=True).data)

    def post(self, request):
        if len(request._request.body) > 65536:
            raise ValidationError({"items": "A meal must be 64 KiB or smaller."})
        serializer = MealSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        meal = serializer.save()
        return Response(MealSerializer(meal).data, status=status.HTTP_201_CREATED)


class NutritionMealDetailView(PrivateMixin, APIView):
    def get_object(self, request, pk):
        return get_object_or_404(Meal.objects.prefetch_related("items"), user=request.user, pk=pk)

    def get(self, request, pk):
        return Response(MealSerializer(self.get_object(request, pk)).data)

    def patch(self, request, pk):
        if len(request._request.body) > 65536:
            raise ValidationError({"items": "A meal must be 64 KiB or smaller."})
        serializer = MealSerializer(self.get_object(request, pk), data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        meal = serializer.save()
        return Response(MealSerializer(meal).data)

    def delete(self, request, pk):
        self.get_object(request, pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class NutritionSummaryView(PrivateMixin, APIView):
    def get(self, request):
        selected_date = nutrition_date(request.query_params["date"]) if "date" in request.query_params else timezone.localdate(timezone=ZoneInfo("Asia/Manila"))
        return Response(nutrition_summary(request.user, selected_date))


class NutritionPeriodSummaryView(PrivateMixin, APIView):
    def get(self, request):
        period = request.query_params.get("period", "month")
        if period not in ("month", "overall"):
            raise ValidationError({"period": "Choose month or overall."})
        selected_date = nutrition_date(request.query_params["date"]) if "date" in request.query_params else timezone.localdate(timezone=ZoneInfo("Asia/Manila"))
        return Response(nutrition_period_summary(request.user, selected_date, period))
