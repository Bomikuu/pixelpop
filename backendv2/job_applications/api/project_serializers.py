import json
from zoneinfo import ZoneInfo

from django.utils import timezone
from rest_framework import serializers


class ProjectExperienceSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    name = serializers.CharField(max_length=160)
    system_type = serializers.CharField(max_length=80)
    context = serializers.ChoiceField(choices=["asta", "independent", "client"])
    tools = serializers.ListField(child=serializers.CharField(max_length=80), max_length=40, default=list)
    contributions = serializers.CharField(max_length=4000, allow_blank=True, default="")
    outcomes = serializers.CharField(max_length=2000, allow_blank=True, default="")
    year = serializers.IntegerField(min_value=1900, allow_null=True, default=None)
    status = serializers.ChoiceField(choices=["unconfirmed", "confirmed"], default="unconfirmed")

    def to_internal_value(self, data):
        if isinstance(data, dict) and set(data) - set(self.fields):
            raise serializers.ValidationError("Unknown project fields are not supported.")
        return super().to_internal_value(data)

    def validate(self, data):
        if data["year"] and data["year"] > timezone.localdate(timezone=ZoneInfo("Asia/Manila")).year:
            raise serializers.ValidationError({"year": "Use a past or current year, or leave it blank."})
        if data["status"] == "confirmed" and not data["contributions"].strip():
            raise serializers.ValidationError({"contributions": "Describe what you actually contributed before confirming this project."})
        data["id"] = str(data["id"])
        data["tools"] = list(dict.fromkeys(data["tools"]))
        return data


def validate_projects(value):
    if len({item["id"] for item in value}) != len(value):
        raise serializers.ValidationError("Each project must have a unique ID.")
    if len(json.dumps(value, ensure_ascii=False)) > 30000:
        raise serializers.ValidationError("Project experience must be at most 30,000 characters in total.")
    return value
