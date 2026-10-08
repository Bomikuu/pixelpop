import hashlib
import json

from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import serializers, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from finance.api.views import PrivateMixin
from job_applications.models import ReusableAnswer
from job_applications.services.review import ReviewConflict
from .timeline_actions import WorkflowPagination


def answer_digest(answer):
    return hashlib.sha256(json.dumps([answer.question, answer.category, answer.body], ensure_ascii=False).encode()).hexdigest()


class AnswerSerializer(serializers.ModelSerializer):
    expected_revision = serializers.IntegerField(min_value=1, write_only=True, required=False)
    reviewed = serializers.SerializerMethodField()

    def get_reviewed(self, obj):
        return bool(not obj.is_archived and obj.reviewed_at and obj.reviewed_digest == answer_digest(obj))

    class Meta:
        model = ReusableAnswer
        exclude = ["owner"]
        read_only_fields = ["id", "revision", "reviewed_at", "reviewed_digest", "created_at", "updated_at"]

    def validate(self, data):
        for field in ("title", "question", "body"):
            if field in data and not data[field].strip():
                raise serializers.ValidationError({field: "Enter text for this field."})
        return data


class ReusableAnswerViewSet(PrivateMixin, viewsets.ModelViewSet):
    serializer_class = AnswerSerializer
    pagination_class = WorkflowPagination
    http_method_names = ["get", "post", "patch", "head", "options"]
    filter_backends = []

    def get_queryset(self):
        rows = ReusableAnswer.objects.filter(owner=self.request.user)
        query = self.request.query_params.get("q", "").strip()[:160]
        if query:
            rows = rows.filter(Q(title__icontains=query) | Q(question__icontains=query) | Q(body__icontains=query))
        category = self.request.query_params.get("category")
        if category:
            if category not in dict(ReusableAnswer.CATEGORIES):
                raise ValidationError({"category": "Choose a valid category."})
            rows = rows.filter(category=category)
        for field in ("archived", "reviewed"):
            value = self.request.query_params.get(field)
            if value is not None:
                if value not in ("true", "false"):
                    raise ValidationError({field: "Use true or false."})
                if field == "archived":
                    rows = rows.filter(is_archived=value == "true")
                elif value == "true":
                    rows = rows.filter(is_archived=False, reviewed_at__isnull=False).exclude(reviewed_digest="")
                else:
                    rows = rows.filter(Q(reviewed_at__isnull=True) | Q(reviewed_digest="") | Q(is_archived=True))
        return rows

    def perform_create(self, serializer):
        serializer.validated_data.pop("expected_revision", None)
        serializer.save(owner=self.request.user)

    @transaction.atomic
    def perform_update(self, serializer):
        record = ReusableAnswer.objects.select_for_update().get(pk=serializer.instance.pk, owner=self.request.user)
        expected = serializer.validated_data.pop("expected_revision", None)
        if expected != record.revision:
            raise ReviewConflict("This answer changed in another tab. Refresh before saving.")
        changed = any(field in serializer.validated_data and serializer.validated_data[field] != getattr(record, field) for field in ("question", "category", "body", "is_archived"))
        serializer.instance = record
        updates = {"revision": record.revision + 1}
        if changed:
            updates.update(reviewed_at=None, reviewed_digest="")
        serializer.save(**updates)

    @action(detail=True, methods=["post"])
    @transaction.atomic
    def review(self, request, pk=None):
        scoped = self.get_object()
        record = ReusableAnswer.objects.select_for_update().get(pk=scoped.pk, owner=request.user)
        expected = serializers.IntegerField(min_value=1).run_validation(request.data.get("expected_revision"))
        if record.revision != expected:
            raise ReviewConflict("This answer changed. Read the latest text before marking it reviewed.")
        if record.is_archived:
            raise ValidationError("Restore the answer before reviewing it.")
        record.reviewed_at, record.reviewed_digest = timezone.now(), answer_digest(record)
        record.revision += 1
        record.save()
        return Response(self.get_serializer(record).data)
