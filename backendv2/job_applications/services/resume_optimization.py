"""Source-traced résumé advice, stored in existing generation/proposal records."""
from copy import deepcopy
import hashlib
from types import SimpleNamespace

from rest_framework.exceptions import ValidationError

from .review import profile_ready, source_fingerprint
from .sections import split_sections
from .clarifications import accepted_clarifications, confirmed_answers, latest_clarifications

REPORT_MODES = ("discover", "check")
RESUME_MODES = (*REPORT_MODES, "tailor", "fix")
SOURCE_SCHEMA = {"type": "array", "maxItems": 8, "items": {"type": "object", "properties": {
    "source": {"type": "string", "enum": ["facts", "resume_text", "clarifications"]}, "excerpt": {"type": "string"},
}, "required": ["source", "excerpt"], "additionalProperties": False}}

INSTRUCTIONS = {
    "discover": """This is a keyword-opportunity report, NOT a new résumé. Set requirements and evidence to [].
Compare the posting with reviewed applicant sources and the current résumé. Return a short Markdown summary in body and at most 40 opportunities.
Each opportunity has keyword, posting_excerpt (exact quote from posting), support (supported/partial/not_evidenced based on reviewed sources), section_key (from resume_sections, empty if no destination exists), resume_excerpt (exact quote from that section showing coverage, or empty), sources (exact facts/resume_text quotations), and suggestion (specific bullet/wording placement, not vague advice).
Find skills/qualifications/tools genuinely evidenced but under-emphasized, already covered requirements, and missing evidence separately. Missing evidence must ask for facts, never suggest asserting it. Source quotations alone do not prove a qualification: assess their meaning. Do not claim experience years, eligibility or credentials from unrelated text.
All strings are at most 2000 characters. Never give an ATS probability or score.
""",
    "tailor": """Create a complete role-tailored résumé proposal using only reviewed facts. Also return changes (at most 80), one for EVERY changed, added or removed section, with section_title, reason, and sources (exact facts/resume_text quotes supporting the change).
Cover these goals together: naturally place genuinely supported posting keywords; turn responsibilities into achievement-focused bullets using actual outcomes and real numbers ONLY when supplied; remove clichés, filler and repetition without changing the underlying claim; prioritize relevant roles/projects/bullets within existing section order and shorten less relevant material without hiding employment history; write a concise credible role-specific summary; strengthen source-backed differentiators with precise wording. Preserve the supplied layout's section labels and structure. Do not add learning goals or hypothetical achievements as employment experience.
Explain specifically why each section changed and what facts support it. Empty sources are allowed for deleting filler or purely structural edits, but never for new factual claims. Changes do not approve themselves. All change strings are at most 2000 characters.
""",
    "check": """This is a final recruiter/readiness review of the CURRENT SAVED résumé, NOT a rewrite. Set requirements and evidence to [].
Return a concise qualitative summary in body and findings (at most 40) ordered by impact. Each finding has priority high/medium/low, category keywords/positioning/achievements/consistency/claims/formatting/length, section_key from resume_sections, excerpt (exact quote from that section, or empty for an omission), explanation, and suggestion with an actionable fix.
Check supported but missing relevant keywords, vague achievements/clichés/repetition, consistency of dates/titles/contact with source records, unsupported claims and unresolved placeholders, irrelevant/excess content, common Markdown/read-order formatting problems. Never invent numbers, missing credentials or experience as a fix. Do not claim that parsing was tested or estimate acceptance, ATS or recruiter probability. The selected document template owns layout; do not report Markdown headings as visible formatting errors. An empty findings list means no issues found, not guaranteed acceptance.
All finding strings are at most 2000 characters. Do not rewrite or approve the document.
""",
    "fix": """Make ONE source-backed fix proposal addressing ALL findings in latest_checklist against the CURRENT SAVED résumé. This is a single repair attempt, not another assessment or iterative review. Return a complete résumé in body and changes (at most 80) for EVERY changed section, with section_title, reason, and sources (exact facts/resume_text quotations).
For each checklist finding, apply the suggested fix only when genuinely supported by reviewed applicant sources. Fix clarity, wording, emphasis, consistency and structure where possible. Preserve section labels/order, employment history, accurate dates and unchanged content. Do not perform an unrelated broad rewrite.
Use applicant_answers to resolve uncertainty, retaining previously_accepted_answers where accurate and relevant. Only status=answered contains user-confirmed experience; cite its exact answer as source=clarifications. not_used is a limitation, and unresolved adds no evidence. New answers that contradict older facts require warnings and review, not assumptions. Never turn a suggested fix or the question itself into proof. Missing skills, experience, credentials, metrics or eligibility cannot be created. If a finding needs new facts or cannot safely be fixed, keep the accurate original wording and explicitly name the unresolved issue and information needed in warnings. Never assert that every issue is resolved, mark a checklist complete, or invent evidence. Any new factual claim requires verifiable source quotations; empty sources are acceptable only for structural/wording edits that add no factual claim. Keep all change strings at most 2000 characters. Set requirements to []. The proposal must be reviewed before acceptance.
""",
}


