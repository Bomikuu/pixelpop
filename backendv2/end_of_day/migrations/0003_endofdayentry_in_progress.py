from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("end_of_day", "0002_personal_group")]

    operations = [
        migrations.AddField(
            model_name="endofdayentry",
            name="in_progress",
            field=models.JSONField(blank=True, default=list),
        ),
    ]
