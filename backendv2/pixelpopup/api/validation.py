from typing import Any, Dict, List, Optional, Set, Tuple

from rest_framework.exceptions import ValidationError


ALLOWED_SCENE_TYPES: Set[str] = {
    "motion",
    "question",
    "choice",
    "timeline",
    "letter",
    "map",
    "exploration",
    "finale",
}

# Allow new keys later by adding here (keeps schema controlled)
COMMON_KEYS: Set[str] = {
    "background",
    "audio",
    "objects",
    "timeline",
    "question",
    "choice",
    "map",
    "exploration",
    "letter",
    "renderer",  # optional if you store scene renderer inside data (you currently have a field too)
}

ALLOWED_BACKGROUND_TYPES = {"video", "gif", "image", "gradient", "ui"}

ALLOWED_OBJECT_TYPES: Set[str] = {
    "text",
    "image",
    "sticker",
    "emoji",
    "button",
    "popup",
    "hotspot",
    "pin",
    "sprite",
    "window_card",
    "progress",
}

ALLOWED_TRIGGER_EVENTS: Set[str] = {
    "click",
    "hover",
    "enter",
    "timer",
    "scene_start",
    "answer_correct",
    "answer_wrong",
    "choice_selected",
    "reach_destination",
}

ALLOWED_ACTIONS: Set[str] = {
    "open_popup",
    "close_popup",
    "unlock",
    "reveal",
    "go_to_scene",
    "branch",
    "play_sound",
    "set_audio",
    "trigger_confetti",
    "screen_effect",
    "set_text",
    "set_image",
    "set_var",
    "end_experience",
}

ALLOWED_SCREEN_EFFECTS = {"shake", "flash", "zoom", "blur"}


def _is_dict(x: Any) -> bool:
    return isinstance(x, dict)


def _is_list(x: Any) -> bool:
    return isinstance(x, list)


def _err(path: str, msg: str) -> ValidationError:
    return ValidationError({path: msg})


def validate_scene_data(scene_type: Optional[str], data: Any) -> None:
    """
    Structural validation only (no DB lookups).
    DB reference validation is done in serializers.py with page context.
    """
    if scene_type not in ALLOWED_SCENE_TYPES:
        raise _err("type", f"Invalid scene type: {scene_type}")

    if not _is_dict(data):
        raise _err("data", "Scene.data must be an object/dict.")

    unknown = set(data.keys()) - COMMON_KEYS
    if unknown:
        raise _err("data", f"Unknown keys in Scene.data: {sorted(list(unknown))}")

    # Common blocks
    if "background" in data:
        _validate_background_block(data["background"])

    if "audio" in data:
        _validate_audio_block(data["audio"])

    objects = data.get("objects", [])
    if objects is not None:
        if not _is_list(objects):
            raise _err("data.objects", "Must be a list.")
        _validate_objects(objects)

    # Type-specific blocks
    if scene_type == "question":
        q = data.get("question")
        if not _is_dict(q):
            raise _err("data.question", "Question scene requires a 'question' object.")
        _validate_question_block(q)

    if scene_type == "choice":
        c = data.get("choice")
        if not _is_dict(c):
            raise _err("data.choice", "Choice scene requires a 'choice' object.")
        _validate_choice_block(c)

    if scene_type == "timeline":
        t = data.get("timeline")
        if not _is_dict(t):
            raise _err("data.timeline", "Timeline scene requires a 'timeline' object.")
        _validate_timeline_block(t)

    if scene_type == "letter":
        l = data.get("letter")
        if not _is_dict(l):
            raise _err("data.letter", "Letter scene requires a 'letter' object.")
        _validate_letter_block(l)

    if scene_type == "map":
        m = data.get("map")
        if not _is_dict(m):
            raise _err("data.map", "Map scene requires a 'map' object.")
        _validate_map_block(m)

    if scene_type == "exploration":
        e = data.get("exploration")
        if not _is_dict(e):
            raise _err("data.exploration", "Exploration scene requires an 'exploration' object.")
        _validate_exploration_block(e)


def _validate_background_block(bg: Any) -> None:
    if not _is_dict(bg):
        raise _err("data.background", "Must be an object.")
    bg_type = bg.get("type")
    if bg_type not in ALLOWED_BACKGROUND_TYPES:
        raise _err("data.background.type", f"Must be one of {sorted(ALLOWED_BACKGROUND_TYPES)}")

    # For media backgrounds, expect asset_id
    if bg_type in {"video", "gif", "image"}:
        if not bg.get("asset_id"):
            raise _err("data.background.asset_id", "asset_id is required for video/gif/image backgrounds.")

    # Optional numeric fields (best-effort)
    for k in ("dim", "blur"):
        if k in bg and bg[k] is not None and not isinstance(bg[k], (int, float)):
            raise _err(f"data.background.{k}", "Must be a number.")


