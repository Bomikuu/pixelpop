"""Deterministic user-confirmed project sources, separate from practice examples."""
import hashlib
import json


def project_experience_text(profile, confirmed_only=True):
    sections = []
    for item in getattr(profile, "project_experience", []):
        if confirmed_only and item["status"] != "confirmed":
            continue
        lines = [item["name"], f"System: {item['system_type']}", f"Context: {item['context']}"]
        if item.get("year"):
            lines.append(f"Year: {item['year']}")
        if item.get("tools"):
            lines.append("Tools: " + ", ".join(item["tools"]))
        lines.append("My contribution: " + item["contributions"])
        if item.get("outcomes"):
            lines.append("Recorded outcomes: " + item["outcomes"])
        sections.append("\n".join(lines))
    return "\n\n".join(sections)


def tailoring_context(application, profile, preferences):
    from .review import source_fingerprint
    digest = source_fingerprint(application, profile)
    answers = list(application.requirement_decisions.filter(decision="evidence_added", source_digest=digest).order_by("pk").values("requirement", "note"))
    return {"emphasis": preferences.tailoring_emphasis if preferences else "conservative",
            "unconfirmed_claims": preferences.unconfirmed_claims if preferences else "review_questions",
            "confirmed_project_experience": project_experience_text(profile), "applicant_answers": answers}


def answers_digest(application, profile):
    answers = tailoring_context(application, profile, None)["applicant_answers"]
    return hashlib.sha256(json.dumps(answers, sort_keys=True).encode()).hexdigest()
