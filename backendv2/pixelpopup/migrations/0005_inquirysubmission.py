import uuid

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("pixelpopup", "0004_seed_mico_articles")]

    operations = [
        migrations.CreateModel(
            name="InquirySubmission",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("kind", models.CharField(choices=[("portfolio_contact", "Portfolio contact"), ("asta_project", "ASTA project"), ("asta_careers", "ASTA careers")], max_length=32)),
                ("name", models.CharField(max_length=100)),
                ("email", models.EmailField(max_length=254)),
                ("details", models.JSONField(default=dict)),
                ("payload_hash", models.CharField(max_length=64)),
                ("delivery_status", models.CharField(choices=[("pending", "Pending"), ("sent", "Sent"), ("failed", "Failed")], default="pending", max_length=10)),
                ("resend_message_id", models.CharField(blank=True, default="", max_length=100)),
                ("failure_category", models.CharField(blank=True, default="", max_length=40)),
                ("last_attempt_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]
