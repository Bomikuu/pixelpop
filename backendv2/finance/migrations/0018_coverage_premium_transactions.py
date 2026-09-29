from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [("finance", "0017_benefit_coverage_types")]

    operations = [
        migrations.AddField(
            model_name="transaction",
            name="coverage",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="premium_payments",
                to="finance.account",
            ),
        ),
    ]
