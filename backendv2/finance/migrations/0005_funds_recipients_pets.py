from django.db import migrations, models


def add_pets(apps, schema_editor):
    categories = apps.get_model("finance", "Category").objects.using(schema_editor.connection.alias)
    if not categories.filter(name__iexact="Pets").exists():
        categories.get_or_create(name="Pets")


class Migration(migrations.Migration):
    dependencies = [("finance", "0004_alter_asset_kind")]
    operations = [
        migrations.AddField(model_name="account", name="fund_type", field=models.CharField(blank=True, choices=[("pag_ibig", "Pag-IBIG"), ("mp2", "Pag-IBIG MP2"), ("investment", "Investment"), ("other", "Other fund")], max_length=20)),
        migrations.AlterField(model_name="account", name="kind", field=models.CharField(choices=[("cash", "Cash"), ("bank", "Bank"), ("ewallet", "Ewallet"), ("credit_card", "Credit Card"), ("fund", "Fund")], default="bank", max_length=20)),
        migrations.AddField(model_name="transaction", name="recipient", field=models.CharField(blank=True, max_length=120)),
        migrations.AlterField(model_name="moneymovement", name="kind", field=models.CharField(choices=[("transfer", "Transfer"), ("loan_disbursement", "Loan Disbursement"), ("loan_repayment", "Loan Repayment"), ("credit_card_payment", "Credit Card Payment"), ("fund_contribution", "Fund Contribution"), ("fund_withdrawal", "Fund Withdrawal")], max_length=25)),
        migrations.RunPython(add_pets, migrations.RunPython.noop),
    ]
