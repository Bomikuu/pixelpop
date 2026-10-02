import datetime

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("finance", "0022_deadline_optional_date_priority")]

    operations = [
        migrations.AddField(model_name="deadline", name="important", field=models.BooleanField(default=False)),
        migrations.AddField(model_name="recurringschedule", name="important", field=models.BooleanField(default=False)),
        migrations.AddField(model_name="recurringschedule", name="system_key", field=models.CharField(blank=True, max_length=40, null=True)),
        migrations.AddField(model_name="workspacesettings", name="reminder_strict_mode", field=models.BooleanField(default=False)),
        migrations.AddField(model_name="workspacesettings", name="reminder_interval_hours", field=models.PositiveSmallIntegerField(default=1, validators=[MinValueValidator(1), MaxValueValidator(24)])),
        migrations.AddField(model_name="workspacesettings", name="reminder_start_time", field=models.TimeField(default=datetime.time(9, 0))),
        migrations.AddField(model_name="workspacesettings", name="reminder_end_time", field=models.TimeField(default=datetime.time(0, 0))),
        migrations.AddConstraint(model_name="recurringschedule", constraint=models.UniqueConstraint(condition=models.Q(system_key__isnull=False), fields=("created_by", "system_key"), name="finance_schedule_user_system_key")),
    ]
