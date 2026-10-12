from django.db import migrations, models
import django.db.models.deletion


def link_unambiguous_people(apps, schema_editor):
    Person = apps.get_model("finance", "Person")
    Participant = apps.get_model("finance", "SharedBillParticipant")
    Loan = apps.get_model("finance", "LoanReceivable")
    database = schema_editor.connection.alias
    matches = {}
    for person in Person.objects.using(database).only("id", "name"):
        matches.setdefault(person.name.strip().casefold(), []).append(person.pk)
    linked = set()
    for participant in Participant.objects.using(database).filter(is_me=False).order_by("id"):
        candidates = matches.get(participant.name.strip().casefold(), [])
        if len(candidates) != 1 or (participant.bill_id, candidates[0]) in linked:
            continue
        participant.contact_id = candidates[0]
        participant.save(using=database, update_fields=["contact"])
        linked.add((participant.bill_id, participant.contact_id))
        if participant.advance_id:
            Loan.objects.using(database).filter(pk=participant.advance_id, contact__isnull=True).update(contact_id=participant.contact_id)


class Migration(migrations.Migration):
    dependencies = [("finance", "0029_person_contact_details_avatar")]

    operations = [
        migrations.RemoveConstraint(model_name="person", name="finance_person_name_ci_unique"),
        migrations.AddField(model_name="person", name="nickname", field=models.CharField(blank=True, max_length=60)),
        migrations.AddField(model_name="sharedbillparticipant", name="contact", field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="shared_participants", to="finance.person")),
        migrations.RunPython(link_unambiguous_people, migrations.RunPython.noop),
        migrations.AddConstraint(model_name="sharedbillparticipant", constraint=models.UniqueConstraint(fields=("bill", "contact"), condition=models.Q(contact__isnull=False), name="finance_shared_unique_contact")),
    ]
