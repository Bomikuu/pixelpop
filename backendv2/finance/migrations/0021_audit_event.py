from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("finance", "0020_nutrition_activity"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="AuditEvent",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("actor_label", models.CharField(max_length=150)),
                ("source", models.CharField(default="dashboard", max_length=24)),
                ("action", models.CharField(db_index=True, max_length=32)),
                ("area", models.CharField(db_index=True, max_length=32)),
                ("subject_type", models.CharField(max_length=48)),
                ("subject_id", models.CharField(max_length=64)),
                ("label", models.CharField(max_length=200)),
                ("changes", models.JSONField(default=list)),
                ("operation_key", models.CharField(blank=True, max_length=180, null=True, unique=True)),
                ("actor", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ["-created_at", "-id"],
                "indexes": [models.Index(fields=["area", "created_at"], name="finance_audit_area_date")],
            },
        ),
    ]
