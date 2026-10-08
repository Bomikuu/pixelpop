from django.db import transaction
from rest_framework import serializers
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from job_applications.models import JobApplication
from job_applications.services.clarifications import accepted_clarifications, clarification_state, confirmed_answers
from job_applications.services.resume_optimization import report_state
from job_applications.services.review import ReviewConflict, record_activity, source_fingerprint


class ClarificationAnswerSerializer(serializers.Serializer):
    finding_index = serializers.IntegerField(min_value=0, max_value=39)
    status = serializers.ChoiceField(choices=["answered", "not_used", "unresolved"])
    answer = serializers.CharField(max_length=4000, allow_blank=True)

    def validate(self, data):
        if data["status"] == "answered" and not data["answer"].strip():
            raise serializers.ValidationError({"answer": "Provide a real example, dates or factual explanation."})
        return data


class ClarificationSerializer(serializers.Serializer):
    check_id = serializers.UUIDField()
    expected_version = serializers.IntegerField(min_value=0)
    source_digest = serializers.RegexField(r"^[a-f0-9]{64}$")
    answers = ClarificationAnswerSerializer(many=True, allow_empty=False)
    accuracy_confirmed = serializers.BooleanField(default=False)

    def validate(self, data):
        rows = data["answers"]
        if len(rows) > 40 or len({row["finding_index"] for row in rows}) != len(rows) or sum(len(row["answer"]) for row in rows) > 30000:
            raise serializers.ValidationError({"answers": "Use each finding once, with at most 30,000 answer characters in total."})
        if any(row["status"] == "answered" for row in rows) and not data["accuracy_confirmed"]:
            raise serializers.ValidationError({"accuracy_confirmed": "Confirm your answers describe your actual experience."})
        return data


class ApplicationClarificationActionsMixin:
    @action(detail=True, methods=["post"], url_path="resume-clarifications")
    @transaction.atomic
    def resume_clarifications(self, request, pk=None):
        scoped = self.get_object()
        application = JobApplication.objects.select_for_update().get(pk=scoped.pk)
        profile = self.review_context(application, lock=True)["profile"]
        data = ClarificationSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        values = data.validated_data
        artifact = application.artifacts.filter(kind="resume").first()
        report = report_state(application, profile, artifact, "check")
        if (not report or report["stale"] or report["id"] != str(values["check_id"])
                or values["source_digest"] != source_fingerprint(application, profile)):
            raise ReviewConflict("The checklist or sources changed. Refresh and answer the latest checklist.")
        previous = clarification_state(application, report)
        if values["expected_version"] != previous["version"]:
            raise ReviewConflict("Newer answers were saved in another tab. Refresh before saving.")
        if {row["finding_index"] for row in values["answers"]} != set(range(len(report["findings"]))):
            raise ValidationError({"answers": "Respond to every finding, or mark it unresolved."})
        answers = [{**row, "finding": report["findings"][row["finding_index"]]} for row in values["answers"]]
        record_activity(application, "resume_clarifications", "Saved application-only answers for the résumé checklist; no AI call made.",
                        details={"check_id": report["id"], "source_digest": values["source_digest"],
                                 "revision": artifact.revision, "answers": answers,
                                 "previous_answers": confirmed_answers(accepted_clarifications(application, profile)),
                                 "accuracy_confirmed": values["accuracy_confirmed"]})
        return Response(clarification_state(application, report))
