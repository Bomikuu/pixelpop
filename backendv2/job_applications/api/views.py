import re

from django.db import transaction
from django.db.models import Count, Q
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from zoneinfo import ZoneInfo
from rest_framework import serializers, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from rest_framework.views import APIView

from finance.api.views import PrivateMixin, FinancePagination
from client_workflow.services.docx_export import render_docx
from job_applications.models import ApplicantProfile, ApplicationAISettings, JobApplication, ApplicationArtifact, ApplicationActivity
from job_applications.services.generation import GenerationConflict, generate_artifact, save_revision
from job_applications.services.providers import public_catalog
from job_applications.services.resumes import extract_resume
from job_applications.services.postings import import_posting
from job_applications.services.review import application_checklist, artifact_review_state, source_fingerprint
from job_applications.services.resume_export import render_resume_docx
from .review_actions import ApplicationReviewActionsMixin
from .timeline_actions import ApplicationTimelineActionsMixin
from .budget_actions import ApplicationBudgetActionsMixin
from .conversion_actions import ApplicationConversionActionsMixin
from .requirement_actions import ApplicationRequirementActionsMixin
from .submission_actions import ApplicationSubmissionActionsMixin
from .followup_actions import ApplicationFollowUpActionsMixin
from .clarification_actions import ApplicationClarificationActionsMixin
from job_applications.services.requirements import requirement_decisions, assessment_comparison, assessment_list_summary
from job_applications.services.submission import submission_review_state
from job_applications.services.timeline import record_application_changes
from job_applications.services.budget import monthly_usage
from job_applications.services.resume_optimization import report_state
from job_applications.services.clarifications import clarification_state
from .serializers import ProfileSerializer, AISettingsSerializer, ApplicationSerializer, ArtifactSerializer, ActivitySerializer, GenerationSerializer, GenerateRequestSerializer


def today():
    return timezone.localdate(timezone=ZoneInfo("Asia/Manila"))


class GenerationThrottle(UserRateThrottle):
    scope = "job_generation"
    rate = "30/hour"


class ProfileView(PrivateMixin, APIView):
    def get(self, request):
        profile, _ = ApplicantProfile.objects.get_or_create(owner=request.user)
        return Response(ProfileSerializer(profile).data)

    @transaction.atomic
    def patch(self, request):
        profile, _ = ApplicantProfile.objects.get_or_create(owner=request.user)
        profile = ApplicantProfile.objects.select_for_update().get(pk=profile.pk)
        serializer = ProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class ResumeView(PrivateMixin, APIView):
    def post(self, request):
        # Preview only: uploading never silently replaces approved source text.
        text, filename = extract_resume(request.FILES.get("file"))
        return Response({"resume_text": text, "resume_filename": filename})


