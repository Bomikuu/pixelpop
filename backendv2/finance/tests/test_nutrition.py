from datetime import date, datetime, timedelta, timezone as utc_timezone
from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.test import TestCase
from rest_framework.test import APIClient

from finance.models import Meal, MealItem, NutritionProfile, WeightEntry


class NutritionModelTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user("nutrition-model", password="test-only-password")

    def test_weight_is_unique_per_user_and_date(self):
        WeightEntry.objects.create(user=self.user, date=date(2026, 9, 28), weight_kg="72.5")
        with self.assertRaises(IntegrityError), transaction.atomic():
            WeightEntry.objects.create(user=self.user, date=date(2026, 9, 28), weight_kg="73")

    def test_meal_items_keep_their_entered_order(self):
        meal = Meal.objects.create(user=self.user, date=date(2026, 9, 28), meal_name="Dinner")
        MealItem.objects.create(meal=meal, position=1, name="Rice", amount=250, unit="g", calories=325, protein=6, carbs=71, fat=1)
        MealItem.objects.create(meal=meal, position=0, name="Tuna", amount=1, unit="can", calories=200, protein=24, carbs=2, fat=11)
        self.assertEqual(list(meal.items.values_list("name", flat=True)), ["Tuna", "Rice"])

    def test_owner_fields_are_required(self):
        for model in (NutritionProfile, WeightEntry, Meal):
            self.assertFalse(model._meta.get_field("user").null)


class NutritionApiBase(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user("nutrition-one", password="test-only-password")
        self.other = get_user_model().objects.create_user("nutrition-two", password="test-only-password")
        self.client = APIClient()
        self.client.force_authenticate(self.user)
        self.day = date(2026, 9, 28)

    def meal_payload(self, **changes):
        payload = {
            "date": str(self.day),
            "meal_name": "Dinner",
            "items": [
                {"name": "Potato", "amount": "150", "unit": "g", "calories": "130", "protein": "3", "carbs": "30", "fat": "0"},
                {"name": "Tuna", "amount": "1", "unit": "can", "calories": "200", "protein": "24", "carbs": "2", "fat": "11"},
            ],
        }
        payload.update(changes)
        return payload


class NutritionProfileWeightApiTests(NutritionApiBase):
    def test_profile_is_private_and_target_can_be_unset(self):
        url = "/api/v1/finance/nutrition/profile/"
        self.assertIn(APIClient().get(url).status_code, (401, 403))
        self.assertIsNone(self.client.get(url).data["daily_target_kcal"])
        self.assertFalse(self.client.get(url).data["has_weight_entry"])
        updated = self.client.patch(url, {"height_cm": "165.5", "daily_target_kcal": "1800"}, format="json")
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.data["daily_target_kcal"], "1800.00")
        self.assertEqual(NutritionProfile.objects.get(user=self.user).height_cm, Decimal("165.5"))
        self.assertEqual(self.client.patch(url, {"daily_target_kcal": None}, format="json").data["daily_target_kcal"], None)

    def test_profile_rejects_nonpositive_values(self):
        url = "/api/v1/finance/nutrition/profile/"
        self.assertEqual(self.client.patch(url, {"height_cm": "0"}, format="json").status_code, 400)
        self.assertEqual(self.client.patch(url, {"daily_target_kcal": "-1"}, format="json").status_code, 400)
        self.assertEqual(self.client.patch(url, {"daily_target_protein_g": "0"}, format="json").status_code, 400)

    def test_weight_upserts_one_reading_per_date_and_remains_private(self):
        url = f"/api/v1/finance/nutrition/weights/{self.day}/"
        created = self.client.put(url, {"weight_kg": "72.50", "note": "Morning"}, format="json")
        self.assertEqual(created.status_code, 201)
        updated = self.client.put(url, {"weight_kg": "72.25", "note": ""}, format="json")
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(WeightEntry.objects.filter(user=self.user, date=self.day).count(), 1)
        self.assertEqual(updated.data["weight_kg"], "72.25")
        self.assertTrue(self.client.get("/api/v1/finance/nutrition/profile/").data["has_weight_entry"])
        WeightEntry.objects.create(user=self.other, date=self.day, weight_kg="90")
        rows = self.client.get("/api/v1/finance/nutrition/weights/", {"end": str(self.day)}).data
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["weight_kg"], "72.25")
        self.assertEqual(self.client.delete(url).status_code, 204)
        self.assertEqual(WeightEntry.objects.filter(user=self.other, date=self.day).count(), 1)
        self.assertEqual(self.client.delete(url).status_code, 404)

    @patch("django.utils.timezone.now", return_value=datetime(2026, 9, 27, 17, 0, tzinfo=utc_timezone.utc))
    def test_first_run_setup_saves_profile_and_initial_weight_together(self, _now):
        url = "/api/v1/finance/nutrition/setup/"
        invalid = self.client.post(url, {"height_cm": "165.5", "daily_target_kcal": "0", "weight_kg": "72.5"}, format="json")
        self.assertEqual(invalid.status_code, 400)
        self.assertFalse(NutritionProfile.objects.filter(user=self.user).exists())
        self.assertFalse(WeightEntry.objects.filter(user=self.user).exists())

        result = self.client.post(url, {
            "height_cm": "165.5", "daily_target_kcal": "1800", "weight_kg": "72.5",
            "daily_target_protein_g": "120", "daily_target_carbs_g": "200", "daily_target_fat_g": "60",
        }, format="json")
        self.assertEqual(result.status_code, 201)
        self.assertEqual(result.data["profile"]["daily_target_kcal"], "1800.00")
        self.assertEqual(result.data["profile"]["daily_target_protein_g"], "120.00")
        self.assertEqual(result.data["profile"]["daily_target_carbs_g"], "200.00")
        self.assertEqual(result.data["profile"]["daily_target_fat_g"], "60.00")
        self.assertTrue(result.data["profile"]["has_weight_entry"])
        self.assertEqual(result.data["weight"]["date"], "2026-09-28")
        self.assertEqual(WeightEntry.objects.get(user=self.user).weight_kg, Decimal("72.50"))
        self.assertFalse(NutritionProfile.objects.filter(user=self.other).exists())
        self.assertIn(APIClient().post(url, {}, format="json").status_code, (401, 403))

    def test_invalid_weight_is_not_saved(self):
        url = f"/api/v1/finance/nutrition/weights/{self.day}/"
        self.assertEqual(self.client.put(url, {"weight_kg": "0"}, format="json").status_code, 400)
        self.assertFalse(WeightEntry.objects.exists())


