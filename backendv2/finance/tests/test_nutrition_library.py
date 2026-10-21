from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from threading import Barrier
from uuid import uuid4

from django.contrib.auth import get_user_model
from django.db import close_old_connections
from django.test import TransactionTestCase, skipUnlessDBFeature

from finance.models import AuditEvent, Meal, MealPreset, NutritionMealSave, WeightEntry
from finance.services.nutrition import nutrition_summary
from finance.services.nutrition_library import save_meal_once
from .test_nutrition import NutritionApiBase


class NutritionLibraryTests(NutritionApiBase):
    def test_presets_are_ordered_private_independent_snapshots(self):
        payload = self.meal_payload()
        meal = self.client.post("/api/v1/finance/nutrition/meals/", payload, format="json").data
        url = "/api/v1/finance/nutrition/presets/"
        created = self.client.post(url, payload, format="json")
        self.assertEqual(created.status_code, 201)
        preset = created.data
        self.assertEqual(preset["totals"]["calories"], "330.00")
        self.assertEqual([row["name"] for row in preset["items"]], ["Potato", "Tuna"])
        detail = f"{url}{preset['id']}/"
        updated = self.client.patch(detail, {"items": [payload["items"][1]]}, format="json")
        self.assertEqual(updated.data["totals"]["calories"], "200.00")
        self.assertEqual(self.client.get(f"/api/v1/finance/nutrition/meals/{meal['id']}/").data["totals"]["calories"], "330.00")
        self.client.force_authenticate(self.other)
        self.assertEqual(self.client.get(detail).status_code, 404)
        self.assertEqual(self.client.get(url).data["count"], 0)
        self.assertEqual(self.client.delete(detail).status_code, 404)
        self.client.force_authenticate(self.user)
        self.assertEqual(self.client.delete(detail).status_code, 204)
        self.assertEqual(Meal.objects.count(), 1)

    def test_goal_validation_and_baseline_are_as_of_selected_date(self):
        url = "/api/v1/finance/nutrition/profile/"
        self.assertEqual(self.client.patch(url, {"target_weight_kg": "0"}, format="json").status_code, 400)
        self.assertEqual(self.client.patch(url, {"target_weight_kg": "65.50"}, format="json").data["target_weight_kg"], "65.50")
        self.assertIsNone(self.client.patch(url, {"target_weight_kg": None}, format="json").data["target_weight_kg"])
        WeightEntry.objects.create(user=self.user, date=self.day, weight_kg="72")
        WeightEntry.objects.create(user=self.user, date=self.day + timedelta(days=1), weight_kg="71")
        self.assertIsNone(nutrition_summary(self.user, self.day - timedelta(days=1))["weight_baseline"])
        self.assertEqual(nutrition_summary(self.user, self.day)["weight_baseline"]["weight_kg"], "72.00")

    def test_history_foods_and_calendar_are_read_only_bounded_and_private(self):
        self.client.post("/api/v1/finance/nutrition/meals/", self.meal_payload(), format="json")
        root = "/api/v1/finance/nutrition/"
        history = self.client.get(root + "meals/history/", {"q": "Tuna", "page_size": 1}).data
        self.assertEqual(history["count"], 1)
        self.assertEqual(self.client.get(root + "foods/", {"q": "Tuna"}).data["results"][0]["source_date"], str(self.day))
        self.assertEqual(self.client.get(root + "calendar/", {"month": "2026-09"}).data["days"], [{"date": str(self.day), "meal_count": 1}])
        for params in ({"page_size": 51}, {"page": 0}, {"q": "x" * 161}, {"page": "bad"}):
            self.assertEqual(self.client.get(root + "foods/", params).status_code, 400)
        self.assertEqual(self.client.get(root + "calendar/", {"month": "bad"}).status_code, 400)
        self.client.force_authenticate(self.other)
        for endpoint in ("meals/history/", "foods/", "presets/"):
            self.assertEqual(self.client.get(root + endpoint).data["count"], 0)
        self.assertEqual(Meal.objects.count(), 1)

    def test_retry_replays_once_and_rejects_changed_or_deleted_meals(self):
        url = "/api/v1/finance/nutrition/meals/"
        payload = self.meal_payload(request_id=str(uuid4()))
        created = self.client.post(url, payload, format="json")
        replay = self.client.post(url, payload, format="json")
        self.assertEqual(created.status_code, 201)
        self.assertEqual(replay.status_code, 200)
        self.assertEqual(created.data["id"], replay.data["id"])
        self.assertEqual(AuditEvent.objects.filter(subject_type="Meal", action="added").count(), 1)
        self.assertEqual(self.client.post(url, {**payload, "meal_name": "Different"}, format="json").status_code, 409)
        self.client.delete(f"{url}{created.data['id']}/")
        self.assertEqual(self.client.post(url, payload, format="json").status_code, 409)
        self.assertEqual(Meal.objects.count(), 0)
        self.assertIsNone(NutritionMealSave.objects.get().meal_id)

    def test_failed_create_rolls_back_reservation_and_partial_meal(self):
        def fail():
            Meal.objects.create(user=self.user, date=self.day, meal_name="Must roll back")
            raise ValueError("Failed item creation")
        with self.assertRaises(ValueError):
            save_meal_once(self.user, uuid4(), "signature", fail)
        self.assertEqual(Meal.objects.count(), 0)
        self.assertEqual(NutritionMealSave.objects.count(), 0)

    def test_preset_validation_and_audit_allowlist(self):
        url = "/api/v1/finance/nutrition/presets/"
        self.assertEqual(self.client.post(url, {"meal_name": "Empty", "items": []}, format="json").status_code, 400)
        self.client.post(url, self.meal_payload(request_id=str(uuid4())), format="json")
        event = AuditEvent.objects.get(subject_type="MealPreset")
        self.assertEqual({row["field"] for row in event.changes}, {"Meal name", "Items"})
        self.assertEqual(MealPreset.objects.count(), 1)

    def test_large_page_returns_empty_without_an_unbounded_database_offset(self):
        response = self.client.get("/api/v1/finance/nutrition/foods/", {"page": "9" * 50})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["results"], [])

    def test_retry_key_is_scoped_to_owner(self):
        payload = self.meal_payload(request_id=str(uuid4()))
        first = self.client.post("/api/v1/finance/nutrition/meals/", payload, format="json")
        self.client.force_authenticate(self.other)
        other = self.client.post("/api/v1/finance/nutrition/meals/", payload, format="json")
        self.assertEqual(other.status_code, 201)
        self.assertNotEqual(first.data["id"], other.data["id"])
        self.assertEqual(NutritionMealSave.objects.count(), 2)


class NutritionConcurrentSaveTests(TransactionTestCase):
    @skipUnlessDBFeature("has_select_for_update")
    def test_same_key_concurrent_requests_create_one_meal(self):
        user = get_user_model().objects.create_user("concurrent-nutrition")
        request_id, barrier = uuid4(), Barrier(2)

        def save():
            close_old_connections()
            try:
                owner = get_user_model().objects.get(pk=user.pk)
                barrier.wait(timeout=10)
                meal, _ = save_meal_once(owner, request_id, "same", lambda: Meal.objects.create(user=owner, date="2026-09-28", meal_name="Only once"))
                return meal.pk
            finally:
                close_old_connections()

        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(lambda _: save(), range(2)))
        self.assertEqual(results[0], results[1])
        self.assertEqual(Meal.objects.filter(user=user).count(), 1)
