from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("finance", "0013_meal_eaten_at"),
    ]

    operations = [
        migrations.AddField(
            model_name="nutritionprofile",
            name="daily_target_protein_g",
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=8, null=True, validators=[MinValueValidator(Decimal("0.01"))]),
        ),
        migrations.AddField(
            model_name="nutritionprofile",
            name="daily_target_carbs_g",
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=8, null=True, validators=[MinValueValidator(Decimal("0.01"))]),
        ),
        migrations.AddField(
            model_name="nutritionprofile",
            name="daily_target_fat_g",
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=8, null=True, validators=[MinValueValidator(Decimal("0.01"))]),
        ),
    ]
