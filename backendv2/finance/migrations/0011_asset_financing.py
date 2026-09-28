import uuid
from decimal import Decimal

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [("finance", "0010_account_card_details"), migrations.swappable_dependency(settings.AUTH_USER_MODEL)]

    operations = [
        migrations.CreateModel(name="AssetFinancing", fields=[
            ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
            ("created_at", models.DateTimeField(auto_now_add=True)),
            ("updated_at", models.DateTimeField(auto_now=True)),
            ("lender", models.CharField(max_length=120)),
            ("opening_principal", models.DecimalField(decimal_places=2, max_digits=14, validators=[MinValueValidator(Decimal("0"))])),
            ("balance_as_of", models.DateField()),
            ("next_due_date", models.DateField()),
            ("monthly_due", models.DecimalField(decimal_places=2, max_digits=14, validators=[MinValueValidator(Decimal("0.01"))])),
            ("annual_rate", models.DecimalField(decimal_places=4, max_digits=7, validators=[MinValueValidator(Decimal("0"))])),
            ("remaining_months", models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(360)])),
            ("asset", models.OneToOneField(on_delete=django.db.models.deletion.PROTECT, related_name="financing", to="finance.asset")),
            ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
        ], options={"abstract": False}),
        migrations.CreateModel(name="AssetFinancingTerms", fields=[
            ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
            ("created_at", models.DateTimeField(auto_now_add=True)),
            ("updated_at", models.DateTimeField(auto_now=True)),
            ("effective_date", models.DateField()),
            ("annual_rate", models.DecimalField(decimal_places=4, max_digits=7, validators=[MinValueValidator(Decimal("0"))])),
            ("monthly_due", models.DecimalField(decimal_places=2, max_digits=14, validators=[MinValueValidator(Decimal("0.01"))])),
            ("financing", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="term_changes", to="finance.assetfinancing")),
            ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
        ], options={"abstract": False}),
        migrations.AddConstraint(model_name="assetfinancingterms", constraint=models.UniqueConstraint(fields=("financing", "effective_date"), name="finance_financing_terms_date")),
        migrations.AddField(model_name="deadline", name="asset_financing", field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="installments", to="finance.assetfinancing")),
        migrations.AddField(model_name="deadline", name="installment_index", field=models.PositiveSmallIntegerField(blank=True, null=True)),
        migrations.AddConstraint(model_name="deadline", constraint=models.UniqueConstraint(fields=("asset_financing", "installment_index"), name="finance_asset_installment_index")),
        migrations.CreateModel(name="AssetFinancingPayment", fields=[
            ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
            ("created_at", models.DateTimeField(auto_now_add=True)),
            ("updated_at", models.DateTimeField(auto_now=True)),
            ("date", models.DateField(db_index=True)),
            ("cash_amount", models.DecimalField(decimal_places=2, max_digits=14, validators=[MinValueValidator(Decimal("0"))])),
            ("advance_applied", models.DecimalField(decimal_places=2, default=0, max_digits=14, validators=[MinValueValidator(Decimal("0"))])),
            ("principal", models.DecimalField(decimal_places=2, default=0, max_digits=14, validators=[MinValueValidator(Decimal("0"))])),
            ("extra_principal", models.DecimalField(decimal_places=2, default=0, max_digits=14, validators=[MinValueValidator(Decimal("0"))])),
            ("interest", models.DecimalField(decimal_places=2, default=0, max_digits=14, validators=[MinValueValidator(Decimal("0"))])),
            ("fees", models.DecimalField(decimal_places=2, default=0, max_digits=14, validators=[MinValueValidator(Decimal("0"))])),
            ("advance_reserved", models.DecimalField(decimal_places=2, default=0, max_digits=14, validators=[MinValueValidator(Decimal("0"))])),
            ("historical", models.BooleanField(default=False)),
            ("notes", models.CharField(blank=True, max_length=500)),
            ("request_id", models.UUIDField(default=uuid.uuid4, unique=True)),
            ("account", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="asset_financing_payments", to="finance.account")),
            ("deadline", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="financing_payments", to="finance.deadline")),
            ("financing", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="payments", to="finance.assetfinancing")),
            ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
        ], options={"abstract": False}),
        migrations.AddField(model_name="transaction", name="asset_financing_payment", field=models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="expense", to="finance.assetfinancingpayment")),
    ]
