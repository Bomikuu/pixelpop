from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("job_applications", "0002_application_review")]
    operations = [migrations.AddField(model_name="applicationactivity", name="details", field=models.JSONField(default=dict, blank=True))]
