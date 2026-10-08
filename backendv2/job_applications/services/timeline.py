from .review import record_activity


GROUPS = {
    "communication": ("response", "note"),
    "scheduling": ("interview", "follow_up", "date_changed"),
    "status": ("status_changed", "submitted", "converted"),
    "preparation": ("created", "updated", "generated", "edited", "reviewed", "reconciled"),
}


def recorded_value(value):
    return value.isoformat() if hasattr(value, "isoformat") else value


def record_application_changes(application, previous):
    for field, label in (("status", "Status"), ("applied_on", "Submission date"), ("follow_up_on", "Follow-up date")):
        old, new = previous.get(field), getattr(application, field)
        if old == new:
            continue
        submission = field == "applied_on" and old is None and new is not None
        kind = "submitted" if submission else "status_changed" if field == "status" else "date_changed"
        record_activity(application, kind, f"{label}: {recorded_value(old) or 'Not set'} → {recorded_value(new) or 'Not set'}.",
                        occurred_on=new if submission else None,
                        details={"field": field, "from": recorded_value(old), "to": recorded_value(new)})
    if any(previous.get(field) != getattr(application, field) for field in ("role", "company", "url", "platform", "posting", "questions")):
        record_activity(application, "updated", "Posting details updated.")
