from rest_framework import serializers

from job_applications.models import ApplicationRequirementDecision


class RequirementDecisionSerializer(serializers.Serializer):
    requirement_key = serializers.RegexField(r"^[a-f0-9]{64}$")
    assessment_revision = serializers.IntegerField(min_value=1)
    source_digest = serializers.RegexField(r"^[a-f0-9]{64}$")
    expected_version = serializers.IntegerField(min_value=0)
    decision = serializers.ChoiceField(choices=ApplicationRequirementDecision.DECISIONS)
    note = serializers.CharField(max_length=4000, allow_blank=True)
    append_to_profile = serializers.BooleanField(default=False)
    accuracy_confirmed = serializers.BooleanField(default=False)
    expected_profile_updated_at = serializers.DateTimeField(required=False)

    def validate(self, data):
        if data["decision"] != "needs_review" and not data["note"].strip():
            raise serializers.ValidationError({"note": "Add a factual example or explain the limitation."})
        if data["append_to_profile"]:
            if data["decision"] != "evidence_added" or not data["accuracy_confirmed"]:
                raise serializers.ValidationError({"accuracy_confirmed": "Confirm this example is accurate before adding it to your profile."})
            if "expected_profile_updated_at" not in data:
                raise serializers.ValidationError({"expected_profile_updated_at": "Refresh your profile before adding evidence."})
        return data


class SubmissionCheckSerializer(serializers.Serializer):
    state = serializers.ChoiceField(choices=["needs_review", "confirmed", "not_applicable"])
    note = serializers.CharField(max_length=2000, allow_blank=True)


class SubmissionReviewSerializer(serializers.Serializer):
    expected_version = serializers.IntegerField(min_value=0)
    review_digest = serializers.RegexField(r"^[a-f0-9]{64}$")
    checks = serializers.DictField(child=SubmissionCheckSerializer())

    def validate_checks(self, value):
        if set(value) != {"rate", "availability", "accuracy"}:
            raise serializers.ValidationError("Include rate, availability and accuracy exactly once.")
        errors = {}
        for key, item in value.items():
            if item["state"] == "not_applicable":
                if key == "accuracy":
                    errors[key] = {"state": "Final accuracy cannot be marked not applicable."}
                elif not item["note"].strip():
                    errors[key] = {"note": "Explain why this check is not applicable."}
        if errors:
            raise serializers.ValidationError(errors)
        return value


class FollowUpActionSerializer(serializers.Serializer):
    request_id = serializers.UUIDField()
    expected_updated_at = serializers.DateTimeField()
    action = serializers.ChoiceField(choices=["record", "reschedule"])
    message = serializers.CharField(max_length=8000, required=False, allow_blank=True)
    occurred_on = serializers.DateField(required=False)
    next_date = serializers.DateField(required=False, allow_null=True)
    empty_date_action = serializers.ChoiceField(choices=["keep", "clear"], required=False)

    def validate(self, data):
        if data["action"] == "record" and (not data.get("message", "").strip() or not data.get("occurred_on")):
            raise serializers.ValidationError({"message": "Record what actually happened and its date."})
        if not data.get("next_date"):
            if not data.get("empty_date_action"):
                raise serializers.ValidationError({"empty_date_action": "Choose whether to keep or clear the current reminder."})
            if data["action"] == "reschedule" and data["empty_date_action"] != "clear":
                raise serializers.ValidationError({"next_date": "Choose a new date or explicitly clear the reminder."})
        return data
