from django.db import migrations, models
import django.db.models.deletion
import django.db.models.functions.text


class Migration(migrations.Migration):
    initial = True
    dependencies = []

    operations = [
        migrations.CreateModel(
            name="EndOfDayGroup",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=120)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"ordering": ["id"]},
        ),
        migrations.CreateModel(
            name="EndOfDayEntry",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("date", models.DateField()),
                ("type", models.CharField(choices=[("workday", "Workday"), ("day_off", "Day off"), ("vacation", "Vacation"), ("holiday", "Holiday")], default="workday", max_length=12)),
                ("title", models.CharField(max_length=160)),
                ("summary", models.TextField(blank=True, max_length=4000)),
                ("items", models.JSONField(blank=True, default=list)),
                ("slack_message", models.TextField(blank=True, max_length=8000)),
                ("bullet_list", models.JSONField(blank=True, default=list)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("group", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="entries", to="end_of_day.endofdaygroup")),
            ],
            options={"ordering": ["date", "id"]},
        ),
        migrations.AddConstraint(model_name="endofdaygroup", constraint=models.UniqueConstraint(django.db.models.functions.text.Lower("name"), name="eod_group_name_ci")),
        migrations.AddConstraint(model_name="endofdayentry", constraint=models.UniqueConstraint(fields=("group", "date"), name="eod_group_date_unique")),
    ]
