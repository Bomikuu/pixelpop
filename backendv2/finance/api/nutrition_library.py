from calendar import monthrange
from datetime import date
from decimal import Decimal

from django.db import transaction
from django.db.models import Count, Q, Sum
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from finance.models import Meal, MealItem, MealPreset, NutritionProfile
from finance.services.nutrition import formatted_kcal
from finance.services.audit import log_record, snapshot_record
from finance.services.nutrition_library import library_page
from .nutrition_serializers import MealSerializer
from .nutrition_library_serializers import HistoricalFoodSerializer, MealPresetSerializer
from .views import PrivateMixin


def search_query(request):
    value = request.query_params.get("q", "").strip()
    if len(value) > 160:
        raise ValidationError({"q": "Use 160 characters or fewer."})
    return value


def validate_size(request):
    if len(request._request.body) > 65536:
        raise ValidationError({"items": "A saved meal must be 64 KiB or smaller."})


class NutritionMealHistoryView(PrivateMixin, APIView):
    def get(self, request):
        query = search_query(request)
        meals = Meal.objects.filter(user=request.user).filter(Q(meal_name__icontains=query) | Q(items__name__icontains=query)).distinct().prefetch_related("items")
        return Response(library_page(request, meals, MealSerializer))


class NutritionFoodLibraryView(PrivateMixin, APIView):
    def get(self, request):
        foods = MealItem.objects.filter(meal__user=request.user, name__icontains=search_query(request)).select_related("meal").order_by("-meal__date", "-meal_id", "position", "id")
        return Response(library_page(request, foods, HistoricalFoodSerializer))


class NutritionPresetListView(PrivateMixin, APIView):
    def get(self, request):
        presets = MealPreset.objects.filter(user=request.user, meal_name__icontains=search_query(request)).prefetch_related("items")
        return Response(library_page(request, presets, MealPresetSerializer))

    @transaction.atomic
    def post(self, request):
        validate_size(request)
        serializer = MealPresetSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        preset = serializer.save()
        log_record(preset, actor=request.user, action="added", after=snapshot_record(preset))
        return Response(MealPresetSerializer(preset).data, status=201)


class NutritionPresetDetailView(PrivateMixin, APIView):
    def get_object(self, request, pk):
        return get_object_or_404(MealPreset.objects.prefetch_related("items"), user=request.user, pk=pk)

    def get(self, request, pk):
        return Response(MealPresetSerializer(self.get_object(request, pk)).data)

    @transaction.atomic
    def patch(self, request, pk):
        validate_size(request)
        preset = self.get_object(request, pk)
        before = snapshot_record(preset)
        serializer = MealPresetSerializer(preset, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        log_record(preset, actor=request.user, action="edited", before=before, after=snapshot_record(preset))
        return Response(MealPresetSerializer(preset).data)

    @transaction.atomic
    def delete(self, request, pk):
        preset = self.get_object(request, pk)
        before, subject_id = snapshot_record(preset), preset.pk
        preset.delete()
        log_record(preset, actor=request.user, action="deleted", before=before, subject_id=subject_id)
        return Response(status=204)


class NutritionCalendarView(PrivateMixin, APIView):
    def get(self, request):
        month = request.query_params.get("month", "")
        try:
            start = date.fromisoformat(f"{month}-01")
            if start.strftime("%Y-%m") != month:
                raise ValueError()
        except ValueError:
            raise ValidationError({"month": "Use YYYY-MM."})
        end = start.replace(day=monthrange(start.year, start.month)[1])
        days = Meal.objects.filter(user=request.user, date__range=(start, end)).order_by().values("date").annotate(meal_count=Count("id")).order_by("date")
        totals = {row["meal__date"]: row["calories"] for row in MealItem.objects.filter(meal__user=request.user, meal__date__range=(start, end)).order_by().values("meal__date").annotate(calories=Sum("calories"))}
        target = NutritionProfile.objects.filter(user=request.user).values_list("daily_target_kcal", flat=True).first()
        rows = []
        for row in days:
            calories = totals.get(row["date"], Decimal("0"))
            state = ("over_target" if calories > target else "within_target") if target is not None and target > 0 else None
            rows.append({"date": row["date"].isoformat(), "meal_count": row["meal_count"], "calories": formatted_kcal(calories), "calorie_status": state})
        return Response({"month": month, "target_kcal": formatted_kcal(target) if target is not None else None, "days": rows})
