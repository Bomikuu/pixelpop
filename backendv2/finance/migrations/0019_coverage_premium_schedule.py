from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [("finance", "0018_coverage_premium_transactions")]

    operations = [
        migrations.AddField(
            model_name="recurringschedule",
            name="coverage",
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="premium_schedule",
                to="finance.account",
            ),
        ),
    ]
