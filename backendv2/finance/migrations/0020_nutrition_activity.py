from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("finance", "0019_coverage_premium_schedule"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="NutritionActivity",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("date", models.DateField(db_index=True)),
                ("activity_type", models.CharField(max_length=24)),
                ("name", models.CharField(max_length=120)),
                ("steps", models.PositiveIntegerField(blank=True, null=True)),
                ("duration_minutes", models.DecimalField(blank=True, decimal_places=2, max_digits=7, null=True)),
                ("duration_assumed", models.BooleanField(default=False)),
                ("active_kcal", models.DecimalField(decimal_places=2, max_digits=9, validators=[MinValueValidator(Decimal("0.01"))])),
                ("source", models.CharField(choices=[("estimated", "Estimated"), ("manual", "Manual")], max_length=12)),
                ("manual_override", models.BooleanField(default=False)),
                ("weight_kg_used", models.DecimalField(blank=True, decimal_places=2, max_digits=6, null=True)),
                ("met_used", models.DecimalField(blank=True, decimal_places=1, max_digits=4, null=True)),
                ("estimate_version", models.CharField(blank=True, max_length=24)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="nutrition_activities", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-date", "-created_at", "-id"]},
        ),
    ]
