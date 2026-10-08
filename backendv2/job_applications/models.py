import uuid

from django.conf import settings
from django.db import models


class ApplicantProfile(models.Model):
    owner = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    full_name = models.CharField(max_length=160, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    location = models.CharField(max_length=160, blank=True)
    portfolio_url = models.URLField(blank=True)
    facts = models.TextField(max_length=30000, blank=True)
    resume_text = models.TextField(max_length=30000, blank=True)
    resume_filename = models.CharField(max_length=200, blank=True)
    sources_confirmed = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)


class ApplicationAISettings(models.Model):
    owner = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    provider = models.CharField(max_length=20, default="openai")
    model = models.CharField(max_length=100, default="gpt-6-luna")
    refinement_model = models.CharField(max_length=100, blank=True)
    monthly_budget_usd = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    version = models.PositiveIntegerField(default=1)
    updated_at = models.DateTimeField(auto_now=True)


class JobApplication(models.Model):
    STATUSES = [(value, value.replace("_", " ").title()) for value in
                ("draft", "ready", "applied", "interviewing", "offer", "rejected", "withdrawn")]
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    role = models.CharField(max_length=200)
    company = models.CharField(max_length=200)
    url = models.URLField(max_length=2000, blank=True)
    platform = models.CharField(max_length=100, blank=True)
    posting = models.TextField(max_length=30000)
    questions = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=20, choices=STATUSES, default="draft")
    applied_on = models.DateField(null=True, blank=True)
    follow_up_on = models.DateField(null=True, blank=True)
    linked_project = models.OneToOneField("client_workflow.Project", on_delete=models.SET_NULL, null=True, blank=True, related_name="source_application")
    converted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at", "-id"]


class ApplicationArtifact(models.Model):
    KINDS = [("assessment", "Fit assessment"), ("resume", "Tailored résumé"),
             ("cover_letter", "Cover letter"), ("answers", "Screening answers"),
             ("interview_prep", "Interview preparation")]
    application = models.ForeignKey(JobApplication, on_delete=models.CASCADE, related_name="artifacts")
    kind = models.CharField(max_length=20, choices=KINDS)
    body = models.TextField(max_length=30000, blank=True)
    warnings = models.JSONField(default=list, blank=True)
    evidence = models.JSONField(default=list, blank=True)
    revision = models.PositiveIntegerField(default=0)
    edited = models.BooleanField(default=False)
    provider = models.CharField(max_length=20, blank=True)
    model = models.CharField(max_length=100, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_digest = models.CharField(max_length=64, blank=True)
    requirements = models.JSONField(default=list, blank=True)
    assessment_digest = models.CharField(max_length=64, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["application", "kind"], name="job_artifact_kind_unique")]


class ArtifactRevision(models.Model):
    artifact = models.ForeignKey(ApplicationArtifact, on_delete=models.CASCADE, related_name="revisions")
    revision = models.PositiveIntegerField()
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-revision"]
        constraints = [models.UniqueConstraint(fields=["artifact", "revision"], name="job_artifact_revision_unique")]


class ApplicationRequirementDecision(models.Model):
    DECISIONS = [("needs_review", "Needs review"), ("evidence_added", "Evidence added"), ("not_met", "Not met")]
    application = models.ForeignKey(JobApplication, on_delete=models.CASCADE, related_name="requirement_decisions")
    requirement_key = models.CharField(max_length=64)
    requirement = models.TextField(max_length=2000)
    posting_excerpt = models.TextField(max_length=2000, blank=True)
    importance = models.CharField(max_length=20)
    decision = models.CharField(max_length=20, choices=DECISIONS, default="needs_review")
    note = models.TextField(max_length=4000, blank=True)
    source_digest = models.CharField(max_length=64)
    version = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["application", "requirement_key"], name="job_requirement_decision_unique")]


class ApplicationSubmissionReview(models.Model):
    application = models.OneToOneField(JobApplication, on_delete=models.CASCADE, related_name="submission_review")
    checks = models.JSONField(default=dict, blank=True)
    review_digest = models.CharField(max_length=64)
    version = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class ApplicationActivity(models.Model):
    application = models.ForeignKey(JobApplication, on_delete=models.CASCADE, related_name="activities")
    kind = models.CharField(max_length=30, default="note")
    message = models.TextField(max_length=8000)
    occurred_on = models.DateField()
    details = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-occurred_on", "-created_at"]


class GenerationRun(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.ForeignKey(JobApplication, on_delete=models.CASCADE, related_name="generations")
    kind = models.CharField(max_length=20)
    mode = models.CharField(max_length=10, default="routine")
    provider = models.CharField(max_length=20)
    model = models.CharField(max_length=100)
    status = models.CharField(max_length=20, default="running")
    result = models.JSONField(default=dict, blank=True)
    input_tokens = models.PositiveIntegerField(null=True)
    output_tokens = models.PositiveIntegerField(null=True)
    estimated_cost_usd = models.DecimalField(max_digits=12, decimal_places=6, null=True)
    pricing_date = models.DateField(null=True)
    quote_snapshot = models.JSONField(default=dict, blank=True)
    quoted_cost_usd = models.DecimalField(max_digits=12, decimal_places=6, null=True)
    reconciled_cost_usd = models.DecimalField(max_digits=12, decimal_places=6, null=True)
    reconciled_at = models.DateTimeField(null=True, blank=True)
    reconciliation_note = models.TextField(max_length=2000, blank=True)
    cost_version = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class DraftProposal(models.Model):
    artifact = models.ForeignKey(ApplicationArtifact, on_delete=models.CASCADE, related_name="proposals")
    generation = models.OneToOneField(GenerationRun, on_delete=models.CASCADE, related_name="proposal")
    base_revision = models.PositiveIntegerField()
    source_digest = models.CharField(max_length=64)
    original_body = models.TextField(blank=True)
    source_reference = models.BooleanField(default=False)
    sections = models.JSONField(default=list)
    version = models.PositiveIntegerField(default=1)
    status = models.CharField(max_length=20, choices=[("pending", "Pending"), ("accepted", "Accepted"), ("discarded", "Discarded")], default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at", "-id"]


class ReusableAnswer(models.Model):
    CATEGORIES = [(value, value.title()) for value in ("availability", "rates", "experience", "screening", "other")]
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=160)
    question = models.TextField(max_length=2000)
    category = models.CharField(max_length=20, choices=CATEGORIES, default="screening")
    body = models.TextField(max_length=8000)
    is_archived = models.BooleanField(default=False)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_digest = models.CharField(max_length=64, blank=True)
    revision = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at", "-id"]
