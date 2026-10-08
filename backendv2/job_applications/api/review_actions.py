from django.db import transaction
from django.db.models import Case, IntegerField, Value, When
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework import serializers
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from job_applications.models import ApplicantProfile, ApplicationArtifact, DraftProposal, JobApplication
from job_applications.services.review import ReviewConflict, accept_proposal, profile_ready, record_activity, require_current_proposal, source_fingerprint
from .serializers import ArtifactSerializer, ManualReviewSerializer, ProposalSerializer, ProposalUpdateSerializer, ProposalVersionSerializer


class ProposalPagination(PageNumberPagination):
    page_size = 5
    page_size_query_param = "page_size"
    max_page_size = 10


class ApplicationReviewActionsMixin:
    def review_context(self, record, lock=False):
        profile, _ = ApplicantProfile.objects.get_or_create(owner=self.request.user)
        if lock:
            profile = ApplicantProfile.objects.select_for_update().get(pk=profile.pk)
        return {"application": record, "profile": profile}

    def locked_proposal(self, proposal_id):
        scoped_record = self.get_object()
        record = JobApplication.objects.select_for_update().get(pk=scoped_record.pk)
        context = self.review_context(record, lock=True)
        scoped_proposal = get_object_or_404(DraftProposal, pk=proposal_id, artifact__application=record)
        artifact = ApplicationArtifact.objects.select_for_update().get(pk=scoped_proposal.artifact_id)
        proposal = DraftProposal.objects.select_for_update().select_related("generation").get(pk=scoped_proposal.pk)
        proposal.artifact = artifact
        return record, context, proposal

    @action(detail=True, methods=["get"])
    def proposals(self, request, pk=None):
        record = self.get_object()
        rows = DraftProposal.objects.filter(artifact__application=record, status="pending").select_related("artifact", "generation")
        kind = request.query_params.get("kind")
        if kind:
            if kind not in ("resume", "cover_letter", "answers", "interview_prep"):
                raise ValidationError({"kind": "Choose a document kind."})
            rows = rows.filter(artifact__kind=kind)
        if focus := request.query_params.get("focus"):
            focus_id = serializers.IntegerField(min_value=1).run_validation(focus)
            rows = rows.order_by(Case(When(pk=focus_id, then=Value(0)), default=Value(1), output_field=IntegerField()), "-created_at", "-id")
        paginator = ProposalPagination()
        page = paginator.paginate_queryset(rows, request)
        return paginator.get_paginated_response(ProposalSerializer(page, many=True, context=self.review_context(record)).data)

    @action(detail=True, methods=["patch"], url_path="proposals/(?P<proposal_id>[0-9]+)")
    @transaction.atomic
    def proposal_update(self, request, pk=None, proposal_id=None):
        data = ProposalUpdateSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        record, context, proposal = self.locked_proposal(proposal_id)
        require_current_proposal(proposal, data.validated_data["expected_version"], record, context["profile"])
        updates = {item["id"]: item for item in data.validated_data["sections"]}
        if set(updates) != {item["id"] for item in proposal.sections}:
            raise ValidationError({"sections": "Include each original section once; section IDs cannot be changed."})
        sections = []
        for item in proposal.sections:
            update = updates[item["id"]]
            edited = update["proposed"] != item["proposed"]
            change = "unchanged" if item["original"] == update["proposed"] else "removed" if not update["proposed"] else "added" if not item["original"] else "changed"
            sections.append({**item, "proposed": update["proposed"], "change": change,
                             "rationale_stale": item.get("rationale_stale", False) or edited,
                             "decision": "unreviewed" if edited else update["decision"]})
        proposal.sections = sections
        proposal.version += 1
        proposal.save(update_fields=["sections", "version", "updated_at"])
        return Response(ProposalSerializer(proposal, context=context).data)

    @action(detail=True, methods=["post"], url_path="proposals/(?P<proposal_id>[0-9]+)/accept")
    @transaction.atomic
    def proposal_accept(self, request, pk=None, proposal_id=None):
        data = ProposalVersionSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        record, context, proposal = self.locked_proposal(proposal_id)
        artifact = accept_proposal(proposal, data.validated_data["expected_version"], record, context["profile"])
        return Response(ArtifactSerializer(artifact, context=context).data)

    @action(detail=True, methods=["post"], url_path="proposals/(?P<proposal_id>[0-9]+)/discard")
    @transaction.atomic
    def proposal_discard(self, request, pk=None, proposal_id=None):
        data = ProposalVersionSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        record, context, proposal = self.locked_proposal(proposal_id)
        # Stale proposals can still be discarded; only newer decisions block this.
        if proposal.status != "pending" or proposal.version != data.validated_data["expected_version"]:
            raise ReviewConflict("This proposal changed. Refresh before discarding it.")
        proposal.status = "discarded"
        proposal.version += 1
        proposal.save(update_fields=["status", "version", "updated_at"])
        record_activity(record, "reviewed", f"Discarded a {proposal.artifact.get_kind_display()} proposal; saved text was kept.")
        return Response({"status": "discarded"})

    @action(detail=True, methods=["post"], url_path="review/(?P<kind>resume|cover_letter|answers|interview_prep)")
    @transaction.atomic
    def manual_review(self, request, pk=None, kind=None):
        data = ManualReviewSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        scoped_record = self.get_object()
        record = JobApplication.objects.select_for_update().get(pk=scoped_record.pk)
        context = self.review_context(record, lock=True)
        artifact = get_object_or_404(ApplicationArtifact.objects.select_for_update(), application=record, kind=kind)
        digest = source_fingerprint(record, context["profile"])
        if artifact.revision != data.validated_data["expected_revision"] or digest != data.validated_data["source_digest"]:
            raise ReviewConflict()
        if not profile_ready(context["profile"]) or not artifact.body.strip():
            raise ValidationError("Save a non-empty draft and confirm profile sources before marking it reviewed.")
        artifact.reviewed_at, artifact.reviewed_digest = timezone.now(), digest
        artifact.save(update_fields=["reviewed_at", "reviewed_digest"])
        record_activity(record, "reviewed", f"Marked {artifact.get_kind_display()} revision {artifact.revision} reviewed.")
        return Response(ArtifactSerializer(artifact, context=context).data)
