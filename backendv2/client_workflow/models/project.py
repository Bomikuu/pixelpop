from django.db import models


class Project(models.Model):
    class State(models.TextChoices):
        LEAD = "lead", "Lead"
        ACTIVE = "active", "Active"
        ON_HOLD = "on_hold", "On hold"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    client = models.ForeignKey("client_workflow.Client", on_delete=models.PROTECT, related_name="projects")
    title = models.CharField(max_length=200)
    summary = models.TextField(blank=True)
    state = models.CharField(max_length=12, choices=State.choices, default=State.LEAD)
    current_stage = models.CharField(max_length=20, default="inquiry")
    country = models.CharField(max_length=100, blank=True)
    currency = models.CharField(max_length=3, default="USD")
    governing_law = models.CharField(max_length=160, blank=True)
    quoted_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    started_on = models.DateField(null=True, blank=True)
    target_on = models.DateField(null=True, blank=True)
    support_starts_on = models.DateField(null=True, blank=True)
    support_ends_on = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-updated_at", "-id")

    def __str__(self):
        return self.title
