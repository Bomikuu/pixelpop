"""Bounded nutrition reports. Missing food is not a zero-calorie day."""
from datetime import timedelta
from decimal import Decimal

from django.db.models import Count, Sum

from finance.models import Meal, MealItem, NutritionActivity, WeightEntry
from .nutrition import NUTRIENTS, formatted_kcal, formatted_totals


def nutrition_analytics(user, start, end):
    length = (end - start).days + 1
    previous_start, previous_end = start - timedelta(days=length), start - timedelta(days=1)
    bounds = (previous_start, end)
    meals = {row["date"]: row["count"] for row in Meal.objects.filter(user=user, date__range=bounds).order_by().values("date").annotate(count=Count("id"))}
    foods = {row["meal__date"]: row for row in MealItem.objects.filter(meal__user=user, meal__date__range=bounds).order_by().values("meal__date").annotate(**{key: Sum(key) for key in NUTRIENTS})}
    activities = {row["date"]: row for row in NutritionActivity.objects.filter(user=user, date__range=bounds).order_by().values("date").annotate(kcal=Sum("active_kcal"), count=Count("id"))}

    def period(first, last):
        days = []
        for offset in range((last - first).days + 1):
            day = first + timedelta(days=offset)
            logged = day in meals
            nutrients = {key: foods.get(day, {}).get(key) or Decimal("0") for key in NUTRIENTS}
            activity = activities.get(day, {})
            burn = activity.get("kcal", Decimal("0"))
            days.append({"date": day.isoformat(), "logged": logged, "meal_count": meals.get(day, 0), "activity_count": activity.get("count", 0), "totals": formatted_totals(nutrients) if logged else None, "activity_kcal": formatted_kcal(burn), "net_calories": formatted_kcal(nutrients["calories"] - burn) if logged else None})
        logged_days = sum(row["logged"] for row in days)
        totals = {key: sum((Decimal(row["totals"][key]) for row in days if row["logged"]), Decimal("0")) for key in NUTRIENTS}
        net = sum((Decimal(row["net_calories"]) for row in days if row["logged"]), Decimal("0"))
        result = {"logged_days": logged_days, "meal_count": sum(row["meal_count"] for row in days), "totals": formatted_totals(totals) if logged_days else None, "activity_kcal": formatted_kcal(sum((Decimal(row["activity_kcal"]) for row in days), Decimal("0"))), "net_calories": formatted_kcal(net) if logged_days else None, "average_net_calories": formatted_kcal(net / logged_days) if logged_days else None}
        result.update({f"average_{key}": formatted_kcal(totals[key] / logged_days) if logged_days else None for key in NUTRIENTS})
        return result, days

    current, days = period(start, end)
    previous, _ = period(previous_start, previous_end)
    differences = {}
    for field in ("logged_days", "meal_count", "activity_kcal", "net_calories", "average_net_calories", *(f"average_{key}" for key in NUTRIENTS)):
        value, old = current[field], previous[field]
        delta = Decimal(value) - Decimal(old) if value is not None and old is not None else None
        differences[field] = {"absolute": formatted_kcal(delta) if delta is not None else None, "percentage": formatted_kcal(delta / Decimal(old) * 100) if delta is not None and Decimal(old) > 0 else None}
    weights = [{"date": row.date.isoformat(), "weight_kg": formatted_kcal(row.weight_kg), "note": row.note} for row in WeightEntry.objects.filter(user=user, date__range=(start, end)).order_by("date")]
    return {"range": {"start": start.isoformat(), "end": end.isoformat()}, "previous_range": {"start": previous_start.isoformat(), "end": previous_end.isoformat()}, "current": current, "previous": previous, "differences": differences, "days": days, "weights": weights}
