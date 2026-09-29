from django.db import models


class Process(models.Model):
    plan = models.ForeignKey("leadership.LeadershipPlan", on_delete=models.CASCADE, related_name="processes")
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    created_on = models.DateField(null=True, blank=True)
    owner = models.ForeignKey("leadership.TeamMember", null=True, blank=True, on_delete=models.SET_NULL)
    evidence_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class ProcessObservation(models.Model):
    plan = models.ForeignKey("leadership.LeadershipPlan", on_delete=models.CASCADE, related_name="process_observations")
    process = models.ForeignKey(Process, on_delete=models.CASCADE, related_name="observations")
    week = models.PositiveSmallIntegerField()
    team_using = models.CharField(max_length=12, choices=[("no", "No"), ("partial", "Partial"), ("yes", "Yes")], default="no")
    checked = models.PositiveIntegerField(null=True, blank=True)
    eligible = models.PositiveIntegerField(null=True, blank=True)
    status = models.CharField(max_length=16, choices=[("healthy", "Healthy"), ("improving", "Improving"), ("attention", "Needs attention"), ("unmeasured", "Not measured")], default="unmeasured")
    notes = models.TextField(blank=True)
    evidence_url = models.URLField(blank=True)
    recorded_on = models.DateField()

    class Meta:
        constraints = [models.UniqueConstraint(fields=["process", "week"], name="one_process_observation_per_week")]


class MetricDefinition(models.Model):
    plan = models.ForeignKey("leadership.LeadershipPlan", on_delete=models.CASCADE, related_name="metric_definitions")
    name = models.CharField(max_length=160)
    unit = models.CharField(max_length=32, default="count")
    value_type = models.CharField(max_length=12, choices=[("number", "Number"), ("ratio", "Ratio")], default="number")
    desired_direction = models.CharField(max_length=12, choices=[("up", "Up"), ("down", "Down"), ("neutral", "Neutral")], default="up")
    seeded = models.BooleanField(default=False)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["plan", "name"], name="unique_metric_name_per_plan")]


class MetricEntry(models.Model):
    plan = models.ForeignKey("leadership.LeadershipPlan", on_delete=models.CASCADE, related_name="metric_entries")
    definition = models.ForeignKey(MetricDefinition, on_delete=models.CASCADE, related_name="entries")
    week = models.PositiveSmallIntegerField()
    value = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    numerator = models.PositiveIntegerField(null=True, blank=True)
    denominator = models.PositiveIntegerField(null=True, blank=True)
    source_url = models.URLField(blank=True)
    movement_note = models.TextField(blank=True)
    next_action = models.TextField(blank=True)
    action = models.ForeignKey("leadership.WeeklyAction", null=True, blank=True, on_delete=models.SET_NULL)
    impact_note = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["definition", "week"], name="one_metric_entry_per_week")]


class QualityObservation(models.Model):
    plan = models.ForeignKey("leadership.LeadershipPlan", on_delete=models.CASCADE, related_name="quality_observations")
    indicator = models.CharField(max_length=40)
    week = models.PositiveSmallIntegerField()
    checked = models.PositiveIntegerField(null=True, blank=True)
    eligible = models.PositiveIntegerField(null=True, blank=True)
    target_percent = models.PositiveSmallIntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)
    evidence_url = models.URLField(blank=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["plan", "indicator", "week"], name="one_quality_observation_per_week")]


class PRReview(models.Model):
    plan = models.ForeignKey("leadership.LeadershipPlan", on_delete=models.CASCADE, related_name="pr_reviews")
    name = models.CharField(max_length=200)
    pr_url = models.URLField()
    developer = models.ForeignKey("leadership.TeamMember", null=True, blank=True, on_delete=models.SET_NULL, related_name="developed_prs")
    reviewer = models.ForeignKey("leadership.TeamMember", null=True, blank=True, on_delete=models.SET_NULL, related_name="reviewed_prs")
    outcome = models.CharField(max_length=160, blank=True)
    coaching_note = models.TextField(blank=True)
    reviewed_on = models.DateField()


class WeeklyReport(models.Model):
    plan = models.ForeignKey("leadership.LeadershipPlan", on_delete=models.CASCADE, related_name="weekly_reports")
    week = models.PositiveSmallIntegerField()
    report_date = models.DateField(null=True, blank=True)
    checklist = models.JSONField(default=dict, blank=True)
    wins = models.TextField(blank=True)
    metrics = models.TextField(blank=True)
    changed = models.TextField(blank=True)
    learned = models.TextField(blank=True)
    next_actions = models.TextField(blank=True)
    slack_url = models.URLField(blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["plan", "week"], name="one_weekly_report_per_week")]
