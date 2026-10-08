from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [("job_applications", "0005_reusable_answers"), ("client_workflow", "0002_document_publication")]
    operations = [
        migrations.AddField(model_name="jobapplication", name="linked_project", field=models.OneToOneField(on_delete=django.db.models.deletion.SET_NULL, to="client_workflow.project", null=True, blank=True, related_name="source_application")),
        migrations.AddField(model_name="jobapplication", name="converted_at", field=models.DateTimeField(null=True, blank=True)),
    ]
