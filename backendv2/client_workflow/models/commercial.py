from django.db import models


class PaymentMilestone(models.Model):
    class Status(models.TextChoices):
        PLANNED = "planned", "Planned"
        INVOICED = "invoiced", "Invoiced"
        REPORTED_RECEIVED = "reported_received", "Reported received"

    project = models.ForeignKey("client_workflow.Project", on_delete=models.CASCADE, related_name="payment_milestones")
    description = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    due_on = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PLANNED)
    received_on = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("due_on", "id")


class ChangeRequest(models.Model):
    class Status(models.TextChoices):
        PROPOSED = "proposed", "Proposed"
        APPROVED = "approved", "Approved"
        DECLINED = "declined", "Declined"
        COMPLETED = "completed", "Completed"

    project = models.ForeignKey("client_workflow.Project", on_delete=models.CASCADE, related_name="change_requests")
    description = models.TextField()
    price_impact = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    timeline_impact = models.CharField(max_length=240, blank=True)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PROPOSED)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at", "-id")
