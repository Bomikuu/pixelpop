import re
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from rest_framework import serializers
from rest_framework.decorators import action
from rest_framework.response import Response

from client_workflow.api.serializers import ClientSerializer, ProjectSerializer, OwnedPrimaryKeyRelatedField
from client_workflow.models import Client
from job_applications.services.conversion import convert_application
from .serializers import ApplicationSerializer


class ConversionInputFields:
    def to_internal_value(self, data):
        if isinstance(data, dict):
            unknown = set(data) - set(self.fields)
            if unknown:
                raise serializers.ValidationError({field: "This field cannot be supplied here." for field in unknown})
        return super().to_internal_value(data)


class ConversionClientSerializer(ConversionInputFields, ClientSerializer):
    notes = serializers.CharField(max_length=8000, allow_blank=True, required=False)

    class Meta(ClientSerializer.Meta):
        fields = ("name", "organization", "contact_name", "email", "phone", "country", "timezone_name", "notes")

    def validate_phone(self, value):
        if value and (not re.fullmatch(r"[+\d\s().-]+", value) or not 7 <= len(re.sub(r"\D", "", value)) <= 15):
            raise serializers.ValidationError("Use 7–15 digits for the phone number.")
        return value

    def validate_timezone_name(self, value):
        if value:
            try:
                ZoneInfo(value)
            except (ZoneInfoNotFoundError, ValueError):
                raise serializers.ValidationError("Choose a valid time zone.") from None
        return value


class ConversionProjectSerializer(ConversionInputFields, ProjectSerializer):
    summary = serializers.CharField(max_length=30000, allow_blank=True, required=False)
    notes = serializers.CharField(max_length=8000, allow_blank=True, required=False)
    quoted_amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0, allow_null=True, required=False)

    class Meta(ProjectSerializer.Meta):
        fields = ("title", "summary", "state", "country", "currency", "governing_law", "quoted_amount", "started_on", "target_on", "notes")


class ConversionSerializer(ConversionInputFields, serializers.Serializer):
    client_id = OwnedPrimaryKeyRelatedField(queryset=Client.objects.filter(is_archived=False), required=False)
    new_client = ConversionClientSerializer(required=False)
    project = ConversionProjectSerializer()

    def validate(self, data):
        if ("client_id" in data) == ("new_client" in data):
            raise serializers.ValidationError("Choose an existing client or enter a new client, not both.")
        return data


class ApplicationConversionActionsMixin:
    @action(detail=True, methods=["post"])
    def convert(self, request, pk=None):
        record = self.get_object()
        serializer = ConversionSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        converted, created = convert_application(record, request.user, serializer.validated_data)
        return Response(ApplicationSerializer(converted, context={"request": request}).data, status=201 if created else 200)
