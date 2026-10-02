from django.db import models


class ProjectStage(models.Model):
    class Status(models.TextChoices):
        NOT_STARTED = "not_started", "Not started"
        IN_PROGRESS = "in_progress", "In progress"
        WAITING_ON_CLIENT = "waiting_on_client", "Waiting on client"
        COMPLETE = "complete", "Complete"

    project = models.ForeignKey("client_workflow.Project", on_delete=models.CASCADE, related_name="stages")
    key = models.CharField(max_length=20)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NOT_STARTED)
    notes = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("id",)
        constraints = [models.UniqueConstraint(fields=("project", "key"), name="unique_client_project_stage")]


class ChecklistItem(models.Model):
    stage = models.ForeignKey(ProjectStage, on_delete=models.CASCADE, related_name="items")
    label = models.CharField(max_length=300)
    position = models.PositiveSmallIntegerField(default=0)
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("position", "id")
