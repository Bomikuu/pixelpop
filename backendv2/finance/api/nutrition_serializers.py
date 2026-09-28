from decimal import Decimal
import re
from zoneinfo import ZoneInfo

from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from finance.models import Meal, MealItem, NutritionProfile, WeightEntry


class NutritionProfileSerializer(serializers.ModelSerializer):
    has_weight_entry = serializers.SerializerMethodField()

    class Meta:
        model = NutritionProfile
        fields = (
            "height_cm", "daily_target_kcal", "daily_target_protein_g",
            "daily_target_carbs_g", "daily_target_fat_g", "has_weight_entry",
        )

    def get_has_weight_entry(self, profile):
        return WeightEntry.objects.filter(user=profile.user).exists()


class NutritionSetupSerializer(serializers.Serializer):
    height_cm = serializers.DecimalField(max_digits=5, decimal_places=1, min_value=Decimal("0.01"))
    daily_target_kcal = serializers.DecimalField(max_digits=8, decimal_places=2, min_value=Decimal("0.01"))
    daily_target_protein_g = serializers.DecimalField(max_digits=8, decimal_places=2, min_value=Decimal("0.01"))
    daily_target_carbs_g = serializers.DecimalField(max_digits=8, decimal_places=2, min_value=Decimal("0.01"))
    daily_target_fat_g = serializers.DecimalField(max_digits=8, decimal_places=2, min_value=Decimal("0.01"))
    weight_kg = serializers.DecimalField(max_digits=6, decimal_places=2, min_value=Decimal("0.01"))


class WeightEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = WeightEntry
        fields = ("date", "weight_kg", "note")
        read_only_fields = ("date",)


class MealItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MealItem
        fields = ("name", "amount", "unit", "calories", "protein", "carbs", "fat")

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Enter a food name.")
        return value

    def validate_unit(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Enter a unit.")
        return value


class MealSerializer(serializers.ModelSerializer):
    datetime = serializers.DateTimeField(source="eaten_at", required=False, allow_null=True, default_timezone=ZoneInfo("Asia/Manila"))
    items = MealItemSerializer(many=True)
    totals = serializers.SerializerMethodField()

    class Meta:
        model = Meal
        fields = ("id", "date", "datetime", "meal_name", "items", "totals")
        read_only_fields = ("id", "totals")

    def validate_meal_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Enter a meal name.")
        return value

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("Add at least one food item.")
        if len(value) > 100:
            raise serializers.ValidationError("Use at most 100 food items in a meal.")
        return value

    def validate_datetime(self, value):
        raw = self.initial_data.get("datetime")
        if value is not None and (not isinstance(raw, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+08:00", raw)):
            raise serializers.ValidationError("Use YYYY-MM-DDTHH:mm:ss+08:00 for the time eaten.")
        return value

    def validate(self, attrs):
        manila = ZoneInfo("Asia/Manila")
        meal_date = attrs.get("date", self.instance.date if self.instance else None)
        eaten_at = attrs.get("eaten_at", self.instance.eaten_at if self.instance else None)
        if eaten_at is not None and "date" not in attrs:
            meal_date = timezone.localtime(eaten_at, manila).date()
            attrs["date"] = meal_date
        if meal_date is not None and meal_date > timezone.localdate(timezone=manila):
            raise serializers.ValidationError({"date": "Choose today or an earlier meal date."})
        if eaten_at is not None and eaten_at > timezone.now():
            raise serializers.ValidationError({"datetime": "A meal cannot be logged for a future time."})
        if eaten_at is not None and meal_date != timezone.localtime(eaten_at, manila).date():
            if "eaten_at" not in attrs and self.instance is not None:
                attrs["eaten_at"] = None
            else:
                raise serializers.ValidationError({"datetime": "The datetime must match the meal date."})
        return attrs

    def get_totals(self, meal):
        fields = ("calories", "protein", "carbs", "fat")
        items = list(meal.items.all())
        return {
            field: str(sum((getattr(item, field) for item in items), Decimal("0")).quantize(Decimal("0.01")))
            for field in fields
        }

    @transaction.atomic
    def create(self, validated_data):
        items = validated_data.pop("items")
        meal = Meal.objects.create(user=self.context["request"].user, **validated_data)
        MealItem.objects.bulk_create(
            MealItem(meal=meal, position=index, **item)
            for index, item in enumerate(items)
        )
        return meal

    @transaction.atomic
    def update(self, instance, validated_data):
        items = validated_data.pop("items", None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        if items is not None:
            instance.items.all().delete()
            MealItem.objects.bulk_create(
                MealItem(meal=instance, position=index, **item)
                for index, item in enumerate(items)
            )
        return instance
