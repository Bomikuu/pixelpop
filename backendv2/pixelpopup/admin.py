from django.contrib import admin, messages
from django.db import models

from django_json_widget.widgets import JSONEditorWidget
from import_export.admin import ImportExportModelAdmin

from .models import (
    Article,
    ArticleCategory,
    ArticleTag,
    Asset,
    ClientRequest,
    InquirySubmission,
    CoverLetter,
    CoverLetterTemplate,
    JobApplication,
    Page,
    Payment,
    ProfessionalProfile,
    Scene,
)
from pixelpopup.api.preflight import run_page_preflight
from pixelpopup.api.inquiry_service import inquiry_service_configured, retry_failed_inquiry


JSON_WIDGET = JSONEditorWidget(
    options={
        "mode": "tree",  # tree | code | form | view
        "modes": ["tree", "code"],
        "search": True,
    },
)


@admin.action(description="Retry selected failed inquiry notifications")
def retry_inquiry_notifications(modeladmin, request, queryset):
    if not inquiry_service_configured():
        messages.error(request, "Inquiry email delivery is not configured.")
        return
    retried = sum(retry_failed_inquiry(submission) for submission in queryset)
    if retried:
        messages.info(request, f"Retried {retried} inquiry notification(s). Check delivery status for the result.")
    if retried < queryset.count():
        messages.warning(request, "Some inquiries were skipped because they were not failed or need review after 24 hours.")


@admin.register(InquirySubmission)
class InquirySubmissionAdmin(admin.ModelAdmin):
    list_display = ("created_at", "kind", "name", "email", "delivery_status", "failure_category")
    list_filter = ("kind", "delivery_status", "created_at")
    search_fields = ("name", "email", "resend_message_id")
    readonly_fields = (
        "id", "kind", "name", "email", "details", "payload_hash", "delivery_status",
        "resend_message_id", "failure_category", "last_attempt_at", "created_at", "updated_at",
    )
    actions = [retry_inquiry_notifications]

    def has_add_permission(self, request):
        return False


# ---------- Inlines ----------

class SceneInline(admin.TabularInline):
    model = Scene
    extra = 0
    fields = ("order", "key", "type", "theme_override_id", "updated_at")
    readonly_fields = ("updated_at",)
    ordering = ("order", "id")
    show_change_link = True


class AssetInline(admin.TabularInline):
    model = Asset
    extra = 0
    fields = ("label", "type", "file", "mime", "created_at")
    readonly_fields = ("created_at",)
    show_change_link = True


class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0
    fields = ("amount", "currency", "method", "status", "reference_code", "paid_at", "receipt")
    readonly_fields = ()
    show_change_link = True


class CoverLetterInline(admin.TabularInline):
    model = CoverLetter
    extra = 0
    fields = ("version", "slug", "subject", "status", "profile", "published_at", "updated_at")
    readonly_fields = ("updated_at",)
    ordering = ("-version",)
    show_change_link = True


# ---------- Admin Actions ----------

@admin.action(description="Preflight + publish selected pages")
def preflight_and_publish(modeladmin, request, queryset):
    for page in queryset:
        result = run_page_preflight(page)
        if not result["ok"]:
            messages.error(
                request,
                f"[{page.slug}] Failed preflight: {len(result['issues'])} issue(s)."
            )
            continue
        page.status = "published"
        page.save(update_fields=["status", "updated_at"])
        messages.success(request, f"[{page.slug}] Published.")


# ---------- Admins ----------

@admin.register(Page)
class PageAdmin(admin.ModelAdmin):
    formfield_overrides = {
        models.JSONField: {"widget": JSON_WIDGET},
    }

    list_display = ("slug", "title", "status", "theme_id", "owner", "password_enabled", "expires_at", "updated_at")
    list_filter = ("status", "theme_id", "password_enabled")
    search_fields = ("slug", "title")
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        ("Core", {"fields": ("owner", "slug", "title", "status")}),
        ("Privacy", {"fields": ("password_enabled", "password_hash", "expires_at")}),
        ("Theme", {"fields": ("theme_id", "theme_settings")}),
        ("Variables", {"fields": ("variables",)}),
        ("Custom Renderer (Optional)", {"fields": ("renderer",)}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )
    inlines = [SceneInline, AssetInline]
    actions = [preflight_and_publish]


@admin.register(Scene)
class SceneAdmin(admin.ModelAdmin):
    formfield_overrides = {
        models.JSONField: {"widget": JSON_WIDGET},
    }

    list_display = ("page", "order", "key", "type", "theme_override_id", "updated_at")
    list_filter = ("type", "theme_override_id")
    search_fields = ("key", "page__slug")
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        ("Core", {"fields": ("page", "order", "key", "type")}),
        ("Scene Data (JSON)", {"fields": ("data",)}),
        ("Custom Renderer (Optional)", {"fields": ("renderer",)}),
        ("Theme Override (Optional)", {"fields": ("theme_override_id", "theme_override_settings")}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )


@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    formfield_overrides = {
        models.JSONField: {"widget": JSON_WIDGET},
    }

    list_display = ("page", "label", "type", "mime", "created_at")
    list_filter = ("type",)
    search_fields = ("label", "page__slug", "file")
    readonly_fields = ("created_at",)


