import io
import json
import uuid
from datetime import timedelta
from unittest.mock import patch

from django.core.cache import cache
from django.test import SimpleTestCase, override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from pixelpopup.api.inquiry_service import (
    DeliveryFailure, retry_failed_inquiry, send_inquiry_email, verify_turnstile,
)
from pixelpopup.models import InquirySubmission


CONFIGURED = override_settings(
    RESEND_API_KEY="re_test_key",
    RESEND_FROM_EMAIL="PixelPopup <hello@example.com>",
    INQUIRY_TO_EMAIL="mico.dahang@gmail.com",
    TURNSTILE_SECRET_KEY="turnstile_test_secret",
    VERCEL=False,
    INQUIRY_HAS_PERSISTENT_DATABASE=False,
)


@CONFIGURED
class InquirySubmissionTests(APITestCase):
    url = "/api/v1/inquiries/"

    def setUp(self):
        cache.clear()
        self.payload = {
            "kind": "portfolio_contact",
            "submissionId": str(uuid.uuid4()),
            "name": "Mico Client",
            "email": "client@example.com",
            "projectType": "Web application",
            "message": "Please help with this project.",
            "companyWebsite": "",
            "turnstileToken": "test-token",
        }

    @patch("pixelpopup.api.inquiry_service.send_inquiry_email", return_value="resend-123")
    @patch("pixelpopup.api.inquiry_views.verify_turnstile", return_value=True)
    def test_portfolio_inquiry_is_saved_before_email_send(self, verify, send):
        def assert_saved(submission):
            self.assertTrue(InquirySubmission.objects.filter(pk=submission.pk).exists())
            self.assertEqual(submission.delivery_status, InquirySubmission.DeliveryStatus.PENDING)
            return "resend-123"

        send.side_effect = assert_saved
        response = self.client.post(self.url, self.payload, format="json")

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["deliveryStatus"], "sent")
        self.assertEqual(InquirySubmission.objects.count(), 1)
        self.assertEqual(InquirySubmission.objects.get().resend_message_id, "resend-123")
        verify.assert_called_once_with("test-token", "portfolio-contact")

    @patch("pixelpopup.api.inquiry_service.send_inquiry_email", return_value="resend-123")
    @patch("pixelpopup.api.inquiry_views.verify_turnstile", return_value=True)
    def test_all_three_kinds_are_accepted(self, verify, send):
        cases = [
            {"kind": "asta_project", "company": "Acme", "projectType": "Custom software", "timeline": "Open to discuss", "budget": "Open to discuss", "consent": True},
            {"kind": "asta_careers", "phone": "09171234567", "interest": "Frontend Engineering", "workPreference": "Full-time", "profileUrl": "https://example.com", "consent": True},
        ]
        for case in cases:
            payload = {key: value for key, value in self.payload.items() if key != "projectType"}
            payload.update(case, submissionId=str(uuid.uuid4()))
            response = self.client.post(self.url, payload, format="json")
            self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(InquirySubmission.objects.count(), 2)
        self.assertEqual(verify.call_args_list[0].args[1], "asta-project")
        self.assertEqual(verify.call_args_list[1].args[1], "asta-careers")
        self.assertEqual(send.call_count, 2)

    @patch("pixelpopup.api.inquiry_service.send_inquiry_email", side_effect=DeliveryFailure("provider_unavailable"))
    @patch("pixelpopup.api.inquiry_views.verify_turnstile", return_value=True)
    def test_resend_failure_keeps_record_and_reports_delay(self, verify, send):
        response = self.client.post(self.url, self.payload, format="json")

        self.assertEqual(response.status_code, 202)
        self.assertFalse(response.data["ok"])
        self.assertEqual(response.data["deliveryStatus"], "failed")
        self.assertEqual(InquirySubmission.objects.get().failure_category, "provider_unavailable")

    @patch("pixelpopup.api.inquiry_service.send_inquiry_email", return_value="resend-123")
    @patch("pixelpopup.api.inquiry_views.verify_turnstile", return_value=True)
    def test_duplicate_uuid_does_not_send_twice(self, verify, send):
        first = self.client.post(self.url, self.payload, format="json")
        second = self.client.post(self.url, self.payload, format="json")
        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(send.call_count, 1)
        self.assertEqual(verify.call_count, 1)
        self.assertEqual(InquirySubmission.objects.count(), 1)

        changed = {**self.payload, "message": "A different message with the same identifier."}
        conflict = self.client.post(self.url, changed, format="json")
        self.assertEqual(conflict.status_code, 409)

    @patch("pixelpopup.api.inquiry_views.verify_turnstile", return_value=False)
    def test_failed_bot_verification_is_not_saved(self, verify):
        response = self.client.post(self.url, self.payload, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["error"], "BOT_VERIFICATION_FAILED")
        self.assertFalse(InquirySubmission.objects.exists())

    def test_honeypot_is_silently_discarded(self):
        response = self.client.post(self.url, {"companyWebsite": "spam.example"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertFalse(InquirySubmission.objects.exists())

    def test_invalid_fields_and_missing_consent_are_rejected(self):
        payload = {**self.payload, "unknown": "value"}
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("unknown", response.data["fields"])

        payload = {**self.payload, "kind": "asta_project", "consent": False}
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("consent", response.data["fields"])
        self.assertFalse(InquirySubmission.objects.exists())

    @override_settings(VERCEL=True, INQUIRY_HAS_PERSISTENT_DATABASE=False)
    def test_serverless_without_persistent_database_refuses_submission(self):
        response = self.client.post(self.url, self.payload, format="json")
        self.assertEqual(response.status_code, 503)
        self.assertFalse(InquirySubmission.objects.exists())

    def test_only_post_is_public(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 405)

    @patch("pixelpopup.api.inquiry_service.send_inquiry_email", return_value="resend-retry")
    def test_staff_retry_is_limited_to_safe_window(self, send):
        failed = InquirySubmission.objects.create(
            kind=InquirySubmission.Kind.PORTFOLIO_CONTACT,
            name="Client",
            email="client@example.com",
            details={"projectType": "Web", "message": "A project inquiry."},
            payload_hash="a" * 64,
            delivery_status=InquirySubmission.DeliveryStatus.FAILED,
        )
        self.assertTrue(retry_failed_inquiry(failed))
        failed.refresh_from_db()
        self.assertEqual(failed.delivery_status, InquirySubmission.DeliveryStatus.SENT)
        self.assertEqual(send.call_count, 1)

        failed.delivery_status = InquirySubmission.DeliveryStatus.FAILED
        failed.save(update_fields=["delivery_status"])
        InquirySubmission.objects.filter(pk=failed.pk).update(created_at=timezone.now() - timedelta(hours=25))
        failed.refresh_from_db()
        self.assertFalse(retry_failed_inquiry(failed))
        self.assertEqual(send.call_count, 1)


class FakeResponse(io.BytesIO):
    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()


@CONFIGURED
class InquiryProviderTests(SimpleTestCase):
    @override_settings(CORS_ALLOWED_ORIGINS=["http://localhost:5173"])
    @patch("pixelpopup.api.inquiry_service.urlopen")
    def test_turnstile_requires_matching_action_and_hostname(self, open_url):
        open_url.return_value = FakeResponse(json.dumps({"success": True, "action": "asta-project", "hostname": "localhost"}).encode())
        self.assertTrue(verify_turnstile("token", "asta-project"))
        open_url.return_value = FakeResponse(json.dumps({"success": True, "action": "portfolio-contact", "hostname": "localhost"}).encode())
        self.assertFalse(verify_turnstile("token", "asta-project"))
        open_url.return_value = FakeResponse(json.dumps({"success": True, "action": "asta-project", "hostname": "unexpected.example"}).encode())
        self.assertFalse(verify_turnstile("token", "asta-project"))

    @patch("pixelpopup.api.inquiry_service.urlopen")
    def test_resend_receives_recipient_reply_to_and_idempotency_key(self, open_url):
        open_url.return_value = FakeResponse(b'{"id":"resend-message-id"}')
        submission = InquirySubmission(
            id=uuid.uuid4(), kind=InquirySubmission.Kind.ASTA_CAREERS,
            name="Applicant", email="applicant@example.com",
            details={"interest": "Frontend Engineering", "message": "I would like to apply."},
            payload_hash="a" * 64,
        )
        self.assertEqual(send_inquiry_email(submission), "resend-message-id")
        request = open_url.call_args.args[0]
        payload = json.loads(request.data)
        self.assertEqual(payload["to"], ["mico.dahang@gmail.com"])
        self.assertEqual(payload["reply_to"], "applicant@example.com")
        self.assertEqual(request.get_header("Idempotency-key"), str(submission.pk))
