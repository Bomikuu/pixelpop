"""Hypothetical examples live in preparation proposals, never résumé artifacts."""
import hashlib
import re

from rest_framework.exceptions import ValidationError

from .requirements import requirement_key
from .review import ReviewConflict, source_fingerprint
from .sections import assemble_sections, split_sections
from .project_experience import answers_digest

MODES = ("example", "gapplan")
WARNING = "Hypothetical example — not confirmed work. Wording approval is for preparation only; it does not add résumé facts or change evidence coverage."
INSTRUCTIONS = {
    "example": """Generate ONE hypothetical implementation example for the selected requirement and project theme/tools in skill_gap. These selected tools are suggestions, not applicant experience. This special mode allows illustrative fiction ONLY as explicitly labeled practice material, never as historical work. Write editable résumé-style implementation bullets, possible design trade-offs, and a short list of facts the applicant must confirm. Never attribute the example to ASTA, a client, or any employer. Do not invent a customer, year, metrics, certifications or proficiency. Do not claim the example happened. Use ### subheadings only. Return empty evidence and requirements and include the hypothetical warning. Do not rewrite the existing preparation or résumé; return only the new example. No 'currently learning' résumé section is needed: this is separate preparation material.""",
    "gapplan": """Prepare a focused interview refresher/study plan from skill_gap, including its exact approved example or accepted résumé changes when provided. Clearly label Refresh confirmed experience versus Study an unfamiliar requirement. Include: relevant concepts and implementation trade-offs; a concrete related practice exercise with steps and ways to test it; likely technical interview questions labeled as practice; truthful talking points backed by supplied facts, and unanswered questions when unsupported. The example may be hypothetical: never convert it into historical experience. Use ### subheadings only. Return empty requirements. Do not rewrite existing material; return only the new study plan. No employer questions or outcomes are guaranteed.""",
}


def approved_preparation_body(proposal):
    """Read the reviewed new block, not the pre-existing preparation document."""
    new = proposal.generation.result.get("preparation_body", "")
    title = split_sections(new)[0]["title"] if new else ""
    for section in reversed(proposal.sections):
        if section["decision"] != "proposed":
            continue
        if section["title"] == title and not section["original"]:
            return section["proposed"]
        if section["title"] == "Whole document":
            return next((item["body"] for item in reversed(split_sections(section["proposed"])) if item["title"] == title), "")
    return ""


def skill_gap_context(application, profile, selection, mode):
    if not selection:
        raise ValidationError({"selection": "Select the requirement and preparation parameters first."})
    assessment = application.artifacts.filter(kind="assessment").first()
    if (not assessment or assessment.revision != selection["assessment_revision"]
            or assessment.assessment_digest != source_fingerprint(application, profile)):
        raise ReviewConflict("Requirements changed. Reassess fit before requesting examples or preparation.")
    row = next((item for item in assessment.requirements if requirement_key(item) == selection["requirement_key"]), None)
    if not row:
        raise ReviewConflict("This requirement is no longer in the current assessment.")
    reference_id = selection.get("example_proposal_id") or selection.get("resume_proposal_id")
    if mode == "example" and (row["status"] == "supported" or reference_id):
        raise ValidationError("Select a partial or not-evidenced requirement, without an existing proposal reference, for a hypothetical example.")
    project = None
    if selection.get("related_project_id"):
        project = next((item for item in profile.project_experience if item["id"] == selection["related_project_id"]), None)
        if not project:
            raise ValidationError({"related_project_id": "Choose a project from your current profile."})
    context = {"requirement": row, "parameters": selection, "related_project": project,
               "related_project_confirmed": bool(project and project["status"] == "confirmed")}
    if reference_id:
        proposal = application.artifacts.filter(proposals__pk=reference_id).first()
        proposal = proposal.proposals.select_related("generation").filter(pk=reference_id, status="accepted").first() if proposal else None
        expected_kind = "interview_prep" if selection.get("example_proposal_id") else "resume"
        if (not proposal or proposal.artifact.kind != expected_kind or proposal.version != selection["reference_version"]
                or expected_kind == "interview_prep" and proposal.generation.mode != "example"):
            raise ReviewConflict("Choose an approved example or accepted résumé proposal from this application. Refresh its version first.")
        if proposal.source_digest != source_fingerprint(application, profile):
            raise ReviewConflict("The sources for this accepted proposal changed. Create a current proposal before linking preparation.")
        if expected_kind == "resume" and (proposal.artifact.revision != proposal.base_revision + 1 or proposal.source_digest != source_fingerprint(application, profile)):
            raise ReviewConflict("The accepted résumé changed or its sources are stale. Review the current résumé first.")
        accepted_body = approved_preparation_body(proposal) if expected_kind == "interview_prep" else assemble_sections(proposal.sections)
        if not accepted_body.strip():
            raise ReviewConflict("The example was not kept in the approved preparation. Review or generate an example before linking a study plan.")
        context.update({"approved_reference": accepted_body,
                        "reference_is_hypothetical": expected_kind == "interview_prep",
                        "reference_digest": hashlib.sha256(accepted_body.encode()).hexdigest()})
    return context


