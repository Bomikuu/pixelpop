"""Provider credentials and endpoint URLs are never supplied by the browser."""
import json
import os
import socket
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from rest_framework.exceptions import ValidationError
from .pricing import OUTPUT_LIMIT, model_price
from .additional_providers import generate_deepseek, generate_openrouter
from django.utils import timezone
from zoneinfo import ZoneInfo

CATALOG = {
    "openai": {"label": "OpenAI", "key": "OPENAI_API_KEY", "models": [
        {"id": "gpt-6-luna", "label": "GPT-6 Luna", "description": "Low-cost initial assessments and drafts.", "input": 0.1, "output": 0.5},
        {"id": "gpt-6.1-sol", "label": "GPT-6.1 Sol", "description": "More detailed reasoning and final prose.", "input": 2, "output": 10},
    ]},
    "gemini": {"label": "Google Gemini", "key": "GEMINI_API_KEY", "models": [
        {"id": "gemini-3.1-flash-lite", "label": "Gemini 3.1 Flash-Lite", "description": "Economical text generation.", "input": 0.25, "output": 1.5},
        {"id": "gemini-3.8-flash", "label": "Gemini 3.8 Flash", "description": "General-purpose generation and refinement.", "input": None, "output": None},
    ]},
    "anthropic": {"label": "Anthropic Claude", "key": "ANTHROPIC_API_KEY", "models": [
        {"id": "claude-haiku-4-5", "label": "Claude Haiku 4.5", "description": "Fast first drafts and extraction.", "input": 1, "output": 5},
        {"id": "claude-sonnet-4-6", "label": "Claude Sonnet 4.6", "description": "Detailed review and refinement.", "input": 3, "output": 15},
    ]},
    "openrouter": {"label": "OpenRouter", "key": "OPENROUTER_API_KEY", "models": [
        {"id": "openai/gpt-6-luna", "label": "GPT-6 Luna via OpenRouter", "description": "Low-cost drafts through the OpenAI endpoint on OpenRouter."},
        {"id": "openai/gpt-6.1-sol", "label": "GPT-6.1 Sol via OpenRouter", "description": "Detailed refinement through the OpenAI endpoint on OpenRouter."},
    ]},
    "deepseek": {"label": "DeepSeek", "key": "DEEPSEEK_API_KEY", "models": [
        {"id": "deepseek-flash", "label": "DeepSeek V4.1 Flash", "description": "Economical assessments and first drafts. Estimates use peak rates."},
        {"id": "deepseek-v4-pro", "label": "DeepSeek V4 Pro", "description": "Detailed drafting and refinement. Estimates use peak rates."},
    ]},
}
PRICING_DATE = "2026-10-04"
SCHEMA = {"type": "object", "properties": {
    "body": {"type": "string"}, "warnings": {"type": "array", "items": {"type": "string"}},
    "evidence": {"type": "array", "items": {"type": "string"}},
    "requirements": {"type": "array", "maxItems": 60, "items": {"type": "object", "properties": {
        "text": {"type": "string"}, "posting_excerpt": {"type": "string"},
        "importance": {"type": "string", "enum": ["required", "preferred", "unspecified"]},
        "status": {"type": "string", "enum": ["supported", "partial", "not_evidenced"]},
        "explanation": {"type": "string"},
        "sources": {"type": "array", "maxItems": 8, "items": {"type": "object", "properties": {
            "source": {"type": "string", "enum": ["facts", "resume_text"]}, "excerpt": {"type": "string"},
        }, "required": ["source", "excerpt"], "additionalProperties": False}},
    }, "required": ["text", "posting_excerpt", "importance", "status", "explanation", "sources"], "additionalProperties": False}},
}, "required": ["body", "warnings", "evidence", "requirements"], "additionalProperties": False}


def configured(provider):
    return bool(os.getenv(CATALOG[provider]["key"], "").strip())


def public_catalog():
    today = timezone.localdate(timezone=ZoneInfo("Asia/Manila"))
    providers = []
    for key, value in CATALOG.items():
        models = [{**item, **(model_price(key, item["id"], today) or {"input": None, "output": None})} for item in value["models"]]
        providers.append({"id": key, "label": value["label"], "configured": configured(key),
                          "key_name": value["key"], "models": models,
                          "pricing_date": max(item.get("effective_date", PRICING_DATE) for item in models)})
    return providers


def validate_model(provider, model):
    if provider not in CATALOG or model not in [item["id"] for item in CATALOG[provider]["models"]]:
        raise ValidationError({"model": "Choose a supported model for this provider."})


def _post(url, headers, payload):
    request = Request(url, data=json.dumps(payload).encode(), headers={"Content-Type": "application/json", **headers}, method="POST")
    try:
        with urlopen(request, timeout=75) as response:
            raw = response.read(2_000_001)
        if len(raw) > 2_000_000:
            raise ValidationError("The provider returned too much data. Try again with a shorter posting.")
        result = json.loads(raw)
        if not isinstance(result, dict):
            raise ValueError()
        return result
    except HTTPError as error:
        messages = {401: "The selected provider rejected its API key.", 402: "The provider requires API credits. Check its billing balance before retrying.", 403: "This provider account cannot use the selected model.",
                    404: "The selected model is unavailable. Choose another model in Application AI settings.",
                    429: "The provider usage limit was reached. Check billing or retry later."}
        raise ValidationError(messages.get(error.code, "The provider could not complete generation. Your saved drafts are intact.")) from None
    except (URLError, TimeoutError, socket.timeout, ValueError):
        raise ValidationError("The provider request failed or timed out. Your saved drafts are intact; refresh before retrying.") from None


