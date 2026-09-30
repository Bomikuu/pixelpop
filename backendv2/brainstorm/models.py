import uuid

from django.core.exceptions import ValidationError
from django.db import models
from django.db.models.functions import Lower
from django.utils.text import slugify

from .services.fingerprints import fingerprint_title


def _slug(name, fallback):
    return f"{slugify(name, allow_unicode=True)[:55] or fallback}-{uuid.uuid4().hex[:8]}"


class BrainstormBoard(models.Model):
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=70, unique=True, allow_unicode=True, blank=True)
    description = models.TextField(max_length=4000, blank=True)
    sort_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "id"]
        constraints = [models.UniqueConstraint(Lower("name"), name="brainstorm_board_name_ci")]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = _slug(self.name, "board")
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class BrainstormGroup(models.Model):
    board = models.ForeignKey(BrainstormBoard, on_delete=models.CASCADE, related_name="groups")
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=70, allow_unicode=True, blank=True)
    description = models.TextField(max_length=4000, blank=True)
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "id"]
        constraints = [
            models.UniqueConstraint(Lower("name"), models.F("board"), name="brainstorm_group_name_ci"),
            models.UniqueConstraint(fields=["board", "slug"], name="brainstorm_group_slug"),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = _slug(self.name, "group")
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class BrainstormIdea(models.Model):
    URGENCIES = [(value, value.title()) for value in ("high", "medium", "low", "someday")]
    STATUSES = [(value, value.replace("_", " ").title()) for value in ("inbox", "planned", "in_progress", "carried_over", "done", "archived")]

    board = models.ForeignKey(BrainstormBoard, on_delete=models.CASCADE, related_name="ideas")
    group = models.ForeignKey(BrainstormGroup, on_delete=models.PROTECT, related_name="ideas")
    title = models.CharField(max_length=160)
    description = models.TextField(max_length=4000, blank=True)
    source_text = models.TextField(max_length=4000, blank=True)
    urgency = models.CharField(max_length=12, choices=URGENCIES, default="medium")
    status = models.CharField(max_length=16, choices=STATUSES, default="inbox")
    tags = models.JSONField(default=list, blank=True)
    reference_url = models.URLField(max_length=2048, blank=True)
    notes = models.TextField(max_length=4000, blank=True)
    fingerprint = models.CharField(max_length=180, editable=False)
    sort_order = models.IntegerField(default=0)
    task = models.OneToOneField("finance.Deadline", null=True, blank=True, on_delete=models.SET_NULL, related_name="brainstorm_idea")
    carried_over_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at", "-id"]
        constraints = [models.UniqueConstraint(fields=["board", "fingerprint"], name="brainstorm_idea_fingerprint")]
        indexes = [models.Index(fields=["board", "status", "urgency"], name="brainstorm_idea_filters")]

    def save(self, *args, **kwargs):
        if self.group_id and self.group.board_id != self.board_id:
            raise ValidationError({"group": "Choose a group from this board."})
        self.fingerprint = fingerprint_title(self.title)
        if not self.fingerprint:
            raise ValidationError({"title": "Enter an idea title with letters or numbers."})
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title
