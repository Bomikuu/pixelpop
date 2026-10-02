from django.db import transaction

from client_workflow.models import (
    ChecklistItem, Client, MasterTemplate, Project, ProjectDocument, ProjectStage,
)
from .defaults import DEFAULT_CHECKLIST, DEFAULT_TEMPLATES, STAGES


def ensure_master_templates(owner):
    templates = {}
    for kind, (title, body) in DEFAULT_TEMPLATES.items():
        template, _ = MasterTemplate.objects.get_or_create(
            owner=owner, kind=kind, defaults={"title": title, "body": body},
        )
        templates[kind] = template
    return templates


@transaction.atomic
def create_project(*, owner, client, fields):
    owned_client = Client.objects.get(pk=client.pk, owner=owner)
    templates = ensure_master_templates(owner)
    project = Project.objects.create(client=owned_client, current_stage="inquiry", **fields)
    stages = {}
    for key, _label, _description in STAGES:
        stages[key] = ProjectStage.objects.create(project=project, key=key)
    ChecklistItem.objects.bulk_create([
        ChecklistItem(stage=stages[key], label=label, position=position)
        for key, labels in DEFAULT_CHECKLIST.items()
        for position, label in enumerate(labels)
    ])
    ProjectDocument.objects.bulk_create([
        ProjectDocument(project=project, kind=kind, title=template.title, body=template.body)
        for kind, template in templates.items()
    ])
    return project
