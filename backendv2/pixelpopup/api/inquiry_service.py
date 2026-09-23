import json
from datetime import timedelta
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen

from django.conf import settings
from django.utils import timezone

from pixelpopup.models import InquirySubmission


TURNSTILE_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"
RESEND_URL = "https://api.resend.com/emails"
SAFE_RETRY_WINDOW = timedelta(hours=24)

FIELD_LABELS = {
    "projectType": "Project type",
    "company": "Company",
    "timeline": "Timeline",
    "budget": "Budget",
    "phone": "Phone",
    "interest": "Area of interest",
    "workPreference": "Work preference",
    "profileUrl": "Profile URL",
    "message": "Message",
}


class DeliveryFailure(Exception):
    def __init__(self, category):
        self.category = category
        super().__init__(category)


def inquiry_service_configured():
    return all(
        value and "<key here>" not in value and "your-domain" not in value
        for value in (
            settings.RESEND_API_KEY,
            settings.RESEND_FROM_EMAIL,
            settings.INQUIRY_TO_EMAIL,
            settings.TURNSTILE_SECRET_KEY,
        )
    ) and bool(settings.CORS_ALLOWED_ORIGINS) and not (
        settings.VERCEL and not settings.INQUIRY_HAS_PERSISTENT_DATABASE
    )


def verify_turnstile(token, expected_action):
    request = Request(
        TURNSTILE_URL,
        data=urlencode({"secret": settings.TURNSTILE_SECRET_KEY, "response": token}).encode(),
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=10) as response:
            result = json.load(response)
    except (HTTPError, URLError, TimeoutError, ValueError):
        return False

    allowed_hosts = {
        urlparse(origin).hostname
        for origin in settings.CORS_ALLOWED_ORIGINS
        if urlparse(origin).hostname
    }
    return (
        result.get("success") is True
        and result.get("action") == expected_action
        and result.get("hostname") in allowed_hosts
    )


def format_inquiry_email(submission):
    subject_prefix = {
        InquirySubmission.Kind.PORTFOLIO_CONTACT: "Portfolio inquiry",
        InquirySubmission.Kind.ASTA_PROJECT: "ASTA project inquiry",
        InquirySubmission.Kind.ASTA_CAREERS: "ASTA application",
    }[submission.kind]
    subject = f"{subject_prefix} from {submission.name}"
    lines = [f"Name: {submission.name}", f"Email: {submission.email}"]
    for field, label in FIELD_LABELS.items():
        value = submission.details.get(field)
        if value:
            if field == "message":
                lines.extend(["", f"{label}:", value])
            else:
                lines.append(f"{label}: {value}")
    return subject, "\n".join(lines)


def send_inquiry_email(submission):
    subject, body = format_inquiry_email(submission)
    payload = {
        "from": settings.RESEND_FROM_EMAIL,
        "to": [settings.INQUIRY_TO_EMAIL],
        "reply_to": submission.email,
        "subject": subject,
        "text": body,
    }
    request = Request(
        RESEND_URL,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {settings.RESEND_API_KEY}",
            "Content-Type": "application/json",
            "Idempotency-Key": str(submission.pk),
            "User-Agent": "PixelPopup-Inquiries/1.0",
        },
        method="POST",
    )
    try:
        with urlopen(request, timeout=10) as response:
            result = json.load(response)
    except HTTPError as error:
        raise DeliveryFailure("provider_rejected" if error.code < 500 else "provider_unavailable") from error
    except (URLError, TimeoutError, ValueError) as error:
        raise DeliveryFailure("provider_unavailable") from error

    message_id = result.get("id")
    if not isinstance(message_id, str) or not message_id:
        raise DeliveryFailure("invalid_provider_response")
    return message_id


def deliver_inquiry(submission):
    submission.last_attempt_at = timezone.now()
    try:
        submission.resend_message_id = send_inquiry_email(submission)
        submission.delivery_status = InquirySubmission.DeliveryStatus.SENT
        submission.failure_category = ""
    except DeliveryFailure as error:
        submission.delivery_status = InquirySubmission.DeliveryStatus.FAILED
        submission.failure_category = error.category
    submission.save(update_fields=["last_attempt_at", "resend_message_id", "delivery_status", "failure_category", "updated_at"])
    return submission.delivery_status


def retry_failed_inquiry(submission):
    if submission.delivery_status != InquirySubmission.DeliveryStatus.FAILED:
        return False
    if timezone.now() - submission.created_at >= SAFE_RETRY_WINDOW:
        return False
    updated = InquirySubmission.objects.filter(
        pk=submission.pk, delivery_status=InquirySubmission.DeliveryStatus.FAILED
    ).update(delivery_status=InquirySubmission.DeliveryStatus.PENDING)
    if not updated:
        return False
    submission.delivery_status = InquirySubmission.DeliveryStatus.PENDING
    deliver_inquiry(submission)
    return True
