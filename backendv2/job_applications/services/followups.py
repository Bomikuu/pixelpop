from rest_framework.exceptions import ValidationError

from .review import ReviewConflict, record_activity
from .timeline import record_application_changes, recorded_value


ELIGIBLE_STATUSES = ("ready", "applied", "interviewing")


def apply_follow_up(application, values):
    # Caller holds the owner-scoped application's lock, including initial UUID writes.
    request_id = str(values["request_id"])
    payload = {key: recorded_value(value) for key, value in values.items() if key not in ("request_id", "expected_updated_at")}
    previous_request = application.activities.filter(details__follow_up_request_id=request_id).first()
    if previous_request:
        if previous_request.details.get("payload") != payload:
            raise ReviewConflict("This request ID already recorded a different follow-up. Refresh before saving a new action.")
        return {"follow_up_on": application.follow_up_on, "updated_at": application.updated_at, "replayed": True}
    if application.updated_at != values["expected_updated_at"]:
        raise ReviewConflict("This application changed. Refresh before recording or rescheduling the follow-up.")
    if application.status not in ELIGIBLE_STATUSES:
        raise ValidationError("Follow-ups are available for Ready, Applied or Interviewing applications only.")
    previous = {field: getattr(application, field) for field in ("status", "applied_on", "follow_up_on", "role", "company", "url", "platform", "posting", "questions")}
    new_date = values.get("next_date")
    if new_date or values.get("empty_date_action") == "clear":
        application.follow_up_on = new_date
    application.save(update_fields=["follow_up_on", "updated_at"])
    record_application_changes(application, previous)
    activity = record_activity(application, "follow_up" if values["action"] == "record" else "date_changed",
                               values["message"] if values["action"] == "record" else "Follow-up schedule reviewed.",
                               occurred_on=values.get("occurred_on") if values["action"] == "record" else None,
                               details={"follow_up_request_id": request_id, "payload": payload,
                                        "from": recorded_value(previous["follow_up_on"]), "to": recorded_value(application.follow_up_on)})
    return {"follow_up_on": application.follow_up_on, "updated_at": application.updated_at, "activity_id": activity.pk, "replayed": False}
