from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [("job_applications", "0001_initial")]

    operations = [
        migrations.AddField(model_name="applicationartifact", name="reviewed_at", field=models.DateTimeField(blank=True, null=True)),
        migrations.AddField(model_name="applicationartifact", name="reviewed_digest", field=models.CharField(blank=True, max_length=64)),
        migrations.AddField(model_name="applicationartifact", name="requirements", field=models.JSONField(blank=True, default=list)),
        migrations.AddField(model_name="applicationartifact", name="assessment_digest", field=models.CharField(blank=True, max_length=64)),
        migrations.CreateModel(
            name="DraftProposal",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("base_revision", models.PositiveIntegerField()),
                ("source_digest", models.CharField(max_length=64)),
                ("original_body", models.TextField(blank=True)),
                ("source_reference", models.BooleanField(default=False)),
                ("sections", models.JSONField(default=list)),
                ("version", models.PositiveIntegerField(default=1)),
                ("status", models.CharField(choices=[("pending", "Pending"), ("accepted", "Accepted"), ("discarded", "Discarded")], default="pending", max_length=20)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("artifact", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="proposals", to="job_applications.applicationartifact")),
                ("generation", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="proposal", to="job_applications.generationrun")),
            ],
            options={"ordering": ["-created_at", "-id"]},
        ),
    ]
