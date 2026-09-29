from django.db import migrations, models
from django.db.models import Q


class Migration(migrations.Migration):
    dependencies = [("leadership", "0001_initial")]

    operations = [
        migrations.AddField(
            model_name="teammember",
            name="is_self",
            field=models.BooleanField(default=False),
        ),
        migrations.AddConstraint(
            model_name="teammember",
            constraint=models.UniqueConstraint(fields=("plan",), condition=Q(is_self=True), name="unique_self_member_per_plan"),
        ),
    ]
