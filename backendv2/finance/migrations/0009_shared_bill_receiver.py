from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):
    dependencies = [("finance", "0008_shared_bill_ledger_review"), migrations.swappable_dependency(settings.AUTH_USER_MODEL)]
    operations = [
        migrations.AddField(model_name="sharedbill", name="receiver", field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="received_events", to="finance.sharedbillparticipant")),
        migrations.AddField(model_name="sharedbill", name="all_paid", field=models.BooleanField(default=False)),
        migrations.AddField(model_name="sharedbillpayment", name="kind", field=models.CharField(choices=[("payment", "Provider payment / advance settlement"), ("contribution", "Contribution to receiver"), ("refund", "Overpayment refund")], default="payment", max_length=16)),
        migrations.CreateModel(name="SharedBillClosure", fields=[
            ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
            ("created_at", models.DateTimeField(auto_now_add=True)),
            ("updated_at", models.DateTimeField(auto_now=True)),
            ("snapshot", models.JSONField(default=list)),
            ("request_id", models.UUIDField(default=uuid.uuid4, unique=True)),
            ("bill", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="closures", to="finance.sharedbill")),
            ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
        ], options={"abstract": False}),
    ]