class SettingsView(PrivateMixin, APIView):
    def get(self, request):
        record, _ = ApplicationAISettings.objects.get_or_create(owner=request.user)
        return Response({"settings": AISettingsSerializer(record).data, "providers": public_catalog(), "usage": monthly_usage(request.user, preferences=record)})

    @transaction.atomic
    def patch(self, request):
        record, _ = ApplicationAISettings.objects.get_or_create(owner=request.user)
        record = ApplicationAISettings.objects.select_for_update().get(pk=record.pk)
        serializer = AISettingsSerializer(record, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        expected = serializer.validated_data.pop("expected_version", None)
        if expected != record.version:
            raise GenerationConflict("AI settings changed in another tab. Refresh before saving.")
        serializer.save(version=record.version + 1)
        return Response({"settings": serializer.data, "providers": public_catalog(), "usage": monthly_usage(request.user, preferences=record)})


class PostingImportView(PrivateMixin, APIView):
    def post(self, request):
        field = serializers.URLField(max_length=2000)
        url = field.run_validation(request.data.get("url"))
        return Response(import_posting(url))


class ApplicationViewSet(ApplicationClarificationActionsMixin, ApplicationRequirementActionsMixin, ApplicationSubmissionActionsMixin, ApplicationFollowUpActionsMixin, ApplicationConversionActionsMixin, ApplicationBudgetActionsMixin, ApplicationTimelineActionsMixin, ApplicationReviewActionsMixin, PrivateMixin, viewsets.ModelViewSet):
    serializer_class = ApplicationSerializer
    pagination_class = FinancePagination
    filter_backends = []
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        rows = JobApplication.objects.filter(owner=self.request.user).select_related("linked_project__client")
        query = self.request.query_params.get("q", "").strip()[:160]
        if query:
            rows = rows.filter(Q(role__icontains=query) | Q(company__icontains=query) | Q(platform__icontains=query))
        if status := self.request.query_params.get("status"):
            rows = rows.filter(status=status)
        return rows

    @transaction.atomic
    def perform_create(self, serializer):
        record = serializer.save(owner=self.request.user)
        ApplicationActivity.objects.create(application=record, kind="created", message="Application added.", occurred_on=today())
        record_application_changes(record, {"status": record.status, "applied_on": None, "follow_up_on": None,
                                           **{field: getattr(record, field) for field in ("role", "company", "url", "platform", "posting", "questions")}})

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        rows = self.get_queryset()
        ids = [item["id"] for item in response.data["results"]]
        applications = {item.pk: item for item in rows.filter(pk__in=ids).prefetch_related("requirement_decisions")}
        assessments = {item.application_id: item for item in ApplicationArtifact.objects.filter(application_id__in=ids, kind="assessment")
                       .only("application_id", "requirements", "warnings", "assessment_digest")}
        profile = ApplicantProfile.objects.filter(owner=request.user).first()
        for item in response.data["results"]:
            application = applications.get(item["id"])
            item["assessment_summary"] = assessment_list_summary(application, profile, assessments.get(item["id"])) if application else None
        response.data["ai_usage"] = monthly_usage(request.user)
        current_day = today()
        response.data["summary"] = {"total": rows.count(), "applied": rows.filter(status="applied").count(),
                                    "interviewing": rows.filter(status="interviewing").count(),
                                    "follow_ups_due": rows.filter(follow_up_on__lte=current_day, status__in=["ready", "applied", "interviewing"]).count()}
        return response

    @transaction.atomic
    def perform_update(self, serializer):
        serializer.instance = JobApplication.objects.select_for_update().get(pk=serializer.instance.pk)
        previous = {field: getattr(serializer.instance, field) for field in ("status", "applied_on", "follow_up_on", "role", "company", "url", "platform", "posting", "questions")}
        record = serializer.save()
        record_application_changes(record, previous)

    def retrieve(self, request, *args, **kwargs):
        record = self.get_object()
        context = self.review_context(record)
        artifacts = list(record.artifacts.all())
        decisions = requirement_decisions(record, context["profile"], next((item for item in artifacts if item.kind == "assessment"), None))
        pending = record.artifacts.filter(proposals__status="pending").values("kind").annotate(count=Count("proposals"))
        resume_check = report_state(record, context["profile"], next((item for item in artifacts if item.kind == "resume"), None), "check")
        return Response({**self.get_serializer(record).data,
                         "source_digest": source_fingerprint(record, context["profile"]),
                         "checklist": application_checklist(record, context["profile"], artifacts),
                         "submission_review": submission_review_state(record, context["profile"], artifacts),
                         "requirement_decisions": decisions["current"],
                         "historical_requirement_decisions": decisions["historical"],
                         "assessment_comparison": assessment_comparison(record, context["profile"]),
                         "resume_opportunities": report_state(record, context["profile"], next((item for item in artifacts if item.kind == "resume"), None), "discover"),
                         "resume_check": resume_check,
                         "resume_clarifications": clarification_state(record, resume_check),
                         "pending_proposals": list(pending),
                         "artifacts": ArtifactSerializer(artifacts, many=True, context=context).data,
                         "activities": ActivitySerializer(record.activities.all()[:30], many=True).data,
                         "generations": GenerationSerializer(record.generations.all()[:30], many=True).data})

    @action(detail=True, methods=["post"], throttle_classes=[GenerationThrottle])
    def generate(self, request, pk=None):
        record = self.get_object()
        profile, _ = ApplicantProfile.objects.get_or_create(owner=request.user)
        preferences, _ = ApplicationAISettings.objects.get_or_create(owner=request.user)
        serializer = GenerateRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        run = generate_artifact(record, profile, preferences, serializer.validated_data)
        return Response(GenerationSerializer(run).data)

    @action(detail=True, methods=["patch"], url_path="artifacts/(?P<kind>assessment|resume|cover_letter|answers|interview_prep)")
    @transaction.atomic
    def artifact(self, request, pk=None, kind=None):
        scoped_record = self.get_object()
        record = JobApplication.objects.select_for_update().get(pk=scoped_record.pk)
        artifact, _ = ApplicationArtifact.objects.get_or_create(application=record, kind=kind)
        expected = serializers.IntegerField(min_value=0).run_validation(request.data.get("expected_revision"))
        if expected != artifact.revision:
            raise GenerationConflict()
        context = self.review_context(record)
        serializer = ArtifactSerializer(artifact, data=request.data, partial=True, context=context)
        serializer.is_valid(raise_exception=True)
        if "body" not in serializer.validated_data:
            raise ValidationError({"body": "Include the draft text to save."})
        save_revision(artifact, serializer.validated_data["body"], edited=True)
        ApplicationActivity.objects.create(application=record, kind="edited", message=f"Saved {artifact.get_kind_display()} revision {artifact.revision}.", occurred_on=today())
        return Response(ArtifactSerializer(artifact, context=context).data)

    @action(detail=True, methods=["get"], url_path="revisions/(?P<kind>assessment|resume|cover_letter|answers|interview_prep)")
    def revisions(self, request, pk=None, kind=None):
        artifact = get_object_or_404(ApplicationArtifact, application=self.get_object(), kind=kind)
        return Response(list(artifact.revisions.values("id", "revision", "body", "created_at")[:30]))

    @action(detail=True, methods=["post"])
    def activity(self, request, pk=None):
        record = self.get_object()
        serializer = ActivitySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(application=record)
        return Response(serializer.data, status=201)

    @action(detail=True, methods=["get"], url_path="export/(?P<kind>resume|cover_letter)")
    @transaction.atomic
    def export(self, request, pk=None, kind=None):
        scoped_record = self.get_object()
        record = JobApplication.objects.select_for_update().get(pk=scoped_record.pk)
        profile = self.review_context(record, lock=True)["profile"]
        artifact = get_object_or_404(ApplicationArtifact.objects.select_for_update(), application=record, kind=kind)
        if not artifact.body.strip():
            raise ValidationError("Save a draft before exporting it.")
        if kind == "resume" and not artifact_review_state(artifact, record, profile)["exportable"]:
            raise ValidationError("Review the saved résumé against the current sources before exporting it.")
        title = profile.full_name if kind == "resume" and profile.full_name else f"Cover letter — {record.role}" if kind == "cover_letter" else "Résumé"
        layout = request.query_params.get("layout", "original")
        if kind == "resume" and layout not in ("original", "ats"):
            raise ValidationError({"layout": "Choose original or ats for the résumé layout."})
        content = render_resume_docx(profile, artifact.body, layout=layout) if kind == "resume" else render_docx(title, artifact.body)
        filename = re.sub(r"[^A-Za-z0-9_-]", "-", f"{record.company}-{kind}")[:120] + ".docx"
        response = HttpResponse(content, content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response
