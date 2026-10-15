from decimal import Decimal, ROUND_HALF_UP
from django.utils import timezone
from finance import models
from .common import MANILA, ZERO, cash, fingerprint, midnight, number, plain
from .readings import cycle_consumption, reading_intervals
from .tariffs import calculate_tariff, usage_allowance


def _quantity(value):
    return value.quantize(Decimal("0.000001"), rounding=ROUND_HALF_UP)


def predict_cycle(cycle_id, as_of=None, scenario="normal", usage_multiplier=Decimal("1")):
    cycle = models.SubscriptionCycle.objects.select_related("subscription__schedule", "tariff", "deadline").get(pk=cycle_id)
    now, subscription = as_of or timezone.now(), cycle.subscription
    usage_multiplier = number(usage_multiplier, "usage_multiplier", 6, maximum=100)
    consumption = cycle_consumption(cycle.pk)
    result = {"model": "insufficient_data", "version": 1, "scenario": scenario, "as_of": consumption["as_of"],
        "projected_usage": None, "projected_amount": None, "current_estimate": None, "tariff_lines": [],
        "consumption": consumption, "limited": True, "warnings": list(consumption["warnings"]), "anomaly": None}
    if not subscription.schedule.variable_amount:
        result.update(model="fixed_price", projected_amount=cycle.deadline.amount, limited=False)
        result["budget"] = budget_insight(cycle, result)
        return result
    cycle_days = Decimal((cycle.period_end - cycle.period_start).days) if cycle.period_start and cycle.period_end else None
    daily = consumption.get("daily")
    days = consumption["observed_days"]
    if daily is not None and days > 0 and cycle_days:
        result.update(model="current_cycle", projected_usage=_quantity(daily * cycle_days * usage_multiplier),
            limited=days < 7 or days / cycle_days < Decimal("0.25") or consumption["coverage"] == "partial")
    history = []
    candidates = subscription.cycles.exclude(pk=cycle.pk).filter(period_end__lte=cycle.period_start or now.astimezone(MANILA).date(),
        period_start__isnull=False, period_end__isnull=False, confirmed_at__isnull=False, excluded_at__isnull=True).order_by("-period_end")[:12]
    for previous in candidates:
        quantity = previous.reported_consumption
        if quantity is None:
            measured = cycle_consumption(previous.pk)
            if measured["as_of"] and measured["as_of"] >= midnight(previous.period_end):
                quantity = measured["usage"]
        if quantity is not None:
            previous.comparable_usage = quantity
            history.append(previous)
        if len(history) == 3:
            break
    historical_days = sum(((c.period_end - c.period_start).days for c in history if c.period_start and c.period_end), 0)
    if result["projected_usage"] is None and historical_days and cycle_days:
        daily = sum((c.comparable_usage for c in history), ZERO) / historical_days
        result.update(model="historical", projected_usage=_quantity(daily * cycle_days * usage_multiplier), limited=len(history) < 3)
    if not cycle.tariff:
        result["warnings"].append("Choose a rate version for this cycle to estimate its cost.")
    else:
        if result["projected_usage"] is not None:
            estimate = calculate_tariff(result["projected_usage"], cycle.tariff.config)
            result.update(projected_amount=estimate["total"], tariff_lines=estimate["lines"])
        if consumption["usage"] is not None:
            result["current_estimate"] = calculate_tariff(_quantity(consumption["usage"]), cycle.tariff.config)["total"]
    latest = consumption["as_of"]
    if latest and (now - latest).total_seconds() > subscription.reminder_preferences.get("stale_days", 7) * 86400:
        result["warnings"].append("The latest reading is outdated. Estimates are based on its timestamp, not today's usage.")
    baselines = []
    if len(history) >= 3 and historical_days:
        baselines = [sum((c.comparable_usage for c in history), ZERO) / historical_days]
    elif consumption.get("daily") is not None:
        # Use strictly earlier intervals, not overlapping observations from this cycle.
        for meter in subscription.meters.all():
            older = [r for r in reading_intervals(meter.pk) if r["days"] >= 1 and r["daily"] is not None and cycle.period_start and r["to"] <= midnight(cycle.period_start)]
            if len(older) >= 3:
                chosen = older[-3:]
                baselines.append(sum((r["usage"] for r in chosen), ZERO) / sum((r["days"] for r in chosen), ZERO))
    if baselines and (len(history) >= 3 or len(baselines) == len(consumption["meters"])) and consumption.get("daily") is not None:
        baseline = sum(baselines, ZERO)
        if baseline:
            change = (consumption["daily"] - baseline) / baseline * 100
            result["anomaly"] = {"baseline_daily": baseline, "observed_daily": consumption["daily"],
                "change_percent": change, "threshold": subscription.anomaly_threshold, "warning": change > subscription.anomaly_threshold}
    result["budget"] = budget_insight(cycle, result)
    return result


def budget_insight(cycle, prediction):
    budget = cycle.subscription.monthly_budget
    result = {"budget": budget, "variance": None, "variance_percent": None, "usage_limit": None, "remaining_usage": None, "daily_allowance": None, "progress": None, "reason": None}
    if budget is None or budget == ZERO or not cycle.tariff:
        result["reason"] = "Set a positive budget and rate version to see a usage allowance."
        return result
    projected = prediction["projected_amount"]
    if projected is not None:
        result.update(variance=projected - budget, variance_percent=(projected - budget) / budget * 100)
    allowance = usage_allowance(budget, cycle.tariff.config)
    result["usage_limit"], result["reason"] = allowance["usage_limit"], allowance["reason"]
    usage = prediction["consumption"]["usage"]
    if usage is not None and allowance["usage_limit"] is not None:
        result["remaining_usage"] = allowance["usage_limit"] - usage
        if allowance["usage_limit"]:
            result["progress"] = usage / allowance["usage_limit"] * 100
        as_of = prediction["as_of"]
        if as_of and cycle.period_end:
            days = Decimal(str((midnight(cycle.period_end) - as_of).total_seconds())) / 86400
            result["daily_allowance"] = max(ZERO, result["remaining_usage"]) / days if days > 0 else None
    return result


def snapshot_prediction(cycle_id, actor, reason):
    result = predict_cycle(cycle_id)
    # Time-dependent warning text is excluded so ordinary reads cannot create history.
    cycle = models.SubscriptionCycle.objects.get(pk=cycle_id)
    source = {"result": {k: v for k, v in result.items() if k != "warnings"}, "tariff": cycle.tariff_id, "cycle_revision": cycle.revision}
    snapshot, _ = models.PredictionSnapshot.objects.get_or_create(cycle=cycle, input_hash=fingerprint(source), scenario="normal", defaults={
        "as_of": result["as_of"] or timezone.now(), "model": result["model"], "projected_usage": result["projected_usage"],
        "projected_amount": result["projected_amount"], "provenance": plain(result), "reason": reason, "created_by": actor})
    return snapshot
