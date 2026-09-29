from django.core.validators import URLValidator
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from leadership import models
from leadership.services.calendar import local_today
from leadership.services.seed import REPORT_CHECKLIST


REFLECTION_QUESTIONS = (
    "team_process", "goals", "metrics", "feedback_loops",
    "knowledge", "delegation", "coaching", "leadership_continuity",
)
DELEGATION_MILESTONES = (
    "Context explained", "Ownership given", "Proposal reviewed",
    "Independent implementation", "Presentation", "Maintenance without Miku",
)


class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.LeadershipPlan
        fields = ("id", "team_name", "start_date", "status", "created_at")
        read_only_fields = ("id", "status", "created_at")

    def validate_team_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Enter a team name.")
        return value

    def validate_start_date(self, value):
        if self.instance and self.instance.actions.exists() and value != self.instance.start_date:
            raise serializers.ValidationError("Start date cannot change after the roadmap is created.")
        return value


class PlanBoundSerializer(serializers.ModelSerializer):
    plan = serializers.PrimaryKeyRelatedField(read_only=True)

    def validate(self, attrs):
        attrs = super().validate(attrs)
        plan = self.context["plan"]
        for field, value in attrs.items():
            related = value if isinstance(value, list) else [value]
            if any(hasattr(item, "plan_id") and item.plan_id != plan.pk for item in related):
                raise serializers.ValidationError({field: "Choose a record from this plan."})
        for field in ("week", "planned_week", "current_week"):
            value = attrs.get(field)
            if value is not None and not 1 <= value <= 12:
                raise serializers.ValidationError({field: "Choose a week from 1 to 12."})
        return attrs


class TeamMemberSerializer(PlanBoundSerializer):
    class Meta:
        model = models.TeamMember
        fields = "__all__"
        read_only_fields = ("id", "plan", "is_self", "created_at")


class DailyCheckInSerializer(PlanBoundSerializer):
    class Meta:
        model = models.DailyCheckIn
        fields = "__all__"
        read_only_fields = ("id", "plan", "created_at", "updated_at")
        validators = []

    def validate_date(self, value):
        if value > local_today():
            raise serializers.ValidationError("A check-in cannot be recorded for a future date.")
        return value


class WeeklyActionSerializer(PlanBoundSerializer):
    class Meta:
        model = models.WeeklyAction
        fields = "__all__"
        read_only_fields = ("id", "plan", "lineage_id", "source_action", "current_week", "phase", "seeded", "created_at", "updated_at")

    def validate_evidence_urls(self, value):
        if not isinstance(value, list) or len(value) > 20:
            raise serializers.ValidationError("Use a list of at most 20 evidence links.")
        validator = URLValidator()
        for url in value:
            if not isinstance(url, str):
                raise serializers.ValidationError("Evidence links must be URLs.")
            try:
                validator(url)
            except DjangoValidationError:
                raise serializers.ValidationError("Enter valid evidence URLs.") from None
        return value

    def validate(self, attrs):
        attrs = super().validate(attrs)
        if attrs.get("status") == "moved" and (self.instance is None or self.instance.status != "moved"):
            raise serializers.ValidationError({"status": "Use Carry to next week to move an action."})
        if self.instance and self.instance.status == "moved" and attrs.get("status", "moved") != "moved":
            raise serializers.ValidationError({"status": "A carried source stays moved. Update its follow-up instead."})
        if self.instance is None:
            attrs["current_week"] = attrs["planned_week"]
            attrs["phase"] = (attrs["current_week"] - 1) // 2 + 1
        elif "planned_week" in attrs and attrs["planned_week"] != self.instance.planned_week:
            raise serializers.ValidationError("Use Carry to next week instead of changing an action's week.")
        return attrs


class TeamGoalSerializer(PlanBoundSerializer):
    class Meta:
        model = models.TeamGoal
        fields = "__all__"
        read_only_fields = ("id", "plan", "created_at", "updated_at")


class WeeklyLeadershipReviewSerializer(PlanBoundSerializer):
    class Meta:
        model = models.WeeklyLeadershipReview
        fields = "__all__"
        read_only_fields = ("id", "plan", "submitted_at", "updated_at")


class ProcessSerializer(PlanBoundSerializer):
    class Meta:
        model = models.Process
        fields = "__all__"
        read_only_fields = ("id", "plan", "created_at")


class ProcessObservationSerializer(PlanBoundSerializer):
    class Meta:
        model = models.ProcessObservation
        fields = "__all__"
        read_only_fields = ("id", "plan")

    def validate(self, attrs):
        attrs = super().validate(attrs)
        checked = attrs.get("checked", getattr(self.instance, "checked", None))
        eligible = attrs.get("eligible", getattr(self.instance, "eligible", None))
        if (checked is None) != (eligible is None) or (eligible is not None and (eligible == 0 or checked > eligible)):
            raise serializers.ValidationError("Enter checked and eligible counts, with eligible greater than zero.")
        return attrs


class MetricDefinitionSerializer(PlanBoundSerializer):
    class Meta:
        model = models.MetricDefinition
        fields = "__all__"
        read_only_fields = ("id", "plan", "seeded")


