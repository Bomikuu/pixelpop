from django.db import transaction
from rest_framework import serializers

from finance.models import MealPreset, MealPresetItem
from .nutrition_serializers import MealItemSerializer, MealSerializer


class MealPresetItemSerializer(MealItemSerializer):
    class Meta(MealItemSerializer.Meta):
        model = MealPresetItem


class MealPresetSerializer(serializers.ModelSerializer):
    items = MealPresetItemSerializer(many=True)
    totals = serializers.SerializerMethodField()
    validate_items = MealSerializer.validate_items
    validate_meal_name = MealSerializer.validate_meal_name
    get_totals = MealSerializer.get_totals

    class Meta:
        model = MealPreset
        fields = ("id", "meal_name", "items", "totals")
        read_only_fields = ("id", "totals")

    @transaction.atomic
    def create(self, validated_data):
        items = validated_data.pop("items")
        preset = MealPreset.objects.create(user=self.context["request"].user, **validated_data)
        MealPresetItem.objects.bulk_create(MealPresetItem(preset=preset, position=index, **item) for index, item in enumerate(items))
        return preset

    @transaction.atomic
    def update(self, instance, validated_data):
        items = validated_data.pop("items", None)
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()
        if items is not None:
            instance.items.all().delete()
            MealPresetItem.objects.bulk_create(MealPresetItem(preset=instance, position=index, **item) for index, item in enumerate(items))
            instance._prefetched_objects_cache = {}
        return instance


class HistoricalFoodSerializer(MealItemSerializer):
    source_date = serializers.DateField(source="meal.date", read_only=True)
    source_meal_name = serializers.CharField(source="meal.meal_name", read_only=True)

    class Meta(MealItemSerializer.Meta):
        fields = ("id", *MealItemSerializer.Meta.fields, "source_date", "source_meal_name")
        read_only_fields = fields
