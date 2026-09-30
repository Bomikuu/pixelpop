from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("finance", "0021_audit_event")]

    operations = [
        migrations.AddField(
            model_name="deadline",
            name="priority",
            field=models.CharField(choices=[("high", "High"), ("medium", "Medium"), ("low", "Low")], default="medium", max_length=10),
        ),
        migrations.AlterField(
            model_name="deadline",
            name="due_date",
            field=models.DateField(blank=True, db_index=True, null=True),
        ),
        migrations.AddConstraint(
            model_name="deadline",
            constraint=models.CheckConstraint(condition=models.Q(due_date__isnull=False) | models.Q(kind__in=["task", "reminder"]), name="finance_deadline_undated_task_only"),
        ),
    ]
