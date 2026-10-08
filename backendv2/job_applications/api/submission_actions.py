from django.db import transaction
from rest_framework.decorators import action
from rest_framework.response import Response

from job_applications.models import JobApplication
from job_applications.services.submission import save_submission_review
from .action_serializers import SubmissionReviewSerializer


class ApplicationSubmissionActionsMixin:
    @action(detail=True, methods=["post"], url_path="submission-review")
    @transaction.atomic
    def submission_review_action(self, request, pk=None):
        scoped = self.get_object()
        record = JobApplication.objects.select_for_update().get(pk=scoped.pk)
        profile = self.review_context(record, lock=True)["profile"]
        data = SubmissionReviewSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        return Response(save_submission_review(record, profile, data.validated_data))
