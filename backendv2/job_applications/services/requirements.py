import hashlib
import json

from rest_framework.exceptions import ValidationError

from job_applications.models import ApplicationArtifact, ApplicationRequirementDecision
from .review import ReviewConflict, profile_ready, record_activity, source_fingerprint


def requirement_key(row):
    parts = [" ".join(str(row.get(key, "")).split()).casefold() for key in ("text", "posting_excerpt", "importance")]
    return hashlib.sha256(json.dumps(parts, ensure_ascii=False).encode()).hexdigest()


def posting_fingerprint(application):
    snapshot = {key: getattr(application, key) for key in ("role", "company", "posting", "questions")}
    return hashlib.sha256(json.dumps(snapshot, sort_keys=True, ensure_ascii=False).encode()).hexdigest()


def decision_data(record, digest):
    return {"requirement_key": record.requirement_key, "requirement": record.requirement,
            "posting_excerpt": record.posting_excerpt, "importance": record.importance,
            "decision": record.decision, "note": record.note, "version": record.version,
            "stale": record.source_digest != digest, "updated_at": record.updated_at}


def requirement_decisions(application, profile, assessment):
    digest = source_fingerprint(application, profile)
    saved = {row.requirement_key: row for row in application.requirement_decisions.all()}
    seen = set()
    current = []
    for row in assessment.requirements if assessment else []:
        key = requirement_key(row)
        decision = saved.get(key)
        seen.add(key)
        current.append({**row, "requirement_key": key,
                        "applicant_decision": decision_data(decision, digest) if decision else None})
    return {"current": current, "historical": [decision_data(row, digest) for key, row in saved.items() if key not in seen]}


def assessment_list_summary(application, profile, assessment):
    if not assessment or not assessment.requirements:
        return None
    decisions = requirement_decisions(application, profile, assessment)["current"] if profile else []
    # The list needs coverage and flags, not full excerpts, private notes or drafts.
    return {
        "requirements": [{"status": row["status"], "importance": row["importance"],
                          "text": row.get("text", "").strip() if len(row.get("text", "").strip()) <= 80 else "",
                          "evidence_warning": bool(row.get("evidence_warning"))}
                         for row in assessment.requirements],
        "warning_count": len(assessment.warnings),
        "requirements_stale": not profile or not profile_ready(profile) or assessment.assessment_digest != source_fingerprint(application, profile),
        "decisions": [{"applicant_decision": {key: row["applicant_decision"][key] for key in ("decision", "stale")}
                       if row["applicant_decision"] else None} for row in decisions],
    }


def save_requirement_decision(application, profile, values):
    # Caller locks application and profile first. The application serializes initial creation.
    assessment = ApplicationArtifact.objects.select_for_update().filter(application=application, kind="assessment").first()
    digest = source_fingerprint(application, profile)
    if (not assessment or assessment.revision != values["assessment_revision"] or
            assessment.assessment_digest != digest or digest != values["source_digest"] or not profile_ready(profile)):
        raise ReviewConflict("The assessment or profile changed. Confirm your sources and reassess before saving a gap decision.")
    row = next((row for row in assessment.requirements if requirement_key(row) == values["requirement_key"]), None)
    if not row:
        raise ReviewConflict("This requirement is no longer in the saved assessment. Refresh before deciding.")
    decision = ApplicationRequirementDecision.objects.select_for_update().filter(application=application, requirement_key=values["requirement_key"]).first()
    if (decision.version if decision else 0) != values["expected_version"]:
        raise ReviewConflict("A newer gap decision was saved. Refresh before changing it.")
    if values["append_to_profile"]:
        if profile.updated_at != values["expected_profile_updated_at"]:
            raise ReviewConflict("Your shared profile changed. Refresh it before adding this example.")
        note = values["note"].strip()
        if note in profile.facts:
            raise ReviewConflict("This example is already in your profile. Save the decision without adding it again.")
        facts = f"{profile.facts.rstrip()}\n\n{note}".strip()
        if len(facts) > 30000:
            raise ValidationError({"note": "This addition would exceed your profile's 30,000-character limit."})
        profile.facts = facts
        profile.sources_confirmed = False
        profile.save(update_fields=["facts", "sources_confirmed", "updated_at"])
    if not decision:
        decision = ApplicationRequirementDecision(application=application, requirement_key=values["requirement_key"])
    else:
        decision.version += 1
    decision.requirement, decision.posting_excerpt, decision.importance = row["text"], row["posting_excerpt"], row["importance"]
    decision.decision, decision.note, decision.source_digest = values["decision"], values["note"], digest
    decision.save()
    record_activity(application, "reviewed", f"Requirement decision: {decision.get_decision_display()} — {row['text']}",
                    details={"requirement_key": decision.requirement_key, "profile_changed": values["append_to_profile"]})
    return {"decision": decision_data(decision, source_fingerprint(application, profile)), "profile_changed": values["append_to_profile"]}


def assessment_comparison(application, profile):
    runs = []
    for run in application.generations.filter(kind="assessment", status="completed").order_by("-created_at", "-id").iterator():
        result, snapshot = run.result, run.quote_snapshot
        if isinstance(result, dict) and isinstance(result.get("requirements"), list) and snapshot.get("source_digest"):
            runs.append(run)
        if len(runs) == 2:
            break
    if len(runs) < 2:
        return {"available": False, "reason": "Complete two assessments to compare their saved evidence. Manual edits do not create assessment snapshots."}
    digest = source_fingerprint(application, profile)

    def summary(run):
        rows = run.result["requirements"]
        counts = {status: sum(row.get("status") == status for row in rows) for status in ("supported", "partial", "not_evidenced")}
        return {"id": str(run.pk), "created_at": run.created_at, "counts": counts, "total": len(rows),
                "coverage": round(counts["supported"] / len(rows) * 100) if rows else None,
                "historical": run.quote_snapshot["source_digest"] != digest, "requirements": rows}

    after, before = summary(runs[0]), summary(runs[1])
    old = {requirement_key(row): row for row in before["requirements"]}
    new = {requirement_key(row): row for row in after["requirements"]}
    # Older runs have only a combined source digest: a changed digest cannot prove
    # the posting stayed the same. Do not fabricate a posting baseline for them.
    same_sources = runs[0].quote_snapshot["source_digest"] == runs[1].quote_snapshot["source_digest"]
    posting_digests = [run.quote_snapshot.get("posting_digest") for run in runs]
    same_posting = same_sources or bool(all(posting_digests) and posting_digests[0] == posting_digests[1])
    comparable = bool(old) and same_posting and old.keys() == new.keys() and before["total"] == after["total"]
    changes = [{"requirement_key": key, "text": new[key]["text"], "before": old[key]["status"], "after": new[key]["status"]}
               for key in new if key in old and old[key]["status"] != new[key]["status"]]
    return {"available": True, "before": before, "after": after, "comparable": comparable,
            "reason": "Same recorded posting and requirement set; this is evidence coverage, not a hiring probability." if comparable else "The requirement set or posting changed, or an older result has no separate posting baseline. These assessments are not directly comparable.",
            "delta": after["coverage"] - before["coverage"] if comparable else None, "changes": changes,
            "added": [row["text"] for key, row in new.items() if key not in old], "removed": [row["text"] for key, row in old.items() if key not in new]}