def generate(provider, model, instructions, content, schema=None, output_limit=OUTPUT_LIMIT):
    schema = schema or SCHEMA
    validate_model(provider, model)
    key = os.getenv(CATALOG[provider]["key"], "").strip()
    if not key:
        raise ValidationError(f"Configure {CATALOG[provider]['key']} on the Django server, or select another provider in Application AI settings.")
    if provider == "openai":
        payload = {"model": model, "instructions": instructions, "input": content, "store": False,
                   "max_output_tokens": output_limit, "text": {"format": {"type": "json_schema", "name": "application_draft", "strict": True, "schema": schema}}}
        payload["reasoning"] = {"effort": "none" if model == "gpt-6-luna" else "low"}
        data = _post("https://api.openai.com/v1/responses", {"Authorization": f"Bearer {key}"}, payload)
        if data.get("status") != "completed":
            details = data.get("incomplete_details") or {}
            reason = details.get("reason") if isinstance(details, dict) else None
            if reason == "max_output_tokens":
                message = f"OpenAI stopped at the {output_limit:,}-token output limit (including reasoning tokens), so the assessment or draft could not finish. Request a fresh quote before retrying, or choose another model."
            elif reason == "content_filter":
                message = "OpenAI stopped generation because of its content filter. Review the supplied posting and source text before retrying."
            else:
                status = data.get("status")
                status = status if status in ("incomplete", "failed", "cancelled", "queued", "in_progress") else "unknown"
                message = f"OpenAI did not return a completed response (status: {status}; no recognized incomplete reason supplied). Refresh saved results before retrying."
            raise ValidationError(message + " Previous drafts were retained. Check AI usage and provider billing; this request may still have incurred a charge.")
        text = "".join(block.get("text", "") for item in data.get("output", []) for block in item.get("content", []) if block.get("type") == "output_text")
        usage = data.get("usage", {})
        counts = (usage.get("input_tokens"), usage.get("output_tokens"))
    elif provider == "gemini":
        data = _post(f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent", {"x-goog-api-key": key}, {
            "systemInstruction": {"parts": [{"text": instructions + ("\nExpected JSON schema: " + json.dumps(schema) if schema is not SCHEMA else "")}]}, "contents": [{"role": "user", "parts": [{"text": content}]}],
            "generationConfig": {"maxOutputTokens": output_limit, "responseMimeType": "application/json"},
        })
        candidates = data.get("candidates", [])
        if not candidates or candidates[0].get("finishReason") != "STOP":
            raise ValidationError("Gemini did not finish a usable draft. Previous drafts were retained.")
        text = "".join(item.get("text", "") for item in candidates[0].get("content", {}).get("parts", []) if not item.get("thought"))
        usage = data.get("usageMetadata", {})
        output = usage.get("candidatesTokenCount")
        counts = (usage.get("promptTokenCount"), output + usage.get("thoughtsTokenCount", 0) if output is not None else None)
    elif provider == "openrouter":
        text, counts = generate_openrouter(model, key, instructions, content, schema, _post, output_limit=output_limit)
    elif provider == "deepseek":
        text, counts = generate_deepseek(model, key, instructions, content, schema, _post, output_limit=output_limit)
    elif provider == "anthropic":
        data = _post("https://api.anthropic.com/v1/messages", {"x-api-key": key, "anthropic-version": "2023-06-01"}, {
            "model": model, "max_tokens": output_limit, "system": instructions, "messages": [{"role": "user", "content": content}],
            "tools": [{"name": "application_draft", "description": "Return the reviewed application draft.", "input_schema": schema}],
            "tool_choice": {"type": "tool", "name": "application_draft"},
        })
        blocks = [item for item in data.get("content", []) if item.get("type") == "tool_use" and item.get("name") == "application_draft"]
        if data.get("stop_reason") != "tool_use" or not blocks:
            raise ValidationError("Claude did not finish a usable draft. Previous drafts were retained.")
        text = json.dumps(blocks[0].get("input"))
        usage = data.get("usage", {})
        counts = (usage.get("input_tokens"), usage.get("output_tokens"))
    else:
        raise ValidationError("Choose a supported AI provider.")
    try:
        result = json.loads(text)
        if not isinstance(result, dict) or not isinstance(result.get("body"), str) or not result["body"].strip() or len(result["body"]) > 30000:
            raise ValueError()
        for field in ("warnings", "evidence"):
            if not isinstance(result.get(field), list) or len(result[field]) > 80 or any(not isinstance(value, str) or len(value) > 2000 for value in result[field]):
                raise ValueError()
        requirements = result.get("requirements")
        if not isinstance(requirements, list) or len(requirements) > 60:
            raise ValueError()
        for item in requirements:
            if not isinstance(item, dict) or any(not isinstance(item.get(key), str) or not item[key].strip() or len(item[key]) > 2000 for key in ("text", "posting_excerpt", "explanation")):
                raise ValueError()
            if item.get("importance") not in ("required", "preferred", "unspecified") or item.get("status") not in ("supported", "partial", "not_evidenced"):
                raise ValueError()
            if not isinstance(item.get("sources"), list) or len(item["sources"]) > 8:
                raise ValueError()
            for source in item["sources"]:
                if not isinstance(source, dict) or source.get("source") not in ("facts", "resume_text") or not isinstance(source.get("excerpt"), str) or not source["excerpt"].strip() or len(source["excerpt"]) > 2000:
                    raise ValueError()
    except (ValueError, TypeError):
        raise ValidationError("The AI returned an invalid draft. Previous drafts were retained. Try regenerating this section.") from None
    counts = tuple(value if isinstance(value, int) and not isinstance(value, bool) and 0 <= value < 100_000_000 else None for value in counts)
    return result, counts