class NutritionMealApiTests(NutritionApiBase):
    def test_create_list_edit_and_delete_whole_meals(self):
        base = "/api/v1/finance/nutrition/meals/"
        first = self.client.post(base, self.meal_payload(), format="json")
        self.assertEqual(first.status_code, 201)
        self.assertEqual(first.data["totals"], {"calories": "330.00", "protein": "27.00", "carbs": "32.00", "fat": "11.00"})
        self.assertEqual(len(first.data["items"]), 2)
        second = self.client.post(base, self.meal_payload(meal_name="Snack"), format="json")
        self.assertEqual(second.status_code, 201)
        self.assertEqual(len(self.client.get(base, {"date": str(self.day)}).data), 2)
        detail = base + str(first.data["id"]) + "/"
        self.assertEqual(self.client.get(detail).data["meal_name"], "Dinner")
        changed = self.client.patch(detail, self.meal_payload(meal_name="Lunch", items=self.meal_payload()["items"][:1]), format="json")
        self.assertEqual(changed.status_code, 200)
        self.assertEqual(changed.data["meal_name"], "Lunch")
        self.assertEqual(changed.data["totals"]["calories"], "130.00")
        self.assertEqual(MealItem.objects.filter(meal_id=first.data["id"]).count(), 1)
        self.assertEqual(self.client.delete(detail).status_code, 204)
        self.assertEqual(Meal.objects.filter(user=self.user).count(), 1)

    def test_client_totals_cannot_override_item_totals(self):
        response = self.client.post("/api/v1/finance/nutrition/meals/", self.meal_payload(totals={"calories": 9999, "protein": 0, "carbs": 0, "fat": 0}), format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["totals"]["calories"], "330.00")

    def test_invalid_second_item_never_creates_partial_meal(self):
        items = self.meal_payload()["items"]
        items[1]["amount"] = "0"
        response = self.client.post("/api/v1/finance/nutrition/meals/", self.meal_payload(items=items), format="json")
        self.assertEqual(response.status_code, 400)
        self.assertFalse(Meal.objects.exists())
        self.assertFalse(MealItem.objects.exists())

    def test_ownership_applies_to_every_detail_action(self):
        meal = Meal.objects.create(user=self.other, date=self.day, meal_name="Private")
        detail = f"/api/v1/finance/nutrition/meals/{meal.pk}/"
        self.assertEqual(self.client.get(detail).status_code, 404)
        self.assertEqual(self.client.patch(detail, {"meal_name": "Changed"}, format="json").status_code, 404)
        self.assertEqual(self.client.delete(detail).status_code, 404)
        self.assertFalse(self.client.get("/api/v1/finance/nutrition/meals/", {"date": str(self.day)}).data)
        meal.refresh_from_db()
        self.assertEqual(meal.meal_name, "Private")

    def test_item_count_names_and_numbers_are_validated(self):
        base = "/api/v1/finance/nutrition/meals/"
        self.assertEqual(self.client.post(base, self.meal_payload(items=self.meal_payload()["items"] * 51), format="json").status_code, 400)
        self.assertEqual(self.client.post(base, self.meal_payload(meal_name="x" * 161), format="json").status_code, 400)
        bad = self.meal_payload()["items"]
        bad[0]["calories"] = "-1"
        self.assertEqual(self.client.post(base, self.meal_payload(items=bad), format="json").status_code, 400)
        bad[0]["calories"] = "NaN"
        self.assertEqual(self.client.post(base, self.meal_payload(items=bad), format="json").status_code, 400)
        self.assertFalse(Meal.objects.exists())

    def test_oversized_json_and_anonymous_user_are_rejected(self):
        base = "/api/v1/finance/nutrition/meals/"
        self.assertIn(APIClient().get(base, {"date": str(self.day)}).status_code, (401, 403))
        payload = self.meal_payload(extra="x" * 66000)
        self.assertEqual(self.client.post(base, payload, format="json").status_code, 400)
        self.assertFalse(Meal.objects.exists())


