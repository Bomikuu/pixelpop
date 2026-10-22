from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("finance", "0032_nutrition_presets_weight_goal"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="UserAvatar",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("avatar_blob", models.BinaryField(editable=False)),
                ("avatar_hash", models.CharField(editable=False, max_length=64)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="dashboard_avatar", to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
