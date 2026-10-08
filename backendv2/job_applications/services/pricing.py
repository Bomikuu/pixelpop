"""Dated uncached token estimates; DeepSeek uses peak rates, not invoice totals."""
from datetime import date
from decimal import Decimal, ROUND_CEILING

OUTPUT_LIMIT = 6000
ASSESSMENT_OUTPUT_LIMIT = 12000


def output_limit_for(kind):
    return ASSESSMENT_OUTPUT_LIMIT if kind == "assessment" else OUTPUT_LIMIT


SOURCES = {
    "openai": "https://developers.openai.com/api/docs/models/compare",
    "gemini": "https://ai.google.dev/gemini-api/docs/pricing",
    "anthropic": "https://platform.claude.com/docs/en/about-claude/pricing",
    "openrouter": "https://openrouter.ai/models",
    "deepseek": "https://api-docs.deepseek.com/quick_start/pricing/",
}
RATES = {
    ("openai", "gpt-6-luna"): [("2026-10-04", "0.10", "0.50")],
    ("openai", "gpt-6.1-sol"): [("2026-10-04", "2", "10")],
    ("gemini", "gemini-3.1-flash-lite"): [("2026-10-04", "0.25", "1.50")],
    ("gemini", "gemini-3.8-flash"): [("2026-10-04", "0.75", "3.75"), ("2027-01-01", "1.50", "7.50")],
    ("anthropic", "claude-haiku-4-5"): [("2026-10-04", "1", "5")],
    ("anthropic", "claude-sonnet-4-6"): [("2026-10-04", "3", "15")],
    ("openrouter", "openai/gpt-6-luna"): [("2026-10-05", "0.10", "0.50")],
    ("openrouter", "openai/gpt-6.1-sol"): [("2026-10-05", "2", "10")],
    ("deepseek", "deepseek-flash"): [("2026-10-05", "0.30", "1.20")],
    ("deepseek", "deepseek-v4-pro"): [("2026-10-05", "1.32", "3.96")],
}
PRICING_NOTES = {
    "openrouter": "Standard OpenAI endpoint rates via OpenRouter. Estimates exclude credit-purchase fees and any cache-write charges; reconcile against provider billing.",
    "deepseek": "Peak uncached rates are used conservatively. Off-peak and cache discounts can lower your actual charge; reconcile against provider billing.",
}


def model_price(provider, model, on):
    eligible = [row for row in RATES.get((provider, model), []) if date.fromisoformat(row[0]) <= on]
    if not eligible:
        return None
    effective, incoming, outgoing = eligible[-1]
    price = {"input": incoming, "output": outgoing, "effective_date": effective, "source_url": SOURCES[provider]}
    if provider in PRICING_NOTES:
        price["note"] = PRICING_NOTES[provider]
    return price


def token_cost(price, incoming, outgoing):
    return ((Decimal(incoming) * Decimal(price["input"]) + Decimal(outgoing) * Decimal(price["output"])) / Decimal(1_000_000)).quantize(Decimal("0.000001"), rounding=ROUND_CEILING)