class MetricEntrySerializer(PlanBoundSerializer):
    class Meta:
        model = models.MetricEntry
        fields = "__all__"
        read_only_fields = ("id", "plan", "updated_at")

    def validate(self, attrs):
        attrs = super().validate(attrs)
        value = attrs.get("value", getattr(self.instance, "value", None))
        numerator = attrs.get("numerator", getattr(self.instance, "numerator", None))
        denominator = attrs.get("denominator", getattr(self.instance, "denominator", None))
        if value is None and (numerator is None or denominator is None):
            raise serializers.ValidationError("Enter a value or a measured numerator and denominator.")
        if (numerator is None) != (denominator is None) or (denominator is not None and (denominator == 0 or numerator > denominator)):
            raise serializers.ValidationError("Enter a valid numerator and a nonzero denominator.")
        return attrs


class QualityObservationSerializer(PlanBoundSerializer):
    class Meta:
        model = models.QualityObservation
        fields = "__all__"
        read_only_fields = ("id", "plan")

    def validate(self, attrs):
        attrs = super().validate(attrs)
        checked = attrs.get("checked", getattr(self.instance, "checked", None))
        eligible = attrs.get("eligible", getattr(self.instance, "eligible", None))
        if (checked is None) != (eligible is None) or (eligible is not None and (eligible == 0 or checked > eligible)):
            raise serializers.ValidationError("Enter checked and eligible counts, with eligible greater than zero.")
        target = attrs.get("target_percent", getattr(self.instance, "target_percent", None))
        if target is not None and target > 100:
            raise serializers.ValidationError({"target_percent": "Use 0–100%."})
        return attrs


class PRReviewSerializer(PlanBoundSerializer):
    class Meta:
        model = models.PRReview
        fields = "__all__"
        read_only_fields = ("id", "plan")


class WeeklyReportSerializer(PlanBoundSerializer):
    class Meta:
        model = models.WeeklyReport
        fields = "__all__"
        read_only_fields = ("id", "plan", "submitted_at", "updated_at")

    def validate_checklist(self, value):
        if not isinstance(value, dict) or any(key not in REPORT_CHECKLIST or not isinstance(done, bool) for key, done in value.items()):
            raise serializers.ValidationError("Use the weekly report checklist with true/false values.")
        return value


class DelegationSerializer(PlanBoundSerializer):
    class Meta:
        model = models.Delegation
        fields = "__all__"
        read_only_fields = ("id", "plan", "created_at", "updated_at")

    def validate_progress(self, value):
        if value > 100:
            raise serializers.ValidationError("Use 0–100%.")
        return value

    def validate_milestones(self, value):
        if not isinstance(value, list) or any(not isinstance(item, str) or item not in DELEGATION_MILESTONES for item in value) or len(value) != len(set(value)):
            raise serializers.ValidationError("Choose unique milestones from the delegation checklist.")
        return value


class KnowledgeItemSerializer(PlanBoundSerializer):
    class Meta:
        model = models.KnowledgeItem
        fields = "__all__"
        read_only_fields = ("id", "plan", "updated_at")

    def validate(self, attrs):
        attrs = super().validate(attrs)
        tested = attrs.get("backup_tested", getattr(self.instance, "backup_tested", False))
        owner = attrs.get("backup_owner", getattr(self.instance, "backup_owner", None))
        if tested and owner is None:
            raise serializers.ValidationError({"backup_owner": "Choose a backup owner before marking the backup tested."})
        return attrs


class ContinuityCheckSerializer(PlanBoundSerializer):
    class Meta:
        model = models.ContinuityCheck
        fields = "__all__"
        read_only_fields = ("id", "plan", "created_at")


class FrictionItemSerializer(PlanBoundSerializer):
    class Meta:
        model = models.FrictionItem
        fields = "__all__"
        read_only_fields = ("id", "plan", "updated_at")


class LeadershipEvidenceSerializer(PlanBoundSerializer):
    class Meta:
        model = models.LeadershipEvidence
        fields = "__all__"
        read_only_fields = ("id", "plan", "created_at")


class LeadershipHealthAssessmentSerializer(PlanBoundSerializer):
    class Meta:
        model = models.LeadershipHealthAssessment
        fields = "__all__"
        read_only_fields = ("id", "plan", "updated_at")

    def validate(self, attrs):
        attrs = super().validate(attrs)
        level = attrs.get("level", getattr(self.instance, "level", "not_started"))
        rationale = attrs.get("rationale", getattr(self.instance, "rationale", ""))
        if level != "not_started" and not rationale.strip():
            raise serializers.ValidationError({"rationale": "Explain why this evidence level fits."})
        return attrs


class MonthlyReflectionSerializer(PlanBoundSerializer):
    class Meta:
        model = models.MonthlyReflection
        fields = "__all__"
        read_only_fields = ("id", "plan", "submitted_at", "updated_at")

    def validate(self, attrs):
        attrs = super().validate(attrs)
        month = attrs.get("month", getattr(self.instance, "month", ""))
        if len(month) != 7 or month[4] != "-" or not (month[:4] + month[5:]).isdigit() or not 1 <= int(month[5:]) <= 12:
            raise serializers.ValidationError({"month": "Use YYYY-MM."})
        answers = attrs.get("answers", getattr(self.instance, "answers", {}))
        if not isinstance(answers, dict) or set(answers) != set(REFLECTION_QUESTIONS) or any(value not in ("yes", "partially", "no") for value in answers.values()):
            raise serializers.ValidationError({"answers": "Answer each readiness question Yes, Partially, or No."})
        notes = attrs.get("notes", getattr(self.instance, "notes", {}))
        if not isinstance(notes, dict) or any(key not in REFLECTION_QUESTIONS or not isinstance(value, str) for key, value in notes.items()):
            raise serializers.ValidationError({"notes": "Use notes for the eight reflection questions."})
        return attrs