def _validate_audio_block(a: Any) -> None:
    if not _is_dict(a):
        raise _err("data.audio", "Must be an object.")
    if "enabled" in a and not isinstance(a["enabled"], bool):
        raise _err("data.audio.enabled", "Must be boolean.")
    if a.get("enabled"):
        if not a.get("asset_id"):
            raise _err("data.audio.asset_id", "asset_id is required when audio.enabled is true.")
    if "volume" in a and a["volume"] is not None and not isinstance(a["volume"], (int, float)):
        raise _err("data.audio.volume", "Must be a number.")


def _validate_objects(objects: List[Any]) -> None:
    seen_ids: Set[str] = set()
    for i, obj in enumerate(objects):
        path = f"data.objects[{i}]"
        if not _is_dict(obj):
            raise _err(path, "Must be an object.")
        obj_id = obj.get("id")
        if not obj_id or not isinstance(obj_id, str):
            raise _err(f"{path}.id", "id is required and must be a string.")
        if obj_id in seen_ids:
            raise _err(f"{path}.id", f"Duplicate object id: {obj_id}")
        seen_ids.add(obj_id)

        obj_type = obj.get("type")
        if obj_type not in ALLOWED_OBJECT_TYPES:
            raise _err(f"{path}.type", f"Invalid object type: {obj_type}")

        # Layout (optional but recommended)
        layout = obj.get("layout")
        if layout is not None:
            _validate_layout(layout, f"{path}.layout")

        # State (optional)
        state = obj.get("state")
        if state is not None:
            _validate_state(state, f"{path}.state")

        # Motion (optional)
        motion = obj.get("motion")
        if motion is not None:
            _validate_motion(motion, f"{path}.motion")

        # Content must be a dict if present
        if "content" in obj and obj["content"] is not None and not _is_dict(obj["content"]):
            raise _err(f"{path}.content", "Must be an object/dict.")

        # Triggers
        triggers = obj.get("triggers", [])
        if triggers is not None:
            if not _is_list(triggers):
                raise _err(f"{path}.triggers", "Must be a list.")
            _validate_triggers(triggers, f"{path}.triggers")


def _validate_layout(layout: Any, path: str) -> None:
    if not _is_dict(layout):
        raise _err(path, "Must be an object.")
    for k in ("x", "y", "w", "h"):
        if k in layout and layout[k] is not None and not isinstance(layout[k], (int, float)):
            raise _err(f"{path}.{k}", "Must be a number.")
    # optional: anchor string
    if "anchor" in layout and layout["anchor"] is not None and not isinstance(layout["anchor"], str):
        raise _err(f"{path}.anchor", "Must be a string.")


def _validate_state(state: Any, path: str) -> None:
    if not _is_dict(state):
        raise _err(path, "Must be an object.")
    for k in ("visible", "locked"):
        if k in state and state[k] is not None and not isinstance(state[k], bool):
            raise _err(f"{path}.{k}", "Must be boolean.")


def _validate_motion(motion: Any, path: str) -> None:
    if not _is_dict(motion):
        raise _err(path, "Must be an object.")
    # Keep flexible; just type-check known fields
    for k in ("anim", "speed"):
        if k in motion and motion[k] is not None and not isinstance(motion[k], str):
            raise _err(f"{path}.{k}", "Must be a string.")
    if "delay_ms" in motion and motion["delay_ms"] is not None and not isinstance(motion["delay_ms"], int):
        raise _err(f"{path}.delay_ms", "Must be an integer.")


def _validate_triggers(triggers: List[Any], path: str) -> None:
    for i, t in enumerate(triggers):
        tpath = f"{path}[{i}]"
        if not _is_dict(t):
            raise _err(tpath, "Must be an object.")
        on = t.get("on")
        if on not in ALLOWED_TRIGGER_EVENTS:
            raise _err(f"{tpath}.on", f"Invalid trigger event: {on}")
        do = t.get("do")
        if not _is_list(do) or len(do) == 0:
            raise _err(f"{tpath}.do", "Must be a non-empty list of actions.")
        for j, action in enumerate(do):
            _validate_action(action, f"{tpath}.do[{j}]")


