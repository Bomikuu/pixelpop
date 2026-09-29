from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from leadership.models import DailyCheckIn, LeadershipPlan, TeamMember
from leadership.services.calendar import local_today


class DailyCheckInApiTests(TestCase):
    def setUp(self):
        user_model = get_user_model()
        self.owner = user_model.objects.create_user(username="check-in-owner", password="test-pass")
        self.other = user_model.objects.create_user(username="check-in-other", password="test-pass")
        self.plan = LeadershipPlan.objects.create(owner=self.owner, team_name="Network", start_date=local_today())
        self.other_plan = LeadershipPlan.objects.create(owner=self.other, team_name="Other", start_date=local_today())
        self.member = TeamMember.objects.create(plan=self.plan, name="Miku")
        self.other_member = TeamMember.objects.create(plan=self.other_plan, name="Other member")
        self.client = APIClient()
        self.client.force_authenticate(self.owner)

    def test_mark_self_is_unique_and_does_not_move_history(self):
        second = TeamMember.objects.create(plan=self.plan, name="Second member")
        self.assertEqual(self.client.post(f"/api/v1/leadership/team-members/{self.member.pk}/mark-self/").status_code, 200)
        DailyCheckIn.objects.create(plan=self.plan, member=self.member, date=local_today(), reviewed_pr="done")
        self.assertEqual(self.client.post(f"/api/v1/leadership/team-members/{second.pk}/mark-self/").status_code, 200)
        self.member.refresh_from_db()
        second.refresh_from_db()
        self.assertFalse(self.member.is_self)
        self.assertTrue(second.is_self)
        self.assertEqual(DailyCheckIn.objects.get(plan=self.plan).member_id, self.member.pk)
        self.assertEqual(self.client.post(f"/api/v1/leadership/team-members/{self.other_member.pk}/mark-self/").status_code, 404)

    def test_daily_save_updates_same_date(self):
        url = "/api/v1/leadership/daily-check-ins/day/"
        payload = {"member": self.member.pk, "date": str(local_today()), "reviewed_pr": "done"}
        self.assertEqual(self.client.put(url, payload, format="json").status_code, 201)
        payload["reviewed_pr"] = "not_done"
        self.assertEqual(self.client.put(url, payload, format="json").status_code, 200)
        self.assertEqual(DailyCheckIn.objects.count(), 1)
        self.assertEqual(DailyCheckIn.objects.get().reviewed_pr, "not_done")

    def test_future_invalid_and_cross_plan_records_are_rejected(self):
        url = "/api/v1/leadership/daily-check-ins/day/"
        self.assertEqual(self.client.put(url, {"member": self.member.pk, "date": str(local_today() + timedelta(days=1))}, format="json").status_code, 400)
        self.assertEqual(self.client.put(url, {"member": self.member.pk, "date": str(local_today()), "sent_eod": "maybe"}, format="json").status_code, 400)
        self.assertEqual(self.client.put(url, {"member": self.other_member.pk, "date": str(local_today())}, format="json").status_code, 400)
        self.assertEqual(DailyCheckIn.objects.count(), 0)

    def test_history_is_private_and_member_deletion_is_protected(self):
        record = DailyCheckIn.objects.create(plan=self.other_plan, member=self.other_member, date=local_today())
        self.assertEqual(self.client.get(f"/api/v1/leadership/daily-check-ins/{record.pk}/").status_code, 404)
        self.assertEqual(self.client.get(f"/api/v1/leadership/daily-check-ins/?member={self.other_member.pk}").status_code, 400)
        self.assertEqual(self.client.post(f"/api/v1/leadership/team-members/{self.other_member.pk}/mark-self/").status_code, 404)
        own = DailyCheckIn.objects.create(plan=self.plan, member=self.member, date=local_today())
        self.assertEqual(self.client.delete(f"/api/v1/leadership/team-members/{self.member.pk}/").status_code, 400)
        self.assertTrue(DailyCheckIn.objects.filter(pk=own.pk).exists())
