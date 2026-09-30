import json
from uuid import uuid4

from django.db import IntegrityError, transaction
from rest_framework.exceptions import ValidationError

from brainstorm.api.serializers import IdeaContentSerializer, clean_name
from brainstorm.models import BrainstormBoard, BrainstormGroup, BrainstormIdea
from .fingerprints import fingerprint_title


MAX_BYTES = 1024 * 1024
MAX_BOARDS = 50
MAX_GROUPS = 200
MAX_IDEAS = 1000


def _description(value, location):
    if value is None:
        return ""
    if not isinstance(value, str) or len(value) > 4000:
        raise ValidationError({location: "Use a description of at most 4,000 characters."})
    return value.strip()


def _parse(payload):
    if not isinstance(payload, dict):
        raise ValidationError({"json": "Paste a JSON object with a board or boards array."})
    if len(json.dumps(payload, ensure_ascii=False).encode("utf-8")) > MAX_BYTES:
        raise ValidationError({"json": "Use a JSON document smaller than 1 MiB."})
    if "boards" in payload:
        raw_boards = payload["boards"]
    elif "board" in payload and "groups" in payload:
        raw_boards = [{**payload["board"], "groups": payload["groups"]}] if isinstance(payload["board"], dict) else None
    else:
        raw_boards = None
    if not isinstance(raw_boards, list) or not raw_boards or len(raw_boards) > MAX_BOARDS:
        raise ValidationError({"boards": "Include 1–50 boards."})
    parsed = []
    group_count = idea_count = 0
    seen_boards = set()
    for board_index, board in enumerate(raw_boards):
        location = f"boards[{board_index}]"
        if not isinstance(board, dict) or not isinstance(board.get("name"), str):
            raise ValidationError({location: "Each board needs a name and groups array."})
        board_name = clean_name(board["name"])
        if len(board_name) > 120 or board_name.casefold() in seen_boards:
            raise ValidationError({location: "Use a unique board name of at most 120 characters."})
        seen_boards.add(board_name.casefold())
        groups = board.get("groups")
        if not isinstance(groups, list):
            raise ValidationError({location: "Groups must be an array."})
        parsed_groups = []
        seen_groups = set()
        for group_index, group in enumerate(groups):
            group_location = f"{location}.groups[{group_index}]"
            if not isinstance(group, dict) or not isinstance(group.get("name"), str) or not isinstance(group.get("ideas"), list):
                raise ValidationError({group_location: "Each group needs a name and ideas array."})
            group_name = clean_name(group["name"])
            if len(group_name) > 120 or group_name.casefold() in seen_groups:
                raise ValidationError({group_location: "Use a unique group name of at most 120 characters."})
            seen_groups.add(group_name.casefold())
            group_count += 1
            idea_count += len(group["ideas"])
            if group_count > MAX_GROUPS or idea_count > MAX_IDEAS:
                raise ValidationError({"json": "Use at most 200 groups and 1,000 ideas per import."})
            parsed_groups.append({
                "name": group_name,
                "description": _description(group.get("description"), group_location),
                "ideas": group["ideas"],
                "location": group_location,
            })
        parsed.append({
            "name": board_name,
            "description": _description(board.get("description"), location),
            "groups": parsed_groups,
        })
    return parsed


def _candidate_ideas(parsed):
    """Return valid ideas and a summary without changing the database."""
    summary = {
        "boards": len(parsed), "groups": sum(len(board["groups"]) for board in parsed),
        "created": 0, "duplicates_skipped": 0, "invalid": 0, "errors": [],
    }
    candidates = []
    for board in parsed:
        existing = BrainstormBoard.objects.filter(name__iexact=board["name"]).first()
        fingerprints = set(BrainstormIdea.objects.filter(board=existing).values_list("fingerprint", flat=True)) if existing else set()
        for group in board["groups"]:
            for idea_index, raw_idea in enumerate(group["ideas"]):
                location = f"{group['location']}.ideas[{idea_index}]"
                if not isinstance(raw_idea, dict):
                    summary["invalid"] += 1
                    summary["errors"].append({"location": location, "reason": "An idea must be an object."})
                    continue
                serializer = IdeaContentSerializer(data=raw_idea)
                if not serializer.is_valid():
                    summary["invalid"] += 1
                    summary["errors"].append({"location": location, "reason": str(serializer.errors)})
                    continue
                values = dict(serializer.validated_data)
                if values.get("reference_url") is None:
                    values["reference_url"] = ""
                if values["status"] == "carried_over":
                    summary["invalid"] += 1
                    summary["errors"].append({"location": location, "reason": "Only Carry to task can mark an idea carried over."})
                    continue
                fingerprint = fingerprint_title(values["title"])
                if fingerprint in fingerprints:
                    summary["duplicates_skipped"] += 1
                    continue
                fingerprints.add(fingerprint)
                candidates.append((board, group, values, fingerprint))
                summary["created"] += 1
    return candidates, summary


def preview_import(payload: dict) -> dict:
    parsed = _parse(payload)
    _, summary = _candidate_ideas(parsed)
    return summary


@transaction.atomic
def apply_import(payload: dict, actor=None, source="dashboard") -> dict:
    parsed = _parse(payload)
    candidates, summary = _candidate_ideas(parsed)
    boards = {}
    groups = {}
    for board_data in parsed:
        board = BrainstormBoard.objects.filter(name__iexact=board_data["name"]).first()
        if board is None:
            try:
                with transaction.atomic():
                    board = BrainstormBoard.objects.create(name=board_data["name"], description=board_data["description"])
            except IntegrityError:
                board = BrainstormBoard.objects.get(name__iexact=board_data["name"])
        boards[board_data["name"].casefold()] = board
        for group_data in board_data["groups"]:
            group = BrainstormGroup.objects.filter(board=board, name__iexact=group_data["name"]).first()
            if group is None:
                try:
                    with transaction.atomic():
                        group = BrainstormGroup.objects.create(board=board, name=group_data["name"], description=group_data["description"])
                except IntegrityError:
                    group = BrainstormGroup.objects.get(board=board, name__iexact=group_data["name"])
            groups[(board.pk, group_data["name"].casefold())] = group
    actual_created = 0
    for board_data, group_data, values, fingerprint in candidates:
        board = boards[board_data["name"].casefold()]
        group = groups[(board.pk, group_data["name"].casefold())]
        if BrainstormIdea.objects.filter(board=board, fingerprint=fingerprint).exists():
            summary["duplicates_skipped"] += 1
            continue
        try:
            with transaction.atomic():
                BrainstormIdea.objects.create(board=board, group=group, **values)
        except IntegrityError:
            summary["duplicates_skipped"] += 1
            continue
        actual_created += 1
    summary["created"] = actual_created
    if actual_created:
        from finance.services.audit import record_change
        record_change(
            actor=actor, actor_label="Local import" if source == "local_import" else None,
            source=source, action="imported", area="brainstorm", subject_type="BrainstormImport",
            subject_id=uuid4().hex, label="Brainstorm import",
            after={"boards": summary["boards"], "groups": summary["groups"], "ideas_added": actual_created, "duplicates_skipped": summary["duplicates_skipped"]},
        )
    return summary
