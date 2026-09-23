import hashlib
import json

from rest_framework import serializers, status
from rest_framework.parsers import JSONParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import SimpleRateThrottle
from rest_framework.views import APIView

from pixelpopup.models import InquirySubmission
from .inquiry_service import deliver_inquiry, inquiry_service_configured, verify_turnstile


MAX_BODY_BYTES = 16 * 1024
TURNSTILE_ACTIONS = {
    InquirySubmission.Kind.PORTFOLIO_CONTACT: "portfolio-contact",
    InquirySubmission.Kind.ASTA_PROJECT: "asta-project",
    InquirySubmission.Kind.ASTA_CAREERS: "asta-careers",
}


class InquiryRateThrottle(SimpleRateThrottle):
    scope = "inquiry"
    rate = "5/minute"

    def get_cache_key(self, request, view):
        return self.cache_format % {"scope": self.scope, "ident": self.get_ident(request)}


class InquirySerializer(serializers.Serializer):
    kind = serializers.ChoiceField(choices=InquirySubmission.Kind.choices)
    submissionId = serializers.UUIDField()
    name = serializers.CharField(max_length=100)
    email = serializers.EmailField(max_length=254)
    message = serializers.CharField(max_length=2000)
    companyWebsite = serializers.CharField(max_length=200, required=False, allow_blank=True)
    turnstileToken = serializers.CharField(max_length=2048)

    expected_kind = None

    def to_internal_value(self, data):
        if not isinstance(data, dict):
            raise serializers.ValidationError("Expected a JSON object.")
        unknown = set(data) - set(self.fields)
        if unknown:
            raise serializers.ValidationError({field: ["Unknown field."] for field in unknown})
        return super().to_internal_value(data)

    def validate_email(self, value):
        return value.lower()

    def validate(self, attrs):
        if attrs["kind"] != self.expected_kind:
            raise serializers.ValidationError({"kind": ["Invalid inquiry kind."]})
        for field, value in attrs.items():
            if field not in {"message", "turnstileToken"} and isinstance(value, str) and ("\n" in value or "\r" in value):
                raise serializers.ValidationError({field: ["Must be a single line."]})
        return attrs


class PortfolioInquirySerializer(InquirySerializer):
    expected_kind = InquirySubmission.Kind.PORTFOLIO_CONTACT
    projectType = serializers.CharField(max_length=80)
    message = serializers.CharField(min_length=10, max_length=2000)


class AstaProjectInquirySerializer(InquirySerializer):
    expected_kind = InquirySubmission.Kind.ASTA_PROJECT
    company = serializers.CharField(max_length=120, required=False, allow_blank=True)
    projectType = serializers.CharField(max_length=80)
    timeline = serializers.CharField(max_length=80, required=False, allow_blank=True)
    budget = serializers.CharField(max_length=80, required=False, allow_blank=True)
    consent = serializers.BooleanField()

    def validate_consent(self, value):
        if not value:
            raise serializers.ValidationError("Consent is required.")
        return value


class AstaCareersInquirySerializer(InquirySerializer):
    expected_kind = InquirySubmission.Kind.ASTA_CAREERS
    phone = serializers.CharField(max_length=40, required=False, allow_blank=True)
    interest = serializers.CharField(max_length=80)
    workPreference = serializers.CharField(max_length=80)
    profileUrl = serializers.URLField(max_length=400, required=False, allow_blank=True)
    consent = serializers.BooleanField()

    def validate_consent(self, value):
        if not value:
            raise serializers.ValidationError("Consent is required.")
        return value


SERIALIZERS = {
    InquirySubmission.Kind.PORTFOLIO_CONTACT: PortfolioInquirySerializer,
    InquirySubmission.Kind.ASTA_PROJECT: AstaProjectInquirySerializer,
    InquirySubmission.Kind.ASTA_CAREERS: AstaCareersInquirySerializer,
}


def payload_fingerprint(kind, name, email, details):
    payload = json.dumps(
        {"kind": kind, "name": name, "email": email, "details": details},
        sort_keys=True,
        ensure_ascii=False,
        separators=(",", ":"),
    )
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def status_response(submission, *, created=False):
    delivery_status = submission.delivery_status
    return Response(
        {
            "ok": delivery_status == InquirySubmission.DeliveryStatus.SENT,
            "submissionId": str(submission.pk),
            "deliveryStatus": delivery_status,
        },
        status=status.HTTP_201_CREATED if created and delivery_status == InquirySubmission.DeliveryStatus.SENT else (
            status.HTTP_200_OK if delivery_status == InquirySubmission.DeliveryStatus.SENT else status.HTTP_202_ACCEPTED
        ),
    )


class InquirySubmissionView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    parser_classes = [JSONParser]
    throttle_classes = [InquiryRateThrottle]

    def post(self, request):
        if len(request.body) > MAX_BODY_BYTES:
            return Response({"error": "PAYLOAD_TOO_LARGE"}, status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE)
        if not isinstance(request.data, dict):
            return Response({"error": "INVALID_JSON"}, status=status.HTTP_400_BAD_REQUEST)

        # A successful-looking response prevents the hidden trap from teaching bots how to bypass it.
        honeypot = request.data.get("companyWebsite", "")
        if isinstance(honeypot, str) and honeypot.strip():
            return Response({"ok": True, "deliveryStatus": "sent"})

        kind = request.data.get("kind")
        serializer_class = SERIALIZERS.get(kind) if isinstance(kind, str) else None
        if serializer_class is None:
            return Response({"error": "VALIDATION_ERROR", "fields": {"kind": ["Unknown inquiry kind."]}}, status=status.HTTP_400_BAD_REQUEST)
        serializer = serializer_class(data=request.data)
        if not serializer.is_valid():
            return Response({"error": "VALIDATION_ERROR", "fields": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        if not inquiry_service_configured():
            return Response({"error": "INQUIRY_SERVICE_UNAVAILABLE"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        data = serializer.validated_data
        details = {
            key: value for key, value in data.items()
            if key not in {"kind", "submissionId", "name", "email", "turnstileToken", "companyWebsite"}
        }
        fingerprint = payload_fingerprint(data["kind"], data["name"], data["email"], details)
        existing = InquirySubmission.objects.filter(pk=data["submissionId"]).first()
        if existing:
            if existing.payload_hash != fingerprint:
                return Response({"error": "SUBMISSION_ID_CONFLICT"}, status=status.HTTP_409_CONFLICT)
            return status_response(existing)

        if not verify_turnstile(data["turnstileToken"], TURNSTILE_ACTIONS[data["kind"]]):
            return Response({"error": "BOT_VERIFICATION_FAILED"}, status=status.HTTP_400_BAD_REQUEST)

        submission, created = InquirySubmission.objects.get_or_create(
            pk=data["submissionId"],
            defaults={
                "kind": data["kind"],
                "name": data["name"],
                "email": data["email"],
                "details": details,
                "payload_hash": fingerprint,
            },
        )
        if not created:
            if submission.payload_hash != fingerprint:
                return Response({"error": "SUBMISSION_ID_CONFLICT"}, status=status.HTTP_409_CONFLICT)
            return status_response(submission)

        deliver_inquiry(submission)
        return status_response(submission, created=True)
