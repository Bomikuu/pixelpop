from decimal import Decimal
from zoneinfo import ZoneInfo

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import serializers, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from finance.models import NutritionActivity, WeightEntry
from finance.services.activity import ACTIVITIES, estimate_active_kcal
from finance.services.audit import log_record, snapshot_record
from .nutrition import nutrition_date
from .views import PrivateMixin


class NutritionActivitySerializer(serializers.ModelSerializer):
    activity_type = serializers.ChoiceField(choices=[*ACTIVITIES, "other"])
    name = serializers.CharField(required=False, max_length=120, allow_blank=True)
    steps = serializers.IntegerField(required=False, allow_null=True, min_value=1, max_value=100000)
    duration_minutes = serializers.DecimalField(required=False, allow_null=True, max_digits=7, decimal_places=2, min_value=Decimal("1"), max_value=Decimal("1440"))
    active_kcal = serializers.DecimalField(required=False, max_digits=9, decimal_places=2, min_value=Decimal("0.01"), max_value=Decimal("10000"))

    class Meta:
        model = NutritionActivity
        fields = (
            "id", "date", "activity_type", "name", "steps", "duration_minutes",
            "duration_assumed", "active_kcal", "source", "manual_override",
            "weight_kg_used", "met_used", "estimate_version", "created_at", "updated_at",
        )
        read_only_fields = (
            "id", "duration_assumed", "manual_override", "weight_kg_used",
            "met_used", "estimate_version", "created_at", "updated_at",
        )

    def validate(self, attrs):
        instance = self.instance
        activity_date = attrs.get("date", instance.date if instance else None)
        activity_type = attrs.get("activity_type", instance.activity_type if instance else None)
        source = attrs.get("source", instance.source if instance else None)
        if activity_type is None:
            raise ValidationError({"activity_type": "Choose an activity."})
        if activity_date is None:
            raise ValidationError({"date": "Choose an activity date."})
        if activity_date > timezone.localdate(timezone=ZoneInfo("Asia/Manila")):
            raise ValidationError({"date": "Choose today or an earlier activity date."})
        if not source:
            raise ValidationError({"source": "Choose estimate or manual entry."})
        name = attrs.get("name", instance.name if instance else "")
        if activity_type != "other" and not name:
            name = ACTIVITIES[activity_type]["label"]
            attrs["name"] = name
        if not name or not name.strip():
            raise ValidationError({"name": "Enter an activity name."})
        attrs["name"] = name.strip()

        steps = attrs.get("steps", instance.steps if instance else None)
        duration = attrs.get("duration_minutes", instance.duration_minutes if instance else None)
        if activity_type != "walking" and steps is not None:
            raise ValidationError({"steps": "Steps are for a specific walking session only."})
        if source == "estimated":
            if activity_type == "other":
                raise ValidationError({"activity_type": "Choose a supported activity to estimate burn."})
            if "active_kcal" in attrs:
                raise ValidationError({"active_kcal": "Estimated burn is calculated automatically."})
            previous_duration = None if instance and instance.duration_assumed else instance.duration_minutes if instance else None
            requested_duration = attrs.get("duration_minutes", previous_duration)
            needs_estimate = not instance or instance.source != "estimated" or any((
                activity_date != instance.date,
                activity_type != instance.activity_type,
                steps != instance.steps,
                requested_duration != previous_duration,
            ))
            if needs_estimate:
                duration = requested_duration
                if activity_type == "walking" and duration is None and steps is None:
                    raise ValidationError({"steps": "Enter walking-session steps or duration."})
                if activity_type != "walking" and duration is None:
                    raise ValidationError({"duration_minutes": "Enter the activity duration."})
                weight = WeightEntry.objects.filter(user=self.context["request"].user, date__lte=activity_date).order_by("-date", "-id").first()
                if weight is None:
                    raise ValidationError({"source": "Log a weight on or before this date, or enter active calories manually."})
                kcal, minutes, met, version, assumed = estimate_active_kcal(activity_type, duration, steps, weight.weight_kg)
                if minutes < Decimal("1") or minutes > Decimal("1440"):
                    raise ValidationError({"duration_minutes": "Use an activity duration of 1–1,440 minutes."})
                if kcal < Decimal("0.01") or kcal > Decimal("10000"):
                    raise ValidationError({"duration_minutes": "This estimate is outside the supported calorie range."})
                attrs.update(
                    active_kcal=kcal, duration_minutes=minutes, duration_assumed=assumed,
                    weight_kg_used=weight.weight_kg, met_used=met,
                    estimate_version=version, manual_override=False,
                )
            elif instance.duration_assumed and attrs.get("duration_minutes") is None:
                attrs.pop("duration_minutes", None)
        else:
            if "active_kcal" not in attrs and (not instance or instance.source != "manual"):
                raise ValidationError({"active_kcal": "Enter active calories burned."})
            if not instance or instance.source != "manual":
                attrs["manual_override"] = bool(instance and instance.source == "estimated")
                if not attrs["manual_override"]:
                    attrs.update(duration_assumed=False, weight_kg_used=None, met_used=None, estimate_version="")
        return attrs


class NutritionActivityListView(PrivateMixin, APIView):
    def get(self, request):
        selected_date = nutrition_date(request.query_params["date"]) if "date" in request.query_params else timezone.localdate(timezone=ZoneInfo("Asia/Manila"))
        rows = NutritionActivity.objects.filter(user=request.user, date=selected_date)
        return Response(NutritionActivitySerializer(rows, many=True).data)

    @transaction.atomic
    def post(self, request):
        serializer = NutritionActivitySerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        row = serializer.save(user=request.user)
        log_record(row, actor=request.user, action="added", after=snapshot_record(row))
        return Response(NutritionActivitySerializer(row).data, status=status.HTTP_201_CREATED)


class NutritionActivityDetailView(PrivateMixin, APIView):
    def get_object(self, request, pk):
        return get_object_or_404(NutritionActivity, user=request.user, pk=pk)

    def get(self, request, pk):
        return Response(NutritionActivitySerializer(self.get_object(request, pk)).data)

    @transaction.atomic
    def patch(self, request, pk):
        row = self.get_object(request, pk)
        before = snapshot_record(row)
        serializer = NutritionActivitySerializer(row, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        row = serializer.save()
        log_record(row, actor=request.user, action="edited", before=before, after=snapshot_record(row))
        return Response(NutritionActivitySerializer(row).data)

    @transaction.atomic
    def delete(self, request, pk):
        row = self.get_object(request, pk)
        before, subject_id = snapshot_record(row), row.pk
        row.delete()
        log_record(row, actor=request.user, action="deleted", before=before, subject_id=subject_id)
        return Response(status=status.HTTP_204_NO_CONTENT)
