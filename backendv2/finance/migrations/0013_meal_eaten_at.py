from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("finance", "0012_nutrition"),
    ]

    operations = [
        migrations.AddField(
            model_name="meal",
            name="eaten_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
