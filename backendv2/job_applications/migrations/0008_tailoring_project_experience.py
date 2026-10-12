from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("job_applications", "0007_application_action_workflow")]

    operations = [
        migrations.AddField(model_name="applicantprofile", name="project_experience", field=models.JSONField(blank=True, default=list)),
        migrations.AddField(model_name="applicationaisettings", name="tailoring_emphasis", field=models.CharField(choices=[("conservative", "Conservative"), ("strong", "Strong")], default="conservative", max_length=20)),
        migrations.AddField(model_name="applicationaisettings", name="unconfirmed_claims", field=models.CharField(choices=[("review_questions", "Review questions"), ("exclude", "Exclude")], default="review_questions", max_length=20)),
    ]
