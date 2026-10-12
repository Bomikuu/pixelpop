"""Batch answer drafts are advice, never confirmed applicant history."""
from copy import deepcopy

from rest_framework.exceptions import ValidationError

INSTRUCTIONS = """Draft answers to EVERY finding in resume_optimization.latest_checklist in one call.
This is an answer-drafting task, NOT a résumé rewrite. Keep body to a brief review summary and requirements/evidence to [].
Return answers in finding_index order, exactly one per finding. Each has finding_index, status (answered or unresolved), answer, reason, and sources.
Use only reviewed profile facts, reviewed original résumé text, confirmed project experience, and previously user-confirmed applicant answers. Relevant ASTA and independent CMS, POS, restaurant, full-stack and landing-page contributions may be used ONLY when actually present in those sources. The current saved draft, posting, checklist, questions, hypothetical examples and suggested fixes are NOT evidence.
An answered draft must directly address the question with supplied facts and exact source quotations. Aim for 2–4 short sentences per answer, normally under 600 characters, ready for batch review. Never infer a specific tool from a related one, years from general tenure, credentials, customer identities, project dates, production scale or metrics. Never invent work to fill a gap. When a finding is partly supported, clearly name what is still unknown in the answer; do not fill it in.
Use unresolved when no supported answer can be given; state what information is missing. Do not infer that someone has never used a tool just because it is absent. Formatting-only corrections can remain unresolved with a suggested removal in reason; do not present the suggestion as experience.
sources use facts, resume_text, project_experience or clarifications with exact excerpts from the corresponding source. Cite only the strongest 1–2 short relevant excerpts per answer, not entire source paragraphs. Use source=clarifications only for existing user-confirmed answer text. AI drafts are not confirmed facts. All answers require one batch factual review before saving, and a separate cost approval before a fix proposal. Do not claim that the résumé or checklist has been fixed.
Keep each answer at most 4000 characters, reason at most 1000, and ALL answer text together at most 30000 characters.
"""


def answer_schema(base, sources):
    schema = deepcopy(base)
    fields = {
        "finding_index": {"type": "integer", "minimum": 0, "maximum": 39},
        "status": {"type": "string", "enum": ["answered", "unresolved"]},
        "answer": {"type": "string"}, "reason": {"type": "string"}, "sources": sources,
    }
    schema["properties"]["answers"] = {"type": "array", "maxItems": 40, "items": {
        "type": "object", "properties": fields, "required": list(fields), "additionalProperties": False,
    }}
    schema["required"].append("answers")
    return schema


def normalize_answers(result, profile, context):
    from .resume_optimization import traced_sources

    rows = result.get("answers")
    count = len(context["latest_checklist"]["findings"])
    message = "The AI returned invalid batch answers. Your answers and saved résumé were kept."
    if not isinstance(rows, list) or len(rows) != count:
        raise ValidationError(message)
    confirmed = "\n\n".join(row["answer"] for row in context["applicant_answers"] if row["status"] == "answered")
    confirmed += "\n\n" + "\n\n".join(row["note"] for row in context.get("requirement_answers", []))
    validated, indices = [], set()
    for row in rows:
        if (not isinstance(row, dict) or type(row.get("finding_index")) is not int
                or row["finding_index"] not in range(count) or row["finding_index"] in indices
                or row.get("status") not in ("answered", "unresolved")
                or not isinstance(row.get("answer"), str) or len(row["answer"]) > 4000
                or not isinstance(row.get("reason"), str) or not 0 < len(row["reason"].strip()) <= 1000
                or row["status"] == "answered" and not row["answer"].strip()):
            raise ValidationError(message)
        indices.add(row["finding_index"])
        sources = traced_sources(row.get("sources"), profile, confirmed)
        item = {**row, "sources": sources}
        if row["status"] == "answered" and (not sources or len(sources) != len(row["sources"])):
            # Do not prefill an assertion whose own cited evidence cannot be traced.
            item.update(status="unresolved", answer="", reason="Source quotations could not be verified. Provide actual facts or leave this finding unresolved.")
        validated.append(item)
    if sum(len(row["answer"]) for row in validated) > 30000:
        raise ValidationError(message)
    result["answers"] = sorted(validated, key=lambda row: row["finding_index"])
    result["requirements"], result["evidence"] = [], []
    return result
