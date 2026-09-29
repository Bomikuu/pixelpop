import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("leadership", "0002_team_member_self")]

    operations = [
        migrations.CreateModel(
            name="DailyCheckIn",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("date", models.DateField()),
                ("reviewed_pr", models.CharField(blank=True, choices=[("done", "Done"), ("not_done", "Not done"), ("not_applicable", "Not applicable")], default="", max_length=16)),
                ("updated_documentation", models.CharField(blank=True, choices=[("done", "Done"), ("not_done", "Not done"), ("not_applicable", "Not applicable")], default="", max_length=16)),
                ("sent_eod", models.CharField(blank=True, choices=[("done", "Done"), ("not_done", "Not done"), ("not_applicable", "Not applicable")], default="", max_length=16)),
                ("connected_with_person", models.CharField(blank=True, choices=[("done", "Done"), ("not_done", "Not done"), ("not_applicable", "Not applicable")], default="", max_length=16)),
                ("finished_tasks", models.CharField(blank=True, choices=[("done", "Done"), ("not_done", "Not done"), ("not_applicable", "Not applicable")], default="", max_length=16)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("member", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="daily_check_ins", to="leadership.teammember")),
                ("plan", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="daily_check_ins", to="leadership.leadershipplan")),
            ],
            options={"ordering": ["-date", "-id"]},
        ),
        migrations.AddConstraint(
            model_name="dailycheckin",
            constraint=models.UniqueConstraint(fields=("plan", "member", "date"), name="unique_daily_check_in_per_member"),
        ),
    ]
