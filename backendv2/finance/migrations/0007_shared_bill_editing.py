from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def legacy_allocations(apps, schema_editor):
    apps.get_model("finance", "SharedBill").objects.using(schema_editor.connection.alias).all().update(allocation_confirmed=False)


class Migration(migrations.Migration):
    dependencies = [("finance", "0006_shared_bills")]
    operations = [
        migrations.AddField(model_name="sharedbill", name="edit_pin_hash", field=models.CharField(blank=True, max_length=128)),
        migrations.AddField(model_name="sharedbill", name="allocation_confirmed", field=models.BooleanField(default=True)),
        migrations.AddField(model_name="sharedbillparticipant", name="share_is_fixed", field=models.BooleanField(default=False)),
        migrations.AddField(model_name="sharedbillparticipant", name="membership_request_id", field=models.UUIDField(blank=True, null=True, unique=True)),
        migrations.AddField(model_name="sharedbillpayment", name="status", field=models.CharField(choices=[("confirmed", "Confirmed"), ("pending", "Pending"), ("rejected", "Rejected")], default="confirmed", max_length=10)),
        migrations.RunPython(legacy_allocations, migrations.RunPython.noop),
        migrations.CreateModel(name="SharedBillDebtAdjustment", fields=[
            ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
            ("created_at", models.DateTimeField(auto_now_add=True)),
            ("updated_at", models.DateTimeField(auto_now=True)),
            ("amount", models.DecimalField(decimal_places=2, max_digits=14)),
            ("date", models.DateField(db_index=True)),
            ("reason", models.CharField(max_length=160)),
            ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ("bill", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="debt_adjustments", to="finance.sharedbill")),
            ("loan", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="shared_adjustments", to="finance.loanreceivable")),
        ]),
    ]
