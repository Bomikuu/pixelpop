from django.contrib import admin, messages
from django.db import models

from django_json_widget.widgets import JSONEditorWidget

from .models import ClientRequest, Payment, Page, Scene, Asset
from pixelpopup.api.preflight import run_page_preflight


JSON_WIDGET = JSONEditorWidget(
    options={
        "mode": "tree",  # tree | code | form | view
        "modes": ["tree", "code"],
        "search": True,
    },
)


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
