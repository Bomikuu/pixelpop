import re
import secrets
from datetime import timedelta

from django.db import models, transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from client_workflow.models import ProjectDocument


PLACEHOLDER = re.compile(r"\{\{[^{}]*\}\}")
EXPIRY_DAYS = {"7": 7, "30": 30, "never": None}


@transaction.atomic
def publish_document(document: ProjectDocument, expiry: str) -> ProjectDocument:
    if not isinstance(expiry, str) or expiry not in EXPIRY_DAYS:
        raise ValidationError({"expiry": "Choose 7 days, 30 days, or no expiry."})
    document = ProjectDocument.objects.select_for_update().get(pk=document.pk)
    if not document.title.strip() or not document.body.strip():
        raise ValidationError({"document": "Save a title and document content before publishing."})
    if PLACEHOLDER.search(document.title) or PLACEHOLDER.search(document.body):
        raise ValidationError({"document": "Replace all {{placeholders}} before publishing."})
    now = timezone.now()
    document.share_token = secrets.token_urlsafe(32)
    document.published_title = document.title
    document.published_body = document.body
    document.published_at = now
    days = EXPIRY_DAYS[expiry]
    document.share_expires_at = now + timedelta(days=days) if days else None
    document.save(update_fields=("share_token", "published_title", "published_body", "published_at", "share_expires_at"))
    return document


@transaction.atomic
def revoke_document(document: ProjectDocument) -> ProjectDocument:
    document = ProjectDocument.objects.select_for_update().get(pk=document.pk)
    document.share_token = None
    document.published_title = None
    document.published_body = None
    document.published_at = None
    document.share_expires_at = None
    document.save(update_fields=("share_token", "published_title", "published_body", "published_at", "share_expires_at"))
    return document


def resolve_public_document(token: str) -> ProjectDocument | None:
    if not token or len(token) > 96:
        return None
    return ProjectDocument.objects.filter(share_token=token, published_at__isnull=False, published_title__isnull=False, published_body__isnull=False).filter(
        models.Q(share_expires_at__isnull=True) | models.Q(share_expires_at__gt=timezone.now())
    ).first()
