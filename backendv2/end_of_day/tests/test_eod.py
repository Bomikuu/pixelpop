from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from end_of_day.models import EndOfDayEntry, EndOfDayGroup
from end_of_day.services.formatting import copy_outputs, manila_today


BASE = "/api/v1/finance/eod/"


class EndOfDayApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(username="eod-owner", password="test-password")
        self.client.force_login(self.user)
        self.personal = EndOfDayGroup.objects.get(name="Personal")
        self.work = EndOfDayGroup.objects.create(name="Company 1")
        self.day = manila_today()

    def entry(self, group=None, day=None, **extra):
        return {
            "group": (group or self.personal).pk,
            "date": (day or self.day).isoformat(),
            "type": "workday",
            "title": "Reviewed the release",
            "summary": "Reviewed changes and documented findings.",
            "items": ["Reviewed changes"],
            **extra,
        }

    def test_same_date_is_unique_within_group_only(self):
        self.assertEqual(self.client.post(BASE + "entries/", self.entry(), format="json").status_code, 201)
        self.assertEqual(self.client.post(BASE + "entries/", self.entry(group=self.work), format="json").status_code, 201)
        self.assertEqual(self.client.post(BASE + "entries/", self.entry(), format="json").status_code, 400)
        self.assertEqual(EndOfDayEntry.objects.count(), 2)

    def test_group_name_is_case_insensitive_and_personal_is_immutable(self):
        self.assertEqual(self.client.post(BASE + "groups/", {"name": "company 1"}, format="json").status_code, 400)
        self.assertEqual(self.client.patch(BASE + f"groups/{self.personal.pk}/", {"name": "Mine"}, format="json").status_code, 400)

    def test_future_manila_day_is_rejected(self):
        with patch("end_of_day.api.serializers.manila_today", return_value=self.day):
            response = self.client.post(BASE + "entries/", self.entry(day=self.day + timedelta(days=1)), format="json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(EndOfDayEntry.objects.count(), 0)

    def test_edit_conflict_leaves_original_pair_intact(self):
        first = self.client.post(BASE + "entries/", self.entry(), format="json").data
        second = self.client.post(BASE + "entries/", self.entry(group=self.work), format="json").data
        response = self.client.patch(BASE + f"entries/{second['id']}/", {"group": self.personal.pk}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(EndOfDayEntry.objects.get(pk=second["id"]).group, self.work)
        self.assertEqual(EndOfDayEntry.objects.get(pk=first["id"]).group, self.personal)

    def test_import_group_override_and_unknown_name_preview(self):
        payload = {"group": "Company 1", "entries": [self.entry(group=self.work, group_name="unused")]}
        payload["entries"][0].pop("group")
        payload["entries"][0].pop("group_name")
        payload["entries"][0]["group"] = "Personal"
        preview = self.client.post(BASE + f"import/preview/?group={self.work.pk}", payload, format="json").data
        self.assertEqual(preview["counts"]["create"], 1)
        self.assertEqual(preview["rows"][0]["group"], "Personal")
        payload["group"] = "Not created"
        preview = self.client.post(BASE + f"import/preview/?group={self.work.pk}", payload, format="json").data
        self.assertGreater(preview["counts"]["error"], 0)
        self.assertFalse(EndOfDayGroup.objects.filter(name="Not created").exists())
        self.assertEqual(EndOfDayEntry.objects.count(), 0)

    def test_import_skips_existing_pair_without_overwriting(self):
        self.client.post(BASE + "entries/", self.entry(), format="json")
        payload = {"group": "Personal", "entries": [{key: value for key, value in self.entry(title="Replacement").items() if key != "group"}]}
        preview = self.client.post(BASE + f"import/preview/?group={self.personal.pk}", payload, format="json")
        self.assertEqual(preview.status_code, 200)
        self.assertEqual(preview.data["rows"][0]["action"], "skip")
        self.assertEqual(preview.data["counts"], {"create": 0, "skip": 1, "error": 0})
        response = self.client.post(BASE + f"import/?group={self.personal.pk}", payload, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["counts"]["skipped"], 1)
        self.assertEqual(EndOfDayEntry.objects.get(group=self.personal, date=self.day).title, "Reviewed the release")

    def test_import_replaces_only_selected_existing_dates(self):
        other_day = self.day - timedelta(days=1)
        self.client.post(BASE + "entries/", self.entry(title="Keep this"), format="json")
        self.client.post(BASE + "entries/", self.entry(day=other_day, title="Old recap"), format="json")
        payload = {"group": "Personal", "entries": [
            {"date": self.day.isoformat(), "type": "workday", "title": "Not selected", "summary": "Should not replace."},
            {"date": other_day.isoformat(), "type": "workday", "title": "New recap", "summary": "Imported replacement."},
        ]}
        response = self.client.post(BASE + f"import/?group={self.personal.pk}", {
            "payload": payload, "replace_rows": [1],
        }, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["counts"], {"created": 0, "replaced": 1, "skipped": 1})
        retained = EndOfDayEntry.objects.get(group=self.personal, date=self.day)
        replaced = EndOfDayEntry.objects.get(group=self.personal, date=other_day)
        self.assertEqual(retained.title, "Keep this")
        self.assertEqual(replaced.title, "New recap")
        self.assertEqual(replaced.items, [])

    def test_import_rejects_replace_rows_that_are_not_conflicts(self):
        payload = {"group": "Personal", "entries": [
            {"date": self.day.isoformat(), "type": "workday", "title": "New", "summary": "New day."},
        ]}
        response = self.client.post(BASE + f"import/?group={self.personal.pk}", {
            "payload": payload, "replace_rows": [0],
        }, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertFalse(EndOfDayEntry.objects.filter(group=self.personal, date=self.day).exists())

    def test_copy_fallback_and_private_audit_snapshot(self):
        response = self.client.post(BASE + "entries/", self.entry(), format="json")
        entry = EndOfDayEntry.objects.get(pk=response.data["id"])
        self.assertIn("• Reviewed changes", copy_outputs(entry)["slack_message"])
        self.assertNotIn("summary", str(response.data["outputs"]))
        from finance.models import AuditEvent
        self.assertNotIn("documented findings", str(AuditEvent.objects.latest("id").changes))

    def test_unauthenticated_entries_are_private(self):
        self.client.logout()
        self.assertIn(self.client.get(BASE + f"entries/?month={self.day:%Y-%m}&group={self.personal.pk}").status_code, (401, 403))
