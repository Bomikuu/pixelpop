from datetime import date

from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.test import TestCase

from finance.models import Deadline, RecurringSchedule, WorkspaceSettings
from finance.services.recurrence import materialize


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
        schedule = RecurringSchedule.objects.create(
            title="Have you made a PR?", kind="task", anchor_date=date(2026, 10, 2),
            frequency="days", interval=1, important=True, created_by=self.user,
        )
        materialize(date(2026, 10, 2))
        self.assertTrue(Deadline.objects.get(schedule=schedule, due_date=date(2026, 10, 2)).important)

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
