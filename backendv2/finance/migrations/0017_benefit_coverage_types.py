from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("finance", "0016_people_directory")]

    operations = [
        migrations.AlterField(
            model_name="account",
            name="fund_type",
            field=models.CharField(
                blank=True,
                choices=[
                    ("pag_ibig", "Pag-IBIG"),
                    ("mp2", "Pag-IBIG MP2"),
                    ("sss", "SSS"),
                    ("gsis", "GSIS"),
                    ("retirement", "Retirement fund"),
                    ("mutual_fund", "Mutual fund"),
                    ("time_deposit", "Time deposit"),
                    ("investment", "Investment"),
                    ("other", "Other fund"),
                    ("insurance", "Insurance coverage"),
                    ("hmo", "HMO"),
                    ("philhealth", "PhilHealth"),
                ],
                max_length=20,
            ),
        ),
    ]
