from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("client_workflow", "0001_initial")]

    operations = [
        migrations.AddField(model_name="projectdocument", name="share_token", field=models.CharField(blank=True, max_length=96, null=True, unique=True)),
        migrations.AddField(model_name="projectdocument", name="published_title", field=models.CharField(blank=True, max_length=160, null=True)),
        migrations.AddField(model_name="projectdocument", name="published_body", field=models.TextField(blank=True, null=True)),
        migrations.AddField(model_name="projectdocument", name="published_at", field=models.DateTimeField(blank=True, null=True)),
        migrations.AddField(model_name="projectdocument", name="share_expires_at", field=models.DateTimeField(blank=True, null=True)),
    ]
