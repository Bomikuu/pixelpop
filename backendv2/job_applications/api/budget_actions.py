from datetime import timedelta
from decimal import Decimal

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from finance.api.views import PrivateMixin

from job_applications.models import ApplicantProfile, ApplicationAISettings, ApplicationArtifact, GenerationRun, JobApplication
from job_applications.services.budget import month_window, monthly_usage, quote_generations
from job_applications.services.review import ReviewConflict, record_activity
from .serializers import GenerationSerializer
from .timeline_actions import WorkflowPagination


class QuoteSerializer(serializers.Serializer):
    kinds = serializers.ListField(child=serializers.ChoiceField(choices=[kind for kind, _ in ApplicationArtifact.KINDS]), min_length=1, max_length=4)
    mode = serializers.ChoiceField(choices=["routine", "refine", "experience", "discover", "tailor", "check", "fix"], default="routine")

    def validate_kinds(self, value):
        if len(set(value)) != len(value):
            raise serializers.ValidationError("Choose distinct document types.")
        return value

    def validate(self, data):
        if data["mode"] in ("experience", "discover", "tailor", "check", "fix") and data["kinds"] != ["resume"]:
            raise serializers.ValidationError({"kinds": "Choose only the résumé for optimization or experience proposals."})
        return data


class ReconciliationSerializer(serializers.Serializer):
    expected_version = serializers.IntegerField(min_value=1)
    amount_usd = serializers.DecimalField(max_digits=12, decimal_places=6, min_value=Decimal(0))
    note = serializers.CharField(max_length=2000)


def usage_rows(rows, request):
    scope = request.query_params.get("scope", "all")
    if scope not in ("all", "current", "unresolved"):
        raise serializers.ValidationError({"scope": "Choose all, current or unresolved requests."})
    if scope != "all":
        start, end = month_window()
        rows = rows.filter(created_at__gte=start, created_at__lt=end)
    if scope == "unresolved":
        rows = rows.filter(reconciled_cost_usd__isnull=True, estimated_cost_usd__isnull=True)
    return rows


class OwnerUsageView(PrivateMixin, APIView):
    def get(self, request):
        rows = usage_rows(GenerationRun.objects.filter(application__owner=request.user).select_related("application", "proposal"), request)
        pager = WorkflowPagination()
        response = pager.get_paginated_response(GenerationSerializer(pager.paginate_queryset(rows, request), many=True).data)
        response.data["usage"] = monthly_usage(request.user)
        return response


class ApplicationBudgetActionsMixin:
    @action(detail=True, methods=["post"])
    def quote(self, request, pk=None):
        application = self.get_object()
        data = QuoteSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        profile, _ = ApplicantProfile.objects.get_or_create(owner=request.user)
        settings, _ = ApplicationAISettings.objects.get_or_create(owner=request.user)
        return Response(quote_generations(application, profile, settings, **data.validated_data))

    @action(detail=True, methods=["get"])
    def usage(self, request, pk=None):
        rows = usage_rows(self.get_object().generations.select_related("proposal", "application").all(), request)
        pager = WorkflowPagination()
        response = pager.get_paginated_response(GenerationSerializer(pager.paginate_queryset(rows, request), many=True).data)
        response.data["usage"] = monthly_usage(request.user)
        return response

    @action(detail=True, methods=["post"], url_path="usage/(?P<run_id>[a-fA-F0-9-]{36})/reconcile")
    @transaction.atomic
    def reconcile(self, request, pk=None, run_id=None):
        run_id = serializers.UUIDField().run_validation(run_id)
        scoped = self.get_object()
        application = JobApplication.objects.select_for_update().get(pk=scoped.pk)
        settings, _ = ApplicationAISettings.objects.get_or_create(owner=request.user)
        ApplicationAISettings.objects.select_for_update().get(pk=settings.pk)
        run = get_object_or_404(GenerationRun.objects.select_for_update(), application=application, pk=run_id)
        data = ReconciliationSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        values = data.validated_data
        if run.cost_version != values["expected_version"]:
            raise ReviewConflict("Usage changed. Refresh before reconciling this request.")
        if run.status == "running" and run.created_at > timezone.now() - timedelta(minutes=5):
            raise ReviewConflict("This request is still in progress. Wait before reconciling its cost.")
        old = run.reconciled_cost_usd
        run.reconciled_cost_usd = values["amount_usd"]
        run.reconciliation_note = values["note"]
        run.reconciled_at = timezone.now()
        run.cost_version += 1
        run.save(update_fields=["reconciled_cost_usd", "reconciliation_note", "reconciled_at", "cost_version"])
        record_activity(application, "reconciled", f"Reconciled provider charge: ${run.reconciled_cost_usd}. {run.reconciliation_note}",
                        details={"generation_id": str(run.pk), "from": str(old) if old is not None else None, "to": str(run.reconciled_cost_usd)})
        return Response({"run": GenerationSerializer(run).data, "usage": monthly_usage(request.user)})
