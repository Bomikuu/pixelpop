from django.conf import settings
from django.db import migrations, models
from django.db.models.functions import Lower, Trim
from django.utils.crypto import salted_hmac
import django.db.models.deletion
import finance.models


def backfill_people(apps, schema_editor):
    Person = apps.get_model("finance", "Person")
    Transaction = apps.get_model("finance", "Transaction")
    LoanReceivable = apps.get_model("finance", "LoanReceivable")
    people = {}

    def contact_for(name):
        label = name.strip()
        if not label:
            return None
        normalized = label.casefold()
        if normalized not in people:
            people[normalized] = Person.objects.create(
                key=salted_hmac("finance.person", normalized).hexdigest(),
                name=label,
                relationship="Other",
            )
        return people[normalized]

    for row in Transaction.objects.filter(kind="expense").exclude(recipient="").iterator():
        contact = contact_for(row.recipient)
        if contact:
            Transaction.objects.filter(pk=row.pk).update(contact=contact)
    for row in LoanReceivable.objects.exclude(person="").iterator():
        contact = contact_for(row.person)
        if contact:
            LoanReceivable.objects.filter(pk=row.pk).update(contact=contact)


class Migration(migrations.Migration):
    dependencies = [("finance", "0015_account_card_network"), migrations.swappable_dependency(settings.AUTH_USER_MODEL)]

    operations = [
        migrations.CreateModel(
            name="Person",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("key", models.CharField(default=finance.models.new_person_key, editable=False, max_length=40, unique=True)),
                ("name", models.CharField(max_length=120)),
                ("relationship", models.CharField(choices=[(value, value) for value in ("Mother", "Father", "Parent", "Sibling", "Partner", "Child", "Friend", "Colleague", "Other")], max_length=20)),
                ("custom_relationship", models.CharField(blank=True, max_length=60)),
                ("notes", models.TextField(blank=True, max_length=4000)),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AddConstraint(
            model_name="person",
            constraint=models.UniqueConstraint(Lower(Trim("name")), name="finance_person_name_ci_unique"),
        ),
        migrations.AddField(
            model_name="loanreceivable",
            name="contact",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="loans", to="finance.person"),
        ),
        migrations.AddField(
            model_name="transaction",
            name="contact",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="giving_transactions", to="finance.person"),
        ),
        migrations.RunPython(backfill_people, migrations.RunPython.noop),
    ]
