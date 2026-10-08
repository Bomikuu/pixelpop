import hashlib
import json
from zoneinfo import ZoneInfo

from django.utils import timezone
from rest_framework.exceptions import APIException, ValidationError

from job_applications.models import ApplicationActivity, ArtifactRevision
from .sections import assemble_sections


class ReviewConflict(APIException):
    status_code = 409
    default_detail = "The sources or saved draft changed. Refresh and review again; your saved text was kept."


def source_fingerprint(application, profile):
    snapshot = {"job": {key: getattr(application, key) for key in ("role", "company", "posting", "questions")},
                "profile": {key: getattr(profile, key) for key in ("full_name", "email", "phone", "location", "portfolio_url", "facts", "resume_text")}}
    return hashlib.sha256(json.dumps(snapshot, sort_keys=True, ensure_ascii=False).encode()).hexdigest()


def profile_ready(profile):
    return profile.sources_confirmed and bool(profile.facts.strip() or profile.resume_text.strip())


def artifact_review_state(artifact, application, profile):
    reviewed = bool(artifact.body.strip() and profile_ready(profile) and artifact.reviewed_at and
                    artifact.reviewed_digest == source_fingerprint(application, profile))
    return {"reviewed": reviewed, "needs_review": bool(artifact.body.strip()) and not reviewed,
            "exportable": reviewed if artifact.kind == "resume" else bool(artifact.body.strip())}


def save_revision(artifact, body, **updates):
    ArtifactRevision.objects.create(artifact=artifact, revision=artifact.revision, body=artifact.body)
    artifact.revision += 1
    artifact.body = body
    artifact.reviewed_at = None
    artifact.reviewed_digest = ""
    for key, value in updates.items():
        setattr(artifact, key, value)
    artifact.save()


def record_activity(application, kind, message, *, occurred_on=None, details=None):
    return ApplicationActivity.objects.create(application=application, kind=kind, message=message,
                                              occurred_on=occurred_on or timezone.localdate(timezone=ZoneInfo("Asia/Manila")),
                                              details=details or {})


def require_current_proposal(proposal, expected_version, application, profile):
    if proposal.status != "pending":
        raise ReviewConflict("This proposal is already accepted or discarded. Refresh to see its current state.")
    if proposal.version != expected_version:
        raise ReviewConflict("A newer review was saved in another tab. Refresh before saving these decisions.")
    if proposal.base_revision != proposal.artifact.revision or proposal.source_digest != source_fingerprint(application, profile):
        raise ReviewConflict()
    if proposal.generation.mode == "fix":
        from .clarifications import fix_context_changed
        if fix_context_changed(application, proposal.generation.quote_snapshot):
            raise ReviewConflict("The checklist answers changed. Generate a new proposal using your current answers.")
    if not profile_ready(profile):
        raise ValidationError("Review and confirm profile sources before reviewing this proposal.")


def accept_proposal(proposal, expected_version, application, profile):
    # Caller holds the application/profile/artifact/proposal locks in that order.
    require_current_proposal(proposal, expected_version, application, profile)
    if any(item["decision"] == "unreviewed" for item in proposal.sections):
        raise ValidationError("Choose what to keep for every changed section before accepting.")
    body = assemble_sections(proposal.sections)
    if not body.strip() or len(body) > 30000:
        raise ValidationError("The reviewed draft must contain text and be at most 30,000 characters.")
    result = proposal.generation.result
    edited = any(item["decision"] == "original" and item["change"] != "unchanged" for item in proposal.sections) or body.strip() != result["body"].strip()
    artifact = proposal.artifact
    save_revision(artifact, body, reviewed_at=timezone.now(), reviewed_digest=proposal.source_digest,
                  edited=edited, warnings=result.get("warnings", []), evidence=result.get("evidence", []),
                  provider=proposal.generation.provider, model=proposal.generation.model)
    proposal.status = "accepted"
    proposal.version += 1
    proposal.save(update_fields=["status", "version", "updated_at"])
    record_activity(application, "reviewed", f"Accepted reviewed {artifact.get_kind_display()} revision {artifact.revision}.")
    return artifact


def application_checklist(application, profile, artifacts):
    from .submission import submission_review_state

    by_kind = {item.kind: item for item in artifacts}
    rows = [{"id": "profile", "label": "Profile reviewed", "state": "complete" if profile_ready(profile) else "needs_review", "action": "profile"}]
    for kind, label in (("resume", "Résumé approved"), ("cover_letter", "Cover letter approved"), ("answers", "Screening answers reviewed")):
        artifact = by_kind.get(kind)
        state = "not_needed" if kind == "answers" and not application.questions else "complete" if artifact and artifact_review_state(artifact, application, profile)["reviewed"] else "needs_review"
        rows.append({"id": kind, "label": label, "state": state, "action": kind})
    final_checks = submission_review_state(application, profile, artifacts)
    for check in final_checks["checks"]:
        state = "complete" if check["state"] == "confirmed" else "not_needed" if check["state"] == "not_applicable" else "needs_review"
        rows.append({**check, "state": state})
    completed = sum(item["state"] == "complete" for item in rows)
    total = sum(item["state"] != "not_needed" for item in rows)
    submitted = bool(application.applied_on or application.status in ("applied", "interviewing", "offer"))
    closed = application.status in ("rejected", "withdrawn")
    current_day = timezone.localdate(timezone=ZoneInfo("Asia/Manila"))
    follow_state = "not_needed" if closed else "unset" if not application.follow_up_on else "due" if application.follow_up_on <= current_day else "upcoming"
    next_action = next((item["action"] for item in rows if item["state"] == "needs_review"), "posting" if not submitted else "activity")
    return {"preparation": rows, "completed": completed, "total": total, "next_action": next_action,
            "submission": {"label": "Submitted", "state": "complete" if submitted else "unset", "date": application.applied_on},
            "follow_up": {"label": "Follow-up", "state": follow_state, "date": application.follow_up_on,
                          "action": ("follow_up" if application.follow_up_on else "reschedule")
                          if application.status in ("ready", "applied", "interviewing") else "posting"}}


def normalize_requirements(requirements, application, profile):
    def normalized(value):
        return " ".join(value.split()).casefold()

    posting = normalized(application.posting)
    sources = {key: normalized(getattr(profile, key)) for key in ("facts", "resume_text")}
    rows = []
    for item in requirements:
        quoted = normalized(item["posting_excerpt"])
        traceable = bool(quoted and quoted in posting)
        excerpts = [source for source in item["sources"] if normalized(source["excerpt"]) and normalized(source["excerpt"]) in sources[source["source"]]]
        valid_evidence = traceable and bool(excerpts) and len(excerpts) == len(item["sources"])
        status = item["status"] if valid_evidence else "not_evidenced"
        rows.append({**item, "sources": excerpts, "status": status, "traceable": traceable,
                     "evidence_warning": "" if traceable and len(excerpts) == len(item["sources"]) else "Some AI quotations could not be traced to the supplied text. Review this requirement."})
    return rows
