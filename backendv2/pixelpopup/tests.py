from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from pixelpopup.models import (
    Article,
    CoverLetter,
    JobApplication,
    ProfessionalProfile,
)


class PortfolioPublicApiTests(APITestCase):
    def setUp(self):
        self.profile, _ = ProfessionalProfile.objects.update_or_create(
            slug="mico-ang",
            defaults={
                "full_name": "Mico Ang",
                "headline": "Senior frontend engineer",
                "professional_summary": "Frontend engineering and technical leadership.",
                "email": "mico@example.com",
            },
        )
        self.application = JobApplication.objects.create(
            slug="example-senior-frontend",
            company_name="Example Company",
            job_title="Senior Frontend Engineer",
            recipient_email="private@example.com",
            job_description="Private job description",
            notes_private="Private notes",
        )

    def test_public_articles_only_return_published_content(self):
        Article.objects.create(
            title="Published article",
            slug="published-article",
            excerpt="Published excerpt",
            content="Published content",
            status="published",
        )
        Article.objects.create(
            title="Draft article",
            slug="draft-article",
            excerpt="Draft excerpt",
            content="Draft content",
            status="draft",
        )

        response = self.client.get(reverse("portfolio-articles-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["slug"], "published-article")
        self.assertEqual(response.data["results"][0]["author"]["full_name"], "Mico Ang")

    def test_public_cover_letter_is_retrieve_only_and_hides_private_application_fields(self):
        letter = CoverLetter.objects.create(
            application=self.application,
            profile=self.profile,
            slug="example-senior-frontend-letter",
            subject="Application for Senior Frontend Engineer",
            opening="Hello hiring team,",
            body="I would like to apply.",
            closing="Thank you.",
            status="published",
        )

        list_response = self.client.get("/api/v1/portfolio/cover-letters/")
        detail_response = self.client.get(
            reverse("portfolio-cover-letters-detail", kwargs={"slug": letter.slug})
        )

        self.assertEqual(list_response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(detail_response.status_code, status.HTTP_200_OK)
        application_data = detail_response.data["application"]
        self.assertNotIn("recipient_email", application_data)
        self.assertNotIn("job_description", application_data)
        self.assertNotIn("notes_private", application_data)

        download_response = self.client.get(
            reverse("portfolio-cover-letters-download", kwargs={"slug": letter.slug})
        )
        self.assertEqual(download_response.status_code, status.HTTP_200_OK)
        self.assertIn("attachment;", download_response["Content-Disposition"])
        self.assertIn("Mico Ang", download_response.content.decode())
        self.assertNotIn("private@example.com", download_response.content.decode())

    def test_draft_cover_letter_is_not_public(self):
        letter = CoverLetter.objects.create(
            application=self.application,
            profile=self.profile,
            slug="draft-letter",
            subject="Draft",
            opening="Hello,",
            body="Draft body",
            closing="Thank you.",
            status="draft",
        )

        response = self.client.get(
            reverse("portfolio-cover-letters-detail", kwargs={"slug": letter.slug})
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_staff_api_rejects_anonymous_requests(self):
        response = self.client.get(reverse("portfolio-admin-articles-list"))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
