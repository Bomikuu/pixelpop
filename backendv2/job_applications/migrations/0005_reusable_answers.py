from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [("job_applications", "0004_application_ai_budget"), migrations.swappable_dependency(settings.AUTH_USER_MODEL)]
    operations = [migrations.CreateModel(name="ReusableAnswer", fields=[
        ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
        ("title", models.CharField(max_length=160)),
        ("question", models.TextField(max_length=2000)),
        ("category", models.CharField(max_length=20, default="screening", choices=[(v, v.title()) for v in ("availability", "rates", "experience", "screening", "other")])),
        ("body", models.TextField(max_length=8000)),
        ("is_archived", models.BooleanField(default=False)),
        ("reviewed_at", models.DateTimeField(null=True, blank=True)),
        ("reviewed_digest", models.CharField(max_length=64, blank=True)),
        ("revision", models.PositiveIntegerField(default=1)),
        ("created_at", models.DateTimeField(auto_now_add=True)),
        ("updated_at", models.DateTimeField(auto_now=True)),
        ("owner", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
    ], options={"ordering": ["-updated_at", "-id"]})]
