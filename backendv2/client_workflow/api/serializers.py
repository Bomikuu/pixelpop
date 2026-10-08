from django.utils import timezone
from rest_framework import serializers

from client_workflow.models import (
    ChangeRequest, ChecklistItem, Client, MasterTemplate, PaymentMilestone,
    Project, ProjectDocument, ProjectStage,
)
from client_workflow.services.defaults import DEFAULT_TEMPLATES, STAGES


STAGE_KEYS = {key for key, _label, _description in STAGES}


class OwnedPrimaryKeyRelatedField(serializers.PrimaryKeyRelatedField):
    def get_queryset(self):
        queryset = super().get_queryset()
        request = self.context.get("request")
        if request is None or not request.user.is_authenticated:
            return queryset.none()
        if queryset.model is Client:
            return queryset.filter(owner=request.user)
        if queryset.model is Project:
            return queryset.filter(client__owner=request.user)
        if queryset.model is ProjectStage:
            return queryset.filter(project__client__owner=request.user)
        return queryset.none()


class ClientSerializer(serializers.ModelSerializer):
    project_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Client
        fields = (
            "id", "name", "organization", "contact_name", "email", "phone", "country",
            "timezone_name", "notes", "is_archived", "project_count", "created_at", "updated_at",
        )
        read_only_fields = ("id", "project_count", "created_at", "updated_at")

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Enter a client name.")
        return value


class ProjectSerializer(serializers.ModelSerializer):
    client = OwnedPrimaryKeyRelatedField(queryset=Client.objects.all())
    client_name = serializers.CharField(source="client.name", read_only=True)

    class Meta:
        model = Project
        fields = (
            "id", "client", "client_name", "title", "summary", "state", "current_stage",
            "country", "currency", "governing_law", "quoted_amount", "started_on", "target_on",
            "support_starts_on", "support_ends_on", "notes", "created_at", "updated_at",
        )
        read_only_fields = ("id", "client_name", "created_at", "updated_at")

    def validate_client(self, value):
        if self.instance and value.pk != self.instance.client_id:
            raise serializers.ValidationError("A project cannot move to another client.")
        return value

    def validate_current_stage(self, value):
        if value not in STAGE_KEYS:
            raise serializers.ValidationError("Choose a valid workflow stage.")
        return value

    def validate_currency(self, value):
        value = value.strip().upper()
        if len(value) != 3 or not value.isalpha():
            raise serializers.ValidationError("Use a three-letter currency code, such as USD or PHP.")
        return value

    def validate_title(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Enter a project title.")
        return value


class StageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectStage
        fields = ("id", "project", "key", "status", "notes", "updated_at")
        read_only_fields = ("id", "project", "key", "updated_at")


class ChecklistItemSerializer(serializers.ModelSerializer):
    stage = OwnedPrimaryKeyRelatedField(queryset=ProjectStage.objects.all())
    class Meta:
        model = ChecklistItem
        fields = ("id", "stage", "label", "position", "is_completed", "completed_at")
        read_only_fields = ("id", "completed_at")

    def validate_stage(self, value):
        if self.instance and value.pk != self.instance.stage_id:
            raise serializers.ValidationError("A checklist item cannot move to another stage.")
        return value

    def validate_label(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Enter a checklist item.")
        return value

    def create(self, validated_data):
        if validated_data.get("is_completed"):
            validated_data["completed_at"] = timezone.now()
        return super().create(validated_data)

    def update(self, instance, validated_data):
        completed = validated_data.get("is_completed", instance.is_completed)
        if completed != instance.is_completed:
            validated_data["completed_at"] = timezone.now() if completed else None
        return super().update(instance, validated_data)


class MasterTemplateSerializer(serializers.ModelSerializer):
    starter_title = serializers.SerializerMethodField()
    starter_body = serializers.SerializerMethodField()

    class Meta:
        model = MasterTemplate
        fields = ("id", "kind", "title", "body", "starter_title", "starter_body", "updated_at")
        read_only_fields = ("id", "kind", "starter_title", "starter_body", "updated_at")

    def get_starter_title(self, obj):
        return DEFAULT_TEMPLATES[obj.kind][0]

    def get_starter_body(self, obj):
        return DEFAULT_TEMPLATES[obj.kind][1]


class ProjectDocumentSerializer(serializers.ModelSerializer):
    starter_title = serializers.SerializerMethodField()
    starter_body = serializers.SerializerMethodField()
    is_share_active = serializers.SerializerMethodField()

    class Meta:
        model = ProjectDocument
        fields = ("id", "project", "kind", "title", "body", "starter_title", "starter_body", "updated_at", "share_token", "published_at", "share_expires_at", "is_share_active")
        read_only_fields = ("id", "project", "kind", "starter_title", "starter_body", "updated_at", "share_token", "published_at", "share_expires_at", "is_share_active")

    def get_starter_title(self, obj):
        return DEFAULT_TEMPLATES[obj.kind][0]

    def get_starter_body(self, obj):
        return DEFAULT_TEMPLATES[obj.kind][1]

    def get_is_share_active(self, obj):
        return bool(obj.share_token and obj.published_at and (obj.share_expires_at is None or obj.share_expires_at > timezone.now()))


class PublishedDocumentSerializer(serializers.ModelSerializer):
    title = serializers.CharField(source="published_title")
    body = serializers.CharField(source="published_body")

    class Meta:
        model = ProjectDocument
        fields = ("title", "body", "kind", "published_at")


class PaymentMilestoneSerializer(serializers.ModelSerializer):
    project = OwnedPrimaryKeyRelatedField(queryset=Project.objects.all())
    class Meta:
        model = PaymentMilestone
        fields = (
            "id", "project", "description", "amount", "due_on", "status", "received_on",
            "notes", "created_at", "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def validate_project(self, value):
        if self.instance and value.pk != self.instance.project_id:
            raise serializers.ValidationError("A milestone cannot move to another project.")
        return value

    def validate_amount(self, value):
        if value < 0:
            raise serializers.ValidationError("Amount cannot be negative.")
        return value

    def validate(self, attrs):
        attrs = super().validate(attrs)
        status = attrs.get("status", getattr(self.instance, "status", PaymentMilestone.Status.PLANNED))
        if status != PaymentMilestone.Status.REPORTED_RECEIVED:
            attrs["received_on"] = None
        return attrs


class ChangeRequestSerializer(serializers.ModelSerializer):
    project = OwnedPrimaryKeyRelatedField(queryset=Project.objects.all())
    class Meta:
        model = ChangeRequest
        fields = (
            "id", "project", "description", "price_impact", "timeline_impact", "status",
            "notes", "created_at", "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def validate_project(self, value):
        if self.instance and value.pk != self.instance.project_id:
            raise serializers.ValidationError("A change request cannot move to another project.")
        return value

    def validate_description(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Describe the requested change.")
        return value