def _validate_action(a: Any, path: str) -> None:
    if not _is_dict(a):
        raise _err(path, "Must be an object.")
    act = a.get("action")
    if act not in ALLOWED_ACTIONS:
        raise _err(f"{path}.action", f"Invalid action: {act}")

    # Required fields per action
    if act in {"open_popup", "close_popup", "unlock", "reveal"}:
        if not a.get("target_id"):
            raise _err(f"{path}.target_id", "target_id is required.")

    if act == "go_to_scene":
        if not a.get("scene_id"):
            raise _err(f"{path}.scene_id", "scene_id is required.")

    if act == "branch":
        cases = a.get("cases")
        default_scene_id = a.get("default_scene_id")
        if not _is_list(cases) or len(cases) == 0:
            raise _err(f"{path}.cases", "cases must be a non-empty list.")
        for i, c in enumerate(cases):
            if not _is_dict(c):
                raise _err(f"{path}.cases[{i}]", "Each case must be an object.")
            if "if" not in c or not _is_dict(c["if"]):
                raise _err(f"{path}.cases[{i}].if", "Each case requires an 'if' object.")
            if not c.get("scene_id"):
                raise _err(f"{path}.cases[{i}].scene_id", "scene_id is required per case.")
        if default_scene_id is not None and not isinstance(default_scene_id, str):
            raise _err(f"{path}.default_scene_id", "Must be a string if provided.")

    if act in {"play_sound"}:
        if not a.get("asset_id"):
            raise _err(f"{path}.asset_id", "asset_id is required.")

    if act == "set_audio":
        if "enabled" in a and not isinstance(a["enabled"], bool):
            raise _err(f"{path}.enabled", "enabled must be boolean.")
        if a.get("enabled") and not a.get("asset_id"):
            raise _err(f"{path}.asset_id", "asset_id required when enabled is true.")

    if act == "screen_effect":
        eff = a.get("effect")
        if eff not in ALLOWED_SCREEN_EFFECTS:
            raise _err(f"{path}.effect", f"effect must be one of {sorted(ALLOWED_SCREEN_EFFECTS)}")

    if act == "set_text":
        if not a.get("target_id"):
            raise _err(f"{path}.target_id", "target_id is required.")
        if "value" not in a or not isinstance(a["value"], str):
            raise _err(f"{path}.value", "value is required and must be a string.")

    if act == "set_image":
        if not a.get("target_id"):
            raise _err(f"{path}.target_id", "target_id is required.")
        if not a.get("asset_id"):
            raise _err(f"{path}.asset_id", "asset_id is required.")

    if act == "set_var":
        if not a.get("key"):
            raise _err(f"{path}.key", "key is required.")
        if "mode" in a and a["mode"] not in {"inc", "set"}:
            raise _err(f"{path}.mode", "mode must be 'inc' or 'set'.")


# ---------- Type-specific blocks ----------

def _validate_question_block(q: Dict[str, Any]) -> None:
    required = ["prompt", "input_type", "answers"]
    for k in required:
        if k not in q:
            raise _err(f"data.question.{k}", "This field is required.")
    if q["input_type"] not in ("text", "multiple_choice"):
        raise _err("data.question.input_type", "Must be 'text' or 'multiple_choice'.")
    if not _is_list(q["answers"]) or not all(isinstance(a, str) for a in q["answers"]):
        raise _err("data.question.answers", "Must be a list of strings.")
    if q["input_type"] == "multiple_choice":
        if not _is_list(q.get("choices")):
            raise _err("data.question.choices", "Multiple choice requires a 'choices' list.")


def _validate_choice_block(c: Dict[str, Any]) -> None:
    if "prompt" not in c:
        raise _err("data.choice.prompt", "This field is required.")
    options = c.get("options")
    if not _is_list(options) or len(options) < 2:
        raise _err("data.choice.options", "Must be a list with at least 2 options.")
    for i, opt in enumerate(options):
        if not _is_dict(opt):
            raise _err(f"data.choice.options[{i}]", "Must be an object.")
        for k in ("id", "label", "to_scene_id"):
            if k not in opt:
                raise _err(f"data.choice.options[{i}].{k}", "This field is required.")


def _validate_timeline_block(t: Dict[str, Any]) -> None:
    if "layout" not in t:
        raise _err("data.timeline.layout", "This field is required.")
    items = t.get("items", [])
    if not _is_list(items):
        raise _err("data.timeline.items", "Must be a list.")


def _validate_letter_block(l: Dict[str, Any]) -> None:
    if "body" not in l or not isinstance(l["body"], str):
        raise _err("data.letter.body", "This field is required and must be a string.")
    highlights = l.get("highlights", [])
    if highlights is not None and not _is_list(highlights):
        raise _err("data.letter.highlights", "Must be a list.")


def _validate_map_block(m: Dict[str, Any]) -> None:
    pins = m.get("pins", [])
    if not _is_list(pins):
        raise _err("data.map.pins", "Must be a list.")


def _validate_exploration_block(e: Dict[str, Any]) -> None:
    if "player_sprite_asset_id" not in e:
        raise _err("data.exploration.player_sprite_asset_id", "This field is required.")
    dest = e.get("destinations", [])
    if not _is_list(dest):
        raise _err("data.exploration.destinations", "Must be a list.")
