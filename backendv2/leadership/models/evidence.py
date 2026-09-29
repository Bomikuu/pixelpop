from django.db import models


COMPETENCIES = [
    ("coaching", "Coaching"), ("delegation", "Delegation"),
    ("team_process", "Team Process"), ("feedback_loop", "Feedback Loop"),
    ("code_review", "Code Review"), ("documentation", "Documentation"),
    ("strategic_alignment", "Strategic Alignment"), ("metrics", "Metrics"),
    ("cross_team_collaboration", "Cross-Team Collaboration"),
    ("team_development", "Team Development"),
    ("servant_leadership", "Servant Leadership"),
    ("continuous_improvement", "Continuous Improvement"),
]

HEALTH_CATEGORIES = [
    ("process", "Process"), ("coaching", "Coaching"), ("delegation", "Delegation"),
    ("measurement", "Measurement"), ("documentation", "Documentation"),
    ("communication", "Communication"), ("team_independence", "Team Independence"),
]


class LeadershipEvidence(models.Model):
    plan = models.ForeignKey("leadership.LeadershipPlan", on_delete=models.CASCADE, related_name="evidence_items")
    date = models.DateField()
    competency = models.CharField(max_length=32, choices=COMPETENCIES)
    problem = models.TextField()
    action = models.TextField()
    result = models.TextField(blank=True)
    evidence_url = models.URLField(blank=True)
    affected = models.CharField(max_length=200, blank=True)
    weekly_action = models.ForeignKey("leadership.WeeklyAction", null=True, blank=True, on_delete=models.SET_NULL)
    process = models.ForeignKey("leadership.Process", null=True, blank=True, on_delete=models.SET_NULL)
    delegation = models.ForeignKey("leadership.Delegation", null=True, blank=True, on_delete=models.SET_NULL)
    metric_entry = models.ForeignKey("leadership.MetricEntry", null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)


class LeadershipHealthAssessment(models.Model):
    plan = models.ForeignKey("leadership.LeadershipPlan", on_delete=models.CASCADE, related_name="health_assessments")
    category = models.CharField(max_length=24, choices=HEALTH_CATEGORIES)
    level = models.CharField(max_length=24, choices=[("strong", "Strong Evidence"), ("some", "Some Evidence"), ("needs_more", "Needs More Evidence"), ("not_started", "Not Started")], default="not_started")
    rationale = models.TextField(blank=True)
    evidence = models.ManyToManyField(LeadershipEvidence, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["plan", "category"], name="one_health_assessment_per_category")]


class MonthlyReflection(models.Model):
    plan = models.ForeignKey("leadership.LeadershipPlan", on_delete=models.CASCADE, related_name="reflections")
    month = models.CharField(max_length=7)
    answers = models.JSONField(default=dict)
    notes = models.JSONField(default=dict)
    submitted_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["plan", "month"], name="one_leadership_reflection_per_month")]