@admin.register(ClientRequest)
class ClientRequestAdmin(admin.ModelAdmin):
    formfield_overrides = {
        models.JSONField: {"widget": JSON_WIDGET},
    }

    list_display = ("id", "client_name", "occasion", "status", "price_quote", "currency", "assigned_to", "page", "updated_at")
    list_filter = ("status", "occasion", "assigned_to", "source")
    search_fields = ("client_name", "client_contact", "occasion", "brief")
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        ("Client", {"fields": ("client_name", "client_contact", "source")}),
        ("Request", {"fields": ("occasion", "brief", "inputs")}),
        ("Workflow", {"fields": ("status", "price_quote", "currency", "assigned_to", "due_at", "page")}),
        ("Internal Notes", {"fields": ("notes_internal",)}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )
    inlines = [PaymentInline]


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("request", "amount", "currency", "method", "status", "reference_code", "paid_at", "created_at")
    list_filter = ("status", "method", "currency")
    search_fields = ("reference_code", "request__client_name", "request__client_contact")
    readonly_fields = ("created_at", "updated_at")


@admin.register(ProfessionalProfile)
class ProfessionalProfileAdmin(ImportExportModelAdmin):
    list_display = ("full_name", "headline", "email", "is_active", "updated_at")
    list_filter = ("is_active",)
    search_fields = ("full_name", "headline", "email")
    prepopulated_fields = {"slug": ("full_name",)}
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        ("Identity", {"fields": ("slug", "full_name", "headline", "professional_summary", "signature")}),
        ("Contact", {"fields": ("email", "phone", "location")}),
        ("Public links", {"fields": ("website_url", "linkedin_url", "github_url", "resume_url")}),
        ("Publishing", {"fields": ("is_active",)}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )


@admin.register(CoverLetterTemplate)
class CoverLetterTemplateAdmin(ImportExportModelAdmin):
    list_display = ("name", "slug", "is_active", "updated_at")
    list_filter = ("is_active",)
    search_fields = ("name", "description")
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ("created_at", "updated_at")


@admin.register(JobApplication)
class JobApplicationAdmin(ImportExportModelAdmin):
    list_display = ("job_title", "company_name", "status", "recipient_name", "source", "applied_at", "updated_at")
    list_filter = ("status", "source", "applied_at")
    search_fields = ("job_title", "company_name", "recipient_name", "recipient_email")
    prepopulated_fields = {"slug": ("company_name", "job_title")}
    readonly_fields = ("created_at", "updated_at")
    date_hierarchy = "created_at"
    inlines = [CoverLetterInline]
    fieldsets = (
        ("Opportunity", {"fields": ("slug", "company_name", "company_website", "job_title", "job_url", "source")}),
        ("Recipient", {"fields": ("recipient_name", "recipient_title", "recipient_email")}),
        ("Application status", {"fields": ("status", "applied_at", "created_by")}),
        ("Private context", {"fields": ("job_description", "notes_private"), "classes": ("collapse",)}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )


@admin.action(description="Publish selected cover letters")
def publish_cover_letters(modeladmin, request, queryset):
    for cover_letter in queryset:
        cover_letter.status = "published"
        cover_letter.save()


@admin.register(CoverLetter)
class CoverLetterAdmin(ImportExportModelAdmin):
    list_display = ("subject", "application", "version", "status", "profile", "published_at", "updated_at")
    list_filter = ("status", "profile", "template", "published_at")
    search_fields = ("subject", "application__company_name", "application__job_title", "body")
    autocomplete_fields = ("application", "profile", "template")
    readonly_fields = ("created_at", "updated_at")
    date_hierarchy = "created_at"
    actions = [publish_cover_letters]
    fieldsets = (
        ("Application", {"fields": ("application", "profile", "template", "slug", "version")}),
        ("Letter", {"fields": ("subject", "opening", "body", "closing", "highlights")}),
        ("Publishing", {"fields": ("status", "published_at")}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )


@admin.register(ArticleCategory)
class ArticleCategoryAdmin(ImportExportModelAdmin):
    list_display = ("name", "slug", "order")
    list_editable = ("order",)
    search_fields = ("name", "description")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(ArticleTag)
class ArticleTagAdmin(ImportExportModelAdmin):
    list_display = ("name", "slug")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}


@admin.action(description="Publish selected articles")
def publish_articles(modeladmin, request, queryset):
    for article in queryset:
        article.status = "published"
        article.save()


@admin.register(Article)
class ArticleAdmin(ImportExportModelAdmin):
    list_display = ("title", "category", "status", "is_featured", "author_profile", "published_at", "updated_at")
    list_filter = ("status", "is_featured", "category", "tags", "published_at")
    search_fields = ("title", "excerpt", "content")
    prepopulated_fields = {"slug": ("title",)}
    autocomplete_fields = ("category", "tags", "author")
    readonly_fields = ("author_profile", "created_at", "updated_at")
    date_hierarchy = "created_at"
    actions = [publish_articles]
    fieldsets = (
        ("Article", {"fields": ("title", "slug", "excerpt", "content", "content_format")}),
        ("Organization", {"fields": ("category", "tags", "author_profile", "author")}),
        ("Media", {"fields": ("cover_image", "cover_image_alt")}),
        ("Search", {"fields": ("seo_title", "seo_description"), "classes": ("collapse",)}),
        ("Publishing", {"fields": ("status", "is_featured", "published_at")}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )

    def save_model(self, request, obj, form, change):
        if not obj.author_id:
            obj.author = request.user
        super().save_model(request, obj, form, change)


admin.site.site_header = "PixelPopup Administration"
admin.site.site_title = "PixelPopup Admin"
admin.site.index_title = "Content and portfolio management"
