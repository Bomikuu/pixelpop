from django.db import migrations


def add_categories(apps, schema_editor):
    category = apps.get_model("finance", "Category")
    for name in ("Food", "Groceries", "Transportation", "Bills", "Shopping", "Entertainment", "Health", "Subscriptions", "Work", "Education", "Family", "Other"):
        category.objects.using(schema_editor.connection.alias).get_or_create(name=name)


class Migration(migrations.Migration):
    dependencies = [("finance", "0001_initial")]
    operations = [migrations.RunPython(add_categories, migrations.RunPython.noop)]
