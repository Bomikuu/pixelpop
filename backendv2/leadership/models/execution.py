import uuid

from django.db import models


ACTION_STATUSES = [
    ("not_started", "Not started"), ("in_progress", "In progress"),
    ("blocked", "Blocked"), ("completed", "Completed"),
    ("delegated", "Delegated"), ("moved", "Moved"),
]


class WeeklyAction(models.Model):
    plan = models.ForeignKey("leadership.LeadershipPlan", on_delete=models.CASCADE, related_name="actions")
    lineage_id = models.UUIDField(default=uuid.uuid4, editable=False, db_index=True)
    source_action = models.OneToOneField("self", null=True, blank=True, on_delete=models.SET_NULL, related_name="follow_up")
    planned_week = models.PositiveSmallIntegerField()
    current_week = models.PositiveSmallIntegerField()
    phase = models.PositiveSmallIntegerField()
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    owner = models.ForeignKey("leadership.TeamMember", null=True, blank=True, on_delete=models.SET_NULL, related_name="actions")
    due_date = models.DateField(null=True, blank=True)
    priority = models.CharField(max_length=8, choices=[("low", "Low"), ("medium", "Medium"), ("high", "High")], default="medium")
    status = models.CharField(max_length=16, choices=ACTION_STATUSES, default="not_started")
    notes = models.TextField(blank=True)
    evidence_urls = models.JSONField(default=list, blank=True)
    leadership_result = models.TextField(blank=True)
    seeded = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["current_week", "-priority", "id"]
        indexes = [models.Index(fields=["plan", "current_week", "status"])]


class TeamGoal(models.Model):
    plan = models.ForeignKey("leadership.LeadershipPlan", on_delete=models.CASCADE, related_name="goals")
    week = models.PositiveSmallIntegerField()
    title = models.CharField(max_length=200)
    outcome = models.TextField(blank=True)
    success_measure = models.CharField(max_length=240, blank=True)
    owner = models.ForeignKey("leadership.TeamMember", null=True, blank=True, on_delete=models.SET_NULL)
    is_primary = models.BooleanField(default=False)
    linked_actions = models.ManyToManyField(WeeklyAction, blank=True, related_name="goals")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class WeeklyLeadershipReview(models.Model):
    plan = models.ForeignKey("leadership.LeadershipPlan", on_delete=models.CASCADE, related_name="weekly_reviews")
    week = models.PositiveSmallIntegerField()
    improved = models.TextField(blank=True)
    adopted = models.TextField(blank=True)
    did_not_work = models.TextField(blank=True)
    should_delegate = models.TextField(blank=True)
    became_independent = models.TextField(blank=True)
    process_change = models.TextField(blank=True)
    promotion_evidence = models.TextField(blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["plan", "week"], name="one_leadership_review_per_week")]
