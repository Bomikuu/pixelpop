"""Review-only résumé additions for requirements not evidenced by saved sources."""
from rest_framework.exceptions import ValidationError

from .review import ReviewConflict, source_fingerprint


EXPERIENCE_WARNING = "Experience suggestions are hypothetical wording, not verified work history. Edit or remove unsupported examples before accepting. No evidence status or shared profile fact is changed."

EXPERIENCE_INSTRUCTIONS = """
For mode experience only, return résumé ADDITIONS, not a replacement résumé.
Address the supplied missing requirements with concrete, editable experience-bullet suggestions.
These are hypothetical examples for the applicant to review, not assertions that work occurred.
Do not use a Currently learning section. Use ## Relevant experience, followed by ### headings for suggested project themes.
Use concise résumé-style implementation bullets, with explicit [project], [my actual contribution], and [verified outcome] placeholders where facts are missing.
Where a real source excerpt supports a partial requirement, keep that fact accurate and clearly distinguish the unresolved part.
Never attach unsupported work to an existing employer or invent companies, dates, experience years, certifications, qualifications, clients, metrics, or outcomes.
For requirements that cannot be represented by an implementation example (such as licenses, degrees, years of experience or eligibility), warn that the applicant must supply evidence instead of inventing an example.
Keep all suggestions in the additions section. Do not reproduce or rewrite the supplied existing résumé.
Include a warning that these are hypothetical experience suggestions requiring factual review. Return empty evidence and requirements arrays.
The application will preserve the existing résumé verbatim and append your additions only to a pending review proposal.
"""


def experience_context(application, profile, artifact):
    if not artifact.body.strip():
        raise ValidationError("Save a résumé draft before proposing experience additions. Your existing résumé will be kept unchanged.")
    assessment = application.artifacts.filter(kind="assessment").first()
    if not assessment or not assessment.requirements:
        raise ValidationError("Compare job requirements before proposing experience additions.")
    if assessment.assessment_digest != source_fingerprint(application, profile):
        raise ReviewConflict("Your requirement assessment is out of date. Reassess before proposing experience additions.")
    missing = [row for row in assessment.requirements if row.get("status") in ("partial", "not_evidenced")]
    if not missing:
        raise ValidationError("There are no partial or not-evidenced requirements to propose experience for.")
    return {"assessment_revision": assessment.revision, "missing_requirements": missing}


def append_experience_proposal(result, original):
    additions = result["body"].strip()
    if not additions:
        raise ValidationError("The provider returned no experience additions. Your existing résumé was kept.")
    separator = "" if original.endswith("\n") else "\n"
    body = f"{original}{separator}{additions}\n"
    if len(body) > 30000:
        raise ValidationError("The proposed additions exceed the résumé's 30,000-character limit. Shorten the saved draft before requesting another proposal.")
    return {**result, "body": body, "evidence": [], "requirements": [],
            "warnings": [EXPERIENCE_WARNING, *result.get("warnings", [])]}
