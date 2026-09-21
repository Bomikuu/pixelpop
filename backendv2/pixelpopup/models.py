from django.db import models
from django.conf import settings
from django.utils import timezone

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


def validate_list_value(value):
    if not isinstance(value, list):
        raise DjangoValidationError("This value must be a JSON list.")


class ProfessionalProfile(models.Model):
    slug = models.SlugField(max_length=80, unique=True)
    full_name = models.CharField(max_length=120)
    headline = models.CharField(max_length=180)
    professional_summary = models.TextField()
    email = models.EmailField()
    phone = models.CharField(max_length=40, blank=True, default="")
    location = models.CharField(max_length=120, blank=True, default="")
    website_url = models.URLField(blank=True, default="")
    linkedin_url = models.URLField(blank=True, default="")
    github_url = models.URLField(blank=True, default="")
    resume_url = models.URLField(blank=True, default="")
    signature = models.CharField(max_length=120, blank=True, default="")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["full_name"]

    def __str__(self):
        return self.full_name


class CoverLetterTemplate(models.Model):
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.CharField(max_length=240, blank=True, default="")
    subject_template = models.CharField(
        max_length=200,
        blank=True,
        default="Application for {job_title} at {company_name}",
    )
    opening_template = models.TextField()
    body_template = models.TextField()
    closing_template = models.TextField()
    default_highlights = models.JSONField(
        default=list,
        blank=True,
        validators=[validate_list_value],
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class JobApplication(models.Model):
    STATUS = [
        ("draft", "Draft"),
        ("applied", "Applied"),
        ("interview", "Interview"),
        ("offer", "Offer"),
        ("rejected", "Rejected"),
        ("withdrawn", "Withdrawn"),
        ("closed", "Closed"),
    ]

    slug = models.SlugField(max_length=140, unique=True)
    company_name = models.CharField(max_length=160)
    company_website = models.URLField(blank=True, default="")
    job_title = models.CharField(max_length=160)
    job_url = models.URLField(blank=True, default="")
    recipient_name = models.CharField(max_length=120, blank=True, default="Hiring Manager")
    recipient_title = models.CharField(max_length=120, blank=True, default="")
    recipient_email = models.EmailField(blank=True, default="")
    source = models.CharField(max_length=80, blank=True, default="")
    job_description = models.TextField(blank=True, default="")
    notes_private = models.TextField(blank=True, default="")
    status = models.CharField(max_length=16, choices=STATUS, default="draft")
    applied_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="portfolio_job_applications",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.job_title} at {self.company_name}"


class CoverLetter(models.Model):
    STATUS = [
        ("draft", "Draft"),
        ("published", "Published"),
        ("archived", "Archived"),
    ]

    application = models.ForeignKey(
        JobApplication,
        on_delete=models.CASCADE,
        related_name="cover_letters",
    )
    profile = models.ForeignKey(
        ProfessionalProfile,
        on_delete=models.PROTECT,
        related_name="cover_letters",
    )
    template = models.ForeignKey(
        CoverLetterTemplate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="cover_letters",
    )
    slug = models.SlugField(max_length=160, unique=True)
    version = models.PositiveIntegerField(default=1)
    subject = models.CharField(max_length=200)
    opening = models.TextField()
    body = models.TextField()
    closing = models.TextField()
    highlights = models.JSONField(
        default=list,
        blank=True,
        validators=[validate_list_value],
    )
    status = models.CharField(max_length=12, choices=STATUS, default="draft")
    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["application", "version"],
                name="uniq_cover_letter_version_per_application",
            ),
        ]

    def save(self, *args, **kwargs):
        if self.status == "published" and self.published_at is None:
            self.published_at = timezone.now()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.application} (v{self.version})"


class ArticleCategory(models.Model):
    name = models.CharField(max_length=80, unique=True)
    slug = models.SlugField(max_length=80, unique=True)
    description = models.CharField(max_length=240, blank=True, default="")
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "name"]
        verbose_name_plural = "article categories"

    def __str__(self):
        return self.name


class ArticleTag(models.Model):
    name = models.CharField(max_length=60, unique=True)
    slug = models.SlugField(max_length=60, unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Article(models.Model):
    STATUS = [
        ("draft", "Draft"),
        ("published", "Published"),
        ("archived", "Archived"),
    ]
    CONTENT_FORMAT = [
        ("markdown", "Markdown"),
        ("plain", "Plain text"),
    ]

    title = models.CharField(max_length=180)
    slug = models.SlugField(max_length=180, unique=True)
    excerpt = models.CharField(max_length=320)
    content = models.TextField()
    content_format = models.CharField(
        max_length=12,
        choices=CONTENT_FORMAT,
        default="markdown",
    )
    category = models.ForeignKey(
        ArticleCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="articles",
    )
    tags = models.ManyToManyField(ArticleTag, blank=True, related_name="articles")
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="portfolio_articles",
    )
    author_profile = models.ForeignKey(
        ProfessionalProfile,
        on_delete=models.PROTECT,
        related_name="articles",
    )
    cover_image = models.ImageField(
        upload_to="portfolio/articles/%Y/%m/",
        null=True,
        blank=True,
    )
    cover_image_alt = models.CharField(max_length=180, blank=True, default="")
    seo_title = models.CharField(max_length=70, blank=True, default="")
    seo_description = models.CharField(max_length=170, blank=True, default="")
    status = models.CharField(max_length=12, choices=STATUS, default="draft")
    is_featured = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-published_at", "-created_at"]

    def save(self, *args, **kwargs):
        if not self.author_profile_id:
            profile_slug = settings.PORTFOLIO_AUTHOR_PROFILE_SLUG
            try:
                self.author_profile = ProfessionalProfile.objects.get(
                    slug=profile_slug,
                    is_active=True,
                )
            except ProfessionalProfile.DoesNotExist as error:
                raise DjangoValidationError(
                    f'Create an active professional profile with slug "{profile_slug}" before saving articles.'
                ) from error

            if kwargs.get("update_fields") is not None:
                kwargs["update_fields"] = set(kwargs["update_fields"]) | {"author_profile"}

        if self.status == "published" and self.published_at is None:
            self.published_at = timezone.now()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title
