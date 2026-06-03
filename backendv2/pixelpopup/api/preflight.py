from __future__ import annotations

import copy
from typing import Any, Dict, List, Set, Tuple

from rest_framework.exceptions import ValidationError

from pixelpopup.models import Page, Scene, Asset
from pixelpopup.api.validation import validate_scene_data


def _collect_refs(data: dict):
    used_assets = set()
    used_scenes = set()
    used_targets = set()

    bg = data.get("background") or {}
    if isinstance(bg, dict) and bg.get("asset_id"):
        used_assets.add(str(bg["asset_id"]))

    au = data.get("audio") or {}
    if isinstance(au, dict) and au.get("asset_id"):
        used_assets.add(str(au["asset_id"]))

    letter = data.get("letter") or {}
    if isinstance(letter, dict) and letter.get("image_fill_asset_id"):
        used_assets.add(str(letter["image_fill_asset_id"]))

    map_block = data.get("map") or {}
    if isinstance(map_block, dict) and map_block.get("map_asset_id"):
        used_assets.add(str(map_block["map_asset_id"]))

    exploration = data.get("exploration") or {}
    if isinstance(exploration, dict):
        for k in ("world_asset_id", "player_sprite_asset_id"):
            if exploration.get(k):
                used_assets.add(str(exploration[k]))

    # traverse objects->triggers->actions
    for obj in (data.get("objects") or []):
        if not isinstance(obj, dict):
            continue
        content = obj.get("content") or {}
        if isinstance(content, dict):
            if content.get("asset_id"):
                used_assets.add(str(content["asset_id"]))
            media = content.get("media")
            if isinstance(media, list):
                for m in media:
                    if isinstance(m, dict) and m.get("asset_id"):
                        used_assets.add(str(m["asset_id"]))

        for t in (obj.get("triggers") or []):
            if not isinstance(t, dict):
                continue
            for a in (t.get("do") or []):
                if not isinstance(a, dict):
                    continue
                act = a.get("action")

                if act in {"open_popup", "close_popup", "unlock", "reveal", "set_text"}:
                    if a.get("target_id"):
                        used_targets.add(str(a["target_id"]))

                if act == "go_to_scene":
                    if a.get("scene_id"):
                        used_scenes.add(str(a["scene_id"]))

                if act == "branch":
                    for case in (a.get("cases") or []):
                        if isinstance(case, dict) and case.get("scene_id"):
                            used_scenes.add(str(case["scene_id"]))
                    if a.get("default_scene_id"):
                        used_scenes.add(str(a["default_scene_id"]))

                if act in {"play_sound", "set_audio", "set_image"}:
                    if a.get("asset_id"):
                        used_assets.add(str(a["asset_id"]))

    return used_assets, used_scenes, used_targets


def run_page_preflight(page: Page) -> Dict[str, Any]:
    """
    Returns a dict:
      { ok: bool, issues: [..], start_scene_key: str }
    Does not mutate the DB.
    """
    issues: List[Dict[str, Any]] = []

    scenes = list(Scene.objects.filter(page=page).order_by("order", "id"))
    if not scenes:
        return {"ok": False, "issues": [{"code": "NO_SCENES", "message": "Page has no scenes."}], "start_scene_key": ""}

    start_scene_key = scenes[0].key

    scene_keys: Set[str] = {s.key for s in scenes}
    asset_ids: Set[str] = set(map(str, Asset.objects.filter(page=page).values_list("id", flat=True)))

    for sc in scenes:
        # 1) Structural schema validation
        try:
            validate_scene_data(sc.type, sc.data or {})
        except ValidationError as ve:
            issues.append({
                "code": "SCENE_SCHEMA_INVALID",
                "scene_key": sc.key,
                "detail": ve.detail,
            })
            continue

        # 2) Reference validation
        data = sc.data or {}
        used_assets, used_scenes, used_targets = _collect_refs(data)

        missing_assets = sorted(list(set(used_assets) - asset_ids))
        if missing_assets:
            issues.append({
                "code": "MISSING_ASSETS",
                "scene_key": sc.key,
                "missing_assets": missing_assets,
            })

        missing_scenes = sorted(list(set(used_scenes) - scene_keys))
        if missing_scenes:
            issues.append({
                "code": "MISSING_SCENES",
                "scene_key": sc.key,
                "missing_scenes": missing_scenes,
            })

        # Best-effort target validation
        obj_ids = set()
        for obj in (data.get("objects") or []):
            if isinstance(obj, dict) and isinstance(obj.get("id"), str):
                obj_ids.add(obj["id"])

        missing_targets = sorted(list(set(used_targets) - obj_ids))
        if missing_targets:
            issues.append({
                "code": "MISSING_TARGETS",
                "scene_key": sc.key,
                "missing_targets": missing_targets,
            })

    return {"ok": len(issues) == 0, "issues": issues, "start_scene_key": start_scene_key}
