from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [("job_applications", "0006_application_client_link")]
    operations = [
        migrations.CreateModel(
            name="ApplicationRequirementDecision",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("requirement_key", models.CharField(max_length=64)),
                ("requirement", models.TextField(max_length=2000)),
                ("posting_excerpt", models.TextField(blank=True, max_length=2000)),
                ("importance", models.CharField(max_length=20)),
                ("decision", models.CharField(choices=[("needs_review", "Needs review"), ("evidence_added", "Evidence added"), ("not_met", "Not met")], default="needs_review", max_length=20)),
                ("note", models.TextField(blank=True, max_length=4000)),
                ("source_digest", models.CharField(max_length=64)),
                ("version", models.PositiveIntegerField(default=1)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("application", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="requirement_decisions", to="job_applications.jobapplication")),
            ],
            options={"constraints": [models.UniqueConstraint(fields=("application", "requirement_key"), name="job_requirement_decision_unique")]},
        ),
        migrations.CreateModel(
            name="ApplicationSubmissionReview",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("checks", models.JSONField(blank=True, default=dict)),
                ("review_digest", models.CharField(max_length=64)),
                ("version", models.PositiveIntegerField(default=1)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("application", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="submission_review", to="job_applications.jobapplication")),
            ],
        ),
        migrations.AlterField(model_name="applicationartifact", name="kind", field=models.CharField(max_length=20, choices=[("assessment", "Fit assessment"), ("resume", "Tailored résumé"), ("cover_letter", "Cover letter"), ("answers", "Screening answers"), ("interview_prep", "Interview preparation")])),
    ]
