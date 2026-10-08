from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("job_applications", "0003_application_timeline")]
    operations = [
        migrations.AddField(model_name="applicationaisettings", name="monthly_budget_usd", field=models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)),
        migrations.AddField(model_name="applicationaisettings", name="version", field=models.PositiveIntegerField(default=1)),
        migrations.AddField(model_name="generationrun", name="quote_snapshot", field=models.JSONField(default=dict, blank=True)),
        migrations.AddField(model_name="generationrun", name="quoted_cost_usd", field=models.DecimalField(max_digits=12, decimal_places=6, null=True)),
        migrations.AddField(model_name="generationrun", name="reconciled_cost_usd", field=models.DecimalField(max_digits=12, decimal_places=6, null=True)),
        migrations.AddField(model_name="generationrun", name="reconciled_at", field=models.DateTimeField(null=True, blank=True)),
        migrations.AddField(model_name="generationrun", name="reconciliation_note", field=models.TextField(max_length=2000, blank=True)),
        migrations.AddField(model_name="generationrun", name="cost_version", field=models.PositiveIntegerField(default=1)),
    ]
