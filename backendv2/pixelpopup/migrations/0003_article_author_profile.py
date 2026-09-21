from django.db import migrations, models
import django.db.models.deletion


def assign_mico_as_article_author(apps, schema_editor):
    ProfessionalProfile = apps.get_model("pixelpopup", "ProfessionalProfile")
    Article = apps.get_model("pixelpopup", "Article")
    profile, _ = ProfessionalProfile.objects.get_or_create(
        slug="mico-ang",
        defaults={
            "full_name": "Mico Ang",
            "headline": "Senior frontend-focused full-stack developer",
            "professional_summary": (
                "Frontend engineer, full-stack developer, and technical lead building "
                "clear, reliable product experiences."
            ),
            "email": "mico.dahang@gmail.com",
            "linkedin_url": "https://www.linkedin.com/in/boomiyaah/",
            "github_url": "https://github.com/Bomikuu",
            "signature": "Mico Ang",
            "is_active": True,
        },
    )
    Article.objects.filter(author_profile__isnull=True).update(author_profile=profile)


class Migration(migrations.Migration):
    dependencies = [("pixelpopup", "0002_articlecategory_articletag_coverlettertemplate_and_more")]

    operations = [
        migrations.AddField(
            model_name="article",
            name="author_profile",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="articles",
                to="pixelpopup.professionalprofile",
            ),
        ),
        migrations.RunPython(assign_mico_as_article_author, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="article",
            name="author_profile",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name="articles",
                to="pixelpopup.professionalprofile",
            ),
        ),
    ]
