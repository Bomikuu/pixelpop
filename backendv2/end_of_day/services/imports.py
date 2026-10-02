import re
from datetime import date

from django.db import transaction
from rest_framework.exceptions import ValidationError

from end_of_day.models import EndOfDayEntry, EndOfDayGroup
from end_of_day.services.formatting import manila_today
from finance.services.audit import log_record, snapshot_record


ENTRY_FIELDS = frozenset(("date", "type", "title", "summary", "items", "in_progress", "slack_message", "bullet_list"))


def _errors(serializer):
    return [f"{field}: {', '.join(map(str, messages)) if isinstance(messages, list) else messages}" for field, messages in serializer.errors.items()]


def _inspect(payload, fallback_group_id):
    from end_of_day.api.serializers import EntrySerializer

    groups = {group.name.casefold(): group for group in EndOfDayGroup.objects.all()}
    fallback = EndOfDayGroup.objects.filter(pk=fallback_group_id).first()
    if not fallback:
        raise ValidationError({"group": "Choose an existing EOD group."})
    errors = []
    if not isinstance(payload, dict):
        return {"counts": {"create": 0, "skip": 0, "error": 1}, "rows": [], "errors": ["Paste one EOD object or a bulk object with an entries list."]}, []
    is_bulk = "entries" in payload
    if is_bulk:
        raw_entries = payload.get("entries")
        if not isinstance(raw_entries, list) or not 1 <= len(raw_entries) <= 100:
            errors.append("entries: Include 1–100 EOD entries.")
            raw_entries = []
        unknown_keys = set(payload) - {"month", "group", "entries"}
    else:
        raw_entries = [payload]
        unknown_keys = set()
    if unknown_keys:
        errors.append(f"Unknown bulk fields: {', '.join(sorted(unknown_keys))}.")
    month = payload.get("month") if is_bulk else None
    if month is not None:
        if not isinstance(month, str) or not re.fullmatch(r"\d{4}-(0[1-9]|1[0-2])", month):
            errors.append("month: Use YYYY-MM.")
        else:
            year, number = map(int, month.split("-"))
            try:
                date(year, number, 1)
            except ValueError:
                errors.append("month: Choose a valid month.")
            if (year, number) > (manila_today().year, manila_today().month):
                errors.append("month: Future months are not available.")

    def resolve(value, source):
        if not isinstance(value, str) or not value.strip():
            errors.append(f"{source}: Enter an existing group name.")
            return None
        group = groups.get(" ".join(value.split()).casefold())
        if not group:
            errors.append(f"{source}: Unknown group “{value[:120]}”. Add it before importing.")
        return group

    top_group = resolve(payload["group"], "group") if is_bulk and "group" in payload else None
    rows, candidates, seen = [], [], set()
    for index, raw in enumerate(raw_entries, 1):
        row_errors = []
        if not isinstance(raw, dict):
            rows.append({"date": None, "group": None, "action": "error", "errors": ["Entry must be a JSON object."]})
            continue
        supplied_group = resolve(raw["group"], f"entries[{index}].group") if "group" in raw else None
        group = supplied_group if "group" in raw else top_group if is_bulk and "group" in payload else fallback
        extra = set(raw) - ENTRY_FIELDS - {"group"}
        if extra:
            row_errors.append(f"Unknown fields: {', '.join(sorted(extra))}.")
        serializer = EntrySerializer(data={**{key: raw[key] for key in ENTRY_FIELDS if key in raw}, "group": group.pk if group else fallback.pk}, context={"allow_existing_pair": True})
        valid = serializer.is_valid()
        if not valid:
            row_errors.extend(_errors(serializer))
        validated = serializer.validated_data if valid else {}
        day = validated.get("date")
        if month and day and day.strftime("%Y-%m") != month:
            row_errors.append("Date does not match the bulk month.")
        if group and day:
            pair = (group.pk, day)
            if pair in seen:
                row_errors.append("This group/date pair appears twice in the pasted JSON.")
            seen.add(pair)
        if "group" in raw and not supplied_group:
            row_errors.append("Choose an existing group name.")
        if is_bulk and "group" in payload and not top_group:
            row_errors.append("The top-level group must exist before import.")
        existing = bool(group and day and EndOfDayEntry.objects.filter(group=group, date=day).exists())
        action = "error" if row_errors else "skip" if existing else "create"
        rows.append({"date": day.isoformat() if day else str(raw.get("date", ""))[:20], "group": group.name if group else None, "action": action, "errors": row_errors})
        if action != "error":
            candidates.append((index - 1, validated))
    counts = {key: sum(row["action"] == key for row in rows) for key in ("create", "skip", "error")}
    counts["error"] += len(errors)
    return {"counts": counts, "rows": rows, "errors": errors}, candidates


def preview_import(payload, fallback_group_id):
    result, _ = _inspect(payload, fallback_group_id)
    return result


@transaction.atomic
def apply_import(payload, fallback_group_id, actor, replace_rows=None):
    report, candidates = _inspect(payload, fallback_group_id)
    if report["counts"]["error"]:
        raise ValidationError({"import": "Fix the preview errors before importing.", "preview": report})
    replace_rows = [] if replace_rows is None else replace_rows
    if not isinstance(replace_rows, list) or any(type(index) is not int for index in replace_rows):
        raise ValidationError({"replace_rows": "Choose existing preview rows to replace."})
    replacements = set(replace_rows)
    conflicts = {index for index, row in enumerate(report["rows"]) if row["action"] == "skip"}
    if len(replacements) != len(replace_rows) or not replacements.issubset(conflicts):
        raise ValidationError({"replace_rows": "Only existing dates in this import can be replaced. Preview the JSON again."})
    created, replaced, skipped = [], [], []
    for index, values in candidates:
        pair = {"group": values["group"], "date": values["date"]}
        if index in replacements:
            entry = EndOfDayEntry.objects.select_for_update().get(**pair)
            before = snapshot_record(entry)
            replacement = {
                "type": values.get("type", "workday"),
                "title": values["title"],
                "summary": values.get("summary", ""),
                "items": values.get("items", []),
                "in_progress": values.get("in_progress", []),
                "slack_message": values.get("slack_message", ""),
                "bullet_list": values.get("bullet_list", []),
            }
            if any(getattr(entry, field) != value for field, value in replacement.items()):
                for field, value in replacement.items():
                    setattr(entry, field, value)
                entry.save(update_fields=[*replacement, "updated_at"])
                log_record(entry, actor=actor, action="edited", before=before, after=snapshot_record(entry))
            replaced.append(f"{entry.group.name} · {entry.date.isoformat()}")
            continue
        entry, was_created = EndOfDayEntry.objects.get_or_create(**pair, defaults={key: value for key, value in values.items() if key not in pair})
        label = f"{entry.group.name} · {entry.date.isoformat()}"
        if was_created:
            created.append(label)
            log_record(entry, actor=actor, action="imported", after=snapshot_record(entry))
        else:
            skipped.append(label)
    return {"created": created, "replaced": replaced, "skipped": skipped, "counts": {"created": len(created), "replaced": len(replaced), "skipped": len(skipped)}}
