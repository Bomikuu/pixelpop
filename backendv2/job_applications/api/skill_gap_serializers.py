from rest_framework import serializers


class SkillGapSelectionSerializer(serializers.Serializer):
    assessment_revision = serializers.IntegerField(min_value=1)
    requirement_key = serializers.RegexField(r"^[a-f0-9]{64}$")
    related_project_id = serializers.UUIDField(allow_null=True, default=None)
    system_type = serializers.CharField(max_length=80, allow_blank=True, default="")
    tools = serializers.ListField(child=serializers.CharField(max_length=80), max_length=40, default=list)
    example_proposal_id = serializers.IntegerField(min_value=1, allow_null=True, default=None)
    resume_proposal_id = serializers.IntegerField(min_value=1, allow_null=True, default=None)
    reference_version = serializers.IntegerField(min_value=1, allow_null=True, default=None)

    def validate(self, data):
        if data["example_proposal_id"] and data["resume_proposal_id"]:
            raise serializers.ValidationError("Choose either an approved example or an accepted résumé, not both.")
        if (data["example_proposal_id"] or data["resume_proposal_id"]) and not data["reference_version"]:
            raise serializers.ValidationError({"reference_version": "Refresh the accepted proposal before preparing it."})
        if data["related_project_id"]:
            data["related_project_id"] = str(data["related_project_id"])
        data["tools"] = list(dict.fromkeys(data["tools"]))
        return data