class NutritionSummaryApiTests(NutritionApiBase):
    def test_average_uses_only_logged_days_and_aggregates_meals(self):
        base = "/api/v1/finance/nutrition/meals/"
        self.assertEqual(self.client.post(base, self.meal_payload(), format="json").status_code, 201)
        self.assertEqual(self.client.post(base, self.meal_payload(meal_name="Snack", items=self.meal_payload()["items"][:1]), format="json").status_code, 201)
        earlier = self.day - timedelta(days=3)
        self.assertEqual(self.client.post(base, self.meal_payload(date=str(earlier), items=self.meal_payload()["items"][:1]), format="json").status_code, 201)
        Meal.objects.create(user=self.other, date=self.day, meal_name="Other user's meal")
        result = self.client.get("/api/v1/finance/nutrition/summary/", {"date": str(self.day)})
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result.data["day_totals"]["calories"], "460.00")
        self.assertEqual(result.data["logged_days"], 2)
        self.assertEqual(result.data["average_calories"], "295.00")
        self.assertEqual(len(result.data["days"]), 7)
        self.assertIsNone(result.data["days"][0]["totals"])
        self.assertFalse(result.data["days"][0]["logged"])

    def test_empty_day_is_unlogged_not_zero(self):
        result = self.client.get("/api/v1/finance/nutrition/summary/", {"date": str(self.day)})
        self.assertEqual(result.status_code, 200)
        self.assertIsNone(result.data["day_totals"])
        self.assertIsNone(result.data["average_calories"])
        self.assertEqual(result.data["logged_days"], 0)
        self.assertTrue(all(row["totals"] is None for row in result.data["days"]))

    def test_weight_trend_uses_real_dates_and_owner(self):
        WeightEntry.objects.create(user=self.user, date=self.day - timedelta(days=14), weight_kg="73.25")
        WeightEntry.objects.create(user=self.user, date=self.day, weight_kg="72.50")
        WeightEntry.objects.create(user=self.other, date=self.day, weight_kg="91")
        result = self.client.get("/api/v1/finance/nutrition/summary/", {"date": str(self.day)}).data
        self.assertEqual([row["date"] for row in result["weights"]], [str(self.day - timedelta(days=14)), str(self.day)])
        self.assertEqual([row["weight_kg"] for row in result["weights"]], ["73.25", "72.50"])

    @patch("django.utils.timezone.now", return_value=datetime(2026, 9, 27, 17, 0, tzinfo=utc_timezone.utc))
    def test_default_date_uses_manila_day(self, _now):
        result = self.client.get("/api/v1/finance/nutrition/summary/")
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result.data["date"], "2026-09-28")

    def test_calendar_month_summary_preserves_unlogged_days(self):
        base = "/api/v1/finance/nutrition/meals/"
        self.client.post(base, self.meal_payload(date="2026-09-01"), format="json")
        self.client.post(base, self.meal_payload(), format="json")
        self.client.post(base, self.meal_payload(date="2026-08-31"), format="json")
        Meal.objects.create(user=self.other, date=self.day, meal_name="Other user's meal")

        result = self.client.get("/api/v1/finance/nutrition/period-summary/", {"period": "month", "date": str(self.day)})
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result.data["logged_days"], 2)
        self.assertEqual(result.data["average_calories"], "330.00")
        self.assertEqual(result.data["totals"]["calories"], "660.00")
        self.assertEqual(len(result.data["rows"]), 30)
        self.assertEqual(result.data["rows"][0]["date"], "2026-09-01")
        self.assertIsNone(result.data["rows"][1]["totals"])

    def test_overall_summary_groups_real_months_and_excludes_other_users(self):
        base = "/api/v1/finance/nutrition/meals/"
        self.client.post(base, self.meal_payload(date="2026-08-31"), format="json")
        self.client.post(base, self.meal_payload(), format="json")
        self.client.post(base, self.meal_payload(meal_name="Snack", items=self.meal_payload()["items"][:1]), format="json")
        Meal.objects.create(user=self.other, date=self.day, meal_name="Other user's meal")

        result = self.client.get("/api/v1/finance/nutrition/period-summary/", {"period": "overall", "date": "2026-08-01"})
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result.data["logged_days"], 2)
        self.assertEqual(result.data["totals"]["calories"], "790.00")
        self.assertEqual(result.data["average_calories"], "395.00")
        self.assertEqual([row["month"] for row in result.data["rows"]], ["2026-08", "2026-09"])
        self.assertEqual([row["logged_days"] for row in result.data["rows"]], [1, 1])
        self.assertEqual(self.client.get("/api/v1/finance/nutrition/period-summary/", {"period": "year"}).status_code, 400)
