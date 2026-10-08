import hashlib
import json

from job_applications.models import ApplicationArtifact, ApplicationSubmissionReview
from .review import ReviewConflict, record_activity, source_fingerprint


CHECK_LABELS = {"rate": "Rate reviewed", "availability": "Availability reviewed", "accuracy": "Final accuracy checked"}


def submission_digest(application, profile, artifacts):
    revisions = {item.kind: item.revision for item in artifacts}
    snapshot = [source_fingerprint(application, profile),
                [(kind, revisions.get(kind, 0) if kind != "answers" or application.questions else 0)
                 for kind in ("resume", "cover_letter", "answers")]]
    return hashlib.sha256(json.dumps(snapshot).encode()).hexdigest()


def submission_review_state(application, profile, artifacts):
    digest = submission_digest(application, profile, artifacts)
    saved = ApplicationSubmissionReview.objects.filter(application=application).first()
    stale = bool(saved and saved.review_digest != digest)
    rows = []
    for key, label in CHECK_LABELS.items():
        stored = saved.checks.get(key, {}) if saved else {}
        state = "needs_review" if stale else stored.get("state", "needs_review")
        rows.append({"id": key, "label": label, "state": state, "note": stored.get("note", ""),
                     "previous_state": stored.get("state", "needs_review"), "action": "final_checks"})
    return {"review_digest": digest, "version": saved.version if saved else 0, "stale": stale, "checks": rows,
            "completed": sum(row["state"] == "confirmed" for row in rows),
            "total": sum(row["state"] != "not_applicable" for row in rows)}


def save_submission_review(application, profile, values):
    artifacts = list(ApplicationArtifact.objects.select_for_update().filter(application=application).order_by("id"))
    digest = submission_digest(application, profile, artifacts)
    record = ApplicationSubmissionReview.objects.select_for_update().filter(application=application).first()
    if digest != values["review_digest"] or (record.version if record else 0) != values["expected_version"]:
        raise ReviewConflict("The sources, documents or final checks changed. Refresh and review them again; your notes were kept.")
    if not record:
        record = ApplicationSubmissionReview(application=application)
    else:
        record.version += 1
    record.checks, record.review_digest = values["checks"], digest
    record.save()
    record_activity(application, "reviewed", "Saved rate, availability and final accuracy checks. Submission status was not changed.")
    return submission_review_state(application, profile, artifacts)
