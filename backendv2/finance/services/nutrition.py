from calendar import monthrange
from datetime import date, timedelta
from decimal import Decimal

from django.db.models import Sum

from finance.models import Meal, MealItem, WeightEntry


NUTRIENTS = ("calories", "protein", "carbs", "fat")


def formatted_totals(totals):
    return {field: str(Decimal(totals[field]).quantize(Decimal("0.01"))) for field in NUTRIENTS}


def nutrition_period_summary(user, selected_date, period):
    if period == "month":
        start_date = selected_date.replace(day=1)
        end_date = date(selected_date.year, selected_date.month, monthrange(selected_date.year, selected_date.month)[1])
    else:
        start_date = end_date = None

    items = MealItem.objects.filter(meal__user=user)
    if start_date is not None:
        items = items.filter(meal__date__range=(start_date, end_date))
    daily = list(
        items.order_by().values("meal__date")
        .annotate(**{field: Sum(field) for field in NUTRIENTS})
        .order_by("meal__date")
    )
    by_day = {row["meal__date"]: {field: row[field] for field in NUTRIENTS} for row in daily}
    logged_days = len(by_day)
    total = {field: sum((row[field] for row in by_day.values()), Decimal("0")) for field in NUTRIENTS}

    if period == "month":
        rows = []
        for offset in range((end_date - start_date).days + 1):
            day = start_date + timedelta(days=offset)
            values = by_day.get(day)
            rows.append({"date": day.isoformat(), "logged": values is not None, "totals": formatted_totals(values) if values else None})
    else:
        by_month = {}
        for day, values in by_day.items():
            month = day.strftime("%Y-%m")
            bucket = by_month.setdefault(month, {"logged_days": 0, **{field: Decimal("0") for field in NUTRIENTS}})
            bucket["logged_days"] += 1
            for field in NUTRIENTS:
                bucket[field] += values[field]
        rows = [
            {"month": month, "logged_days": values["logged_days"], "totals": formatted_totals(values)}
            for month, values in sorted(by_month.items())
        ]
        start_date = min(by_day) if by_day else None
        end_date = max(by_day) if by_day else None

    return {
        "period": period,
        "start_date": start_date.isoformat() if start_date else None,
        "end_date": end_date.isoformat() if end_date else None,
        "logged_days": logged_days,
        "totals": formatted_totals(total) if logged_days else None,
        "average_calories": str((total["calories"] / logged_days).quantize(Decimal("0.01"))) if logged_days else None,
        "average_protein": str((total["protein"] / logged_days).quantize(Decimal("0.01"))) if logged_days else None,
        "rows": rows,
    }


def nutrition_summary(user, end_date):
    start_date = end_date - timedelta(days=6)
    totals_by_day = {}
    for meal in Meal.objects.filter(user=user, date__range=(start_date, end_date)).prefetch_related("items"):
        totals = totals_by_day.setdefault(meal.date, {field: Decimal("0") for field in NUTRIENTS})
        for item in meal.items.all():
            for field in NUTRIENTS:
                totals[field] += getattr(item, field)

    def formatted(totals):
        return {field: str(value.quantize(Decimal("0.01"))) for field, value in totals.items()}

    days = []
    for offset in range(7):
        day = start_date + timedelta(days=offset)
        totals = totals_by_day.get(day)
        days.append({"date": day.isoformat(), "logged": totals is not None, "totals": formatted(totals) if totals is not None else None})

    logged_days = len(totals_by_day)
    calorie_sum = sum((totals["calories"] for totals in totals_by_day.values()), Decimal("0"))
    weight_rows = list(WeightEntry.objects.filter(user=user, date__lte=end_date).order_by("-date")[:10])
    weights = [
        {"date": row.date.isoformat(), "weight_kg": str(row.weight_kg.quantize(Decimal("0.01"))), "note": row.note}
        for row in reversed(weight_rows)
    ]
    return {
        "date": end_date.isoformat(),
        "day_totals": formatted(totals_by_day[end_date]) if end_date in totals_by_day else None,
        "logged_days": logged_days,
        "average_calories": str((calorie_sum / logged_days).quantize(Decimal("0.01"))) if logged_days else None,
        "days": days,
        "weights": weights,
    }
