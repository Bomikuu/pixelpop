from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("finance", "0014_nutrition_macro_targets")]

    operations = [
        migrations.AddField(
            model_name="account",
            name="card_network",
            field=models.CharField(blank=True, choices=[("mastercard", "Mastercard"), ("visa", "Visa"), ("amex", "American Express"), ("jcb", "JCB"), ("unionpay", "UnionPay"), ("discover", "Discover"), ("maestro", "Maestro")], default="", max_length=20),
        ),
    ]
