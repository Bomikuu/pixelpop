from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [("finance", "0024_reminder_delivery")]
    operations = [
        migrations.AlterField(
            model_name="transaction", name="account",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT,
                                    related_name="transactions", to="finance.account"),
        ),
    ]
