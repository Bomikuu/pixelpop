"""Read-only scratch calculations. No models, snapshots or ledger writes."""
from decimal import Decimal, ROUND_HALF_UP, localcontext
from rest_framework.exceptions import ValidationError
from finance.services.balances import today
from .common import ZERO, cash, number
from .tariffs import calculate_tariff


def electricity_preview(data):
    mode = data.get("mode", "bills")
    result = {"mode": mode, "missing": [], "comparison": None, "usage": None}
    if mode == "bills":
        required = ("previous_bill", "current_bill")
        result["missing"] = [key for key in required if data.get(key) is None]
        if result["missing"]:
            return result
        previous = number(data["previous_bill"], "previous_bill")
        current = number(data["current_bill"], "current_bill")
        result["comparison"] = {"previous": previous, "current": current, "difference": cash(current - previous),
            "percent": ((current - previous) / previous * 100).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP) if previous else None}
        return result

    required = ("previous_reading", "current_reading", "previous_date", "reading_date", "period_end", "rate")
    result["missing"] = [key for key in required if data.get(key) is None]
    if result["missing"]:
        return result
    previous = number(data["previous_reading"], "previous_reading", 6, maximum=10**14)
    current = number(data["current_reading"], "current_reading", 6, maximum=10**14)
    start, observed, end = data["previous_date"], data["reading_date"], data["period_end"]
    if observed > today():
        raise ValidationError({"reading_date": "The current reading date cannot be in the future."})
    if observed <= start:
        raise ValidationError({"reading_date": "Choose a date after the previous reading to estimate a daily rate."})
    if end < observed or (end - start).days > 366 * 5:
        raise ValidationError({"period_end": "Choose a cycle end on or after the current reading, within five years of its start."})
    if current < previous:
        raise ValidationError({"current_reading": "This is below the previous reading. This quick calculator does not infer a reset or rollover."})
    elapsed, duration = (observed - start).days, (end - start).days
    rate = number(data["rate"], "rate", 6)
    fixed = number(data.get("fixed_fee") or ZERO, "fixed_fee")
    other = number(data.get("other_charges") or ZERO, "other_charges")
    expected = number(data.get("expected_usage"), "expected_usage", 6, nullable=True, maximum=10**14)
    budget = number(data.get("budget"), "budget", nullable=True)
    usage = current - previous
    with localcontext() as context:
        context.prec = 50
        daily_usage = usage / elapsed
        daily_energy_cost = cash(daily_usage * rate)
        projected = (daily_usage * duration).quantize(Decimal("0.000001"), rounding=ROUND_HALF_UP)
    if projected >= Decimal("100000000000000"):
        raise ValidationError({"current_reading": "The projected consumption is outside the calculator's supported range. Check the readings and dates."})
    config = {"flat_rate": rate, "charges": [
        {"name": "Fixed service fee", "kind": "fixed", "amount": fixed},
        {"name": "Taxes & other charges (entered estimate)", "kind": "fixed", "amount": other}]}
    with localcontext() as context:
        context.prec = 50
        current_cost = calculate_tariff(usage, config, usage_only=True)
        projected_cost = calculate_tariff(projected, config)
    denominator = expected if expected and expected > ZERO else projected if projected > ZERO else None
    result.update(usage=usage, previous_reading=previous, current_reading=current,
        elapsed_days=elapsed, cycle_days=duration, daily_usage=daily_usage, daily_energy_cost=daily_energy_cost,
        projected_usage=projected, current_energy_cost=current_cost["total"], projected_bill=projected_cost["total"],
        lines=projected_cost["lines"], expected_usage=expected, budget=budget,
        denominator=denominator, denominator_kind="expected" if expected and expected > ZERO else "projected",
        progress=usage / denominator * 100 if denominator else None,
        over_expected=projected > expected if expected and expected > ZERO else None,
        budget_variance=projected_cost["total"] - budget if budget is not None else None,
        dates={"start": start, "observed": observed, "end": end},
        note="Flat-rate estimate from your entered readings. Fixed and other charges are included once. No readings, bills, predictions or transactions are saved.")
    return result
