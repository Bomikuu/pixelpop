from django.db import migrations, models
import django.db.models.deletion
from django.db.models.functions import Lower


class Migration(migrations.Migration):
    initial = True
    dependencies = [("finance", "0022_deadline_optional_date_priority")]

    operations = [
        migrations.CreateModel(
            name="BrainstormBoard",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=120)),
                ("slug", models.SlugField(allow_unicode=True, blank=True, max_length=70, unique=True)),
                ("description", models.TextField(blank=True, max_length=4000)),
                ("sort_order", models.IntegerField(default=0)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"ordering": ["sort_order", "id"]},
        ),
        migrations.CreateModel(
            name="BrainstormGroup",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=120)),
                ("slug", models.SlugField(allow_unicode=True, blank=True, max_length=70)),
                ("description", models.TextField(blank=True, max_length=4000)),
                ("sort_order", models.IntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("board", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="groups", to="brainstorm.brainstormboard")),
            ],
            options={"ordering": ["sort_order", "id"]},
        ),
        migrations.CreateModel(
            name="BrainstormIdea",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=160)),
                ("description", models.TextField(blank=True, max_length=4000)),
                ("source_text", models.TextField(blank=True, max_length=4000)),
                ("urgency", models.CharField(choices=[("high", "High"), ("medium", "Medium"), ("low", "Low"), ("someday", "Someday")], default="medium", max_length=12)),
                ("status", models.CharField(choices=[("inbox", "Inbox"), ("planned", "Planned"), ("in_progress", "In Progress"), ("carried_over", "Carried Over"), ("done", "Done"), ("archived", "Archived")], default="inbox", max_length=16)),
                ("tags", models.JSONField(blank=True, default=list)),
                ("reference_url", models.URLField(blank=True, max_length=2048)),
                ("notes", models.TextField(blank=True, max_length=4000)),
                ("fingerprint", models.CharField(editable=False, max_length=180)),
                ("sort_order", models.IntegerField(default=0)),
                ("carried_over_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("board", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="ideas", to="brainstorm.brainstormboard")),
                ("group", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="ideas", to="brainstorm.brainstormgroup")),
                ("task", models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="brainstorm_idea", to="finance.deadline")),
            ],
            options={"ordering": ["-created_at", "-id"]},
        ),
        migrations.AddConstraint(model_name="brainstormboard", constraint=models.UniqueConstraint(Lower("name"), name="brainstorm_board_name_ci")),
        migrations.AddConstraint(model_name="brainstormgroup", constraint=models.UniqueConstraint(Lower("name"), models.F("board"), name="brainstorm_group_name_ci")),
        migrations.AddConstraint(model_name="brainstormgroup", constraint=models.UniqueConstraint(fields=("board", "slug"), name="brainstorm_group_slug")),
        migrations.AddConstraint(model_name="brainstormidea", constraint=models.UniqueConstraint(fields=("board", "fingerprint"), name="brainstorm_idea_fingerprint")),
        migrations.AddIndex(model_name="brainstormidea", index=models.Index(fields=["board", "status", "urgency"], name="brainstorm_idea_filters")),
    ]
