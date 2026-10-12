from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("finance", "0027_cash_loan_deadline_links")]

    operations = [
        migrations.AddField(
            model_name="asset", name="image_blob",
            field=models.BinaryField(blank=True, editable=False, null=True),
        ),
        migrations.AddField(
            model_name="asset", name="image_hash",
            field=models.CharField(blank=True, editable=False, max_length=64),
        ),
    ]
