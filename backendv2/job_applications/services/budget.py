import hashlib
import json
from datetime import datetime
from decimal import Decimal
from types import SimpleNamespace
from zoneinfo import ZoneInfo

from django.core import signing
from django.db.models import Q, Sum
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from job_applications.models import ApplicationAISettings, GenerationRun
from .pricing import output_limit_for, model_price, token_cost
from .providers import SCHEMA, configured, validate_model
from .review import ReviewConflict, profile_ready, source_fingerprint

MANILA = ZoneInfo("Asia/Manila")
QUOTE_SALT = "job-applications.generation-quote.v1"


def month_window(at=None):
    local = (at or timezone.now()).astimezone(MANILA)
    start = datetime(local.year, local.month, 1, tzinfo=MANILA)
    end = datetime(local.year + (local.month == 12), local.month % 12 + 1, 1, tzinfo=MANILA)
    return start, end


def monthly_usage(owner, at=None, preferences=None):
    preferences = preferences or ApplicationAISettings.objects.get_or_create(owner=owner)[0]
    start, end = month_window(at)
    rows = GenerationRun.objects.filter(application__owner=owner, created_at__gte=start, created_at__lt=end)
    known = rows.filter(Q(reconciled_cost_usd__isnull=False) | Q(estimated_cost_usd__isnull=False))
    unresolved = rows.filter(reconciled_cost_usd__isnull=True, estimated_cost_usd__isnull=True)
    spent = known.aggregate(total=Sum(Coalesce("reconciled_cost_usd", "estimated_cost_usd")))["total"] or Decimal(0)
    held = unresolved.aggregate(total=Sum("quoted_cost_usd"))["total"] or Decimal(0)
    cap = preferences.monthly_budget_usd
    unknown = unresolved.filter(quoted_cost_usd__isnull=True).count()
    return {"month": start.strftime("%Y-%m"), "spent_usd": str(spent), "held_usd": str(held),
            "budget_usd": str(cap) if cap is not None else None,
            "remaining_usd": str(max(Decimal(0), cap - spent - held)) if cap is not None and not unknown else None,
            "unresolved_count": unresolved.count(), "unknown_unreserved_count": unknown}


def budget_block(usage, estimate):
    if usage["budget_usd"] is None:
        return ""
    if Decimal(usage["budget_usd"]) == 0:
        return "Your monthly budget is zero. Increase it in Application AI settings to generate."
    if usage["unknown_unreserved_count"]:
        return "Reconcile this month's unknown-cost requests before using the spending guard."
    if estimate is None:
        return "This model has no verified price. Choose a priced model before budget-protected generation."
    if Decimal(estimate) > Decimal(usage["remaining_usd"]):
        return "The estimate exceeds your remaining monthly allowance. Change the budget or wait until next month."
    return ""


def estimate_request(application, profile, preferences, kind, mode):
    from .generation import generation_instructions, build_generation_content
    from .resume_optimization import RESUME_MODES, response_schema
    if mode in ("experience", *RESUME_MODES) and kind != "resume":
        raise ValidationError("Résumé optimization and experience proposals apply only to the résumé.")
    model = preferences.refinement_model if mode in ("refine", "tailor", "check", "fix") and preferences.refinement_model else preferences.model
    validate_model(preferences.provider, model)
    if not configured(preferences.provider):
        raise ValidationError("The selected provider is not configured. Choose a configured provider in Application AI settings.")
    if not profile_ready(profile):
        raise ValidationError("Review and confirm your profile sources before generating.")
    if kind == "answers" and not application.questions:
        raise ValidationError("Add the actual screening questions before generating answers.")
    artifact = application.artifacts.filter(kind=kind).first() or SimpleNamespace(body="", revision=0)
    if mode == "refine" and not artifact.body:
        raise ValidationError("Save an initial draft before refining it.")
    content = build_generation_content(application, profile, artifact, kind, mode)
    payload = generation_instructions(mode) + content + json.dumps(response_schema(SCHEMA, mode), sort_keys=True)
    input_estimate = len(payload.encode("utf-8")) + 1024
    price = model_price(preferences.provider, model, timezone.localdate(timezone=MANILA))
    output_limit = output_limit_for(kind)
    estimate = token_cost(price, input_estimate, output_limit) if price else None
    snapshot = {"owner": application.owner_id, "application": application.pk, "kind": kind, "mode": mode,
            "provider": preferences.provider, "model": model, "settings_version": preferences.version,
            "source_digest": source_fingerprint(application, profile), "expected_revision": artifact.revision,
            "content_digest": hashlib.sha256(payload.encode()).hexdigest(), "month": month_window()[0].strftime("%Y-%m"),
            "input_estimate": input_estimate, "output_limit": output_limit, "price": price,
            "estimate_usd": str(estimate) if estimate is not None else None}
    if mode == "experience":
        snapshot["assessment_revision"] = json.loads(content)["experience_proposal"]["assessment_revision"]
    if mode in RESUME_MODES:
        snapshot["resume_body_digest"] = hashlib.sha256((artifact.body or profile.resume_text).encode()).hexdigest()
        optimization = json.loads(content)["resume_optimization"]
        snapshot["clarification_id"] = optimization["clarification_id"]
        if mode == "fix":
            snapshot["checklist_id"] = optimization["latest_checklist"]["id"]
    return snapshot


def quote_generations(application, profile, preferences, kinds, mode):
    items = []
    for kind in kinds:
        snapshot = estimate_request(application, profile, preferences, kind, mode)
        items.append({**snapshot, "quote_token": signing.dumps(snapshot, salt=QUOTE_SALT, compress=True),
                      "pricing_date": snapshot["price"]["effective_date"] if snapshot["price"] else None,
                      "assumptions": f"Approximate input: UTF-8 byte length plus 1,024 framing tokens; up to {snapshot['output_limit']:,} output tokens. Reasoning and provider billing may differ. This is not a guaranteed billing cap." + (f" {snapshot['price']['note']}" if snapshot["price"] and snapshot["price"].get("note") else "")})
    total = sum((Decimal(item["estimate_usd"]) for item in items), Decimal(0)) if all(item["estimate_usd"] is not None for item in items) else None
    usage = monthly_usage(application.owner, preferences=preferences)
    return {"items": items, "combined_estimate_usd": str(total) if total is not None else None, "usage": usage, "blocked_reason": budget_block(usage, total)}


def verify_quote(application, profile, preferences, data):
    try:
        saved = signing.loads(data["quote_token"], salt=QUOTE_SALT, max_age=600)
    except signing.BadSignature:
        raise ReviewConflict("This quote expired or is invalid. Request a fresh estimate before generating.") from None
    current = estimate_request(application, profile, preferences, data["kind"], data["mode"])
    if saved != current or current["expected_revision"] != data["expected_revision"]:
        raise ReviewConflict("Your sources, model, pricing or draft changed. Request a fresh estimate.")
    reason = budget_block(monthly_usage(application.owner, preferences=preferences), current["estimate_usd"])
    if reason:
        raise ReviewConflict(reason)
    return current
