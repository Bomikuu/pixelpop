from datetime import date, datetime, timedelta
from decimal import Decimal
from zoneinfo import ZoneInfo

from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.test import TestCase

from end_of_day.models import EndOfDayEntry, EndOfDayGroup
from finance.models import Deadline, Meal, MealItem, NutritionProfile, RecurringSchedule, WorkspaceSettings
from finance.services.recurrence import materialize
from finance.services.reminders import checklist_for, ensure_daily_reminders, manila_today
from finance.services.reminder_delivery import due_slots


class ReminderPersistenceTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username="reminder-owner", password="example-password")

    def test_settings_default_to_normal_mode_and_one_hour_interval(self):
        settings = WorkspaceSettings.objects.create()
        self.assertFalse(settings.reminder_strict_mode)
        self.assertEqual(settings.reminder_interval_hours, 1)
        self.assertEqual(settings.reminder_start_time.isoformat(timespec="minutes"), "09:00")
        self.assertEqual(settings.reminder_end_time.isoformat(timespec="minutes"), "00:00")

    def test_important_schedule_passes_flag_to_daily_occurrence(self):
        current_day = manila_today()
        schedule = RecurringSchedule.objects.create(
            title="Have you made a PR?", kind="task", anchor_date=current_day,
            frequency="days", interval=1, important=True, created_by=self.user,
        )
        materialize(current_day)
        self.assertTrue(Deadline.objects.get(schedule=schedule, due_date=current_day).important)

    def test_system_key_is_unique_per_user(self):
        RecurringSchedule.objects.create(
            title="EOD", kind="task", anchor_date=date(2026, 10, 2),
            frequency="days", system_key="eod", created_by=self.user,
        )
        with self.assertRaises(IntegrityError):
            RecurringSchedule.objects.create(
                title="Another EOD", kind="task", anchor_date=date(2026, 10, 2),
                frequency="days", system_key="eod", created_by=self.user,
            )

    def test_system_schedule_materializes_only_current_day(self):
        schedule = RecurringSchedule.objects.create(
            title="EOD", kind="task", anchor_date=manila_today(),
            frequency="days", interval=1, system_key="eod", important=True, created_by=self.user,
        )
        materialize(manila_today())
        self.assertEqual(list(schedule.deadlines.values_list("due_date", flat=True)), [manila_today()])


class ReminderChecklistTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username="checklist-owner", password="example-password")
        self.day = manila_today()

    def test_daily_seed_is_idempotent(self):
        ensure_daily_reminders(self.user)
        ensure_daily_reminders(self.user)
        self.assertEqual(RecurringSchedule.objects.filter(created_by=self.user, system_key__isnull=False).count(), 7)

    def test_important_due_and_undated_tasks_are_included_but_future_is_not(self):
        Deadline.objects.create(title="Undated", kind="task", important=True, created_by=self.user)
        Deadline.objects.create(title="Due", kind="task", due_date=self.day, important=True, created_by=self.user)
        Deadline.objects.create(title="Future", kind="task", due_date=self.day + timedelta(days=1), important=True, created_by=self.user)
        titles = {item["title"] for item in checklist_for(self.user, self.day)["items"]}
        self.assertIn("Undated", titles)
        self.assertIn("Due", titles)
        self.assertNotIn("Future", titles)

    def test_eod_remains_complete_while_another_group_has_same_date(self):
        first = EndOfDayGroup.objects.create(name="Personal")
        second = EndOfDayGroup.objects.create(name="Work")
        one = EndOfDayEntry.objects.create(group=first, date=self.day, title="Personal EOD")
        EndOfDayEntry.objects.create(group=second, date=self.day, title="Work EOD")
        one.delete()
        eod = next(row for row in checklist_for(self.user, self.day)["items"] if row["source"] == "eod")
        self.assertTrue(eod["completed"])

    def test_one_meal_completes_calories_and_shows_food_progress(self):
        NutritionProfile.objects.create(user=self.user, daily_target_kcal=1800)
        meal = Meal.objects.create(user=self.user, date=self.day, meal_name="Lunch")
        MealItem.objects.create(meal=meal, position=0, name="Rice", amount=100, unit="g", calories=130, protein=2, carbs=30, fat=0)
        calories = next(row for row in checklist_for(self.user, self.day)["items"] if row["source"] == "calories")
        self.assertTrue(calories["completed"])
        self.assertEqual(Decimal(calories["calories"]), Decimal("130"))
        self.assertEqual(Decimal(calories["target_kcal"]), Decimal("1800"))


class ReminderTimingTests(TestCase):
    def setUp(self):
        self.settings = WorkspaceSettings.objects.create(reminder_strict_mode=True)
        self.manila = ZoneInfo("Asia/Manila")

    def test_default_strict_window_has_start_hourly_and_previous_day_recap(self):
        morning = due_slots(self.settings, datetime(2026, 10, 2, 9, 0, tzinfo=self.manila))
        hourly = due_slots(self.settings, datetime(2026, 10, 2, 10, 0, tzinfo=self.manila))
        midnight = due_slots(self.settings, datetime(2026, 10, 3, 0, 0, tzinfo=self.manila))
        self.assertEqual([(row[0], row[1]) for row in morning], [(date(2026, 10, 2), "start")])
        self.assertEqual([(row[0], row[1]) for row in hourly], [(date(2026, 10, 2), "strict")])
        self.assertEqual([(row[0], row[1]) for row in midnight], [(date(2026, 10, 2), "recap")])

    def test_normal_mode_has_no_intermediate_reminder(self):
        self.settings.reminder_strict_mode = False
        self.assertEqual(due_slots(self.settings, datetime(2026, 10, 2, 10, 0, tzinfo=self.manila)), [])

    def test_dispatch_refuses_local_requests_without_configuration(self):
        response = self.client.post("/api/v1/finance/reminders/dispatch/", data="{}", content_type="application/json")
        self.assertEqual(response.status_code, 503)
