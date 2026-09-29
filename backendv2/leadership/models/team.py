from django.db import models
from django.db.models import Q


class TeamMember(models.Model):
    plan = models.ForeignKey("leadership.LeadershipPlan", on_delete=models.CASCADE, related_name="members")
    name = models.CharField(max_length=120)
    role = models.CharField(max_length=120, blank=True)
    strengths = models.TextField(blank=True)
    developing = models.TextField(blank=True)
    ownership_opportunity = models.TextField(blank=True)
    is_self = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name", "id"]
        constraints = [
            models.UniqueConstraint(fields=["plan", "name"], name="unique_team_member_per_plan"),
            models.UniqueConstraint(fields=["plan"], condition=Q(is_self=True), name="unique_self_member_per_plan"),
        ]

    def __str__(self):
        return self.name


class Delegation(models.Model):
    plan = models.ForeignKey("leadership.LeadershipPlan", on_delete=models.CASCADE, related_name="delegations")
    title = models.CharField(max_length=200)
    original_owner = models.ForeignKey(TeamMember, null=True, blank=True, on_delete=models.SET_NULL, related_name="original_delegations")
    new_owner = models.ForeignKey(TeamMember, on_delete=models.PROTECT, related_name="new_delegations")
    my_role = models.CharField(max_length=120, blank=True)
    milestones = models.JSONField(default=list, blank=True)
    progress = models.PositiveSmallIntegerField(default=0)
    took_work_back = models.BooleanField(default=False)
    took_work_back_note = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    evidence_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class KnowledgeItem(models.Model):
    plan = models.ForeignKey("leadership.LeadershipPlan", on_delete=models.CASCADE, related_name="knowledge_items")
    title = models.CharField(max_length=200)
    original_owner = models.ForeignKey(TeamMember, null=True, blank=True, on_delete=models.SET_NULL, related_name="owned_knowledge")
    documentation_status = models.CharField(max_length=12, choices=[("none", "No"), ("partial", "Partial"), ("documented", "Yes")], default="none")
    documentation_url = models.URLField(blank=True)
    backup_owner = models.ForeignKey(TeamMember, null=True, blank=True, on_delete=models.SET_NULL, related_name="backup_knowledge")
    backup_tested = models.BooleanField(default=False)
    important = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)


class ContinuityCheck(models.Model):
    plan = models.ForeignKey("leadership.LeadershipPlan", on_delete=models.CASCADE, related_name="continuity_checks")
    recorded_on = models.DateField()
    answer = models.CharField(max_length=10, choices=[("yes", "Yes"), ("partially", "Partially"), ("no", "No")])
    dependencies = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class FrictionItem(models.Model):
    plan = models.ForeignKey("leadership.LeadershipPlan", on_delete=models.CASCADE, related_name="friction_items")
    friction = models.CharField(max_length=240)
    frequency = models.CharField(max_length=120, blank=True)
    impact = models.CharField(max_length=12, choices=[("low", "Low"), ("medium", "Medium"), ("high", "High")], default="medium")
    proposed_improvement = models.TextField(blank=True)
    owner = models.ForeignKey(TeamMember, null=True, blank=True, on_delete=models.SET_NULL)
    status = models.CharField(max_length=16, choices=[("open", "Open"), ("trying", "Trying"), ("resolved", "Resolved")], default="open")
    result = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)
