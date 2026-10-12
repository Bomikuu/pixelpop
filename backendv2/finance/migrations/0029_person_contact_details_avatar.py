from django.core.validators import RegexValidator
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("finance", "0028_asset_images")]

    operations = [
        migrations.AddField(model_name="person", name="email", field=models.EmailField(blank=True, max_length=254)),
        migrations.AddField(model_name="person", name="phone", field=models.CharField(blank=True, max_length=15, validators=[RegexValidator(r"\A[0-9]{7,15}\Z", "Use 7–15 digits, including the country code if needed.")])),
        migrations.AddField(model_name="person", name="organization", field=models.CharField(blank=True, max_length=120)),
        migrations.AddField(model_name="person", name="avatar_blob", field=models.BinaryField(blank=True, editable=False, null=True)),
        migrations.AddField(model_name="person", name="avatar_hash", field=models.CharField(blank=True, editable=False, max_length=64)),
    ]
