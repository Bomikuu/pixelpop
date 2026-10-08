from django.db import transaction
from rest_framework.decorators import action
from rest_framework.response import Response

from job_applications.models import JobApplication
from job_applications.services.requirements import save_requirement_decision
from .action_serializers import RequirementDecisionSerializer


class ApplicationRequirementActionsMixin:
    @action(detail=True, methods=["post"], url_path="requirement-decision")
    @transaction.atomic
    def requirement_decision(self, request, pk=None):
        scoped = self.get_object()
        record = JobApplication.objects.select_for_update().get(pk=scoped.pk)
        profile = self.review_context(record, lock=True)["profile"]
        data = RequirementDecisionSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        return Response(save_requirement_decision(record, profile, data.validated_data))
