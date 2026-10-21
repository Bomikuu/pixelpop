from datetime import date, timedelta

from finance.models import Meal, MealItem, NutritionActivity
from finance.services.nutrition_analytics import nutrition_analytics
from .test_nutrition import NutritionApiBase


class NutritionAnalyticsTests(NutritionApiBase):
    def meal(self, day, calories, user=None):
        meal = Meal.objects.create(user=user or self.user, date=day, meal_name="Recorded meal")
        MealItem.objects.create(meal=meal, position=0, name="Food", amount=1, unit="portion", calories=calories, protein="10", carbs="20", fat="3")
        return meal

    def activity(self, day, calories):
        NutritionActivity.objects.create(user=self.user, date=day, activity_type="walking", name="Walk", active_kcal=calories, source="manual")

    def test_food_and_net_averages_exclude_activity_only_dates(self):
        self.meal(self.day, "100")
        self.meal(self.day + timedelta(days=1), "300")
        self.activity(self.day, "50")
        self.activity(self.day + timedelta(days=2), "80")
        result = nutrition_analytics(self.user, self.day, self.day + timedelta(days=2))
        self.assertEqual(result["current"]["average_calories"], "200.00")
        self.assertEqual(result["current"]["net_calories"], "350.00")
        self.assertEqual(result["current"]["average_net_calories"], "175.00")
        self.assertEqual(result["current"]["activity_kcal"], "130.00")
        self.assertIsNone(result["days"][2]["totals"])
        self.assertIsNone(result["days"][2]["net_calories"])

    def test_zero_calorie_meal_is_logged_and_owner_isolation(self):
        self.meal(self.day, "0")
        self.meal(self.day, "999", self.other)
        result = nutrition_analytics(self.user, self.day, self.day)
        self.assertEqual(result["current"]["logged_days"], 1)
        self.assertEqual(result["current"]["average_calories"], "0.00")
        self.assertIsNone(result["previous"]["average_calories"])
        self.assertIsNone(result["differences"]["average_calories"]["percentage"])

    def test_equal_elapsed_comparison_and_actual_weights(self):
        result = nutrition_analytics(self.user, date(2024, 2, 1), date(2024, 2, 29))
        self.assertEqual(len(result["days"]), 29)
        self.assertEqual(result["previous_range"], {"start": "2024-01-03", "end": "2024-01-31"})
        self.assertEqual(result["weights"], [])

    def test_endpoint_is_private_and_bounded(self):
        url = "/api/v1/finance/nutrition/analytics/"
        for params in ({}, {"start": "no", "end": str(self.day)}, {"start": "2024-01-01", "end": "2026-01-01"}, {"start": "2099-01-01", "end": "2099-01-03"}, {"start": "2026-09-29", "end": "2026-09-28"}):
            self.assertEqual(self.client.get(url, params).status_code, 400)
        response = self.client.get(url, {"start": str(self.day), "end": str(self.day)})
        self.assertEqual(response.status_code, 200)

    def test_target_edits_do_not_change_meal_values(self):
        self.meal(self.day, "100.25")
        before = nutrition_analytics(self.user, self.day, self.day)
        self.client.patch("/api/v1/finance/nutrition/profile/", {"daily_target_kcal": "1600"}, format="json")
        self.assertEqual(nutrition_analytics(self.user, self.day, self.day), before)

    def test_zero_previous_baseline_has_absolute_difference_without_percentage(self):
        self.meal(self.day - timedelta(days=1), "0")
        self.meal(self.day, "100.25")
        delta = nutrition_analytics(self.user, self.day, self.day)["differences"]["average_calories"]
        self.assertEqual(delta["absolute"], "100.25")
        self.assertIsNone(delta["percentage"])

    def test_current_month_uses_equal_elapsed_comparison(self):
        result = nutrition_analytics(self.user, date(2026, 10, 1), date(2026, 10, 21))
        self.assertEqual(result["previous_range"], {"start": "2026-09-10", "end": "2026-09-30"})
