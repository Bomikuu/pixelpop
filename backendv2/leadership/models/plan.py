from django.conf import settings
from django.db import models
from django.db.models import Q


class LeadershipPlan(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="leadership_plans")
    team_name = models.CharField(max_length=120)
    start_date = models.DateField()
    status = models.CharField(max_length=12, choices=[("active", "Active"), ("archived", "Archived")], default="active")
    template_version = models.PositiveSmallIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["owner"], condition=Q(status="active"), name="one_active_leadership_plan_per_owner")]

    def __str__(self):
        return f"{self.team_name} · {self.owner_id}"