def append_preparation(result, original, context, mode):
    title = context["requirement"]["text"].replace("\n", " ")[:160]
    heading = "Hypothetical example" if mode == "example" else "Interview study plan"
    notice = WARNING if mode == "example" or context.get("reference_is_hypothetical") else "Practice preparation, not confirmed employer questions."
    # The new block owns one H2 boundary, even if a provider returns H1/H2.
    # Leave headings inside code fences untouched.
    lines, fence = [], None
    for line in result["body"].strip().splitlines(keepends=True):
        marker = re.match(r"^\s{0,3}(`{3,}|~{3,})", line)
        if marker:
            if fence is None:
                fence = (marker[1][0], len(marker[1]))
            elif marker[1][0] == fence[0] and len(marker[1]) >= fence[1]:
                fence = None
        elif fence is None:
            line = re.sub(r"^#{1,2}(?!#)[ \t]+", "### ", line)
        lines.append(line)
    new = f"## {heading}: {title}\n\n{notice}\n\n{''.join(lines)}"
    body = f"{original.rstrip()}\n\n{new}".strip()
    if len(body) > 30000:
        raise ValidationError("Preparation would exceed 30,000 characters. Shorten the saved preparation before requesting another section.")
    return {**result, "body": body, "preparation_body": new, "requirements": [],
            "evidence": [] if mode == "example" else result["evidence"], "warnings": [notice, *result["warnings"]]}


def preparation_items(application, profile):
    digest = source_fingerprint(application, profile)
    rows = []
    proposals = application.artifacts.filter(proposals__generation__mode__in=MODES).values_list("proposals__pk", flat=True)
    from job_applications.models import DraftProposal
    for proposal in DraftProposal.objects.filter(pk__in=proposals).select_related("generation", "artifact").order_by("-created_at")[:20]:
        selected = proposal.generation.quote_snapshot.get("selection", {})
        body = approved_preparation_body(proposal) if proposal.status == "accepted" else proposal.generation.result.get("preparation_body", "")
        stale = proposal.source_digest != digest or not body.strip()
        if proposal.status == "pending":
            snapshot = proposal.generation.quote_snapshot
            stale = stale or proposal.base_revision != proposal.artifact.revision or snapshot.get("answers_digest") != answers_digest(application, profile)
            try:
                skill_gap_context(application, profile, selected, proposal.generation.mode)
            except (ReviewConflict, ValidationError):
                stale = True
        rows.append({"id": proposal.pk, "version": proposal.version, "mode": proposal.generation.mode,
                     "status": proposal.status, "stale": stale,
                     "requirement_key": selected.get("requirement_key"), "selection": selected,
                     "created_at": proposal.created_at, "body": body})
    resume = application.artifacts.filter(kind="resume").first()
    accepted = resume.proposals.filter(status="accepted", base_revision=resume.revision - 1).first() if resume else None
    return {"items": rows, "resume_reference": {"id": accepted.pk, "version": accepted.version} if accepted and accepted.source_digest == digest else None}
