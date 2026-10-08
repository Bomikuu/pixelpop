from django.db import transaction
from django.utils import timezone

from client_workflow.models import Client
from client_workflow.services.projects import create_project
from job_applications.models import JobApplication
from .review import ReviewConflict, record_activity


@transaction.atomic
def convert_application(application, owner, validated_data):
    record = JobApplication.objects.select_for_update().get(pk=application.pk, owner=owner)
    if record.converted_at:
        if not record.linked_project_id or record.linked_project.client.owner_id != owner.pk:
            raise ReviewConflict("This application was already converted, but its linked project is unavailable. Review the client records rather than creating another.")
        return record, False
    client = validated_data.get("client_id")
    if client:
        client = Client.objects.select_for_update().filter(pk=client.pk, owner=owner, is_archived=False).first()
        if not client:
            raise ReviewConflict("The selected client is no longer available. Choose an active client.")
    else:
        client = Client.objects.create(owner=owner, **validated_data["new_client"])
    project = create_project(owner=owner, client=client, fields=validated_data["project"])
    record.linked_project, record.converted_at = project, timezone.now()
    record.save(update_fields=["linked_project", "converted_at", "updated_at"])
    record_activity(record, "converted", f"Created linked project “{project.title}” for {client.name}.", details={"client_id": client.pk, "project_id": project.pk})
    return record, True
