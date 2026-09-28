import uuid
from decimal import Decimal

from django.db import migrations, models
import django.core.validators


def initialize_review(apps, schema_editor):
    Payment = apps.get_model("finance", "SharedBillPayment")
    alias = schema_editor.connection.alias
    for payment in Payment.objects.using(alias).all().iterator():
        payment.public_id = uuid.uuid4()
        payment.ledger_reviewed = payment.status != "pending"
        payment.save(using=alias, update_fields=["public_id", "ledger_reviewed"])


class Migration(migrations.Migration):
    dependencies = [("finance", "0007_shared_bill_editing")]
    operations = [
        migrations.AddField(model_name="sharedbill", name="ledger_allocation_pending", field=models.BooleanField(default=False)),
        migrations.AddField(model_name="sharedbillparticipant", name="ledger_share", field=models.DecimalField(blank=True, null=True, decimal_places=2, max_digits=14, validators=[django.core.validators.MinValueValidator(Decimal("0"))])),
        migrations.AddField(model_name="sharedbillpayment", name="ledger_reviewed", field=models.BooleanField(default=True)),
        migrations.AddField(model_name="sharedbillpayment", name="public_id", field=models.UUIDField(null=True, editable=False)),
        migrations.RunPython(initialize_review, migrations.RunPython.noop),
        migrations.AlterField(model_name="sharedbillpayment", name="public_id", field=models.UUIDField(default=uuid.uuid4, unique=True, editable=False)),
    ]
