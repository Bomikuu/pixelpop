"""Fixed-endpoint adapters; reuse the existing transport and draft validation."""
from zoneinfo import ZoneInfo

from django.utils import timezone
from rest_framework.exceptions import ValidationError

from .pricing import OUTPUT_LIMIT, model_price


def generate_openrouter(model, key, instructions, content, schema, post, output_limit=OUTPUT_LIMIT):
    price = model_price("openrouter", model, timezone.localdate(timezone=ZoneInfo("Asia/Manila")))
    if not price:
        raise ValidationError("OpenRouter pricing is unavailable. Choose another supported model.")
    data = post("https://openrouter.ai/api/v1/chat/completions", {"Authorization": f"Bearer {key}"}, {
        "model": model,
        "messages": [{"role": "system", "content": instructions}, {"role": "user", "content": content}],
        "stream": False,
        "max_completion_tokens": output_limit,
        "reasoning": {"effort": "none" if model == "openai/gpt-6-luna" else "low"},
        "response_format": {"type": "json_schema", "json_schema": {"name": "application_draft", "strict": True, "schema": schema}},
        "provider": {
            "only": ["openai"], "allow_fallbacks": False, "require_parameters": True,
            "data_collection": "deny",
            "max_price": {"prompt": float(price["input"]), "completion": float(price["output"])},
        },
    })
    choices = data.get("choices")
    if data.get("error") or not isinstance(choices, list) or not choices or not isinstance(choices[0], dict) or choices[0].get("finish_reason") != "stop":
        raise ValidationError("OpenRouter did not finish a usable draft. Check model availability and routing policies; your saved drafts were retained.")
    message = choices[0].get("message")
    if not isinstance(message, dict) or message.get("refusal") or not isinstance(message.get("content"), str):
        raise ValidationError("OpenRouter did not return usable document text. Your saved drafts were retained.")
    usage = data.get("usage")
    usage = usage if isinstance(usage, dict) else {}
    return message["content"], (usage.get("prompt_tokens"), usage.get("completion_tokens"))


def generate_deepseek(model, key, instructions, content, schema, post, output_limit=OUTPUT_LIMIT):
    data = post("https://api.deepseek.com/responses", {"Authorization": f"Bearer {key}"}, {
        "model": model, "instructions": instructions, "input": content,
        "stream": False, "max_output_tokens": output_limit,
        "reasoning": {"effort": "none"},
        "text": {"format": {"type": "json_schema", "name": "application_draft", "schema": schema}},
    })
    if data.get("status") != "completed" or data.get("error"):
        raise ValidationError("DeepSeek did not finish a usable draft. Your saved drafts were retained.")
    output = data.get("output")
    if not isinstance(output, list):
        raise ValidationError("DeepSeek returned an invalid response. Your saved drafts were retained.")
    blocks = [block for item in output if isinstance(item, dict) and item.get("type") == "message" and isinstance(item.get("content"), list)
              for block in item["content"] if isinstance(block, dict) and block.get("type") == "output_text"]
    if not blocks or any(not isinstance(block.get("text"), str) for block in blocks):
        raise ValidationError("DeepSeek did not return usable document text. Your saved drafts were retained.")
    usage = data.get("usage")
    usage = usage if isinstance(usage, dict) else {}
    return "".join(block["text"] for block in blocks), (usage.get("input_tokens"), usage.get("output_tokens"))
