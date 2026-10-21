from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [("finance", "0031_subscriptions_utilities"), migrations.swappable_dependency(settings.AUTH_USER_MODEL)]
    operations = [
        migrations.AddField(model_name="nutritionprofile", name="target_weight_kg", field=models.DecimalField(blank=True, decimal_places=2, max_digits=6, null=True, validators=[MinValueValidator(Decimal("0.01"))])),
        migrations.CreateModel(name="MealPreset", fields=[
            ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
            ("meal_name", models.CharField(max_length=160)),
            ("created_at", models.DateTimeField(auto_now_add=True)),
            ("updated_at", models.DateTimeField(auto_now=True)),
            ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="nutrition_presets", to=settings.AUTH_USER_MODEL)),
        ], options={"ordering": ["-updated_at", "-id"]}),
        migrations.CreateModel(name="MealPresetItem", fields=[
            ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
            ("position", models.PositiveSmallIntegerField()),
            ("name", models.CharField(max_length=160)),
            ("amount", models.DecimalField(decimal_places=3, max_digits=12, validators=[MinValueValidator(Decimal("0.001"))])),
            ("unit", models.CharField(max_length=24)),
            ("calories", models.DecimalField(decimal_places=2, max_digits=10, validators=[MinValueValidator(Decimal("0"))])),
            ("protein", models.DecimalField(decimal_places=2, max_digits=10, validators=[MinValueValidator(Decimal("0"))])),
            ("carbs", models.DecimalField(decimal_places=2, max_digits=10, validators=[MinValueValidator(Decimal("0"))])),
            ("fat", models.DecimalField(decimal_places=2, max_digits=10, validators=[MinValueValidator(Decimal("0"))])),
            ("preset", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="items", to="finance.mealpreset")),
        ], options={"ordering": ["position", "id"], "constraints": [models.UniqueConstraint(fields=("preset", "position"), name="finance_nutrition_preset_position")]}),
        migrations.CreateModel(name="NutritionMealSave", fields=[
            ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
            ("request_id", models.UUIDField()),
            ("signature", models.CharField(max_length=64)),
            ("created_at", models.DateTimeField(auto_now_add=True)),
            ("meal", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to="finance.meal")),
            ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
        ], options={"constraints": [models.UniqueConstraint(fields=("user", "request_id"), name="finance_nutrition_save_request")]}),
    ]
