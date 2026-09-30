from urllib.parse import urlsplit

from rest_framework import serializers

from brainstorm.models import BrainstormBoard, BrainstormGroup, BrainstormIdea
from brainstorm.services.fingerprints import fingerprint_title


def clean_name(value):
    value = " ".join(value.split())
    if not value:
        raise serializers.ValidationError("Enter a name.")
    return value


def clean_title(value):
    value = " ".join(value.split())
    if not fingerprint_title(value):
        raise serializers.ValidationError("Enter a title with letters or numbers.")
    return value


def clean_tags(value):
    if not isinstance(value, list) or len(value) > 20:
        raise serializers.ValidationError("Use up to 20 tags.")
    tags = []
    for tag in value:
        if not isinstance(tag, str) or not 0 < len(tag.strip()) <= 32:
            raise serializers.ValidationError("Each tag must be 1–32 characters.")
        cleaned = tag.strip()
        if cleaned.casefold() not in {item.casefold() for item in tags}:
            tags.append(cleaned)
    return tags


def clean_reference_url(value):
    if not value:
        return ""
    parts = urlsplit(value)
    if parts.scheme not in ("http", "https") or not parts.hostname or parts.username or parts.password:
        raise serializers.ValidationError("Use an HTTP or HTTPS link without embedded credentials.")
    return value


class BoardSerializer(serializers.ModelSerializer):
    idea_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = BrainstormBoard
        fields = ("id", "name", "slug", "description", "sort_order", "is_active", "idea_count", "created_at", "updated_at")
        read_only_fields = ("id", "slug", "idea_count", "created_at", "updated_at")

    def validate_name(self, value):
        value = clean_name(value)
        if BrainstormBoard.objects.filter(name__iexact=value).exclude(pk=getattr(self.instance, "pk", None)).exists():
            raise serializers.ValidationError("A board with this name already exists.")
        return value


class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = BrainstormGroup
        fields = ("id", "board", "name", "slug", "description", "sort_order", "created_at", "updated_at")
        read_only_fields = ("id", "slug", "created_at", "updated_at")

    def validate_name(self, value):
        return clean_name(value)

    def validate(self, attrs):
        board = attrs.get("board", getattr(self.instance, "board", None))
        if self.instance and board.pk != self.instance.board_id:
            raise serializers.ValidationError({"board": "Move ideas individually; a group stays on its board."})
        if not board.is_active:
            raise serializers.ValidationError({"board": "Reactivate this board before changing its groups."})
        name = attrs.get("name", getattr(self.instance, "name", ""))
        if BrainstormGroup.objects.filter(board=board, name__iexact=name).exclude(pk=getattr(self.instance, "pk", None)).exists():
            raise serializers.ValidationError({"name": "This group already exists on the board."})
        return attrs


class IdeaContentSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=160)
    description = serializers.CharField(max_length=4000, required=False, allow_blank=True, default="")
    source_text = serializers.CharField(max_length=4000, required=False, allow_blank=True, default="")
    urgency = serializers.ChoiceField(choices=BrainstormIdea.URGENCIES, required=False, default="medium")
    status = serializers.ChoiceField(choices=BrainstormIdea.STATUSES, required=False, default="inbox")
    tags = serializers.ListField(child=serializers.CharField(max_length=32), required=False, default=list, max_length=20)
    reference_url = serializers.URLField(max_length=2048, required=False, allow_blank=True, allow_null=True, default="")
    notes = serializers.CharField(max_length=4000, required=False, allow_blank=True, default="")

    def validate_title(self, value):
        return clean_title(value)

    def validate_tags(self, value):
        return clean_tags(value)

    def validate_reference_url(self, value):
        return clean_reference_url(value)


class IdeaSerializer(serializers.ModelSerializer):
    task_id = serializers.IntegerField(read_only=True)
    task_status = serializers.SerializerMethodField()

    class Meta:
        model = BrainstormIdea
        fields = (
            "id", "board", "group", "title", "description", "source_text", "urgency", "status",
            "tags", "reference_url", "notes", "sort_order", "task_id", "task_status",
            "carried_over_at", "created_at", "updated_at",
        )
        read_only_fields = ("id", "task_id", "task_status", "carried_over_at", "created_at", "updated_at")

    def get_task_status(self, obj):
        return obj.task.status if obj.task_id else "missing" if obj.status == "carried_over" else None

    def validate_title(self, value):
        return clean_title(value)

    def validate_tags(self, value):
        return clean_tags(value)

    def validate_reference_url(self, value):
        return clean_reference_url(value)

    def validate(self, attrs):
        board = attrs.get("board", getattr(self.instance, "board", None))
        group = attrs.get("group", getattr(self.instance, "group", None))
        if not board or not group or group.board_id != board.pk:
            raise serializers.ValidationError({"group": "Choose a group from this board."})
        if self.instance and board.pk != self.instance.board_id:
            raise serializers.ValidationError({"board": "Move ideas between groups on the same board."})
        if not board.is_active:
            raise serializers.ValidationError({"board": "Reactivate this board before changing its ideas."})
        title = attrs.get("title", getattr(self.instance, "title", ""))
        if BrainstormIdea.objects.filter(board=board, fingerprint=fingerprint_title(title)).exclude(pk=getattr(self.instance, "pk", None)).exists():
            raise serializers.ValidationError({"title": "This idea is already on the board."})
        if attrs.get("status") == "carried_over" and not getattr(self.instance, "task_id", None):
            raise serializers.ValidationError({"status": "Use Carry to task to create and link the task."})
        if attrs.get("reference_url") is None:
            attrs["reference_url"] = ""
        return attrs


class CarrySerializer(serializers.Serializer):
    title = serializers.CharField(max_length=160, required=False, allow_blank=False)
    description = serializers.CharField(max_length=4000, required=False, allow_blank=True)
    priority = serializers.ChoiceField(choices=("high", "medium", "low"), required=False)
    due_date = serializers.DateField(required=False, allow_null=True)
    category = serializers.IntegerField(required=False, allow_null=True, min_value=1)
