from rest_framework import serializers

from end_of_day.models import EndOfDayEntry, EndOfDayGroup
from end_of_day.services.formatting import copy_outputs, manila_today


class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = EndOfDayGroup
        fields = ("id", "name", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")

    def validate_name(self, value):
        name = " ".join(value.split())
        if not name:
            raise serializers.ValidationError("Enter a group name.")
        if EndOfDayGroup.objects.filter(name__iexact=name).exclude(pk=getattr(self.instance, "pk", None)).exists():
            raise serializers.ValidationError("A group with this name already exists.")
        return name

    def validate(self, attrs):
        if self.instance and self.instance.name.casefold() == "personal" and attrs.get("name", self.instance.name) != self.instance.name:
            raise serializers.ValidationError({"name": "The Personal group cannot be renamed."})
        return attrs


class EntrySerializer(serializers.ModelSerializer):
    group_name = serializers.CharField(source="group.name", read_only=True)
    outputs = serializers.SerializerMethodField()
    items = serializers.ListField(child=serializers.CharField(max_length=500, allow_blank=False), max_length=50, required=False)
    in_progress = serializers.ListField(child=serializers.CharField(max_length=500, allow_blank=False), max_length=50, required=False)
    bullet_list = serializers.ListField(child=serializers.CharField(max_length=500, allow_blank=False), max_length=50, required=False)

    class Meta:
        model = EndOfDayEntry
        fields = ("id", "group", "group_name", "date", "type", "title", "summary", "items", "in_progress", "slack_message", "bullet_list", "outputs", "created_at", "updated_at")
        read_only_fields = ("id", "group_name", "outputs", "created_at", "updated_at")
        # validate() enforces this pair for normal writes; imports must preview it first.
        validators = []
        extra_kwargs = {
            "title": {"required": False, "allow_blank": True},
            "summary": {"required": False, "allow_blank": True},
            "slack_message": {"required": False, "allow_blank": True},
        }

    def get_outputs(self, obj):
        return copy_outputs(obj)

    def validate(self, attrs):
        group = attrs.get("group", getattr(self.instance, "group", None))
        day = attrs.get("date", getattr(self.instance, "date", None))
        entry_type = attrs.get("type", getattr(self.instance, "type", "workday"))
        title = attrs.get("title", getattr(self.instance, "title", ""))
        summary = attrs.get("summary", getattr(self.instance, "summary", ""))
        if not group:
            raise serializers.ValidationError({"group": "Choose an EOD group."})
        if not day:
            raise serializers.ValidationError({"date": "Choose a date."})
        if day > manila_today():
            raise serializers.ValidationError({"date": "An EOD cannot be logged for a future date."})
        if entry_type == "workday":
            if not title.strip():
                raise serializers.ValidationError({"title": "Enter a workday title."})
            if not summary.strip():
                raise serializers.ValidationError({"summary": "Enter a workday summary."})
        elif not title.strip():
            attrs["title"] = dict(EndOfDayEntry.TYPES)[entry_type]
        if not self.context.get("allow_existing_pair") and EndOfDayEntry.objects.filter(group=group, date=day).exclude(pk=getattr(self.instance, "pk", None)).exists():
            raise serializers.ValidationError({"date": "This group already has an entry for that date."})
        return attrs
