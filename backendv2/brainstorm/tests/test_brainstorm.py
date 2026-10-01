"""Focused coverage for the private idea wall. Intentionally not run by this task."""

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from brainstorm.models import BrainstormBoard, BrainstormGroup, BrainstormIdea
from brainstorm.services.fingerprints import fingerprint_title
from brainstorm.services.imports import apply_import, preview_import
from finance.models import AuditEvent, Deadline
from finance.services.summaries import overview, urgency


class BrainstormTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user("brainstorm-owner", password="test-only-password")
        self.client = APIClient()
        self.client.force_authenticate(self.user)
        self.board = BrainstormBoard.objects.create(name="Event Platform")
        self.group = BrainstormGroup.objects.create(board=self.board, name="Guest Experience")

    def test_private_board_isolation_and_cross_board_group_rejection(self):
        self.assertIn(APIClient().get("/api/v1/finance/brainstorm/boards/").status_code, (401, 403))
        other = BrainstormBoard.objects.create(name="Other work")
        other_group = BrainstormGroup.objects.create(board=other, name="Ideas")
        idea = BrainstormIdea.objects.create(board=self.board, group=self.group, title="Arrival flow")
        response = self.client.get("/api/v1/finance/brainstorm/ideas/", {"board": other.pk})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 0)
        changed = self.client.patch(f"/api/v1/finance/brainstorm/ideas/{idea.pk}/", {"group": other_group.pk}, format="json")
        self.assertEqual(changed.status_code, 400)
        idea.refresh_from_db()
        self.assertEqual(idea.group_id, self.group.pk)

    def test_title_fingerprints_and_safe_events(self):
        self.assertEqual(fingerprint_title(" Café—Check-in! "), fingerprint_title("café check in"))
        created = self.client.post("/api/v1/finance/brainstorm/ideas/", {
            "board": self.board.pk, "group": self.group.pk, "title": "Café—Check-in!",
            "source_text": "private original", "notes": "private note", "reference_url": "https://example.com/private",
        }, format="json")
        self.assertEqual(created.status_code, 201)
        duplicate = self.client.post("/api/v1/finance/brainstorm/ideas/", {
            "board": self.board.pk, "group": self.group.pk, "title": "café check in",
        }, format="json")
        self.assertEqual(duplicate.status_code, 400)
        changes = str(AuditEvent.objects.get(area="brainstorm").changes)
        self.assertNotIn("private original", changes)
        self.assertNotIn("private note", changes)
        self.assertNotIn("example.com", changes)

    def test_manual_move_reorders_within_group_and_is_idempotent(self):
        first = BrainstormIdea.objects.create(board=self.board, group=self.group, title="First", sort_order=0)
        second = BrainstormIdea.objects.create(board=self.board, group=self.group, title="Second", sort_order=1)
        third = BrainstormIdea.objects.create(board=self.board, group=self.group, title="Third", sort_order=2)
        path = f"/api/v1/finance/brainstorm/ideas/{third.pk}/move/"

        moved = self.client.post(path, {"group": self.group.pk, "before_id": second.pk}, format="json")
        self.assertEqual(moved.status_code, 200)
        ordered = list(BrainstormIdea.objects.filter(group=self.group).order_by("sort_order").values_list("pk", flat=True))
        self.assertEqual(ordered, [first.pk, third.pk, second.pk])
        listed = self.client.get("/api/v1/finance/brainstorm/ideas/", {"board": self.board.pk, "sort": "manual"})
        self.assertEqual([item["id"] for item in listed.data["results"]], ordered)

        count = AuditEvent.objects.filter(area="brainstorm").count()
        repeated = self.client.post(path, {"group": self.group.pk, "before_id": second.pk}, format="json")
        self.assertEqual(repeated.status_code, 200)
        self.assertEqual(AuditEvent.objects.filter(area="brainstorm").count(), count)

    def test_move_between_groups_and_append_to_empty_group(self):
        first = BrainstormIdea.objects.create(board=self.board, group=self.group, title="First", sort_order=0)
        second = BrainstormIdea.objects.create(board=self.board, group=self.group, title="Second", sort_order=1)
        destination = BrainstormGroup.objects.create(board=self.board, name="Launch")
        path = f"/api/v1/finance/brainstorm/ideas/{first.pk}/move/"

        response = self.client.post(path, {"group": destination.pk}, format="json")
        self.assertEqual(response.status_code, 200)
        first.refresh_from_db()
        second.refresh_from_db()
        self.assertEqual((first.group_id, first.sort_order, second.sort_order), (destination.pk, 0, 0))
        self.assertEqual(AuditEvent.objects.filter(area="brainstorm", action="edited").count(), 1)

    def test_move_rejects_conflicting_or_foreign_targets_and_inactive_board(self):
        idea = BrainstormIdea.objects.create(board=self.board, group=self.group, title="Move me")
        target = BrainstormIdea.objects.create(board=self.board, group=self.group, title="Target")
        other_board = BrainstormBoard.objects.create(name="Other board")
        foreign_group = BrainstormGroup.objects.create(board=other_board, name="Ideas")
        path = f"/api/v1/finance/brainstorm/ideas/{idea.pk}/move/"

        conflicting = self.client.post(path, {
            "group": self.group.pk, "before_id": target.pk, "after_id": target.pk,
        }, format="json")
        foreign = self.client.post(path, {"group": foreign_group.pk}, format="json")
        self.board.is_active = False
        self.board.save(update_fields=["is_active"])
        inactive = self.client.post(path, {"group": self.group.pk, "after_id": target.pk}, format="json")

        self.assertEqual((conflicting.status_code, foreign.status_code, inactive.status_code), (400, 400, 400))
        idea.refresh_from_db()
        self.assertEqual((idea.group_id, idea.sort_order), (self.group.pk, 0))

    def test_preview_and_confirm_are_idempotent_with_invalid_ideas(self):
        payload = {"boards": [{"name": "Event Platform", "groups": [{"name": "Guest Experience", "ideas": [
            {"title": "Arrival flow", "tags": ["guest"]},
            {"title": "arrival-flow"},
            {"title": "Invalid link", "reference_url": "javascript:alert(1)"},
        ]}]}]}
        before = (BrainstormBoard.objects.count(), BrainstormGroup.objects.count(), BrainstormIdea.objects.count())
        summary = preview_import(payload)
        self.assertEqual((summary["created"], summary["duplicates_skipped"], summary["invalid"]), (1, 1, 1))
        self.assertEqual((BrainstormBoard.objects.count(), BrainstormGroup.objects.count(), BrainstormIdea.objects.count()), before)
        first = apply_import(payload, actor=self.user)
        second = apply_import(payload, actor=self.user)
        self.assertEqual(first["created"], 1)
        self.assertEqual(second["created"], 0)
        self.assertEqual(BrainstormIdea.objects.count(), 1)
        self.assertEqual(AuditEvent.objects.filter(area="brainstorm", action="imported").count(), 1)

    def test_carry_once_then_recovers_from_deleted_task(self):
        idea = BrainstormIdea.objects.create(board=self.board, group=self.group, title="Arrival flow", urgency="high")
        path = f"/api/v1/finance/brainstorm/ideas/{idea.pk}/carry/"
        first = self.client.post(path, {"priority": "low", "due_date": None}, format="json")
        second = self.client.post(path, {"priority": "high"}, format="json")
        self.assertEqual((first.status_code, second.status_code), (200, 200))
        self.assertEqual(first.data["task"]["id"], second.data["task"]["id"])
        self.assertEqual(Deadline.objects.filter(kind="task").count(), 1)
        self.assertEqual(AuditEvent.objects.filter(area="brainstorm", action="carried").count(), 1)
        task = Deadline.objects.get(pk=first.data["task"]["id"])
        self.assertEqual(task.priority, "low")
        self.assertIsNone(task.due_date)
        task.delete()
        idea.refresh_from_db()
        self.assertIsNone(idea.task_id)
        third = self.client.post(path, {}, format="json")
        self.assertEqual(third.status_code, 200)
        self.assertNotEqual(first.data["task"]["id"], third.data["task"]["id"])

    def test_undated_task_is_neutral_visible_and_completable(self):
        created = self.client.post("/api/v1/finance/deadlines/", {"title": "Explore an idea", "kind": "task", "due_date": None}, format="json")
        self.assertEqual(created.status_code, 201)
        task = Deadline.objects.get(pk=created.data["id"])
        self.assertEqual(urgency(task), "unscheduled")
        undated = self.client.get("/api/v1/finance/deadlines/", {"undated": "1"})
        self.assertEqual(undated.data["count"], 1)
        month = timezone.localdate().strftime("%Y-%m")
        self.assertEqual(self.client.get("/api/v1/finance/deadlines/", {"month": month}).data["count"], 0)
        self.assertEqual(overview(month)["attention"]["overdue"], 0)
        rejected = self.client.post("/api/v1/finance/deadlines/", {"title": "Unscheduled bill", "kind": "bill", "due_date": None}, format="json")
        self.assertEqual(rejected.status_code, 400)
        settled = self.client.post(f"/api/v1/finance/deadlines/{task.pk}/settle/", {}, format="json")
        self.assertEqual(settled.status_code, 200)
        task.refresh_from_db()
        self.assertEqual(task.status, "completed")

    def test_undated_task_never_becomes_overdue(self):
        today = timezone.localdate()
        Deadline.objects.create(title="Undated", kind="task", due_date=None)
        Deadline.objects.create(title="Past", kind="task", due_date=today - timedelta(days=2))
        self.assertEqual(overview(today.strftime("%Y-%m"))["attention"]["overdue"], 1)
