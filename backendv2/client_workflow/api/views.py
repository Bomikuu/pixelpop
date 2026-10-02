from django.db.models import Count, Q
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from client_workflow.models import (
    ChangeRequest, ChecklistItem, Client, MasterTemplate, PaymentMilestone,
    Project, ProjectDocument, ProjectStage,
)
from client_workflow.services.projects import create_project, ensure_master_templates
from .base import PrivateWorkflowViewSet, scoped_id
from .serializers import (
    ChangeRequestSerializer, ChecklistItemSerializer, ClientSerializer,
    MasterTemplateSerializer, PaymentMilestoneSerializer, ProjectDocumentSerializer,
    ProjectSerializer, StageSerializer,
)


class ClientViewSet(PrivateWorkflowViewSet):
    serializer_class = ClientSerializer

    def get_queryset(self):
        queryset = Client.objects.filter(owner=self.request.user).annotate(project_count=Count("projects"))
        if self.action == "list":
            archived = self.request.query_params.get("archived", "false")
            if archived not in ("true", "false"):
                raise ValidationError({"archived": "Choose true or false."})
            queryset = queryset.filter(is_archived=archived == "true")
            search = self.request.query_params.get("q", "").strip()
            if len(search) > 160:
                raise ValidationError({"q": "Use at most 160 characters."})
            if search:
                queryset = queryset.filter(Q(name__icontains=search) | Q(organization__icontains=search))
        return queryset.order_by("name", "id")

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class ProjectViewSet(PrivateWorkflowViewSet):
    serializer_class = ProjectSerializer

    def get_queryset(self):
        queryset = Project.objects.filter(client__owner=self.request.user).select_related("client")
        client_id = scoped_id(self.request, "client")
        if client_id is not None:
            queryset = queryset.filter(client_id=client_id)
        return queryset.order_by("-updated_at", "-id")

    def perform_create(self, serializer):
        fields = dict(serializer.validated_data)
        client = fields.pop("client")
        fields.pop("current_stage", None)
        serializer.instance = create_project(owner=self.request.user, client=client, fields=fields)


class StageViewSet(PrivateWorkflowViewSet):
    serializer_class = StageSerializer
    http_method_names = ["get", "patch", "head", "options"]

    def get_queryset(self):
        queryset = ProjectStage.objects.filter(project__client__owner=self.request.user)
        project_id = scoped_id(self.request, "project")
        if project_id is not None:
            queryset = queryset.filter(project_id=project_id)
        return queryset.order_by("id")


class ChecklistItemViewSet(PrivateWorkflowViewSet):
    serializer_class = ChecklistItemSerializer

    def get_queryset(self):
        queryset = ChecklistItem.objects.filter(stage__project__client__owner=self.request.user)
        project_id = scoped_id(self.request, "project")
        if project_id is not None:
            queryset = queryset.filter(stage__project_id=project_id)
        return queryset.select_related("stage").order_by("position", "id")


class MasterTemplateViewSet(PrivateWorkflowViewSet):
    serializer_class = MasterTemplateSerializer
    http_method_names = ["get", "patch", "head", "options"]

    def get_queryset(self):
        ensure_master_templates(self.request.user)
        return MasterTemplate.objects.filter(owner=self.request.user).order_by("id")


class ProjectDocumentViewSet(PrivateWorkflowViewSet):
    serializer_class = ProjectDocumentSerializer
    http_method_names = ["get", "patch", "head", "options"]

    def get_queryset(self):
        queryset = ProjectDocument.objects.filter(project__client__owner=self.request.user)
        project_id = scoped_id(self.request, "project")
        if project_id is not None:
            queryset = queryset.filter(project_id=project_id)
        return queryset.order_by("id")


class PaymentMilestoneViewSet(PrivateWorkflowViewSet):
    serializer_class = PaymentMilestoneSerializer

    def get_queryset(self):
        queryset = PaymentMilestone.objects.filter(project__client__owner=self.request.user)
        project_id = scoped_id(self.request, "project")
        if project_id is not None:
            queryset = queryset.filter(project_id=project_id)
        return queryset.order_by("due_on", "id")


class ChangeRequestViewSet(PrivateWorkflowViewSet):
    serializer_class = ChangeRequestSerializer

    def get_queryset(self):
        queryset = ChangeRequest.objects.filter(project__client__owner=self.request.user)
        project_id = scoped_id(self.request, "project")
        if project_id is not None:
            queryset = queryset.filter(project_id=project_id)
        return queryset.order_by("-created_at", "-id")
