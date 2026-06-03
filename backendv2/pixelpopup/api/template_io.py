# pixelpopup/api/template_io.py
from __future__ import annotations

import copy
from typing import Any, Dict, List, Optional, Tuple

from django.core.files.storage import default_storage
from django.utils.text import slugify

from pixelpopup.models import Page, Scene, Asset


TEMPLATE_VERSION = "1.0"


def unique_slug(desired: str) -> str:
    base = slugify(desired)[:70] or "page"
    slug = base
    i = 2
    while Page.objects.filter(slug=slug).exists():
        suffix = f"-{i}"
        slug = f"{base[: max(1, 80 - len(suffix))]}{suffix}"
        i += 1
    return slug


def export_page_template(page: Page, request=None) -> Dict[str, Any]:
    scenes = list(Scene.objects.filter(page=page).order_by("order", "id"))
    assets = list(Asset.objects.filter(page=page).order_by("id"))

    exported_assets: List[Dict[str, Any]] = []
    for a in assets:
        file_url = ""
        if a.file:
            try:
                url = a.file.url
                file_url = request.build_absolute_uri(url) if request else url
            except Exception:
                file_url = ""
        exported_assets.append({
            "id": str(a.id),
            "type": a.type,
            "label": a.label,
            "mime": a.mime,
            "meta": copy.deepcopy(a.meta or {}),
            "file": {
                "name": a.file.name if a.file else "",
                "url": file_url,
            },
        })

    exported_scenes: List[Dict[str, Any]] = []
    for s in scenes:
        exported_scenes.append({
            "key": s.key,
            "type": s.type,
            "order": s.order,
            "data": copy.deepcopy(s.data or {}),
            "renderer": copy.deepcopy(s.renderer) if s.renderer else None,
            "theme_override_id": s.theme_override_id or "",
            "theme_override_settings": copy.deepcopy(s.theme_override_settings or {}),
        })

    return {
        "template_version": TEMPLATE_VERSION,
        "kind": "pixelpopup_page_template",
        "page": {
            "title": page.title,
            "theme_id": page.theme_id,
            "theme_settings": copy.deepcopy(page.theme_settings or {}),
            "variables": copy.deepcopy(page.variables or {}),
            "renderer": copy.deepcopy(page.renderer) if page.renderer else None,
        },
        "assets": exported_assets,
        "scenes": exported_scenes,
    }


def import_page_template(
    template: Dict[str, Any],
    *,
    slug: str,
    title: Optional[str] = None,
    owner_id: Optional[int] = None,
    reuse_assets_by_filename: bool = True,
) -> Tuple[Page, Dict[str, Any]]:
    """
    Imports template into a NEW draft Page.
    Returns (page, report).
    """
    report = {"warnings": [], "assets_created": 0, "scenes_created": 0}

    page_block = template.get("page") or {}
    scenes_block = template.get("scenes") or []
    assets_block = template.get("assets") or []

    new_page = Page.objects.create(
        owner_id=owner_id,
        slug=unique_slug(slug),
        title=title or page_block.get("title", "") or "",
        status="draft",
        password_enabled=False,
        password_hash="",
        expires_at=None,
        theme_id=page_block.get("theme_id", "colorful_pop_v1"),
        theme_settings=copy.deepcopy(page_block.get("theme_settings") or {}),
        variables=copy.deepcopy(page_block.get("variables") or {}),
        renderer=copy.deepcopy(page_block.get("renderer")) if page_block.get("renderer") else None,
    )

    # Asset import strategy (MVP):
    # - If reuse_assets_by_filename: create Asset rows reusing same file.name if exists in storage
    # - If missing, skip asset creation + warn
    # NOTE: scene.data references will still point to old asset IDs; you'll fix mapping later if you implement remap.
    # MVP recommendation: use stable asset "labels" or future "asset_key" instead of raw DB ids in scene.data.
    for a in assets_block:
        file_name = ((a.get("file") or {}).get("name") or "").strip()
        if not file_name:
            report["warnings"].append(f"Asset missing file.name; skipped label={a.get('label')}")
            continue

        if reuse_assets_by_filename:
            if not default_storage.exists(file_name):
                report["warnings"].append(f"Asset file not found in storage: {file_name} (skipped)")
                continue

            # Reuse file reference (no physical copy)
            Asset.objects.create(
                page=new_page,
                type=a.get("type", "other"),
                file=file_name,
                mime=a.get("mime", ""),
                meta=copy.deepcopy(a.get("meta") or {}),
                label=a.get("label", ""),
            )
            report["assets_created"] += 1

    # Create scenes (data structure only)
    for s in scenes_block:
        Scene.objects.create(
            page=new_page,
            key=s.get("key"),
            type=s.get("type"),
            order=int(s.get("order") or 0),
            data=copy.deepcopy(s.get("data") or {}),
            renderer=copy.deepcopy(s.get("renderer")) if s.get("renderer") else None,
            theme_override_id=s.get("theme_override_id") or "",
            theme_override_settings=copy.deepcopy(s.get("theme_override_settings") or {}),
        )
        report["scenes_created"] += 1

    return new_page, report
