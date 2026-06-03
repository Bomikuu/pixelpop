from django.db import models
from django.conf import settings

from django.core.exceptions import ValidationError as DjangoValidationError

class Page(models.Model):
    STATUS = [
        ("draft", "Draft"),
        ("published", "Published"),
        ("archived", "Archived"),
    ]

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="pixelpopup_pages"
    )

    slug = models.SlugField(max_length=80, unique=True)
    title = models.CharField(max_length=120, blank=True, default="")
    status = models.CharField(max_length=12, choices=STATUS, default="draft")

    # privacy/delivery
    password_enabled = models.BooleanField(default=False)
    password_hash = models.CharField(max_length=255, blank=True, default="")
    expires_at = models.DateTimeField(null=True, blank=True)

    # theme selection (definition lives in frontend)
    theme_id = models.CharField(max_length=80, blank=True, default="colorful_pop_v1")
    theme_settings = models.JSONField(default=dict, blank=True)  # optional overrides

    # page-level variables used by scenes (templating)
    variables = models.JSONField(default=dict, blank=True)

    # optional: admin custom react page override
    renderer = models.JSONField(null=True, blank=True)  # {type, component_key, props, version}

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Scene(models.Model):
    TYPE = [
        ("motion", "Motion"),
        ("question", "Question"),
        ("choice", "Choice"),
        ("timeline", "Timeline"),
        ("letter", "Letter"),
        ("map", "Map"),
        ("exploration", "Exploration"),
        ("finale", "Finale"),
    ]

    page = models.ForeignKey(Page, on_delete=models.CASCADE, related_name="scenes")

    # stable reference like sc_intro (unique per page)
    key = models.SlugField(max_length=80)

    type = models.CharField(max_length=16, choices=TYPE)
    order = models.PositiveIntegerField(default=0)

    # scene payload: background, audio, objects, triggers, plus type-specific blocks
    data = models.JSONField(default=dict, blank=True)

    # optional custom react scene override
    renderer = models.JSONField(null=True, blank=True)

    # optional per-scene theme override (still references frontend theme registry)
    theme_override_id = models.CharField(max_length=80, blank=True, default="")
    theme_override_settings = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["page", "key"], name="uniq_scene_key_per_page"),
        ]
        ordering = ["order", "id"]

    def clean(self):
        super().clean()
        try:
            from pixelpopup.api.validation import validate_scene_data
            validate_scene_data(self.type, self.data)
        except Exception as e:
            raise DjangoValidationError(str(e))

class Asset(models.Model):
    TYPE = [
        ("image", "Image"),
        ("video", "Video"),
        ("audio", "Audio"),
        ("gif", "GIF"),
        ("other", "Other"),
    ]

    page = models.ForeignKey(Page, on_delete=models.CASCADE, related_name="assets")
    type = models.CharField(max_length=10, choices=TYPE)

    file = models.FileField(upload_to="pixelpopup/assets/%Y/%m/")
    mime = models.CharField(max_length=100, blank=True, default="")
    meta = models.JSONField(default=dict, blank=True)  # width/height/duration_ms/etc

    label = models.CharField(max_length=120, blank=True, default="")  # “intro bg video”
    created_at = models.DateTimeField(auto_now_add=True)

class ClientRequest(models.Model):
    STATUS = [
        ("new", "New"),
        ("quoted", "Quoted"),
        ("waiting_payment", "Waiting for payment"),
        ("paid", "Paid"),
        ("in_progress", "In progress"),
        ("for_review", "For review"),
        ("delivered", "Delivered"),
        ("cancelled", "Cancelled"),
    ]

    # client info (no login required)
    client_name = models.CharField(max_length=120, blank=True, default="")
    client_contact = models.CharField(max_length=200, blank=True, default="")  # IG/Messenger/email/phone
    source = models.CharField(max_length=50, blank=True, default="")  # IG, FB, TikTok, referral, etc.

    occasion = models.CharField(max_length=80, blank=True, default="")  # valentines, birthday, anniversary...
    brief = models.TextField(blank=True, default="")  # instructions, story, notes

    # optional structured inputs (easy for future forms + AI)
    inputs = models.JSONField(default=dict, blank=True)
    # example: {recipient_name, dates, questions, answers, links, tone}

    price_quote = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(max_length=10, default="PHP")

    status = models.CharField(max_length=20, choices=STATUS, default="new")

    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="pixelpopup_assigned_requests"
    )

    # link to produced page
    page = models.OneToOneField(
        "Page",
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="request"
    )

    due_at = models.DateTimeField(null=True, blank=True)
    notes_internal = models.TextField(blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Payment(models.Model):
    STATUS = [
        ("pending", "Pending"),
        ("paid", "Paid"),
        ("failed", "Failed"),
        ("refunded", "Refunded"),
    ]
    METHOD = [
        ("gcash", "GCash"),
        ("maya", "Maya"),
        ("bank", "Bank Transfer"),
        ("cash", "Cash"),
        ("other", "Other"),
    ]

    request = models.ForeignKey(
        ClientRequest,
        on_delete=models.CASCADE,
        related_name="payments"
    )

    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default="PHP")

    method = models.CharField(max_length=20, choices=METHOD, default="gcash")
    status = models.CharField(max_length=20, choices=STATUS, default="pending")

    reference_code = models.CharField(max_length=120, blank=True, default="")
    receipt = models.FileField(upload_to="pixelpopup/receipts/%Y/%m/", null=True, blank=True)

    paid_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
