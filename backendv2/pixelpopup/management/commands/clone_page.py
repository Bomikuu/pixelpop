from __future__ import annotations

import copy
from typing import Optional

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.text import slugify

from pixelpopup.models import Page, Scene, Asset


def _unique_slug(base: str) -> str:
    base = slugify(base)[:70] or "page"
    slug = base
    i = 2
    while Page.objects.filter(slug=slug).exists():
        suffix = f"-{i}"
        slug = f"{base[: max(1, 80 - len(suffix))]}{suffix}"
        i += 1
    return slug


class Command(BaseCommand):
    help = "Clone a PixelPopup Page (and its scenes/assets) into a new draft."

    def add_arguments(self, parser):
        parser.add_argument("page_id", type=int, help="ID of the Page to clone")

        parser.add_argument(
            "--slug",
            type=str,
            default=None,
            help="Slug for the cloned page (auto-generated if omitted)",
        )

        parser.add_argument(
            "--title",
            type=str,
            default=None,
            help="Title for the cloned page (defaults to 'Copy of <original>')",
        )

        parser.add_argument(
            "--copy-assets",
            action="store_true",
            help="Copy Asset DB rows to new Page (keeps the same underlying file path).",
        )

        parser.add_argument(
            "--reset-password",
            action="store_true",
            help="Disable password on the cloned page (recommended).",
        )

        parser.add_argument(
            "--reset-expiry",
            action="store_true",
            help="Clear expires_at on the cloned page (recommended).",
        )

        parser.add_argument(
            "--owner-id",
            type=int,
            default=None,
            help="Set owner_id on the cloned page (optional).",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        page_id: int = options["page_id"]
        slug: Optional[str] = options["slug"]
        title: Optional[str] = options["title"]
        copy_assets: bool = options["copy_assets"]
        reset_password: bool = options["reset_password"]
        reset_expiry: bool = options["reset_expiry"]
        owner_id: Optional[int] = options["owner_id"]

        try:
            original = Page.objects.get(id=page_id)
        except Page.DoesNotExist:
            raise CommandError(f"Page {page_id} not found.")

        new_slug = _unique_slug(slug or f"{original.slug}-copy")
        new_title = title or (f"Copy of {original.title}" if original.title else f"Copy of {original.slug}")

        # Clone Page
        cloned = Page.objects.create(
            owner_id=owner_id if owner_id is not None else original.owner_id,
            slug=new_slug,
            title=new_title,
            status="draft",
            password_enabled=False if reset_password else original.password_enabled,
            password_hash="" if reset_password else original.password_hash,
            expires_at=None if reset_expiry else original.expires_at,
            theme_id=original.theme_id,
            theme_settings=copy.deepcopy(original.theme_settings or {}),
            variables=copy.deepcopy(original.variables or {}),
            renderer=copy.deepcopy(original.renderer) if original.renderer else None,
        )

        # Clone Scenes (preserve keys + order)
        scenes = list(Scene.objects.filter(page=original).order_by("order", "id"))
        for sc in scenes:
            Scene.objects.create(
                page=cloned,
                key=sc.key,
                type=sc.type,
                order=sc.order,
                data=copy.deepcopy(sc.data or {}),
                renderer=copy.deepcopy(sc.renderer) if sc.renderer else None,
                theme_override_id=sc.theme_override_id or "",
                theme_override_settings=copy.deepcopy(sc.theme_override_settings or {}),
            )

        # Clone Assets (DB rows only; file path remains the same)
        if copy_assets:
            assets = list(Asset.objects.filter(page=original).order_by("id"))
            for a in assets:
                Asset.objects.create(
                    page=cloned,
                    type=a.type,
                    file=a.file,  # same stored file reference (no physical copy)
                    mime=a.mime or "",
                    meta=copy.deepcopy(a.meta or {}),
                    label=a.label or "",
                )

        self.stdout.write(self.style.SUCCESS(f"Cloned Page {original.id} → {cloned.id}"))
        self.stdout.write(f"New slug: {cloned.slug}")
        self.stdout.write(f"Scenes cloned: {len(scenes)}")
        self.stdout.write(f"Assets cloned: {Asset.objects.filter(page=cloned).count() if copy_assets else 0}")
