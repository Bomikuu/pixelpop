from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("finance", "0011_asset_financing"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="NutritionProfile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("height_cm", models.DecimalField(blank=True, decimal_places=1, max_digits=5, null=True, validators=[MinValueValidator(Decimal("0.01"))])),
                ("daily_target_kcal", models.DecimalField(blank=True, decimal_places=2, max_digits=8, null=True, validators=[MinValueValidator(Decimal("0.01"))])),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="nutrition_profile", to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name="WeightEntry",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("date", models.DateField(db_index=True)),
                ("weight_kg", models.DecimalField(decimal_places=2, max_digits=6, validators=[MinValueValidator(Decimal("0.01"))])),
                ("note", models.CharField(blank=True, max_length=500)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="nutrition_weights", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-date", "-id"]},
        ),
        migrations.CreateModel(
            name="Meal",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("date", models.DateField(db_index=True)),
                ("meal_name", models.CharField(max_length=160)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="nutrition_meals", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-date", "-created_at", "-id"]},
        ),
        migrations.CreateModel(
            name="MealItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("position", models.PositiveSmallIntegerField()),
                ("name", models.CharField(max_length=160)),
                ("amount", models.DecimalField(decimal_places=3, max_digits=12, validators=[MinValueValidator(Decimal("0.001"))])),
                ("unit", models.CharField(max_length=24)),
                ("calories", models.DecimalField(decimal_places=2, max_digits=10, validators=[MinValueValidator(Decimal("0"))])),
                ("protein", models.DecimalField(decimal_places=2, max_digits=10, validators=[MinValueValidator(Decimal("0"))])),
                ("carbs", models.DecimalField(decimal_places=2, max_digits=10, validators=[MinValueValidator(Decimal("0"))])),
                ("fat", models.DecimalField(decimal_places=2, max_digits=10, validators=[MinValueValidator(Decimal("0"))])),
                ("meal", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="items", to="finance.meal")),
            ],
            options={"ordering": ["position", "id"]},
        ),
        migrations.AddConstraint(
            model_name="weightentry",
            constraint=models.UniqueConstraint(fields=("user", "date"), name="finance_nutrition_weight_user_date"),
        ),
        migrations.AddConstraint(
            model_name="mealitem",
            constraint=models.UniqueConstraint(fields=("meal", "position"), name="finance_nutrition_item_position"),
        ),
    ]
