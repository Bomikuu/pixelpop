from django.conf import settings
from django.db import models


class TemplateKind(models.TextChoices):
    DISCOVERY = "discovery", "Discovery questions"
    RECAP = "recap", "Discovery recap"
    PROPOSAL = "proposal", "Proposal"
    AGREEMENT = "agreement", "Agreement draft"
    ACCESS = "access", "Access request"
    UPDATE = "update", "Progress update"
    HANDOVER = "handover", "Handover checklist"


class MasterTemplate(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="workflow_templates")
    kind = models.CharField(max_length=16, choices=TemplateKind.choices)
    title = models.CharField(max_length=160)
    body = models.TextField()
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("id",)
        constraints = [models.UniqueConstraint(fields=("owner", "kind"), name="unique_workflow_master_template")]


class ProjectDocument(models.Model):
    project = models.ForeignKey("client_workflow.Project", on_delete=models.CASCADE, related_name="documents")
    kind = models.CharField(max_length=16, choices=TemplateKind.choices)
    title = models.CharField(max_length=160)
    body = models.TextField()
    share_token = models.CharField(max_length=96, unique=True, null=True, blank=True)
    published_title = models.CharField(max_length=160, null=True, blank=True)
    published_body = models.TextField(null=True, blank=True)
    published_at = models.DateTimeField(null=True, blank=True)
    share_expires_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("id",)
        constraints = [models.UniqueConstraint(fields=("project", "kind"), name="unique_workflow_project_document")]
