from django.db import migrations


def create_personal_group(apps, schema_editor):
    apps.get_model("end_of_day", "EndOfDayGroup").objects.get_or_create(name="Personal")


class Migration(migrations.Migration):
    dependencies = [("end_of_day", "0001_initial")]
    operations = [migrations.RunPython(create_personal_group, migrations.RunPython.noop)]
