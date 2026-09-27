import uuid
from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import migrations, models
import django.db.models.deletion


def record_fields():
    return [
        ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
        ("created_at", models.DateTimeField(auto_now_add=True)),
        ("updated_at", models.DateTimeField(auto_now=True)),
        ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
    ]


class Migration(migrations.Migration):
    dependencies = [
        ("finance", "0005_funds_recipients_pets"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]
    operations = [
        migrations.CreateModel(name="SharedBill", fields=record_fields() + [
            ("title", models.CharField(max_length=160)),
            ("total", models.DecimalField(decimal_places=2, max_digits=14, validators=[MinValueValidator(Decimal("0.01"))])),
            ("date", models.DateField(db_index=True)),
            ("archived", models.BooleanField(default=False)),
            ("request_id", models.UUIDField(default=uuid.uuid4, unique=True)),
            ("share_token", models.CharField(blank=True, max_length=64, null=True, unique=True)),
            ("share_expires_at", models.DateTimeField(blank=True, null=True)),
            ("category", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, to="finance.category")),
        ]),
        migrations.CreateModel(name="SharedBillParticipant", fields=[
            ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
            ("name", models.CharField(max_length=120)),
            ("is_me", models.BooleanField(default=False)),
            ("share", models.DecimalField(decimal_places=2, max_digits=14, validators=[MinValueValidator(Decimal("0"))])),
            ("bill", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="participants", to="finance.sharedbill")),
            ("advance", models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="shared_participant", to="finance.loanreceivable")),
        ]),
        migrations.CreateModel(name="SharedBillPayment", fields=record_fields() + [
            ("amount", models.DecimalField(decimal_places=2, max_digits=14, validators=[MinValueValidator(Decimal("0.01"))])),
            ("date", models.DateField()),
            ("record_ledger", models.BooleanField(default=False)),
            ("payment_method", models.CharField(default="bank", max_length=20)),
            ("request_id", models.UUIDField(default=uuid.uuid4, unique=True)),
            ("bill", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="payments", to="finance.sharedbill")),
            ("payer", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="payments_out", to="finance.sharedbillparticipant")),
            ("paid_to", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="payments_in", to="finance.sharedbillparticipant")),
            ("account", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, to="finance.account")),
            ("expense", models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="shared_payment", to="finance.transaction")),
            ("repayment", models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="shared_payment", to="finance.moneymovement")),
        ]),
        migrations.AddConstraint(model_name="sharedbillparticipant", constraint=models.CheckConstraint(condition=models.Q(share__gte=0), name="finance_shared_share_nonnegative")),
        migrations.AddConstraint(model_name="sharedbillparticipant", constraint=models.UniqueConstraint(condition=models.Q(is_me=True), fields=("bill",), name="finance_shared_one_me")),
        migrations.AddConstraint(model_name="sharedbillpayment", constraint=models.CheckConstraint(condition=models.Q(amount__gt=0), name="finance_shared_payment_positive")),
    ]
