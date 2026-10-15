"""Deterministic PHP tariff arithmetic, shared by readings, budgets and forecasts."""
from decimal import Decimal, ROUND_DOWN
from rest_framework.exceptions import ValidationError
from .common import ZERO, cash, number


def validate_tariff(config):
    if not isinstance(config, dict) or set(config) - {"flat_rate", "tiers", "minimum_usage_charge", "charges"}:
        raise ValidationError({"config": "Provide flat_rate or tiers, minimum_usage_charge and optional charges."})
    result = {"flat_rate": number(config.get("flat_rate"), "flat_rate", 6, nullable=True),
              "minimum_usage_charge": number(config.get("minimum_usage_charge", "0"), "minimum_usage_charge"), "tiers": [], "charges": []}
    tiers = config.get("tiers") or []
    if not isinstance(tiers, list) or len(tiers) > 30 or (tiers and result["flat_rate"] is not None):
        raise ValidationError({"tiers": "Choose a flat rate or up to 30 incremental rate tiers, not both."})
    previous = ZERO
    for index, tier in enumerate(tiers):
        if not isinstance(tier, dict) or set(tier) != {"up_to", "rate"}:
            raise ValidationError({"tiers": "Each tier needs up_to and rate. Use null for the last upper boundary."})
        upper = number(tier["up_to"], "up_to", 6, nullable=True)
        if (upper is None and index != len(tiers) - 1) or (upper is not None and upper <= previous):
            raise ValidationError({"tiers": "Tier boundaries must increase; only the last tier can be unbounded."})
        result["tiers"].append({"up_to": upper, "rate": number(tier["rate"], "rate", 6)})
        previous = upper if upper is not None else previous
    if tiers and result["tiers"][-1]["up_to"] is not None:
        raise ValidationError({"tiers": "The final tier must have an unbounded (null) upper boundary."})
    charges = config.get("charges") or []
    if not isinstance(charges, list) or len(charges) > 30:
        raise ValidationError({"charges": "Use at most 30 additional charges."})
    for charge in charges:
        if not isinstance(charge, dict) or set(charge) - {"name", "kind", "amount", "base"}:
            raise ValidationError({"charges": "Each charge needs name, kind, amount and optional base."})
        kind, base = charge.get("kind"), charge.get("base", "subtotal")
        if kind not in ("fixed", "per_unit", "percent") or base not in ("usage", "subtotal") or not isinstance(charge.get("name"), str) or not 1 <= len(charge["name"].strip()) <= 120:
            raise ValidationError({"charges": "Name each fixed, per_unit or percent charge and choose usage/subtotal as its percentage base."})
        result["charges"].append({"name": charge["name"].strip(), "kind": kind, "base": base, "amount": number(charge.get("amount"), "charge", 6)})
    return result


def calculate_tariff(usage, config, usage_only=False):
    config = validate_tariff(config)
    usage = number(usage, "usage", 6, maximum=10**14)
    if config["flat_rate"] is None and not config["tiers"]:
        return {"usage_charge": None, "fee_total": None, "total": None, "lines": [], "reason": "missing_rate"}
    raw, lower = ZERO, ZERO
    if config["tiers"]:
        for tier in config["tiers"]:
            ceiling = tier["up_to"] if tier["up_to"] is not None else usage
            raw += max(ZERO, min(usage, ceiling) - lower) * tier["rate"]
            lower = ceiling
    else:
        raw = usage * config["flat_rate"]
    energy = cash(raw if usage_only else max(raw, config["minimum_usage_charge"]))
    lines = [{"name": "Usage charge", "amount": energy}]
    subtotal = energy
    if not usage_only:
        for charge in config["charges"]:
            if charge["kind"] != "percent":
                value = cash(charge["amount"] * usage if charge["kind"] == "per_unit" else charge["amount"])
                lines.append({"name": charge["name"], "amount": value})
                subtotal += value
        for charge in config["charges"]:
            if charge["kind"] == "percent":
                value = cash((energy if charge["base"] == "usage" else subtotal) * charge["amount"] / 100)
                lines.append({"name": charge["name"], "amount": value})
    total = sum((row["amount"] for row in lines), ZERO)
    return {"usage_charge": energy, "fee_total": total - energy, "total": total, "lines": lines, "reason": None}


def usage_allowance(budget, config):
    budget = number(budget)
    floor = calculate_tariff(ZERO, config)["total"]
    if floor is None:
        return {"usage_limit": None, "reason": "missing_rate"}
    if floor > budget:
        return {"usage_limit": ZERO, "reason": "fees_exceed_budget"}
    low, high = ZERO, Decimal(1)
    while high < Decimal("10000000000000") and calculate_tariff(high, config)["total"] <= budget:
        high *= 2
    if high >= Decimal("10000000000000"):
        return {"usage_limit": None, "reason": "no_finite_usage_limit"}
    for _ in range(80):
        middle = ((low + high) / 2).quantize(Decimal("0.000001"), rounding=ROUND_DOWN)
        if middle == low:
            break
        if calculate_tariff(middle, config)["total"] <= budget:
            low = middle
        else:
            high = middle
    return {"usage_limit": low, "reason": None}