def response_schema(base, mode):
    if mode not in RESUME_MODES:
        return base
    schema = deepcopy(base)
    if mode == "discover":
        field, properties = "opportunities", {
            "keyword": {"type": "string"}, "posting_excerpt": {"type": "string"},
            "support": {"type": "string", "enum": ["supported", "partial", "not_evidenced"]},
            "section_key": {"type": "string"}, "resume_excerpt": {"type": "string"},
            "sources": SOURCE_SCHEMA, "suggestion": {"type": "string"},
        }
    elif mode in ("tailor", "fix"):
        field, properties = "changes", {"section_title": {"type": "string"}, "reason": {"type": "string"}, "sources": SOURCE_SCHEMA}
    elif mode == "check":
        field, properties = "findings", {
            "priority": {"type": "string", "enum": ["high", "medium", "low"]},
            "category": {"type": "string", "enum": ["keywords", "positioning", "achievements", "consistency", "claims", "formatting", "length"]},
            "section_key": {"type": "string"}, "excerpt": {"type": "string"},
            "explanation": {"type": "string"}, "suggestion": {"type": "string"},
        }
    schema["properties"][field] = {"type": "array", "maxItems": 80 if mode in ("tailor", "fix") else 40,
                                    "items": {"type": "object", "properties": properties,
                                              "required": list(properties), "additionalProperties": False}}
    schema["required"].append(field)
    return schema


def resume_context(profile, artifact, mode, application=None):
    if mode in ("check", "fix") and not artifact.body.strip():
        raise ValidationError("Save a résumé draft before running a final check or requesting fixes.")
    body = artifact.body or profile.resume_text
    if not body.strip():
        raise ValidationError("Add reviewed résumé text to your profile, or save a résumé draft first.")
    context = {"saved_revision": artifact.revision, "resume_sections": split_sections(body)}
    answers = accepted_clarifications(application, profile) if application else None
    if mode == "fix":
        report = report_state(application, profile, artifact, "check") if application else None
        if not report or report["stale"]:
            raise ValidationError("Run a fresh final check on the saved résumé before requesting a fix proposal.")
        if not report["findings"]:
            raise ValidationError("The latest checklist has no actionable findings. Review its cautions instead.")
        context["latest_checklist"] = {key: report[key] for key in ("id", "revision", "body", "warnings", "findings")}
        answers = latest_clarifications(application, report["id"])
        if (not answers or answers.details.get("source_digest") != source_fingerprint(application, profile)
                or answers.details.get("revision") != artifact.revision):
            raise ValidationError("Answer the latest checklist questions before requesting a fix proposal.")
    context["clarification_id"] = answers.pk if answers else None
    context["applicant_answers"] = answers.details.get("answers", []) if mode == "fix" and answers else confirmed_answers(answers)
    context["previously_accepted_answers"] = answers.details.get("previous_answers", []) if mode == "fix" and answers else []
    return context


def normalized(value):
    return " ".join(value.split()).casefold()


def traced_sources(rows, profile, clarification_text=""):
    if not isinstance(rows, list) or len(rows) > 8:
        raise ValidationError("The AI returned invalid résumé source references. Your saved résumé was kept.")
    valid = []
    for row in rows:
        if not isinstance(row, dict) or row.get("source") not in ("facts", "resume_text", "clarifications") or not isinstance(row.get("excerpt"), str) or not 0 < len(row["excerpt"]) <= 2000:
            raise ValidationError("The AI returned invalid résumé source references. Your saved résumé was kept.")
        text = clarification_text if row["source"] == "clarifications" else getattr(profile, row["source"])
        if normalized(row["excerpt"]) and normalized(row["excerpt"]) in normalized(text):
            valid.append(row)
    return valid


