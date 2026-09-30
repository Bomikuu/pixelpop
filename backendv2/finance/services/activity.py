from decimal import Decimal, ROUND_HALF_UP


# 2024 Adult Compendium of Physical Activities: https://pacompendium.com/adult-compendium/
# A session's active kcal subtracts the resting 1 MET; it is not total energy expenditure.
ACTIVITIES = {
    "walking": {"label": "Moderate walking", "met": Decimal("3.8"), "code": "17190"},
    "running": {"label": "Running · 5 mph", "met": Decimal("8.5"), "code": "12030"},
    "cycling": {"label": "Leisure cycling · under 10 mph", "met": Decimal("4.0"), "code": "01010"},
    "swimming": {"label": "Recreational freestyle swimming", "met": Decimal("5.8"), "code": "18240"},
    "strength": {"label": "Resistance training · varied exercises", "met": Decimal("3.5"), "code": "02054"},
}
ESTIMATE_VERSION = "compendium-2024-v1"


def estimate_active_kcal(activity_type, duration_minutes, steps, weight_kg):
    """Return (active kcal, duration minutes, MET, method version, assumed duration)."""
    met = ACTIVITIES[activity_type]["met"]
    assumed = duration_minutes is None
    duration = (Decimal(steps) / Decimal("100")) if assumed else Decimal(duration_minutes)
    kcal = ((met - Decimal("1")) * Decimal(weight_kg) * duration / Decimal("60")).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )
    return kcal, duration.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP), met, ESTIMATE_VERSION, assumed
