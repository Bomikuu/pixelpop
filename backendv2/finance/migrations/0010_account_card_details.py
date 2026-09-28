from django.core.validators import RegexValidator
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("finance", "0009_shared_bill_receiver")]

    operations = [
        migrations.AddField(
            model_name="account",
            name="last_four",
            field=models.CharField(blank=True, default="", max_length=4, validators=[RegexValidator(r"\A[0-9]{4}\Z", "Enter exactly four digits.")]),
        ),
        migrations.AddField(
            model_name="account",
            name="card_expiry",
            field=models.CharField(blank=True, default="", max_length=5, validators=[RegexValidator(r"\A(?:0[1-9]|1[0-2])/[0-9]{2}\Z", "Use MM/YY, for example 10/28.")]),
        ),
    ]
