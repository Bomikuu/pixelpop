"""Application-only answers, recorded immutably without changing shared profile facts."""
from job_applications.models import ApplicationActivity
from .review import source_fingerprint


def latest_clarifications(application, check_id):
    return application.activities.filter(kind="resume_clarifications", details__check_id=str(check_id)).order_by("-id").first()


def clarification_state(application, report):
    record = latest_clarifications(application, report["id"]) if report else None
    return {"version": record.pk if record else 0, "answers": record.details.get("answers", []) if record else [],
            "check_id": report["id"] if report else None, "saved_at": record.created_at if record else None}


def confirmed_answers(record):
    if not record:
        return []
    rows = [*record.details.get("previous_answers", []), *record.details.get("answers", [])]
    unique = {}
    for row in rows:
        if row["status"] == "answered":
            unique[row["answer"]] = row
    return list(unique.values())


def accepted_clarifications(application, profile):
    # Only answers attached to an accepted proposal become reusable résumé context.
    proposal = application.artifacts.filter(kind="resume").first()
    if not proposal:
        return None
    accepted = proposal.proposals.filter(status="accepted", generation__mode="fix").select_related("generation").order_by("-updated_at").first()
    record_id = accepted.generation.quote_snapshot.get("clarification_id") if accepted else None
    record = ApplicationActivity.objects.filter(application=application, kind="resume_clarifications", pk=record_id).first() if record_id else None
    return record if record and record.details.get("source_digest") == source_fingerprint(application, profile) else None


def fix_context_changed(application, snapshot):
    if "clarification_id" not in snapshot:
        return False  # Proposals created before the question-first workflow remain reviewable.
    record = latest_clarifications(application, snapshot.get("checklist_id"))
    latest_check = application.generations.filter(kind="resume", mode="check", status="completed").first()
    return (not record or record.pk != snapshot.get("clarification_id")
            or not latest_check or str(latest_check.pk) != snapshot.get("checklist_id"))
