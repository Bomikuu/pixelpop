from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("finance", "0003_remove_transaction_finance_income_occurrence_and_more")]
    operations = [
        migrations.AlterField(
            model_name="asset", name="kind",
            field=models.CharField(max_length=20, default="other", choices=[("house", "House"), ("condo", "Condominium"), ("land", "Land"), ("car", "Car"), ("motorcycle", "Motorcycle"), ("investment", "Investments"), ("jewelry", "Jewelry / valuables"), ("business", "Business interest"), ("equipment", "Equipment"), ("other", "Other")]),
        ),
    ]