def normalize_result(result, application, profile, artifact, mode, schema, context=None):
    """Validate shape, then strip untraceable references rather than trusting AI citations."""
    if mode not in RESUME_MODES:
        return result
    field = {"discover": "opportunities", "tailor": "changes", "fix": "changes", "check": "findings"}[mode]
    spec = schema["properties"][field]
    rows = result.get(field)
    if not isinstance(rows, list) or len(rows) > spec["maxItems"]:
        raise ValidationError("The AI returned an invalid résumé report. Your saved résumé was kept.")
    sections = {item["key"]: item for item in split_sections(artifact.body or profile.resume_text)}
    context = context or resume_context(profile, artifact, mode, application)
    clarification_text = "\n\n".join(row["answer"] for row in [*context["applicant_answers"], *context.get("previously_accepted_answers", [])] if row["status"] == "answered")
    validated = []
    for row in rows:
        if not isinstance(row, dict):
            raise ValidationError("The AI returned an invalid résumé report.")
        for key, prop in spec["items"]["properties"].items():
            if key == "sources":
                continue
            if (not isinstance(row.get(key), str) or len(row[key]) > 2000
                    or prop.get("enum") and row[key] not in prop["enum"]
                    or key not in ("section_key", "excerpt", "resume_excerpt") and not row[key].strip()):
                raise ValidationError("The AI returned an invalid résumé report. Your saved résumé was kept.")
        item = dict(row)
        if "sources" in spec["items"]["properties"]:
            item["sources"] = traced_sources(row.get("sources"), profile, clarification_text)
            item["evidence_warning"] = "" if len(item["sources"]) == len(row["sources"]) else "Some source quotes could not be verified; review this advice."
        if mode == "discover":
            if not normalized(row["keyword"]) or not normalized(row["posting_excerpt"]) or normalized(row["posting_excerpt"]) not in normalized(application.posting):
                result["warnings"].append("An opportunity was omitted because its posting quote could not be verified.")
                continue
            section = sections.get(row["section_key"])
            quoted = normalized(row["resume_excerpt"])
            supported = row["support"] == "supported" and bool(item["sources"]) and not item["evidence_warning"]
            covered = bool(section and quoted and quoted in normalized(section["body"]) and supported)
            item.update(section_key=section["key"] if section else "", section_title=section["title"] if section else "Choose a résumé section",
                        resume_excerpt=row["resume_excerpt"] if covered else "",
                        state="covered" if covered else "under_emphasized" if supported else "missing_evidence")
            if item["state"] == "missing_evidence":
                item["suggestion"] = "Add and confirm genuine supporting facts in your profile before including this requirement in your résumé."
        if mode == "check":
            section = sections.get(row["section_key"])
            if not section or row["excerpt"] and normalized(row["excerpt"]) not in normalized(section["body"]):
                result["warnings"].append("A finding was omitted because its résumé section or quote could not be verified.")
                continue
            item["section_title"] = section["title"]
        validated.append(item)
    if mode == "check":
        validated.sort(key=lambda row: ("high", "medium", "low").index(row["priority"]))
    result[field] = validated
    return result


def annotate_changes(sections, result):
    for section in sections:
        notes = [item for item in result.get("changes", [])
                 if section["title"] == "Whole document" or normalized(item["section_title"]) == normalized(section["title"])]
        section["rationale"] = notes
        if section["change"] != "unchanged" and not notes:
            section["rationale_warning"] = "The AI did not explain this section change. Inspect the before/after text and supporting facts before accepting."
    return sections


def report_state(application, profile, artifact, mode):
    run = application.generations.filter(kind="resume", mode=mode, status="completed").first()
    if not run:
        return None
    current = artifact or SimpleNamespace(body="", revision=0)
    body = current.body or profile.resume_text
    snapshot = run.quote_snapshot
    stale = (not profile_ready(profile) or snapshot.get("source_digest") != source_fingerprint(application, profile)
             or snapshot.get("expected_revision") != current.revision
             or snapshot.get("resume_body_digest") != hashlib.sha256(body.encode()).hexdigest())
    accepted = accepted_clarifications(application, profile)
    stale = stale or snapshot.get("clarification_id") != (accepted.pk if accepted else None)
    return {"id": str(run.pk), "mode": mode, "revision": snapshot.get("expected_revision"), "stale": stale,
            "created_at": run.result.get("completed_at", run.created_at), "body": run.result.get("body", ""), "warnings": run.result.get("warnings", []),
            "opportunities": run.result.get("opportunities", []), "findings": run.result.get("findings", [])}
