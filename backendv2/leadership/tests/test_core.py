from datetime import date, datetime, timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from leadership.models import LeadershipPlan, TeamMember, WeeklyReport
from leadership.services.calendar import phase_for_week, plan_period, week_for_date
from leadership.services.overview import build_overview
from leadership.services.reporting import report_streak
from leadership.services.seed import PHASES, seed_plan


class LeadershipCalendarTests(TestCase):
    def test_twelve_seven_day_weeks_have_exact_boundaries(self):
        start = date(2026, 9, 29)
        self.assertEqual(plan_period(start, start - timedelta(days=1)), "upcoming")
        self.assertIsNone(week_for_date(start, start - timedelta(days=1)))
        self.assertEqual(week_for_date(start, start), 1)
        self.assertEqual(week_for_date(start, start + timedelta(days=83)), 12)
        self.assertEqual(phase_for_week(12), 6)
        self.assertEqual(plan_period(start, start + timedelta(days=84)), "finished")
        self.assertIsNone(week_for_date(start, start + timedelta(days=84)))


class LeadershipPrivateApiTests(TestCase):
    def setUp(self):
        user_model = get_user_model()
        self.owner = user_model.objects.create_user(username="lead-owner", password="test-pass")
        self.other = user_model.objects.create_user(username="another-lead", password="test-pass")
        self.plan = LeadershipPlan.objects.create(owner=self.owner, team_name="Network", start_date=date(2026, 9, 29))
        self.other_plan = LeadershipPlan.objects.create(owner=self.other, team_name="Other", start_date=date(2026, 9, 29))
        seed_plan(self.plan)
        seed_plan(self.other_plan)
        self.client = APIClient()
        self.client.force_authenticate(self.owner)

    def test_seed_is_editable_work_without_fabricated_results(self):
        self.assertEqual(self.plan.actions.count(), sum(len(phase["actions"]) for phase in PHASES))
        self.assertFalse(self.plan.actions.exclude(status="not_started").exists())
        self.assertFalse(self.plan.members.exists())
        self.assertFalse(self.plan.metric_entries.exists())
        overview = build_overview(self.plan, self.plan.start_date)
        self.assertEqual(overview["completed_actions"], 0)
        self.assertEqual(overview["adopted_processes"], 0)
        self.assertEqual(overview["evidence_items"], 0)
        self.assertEqual(overview["ownership_people"], 0)

    def test_owner_scoping_and_related_record_validation(self):
        other_action = self.other_plan.actions.first()
        response = self.client.get(f"/api/v1/leadership/actions/{other_action.pk}/")
        self.assertEqual(response.status_code, 404)
        member = TeamMember.objects.create(plan=self.other_plan, name="Another developer")
        response = self.client.post("/api/v1/leadership/actions/", {
            "title": "Cross-plan assignment", "planned_week": 1, "owner": member.pk,
        }, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertFalse(self.plan.actions.filter(title="Cross-plan assignment").exists())

    def test_carry_preserves_lineage_and_does_not_double_count(self):
        action = self.plan.actions.filter(current_week=1).first()
        response = self.client.post(f"/api/v1/leadership/actions/{action.pk}/carry/")
        self.assertEqual(response.status_code, 200)
        action.refresh_from_db()
        self.assertEqual(action.status, "moved")
        self.assertEqual(response.data["follow_up"]["lineage_id"], str(action.lineage_id))
        self.assertEqual(response.data["follow_up"]["current_week"], 2)
        self.assertEqual(self.client.post(f"/api/v1/leadership/actions/{action.pk}/carry/").status_code, 400)
        overview = build_overview(self.plan, self.plan.start_date)
        self.assertEqual(overview["total_actions"], sum(len(phase["actions"]) for phase in PHASES))

    def test_missing_metric_has_no_zero_measurement(self):
        response = self.client.get("/api/v1/leadership/metric-entries/?week=4")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["results"], [])

    def test_reporting_streak_excludes_future_and_pre_reporting_weeks(self):
        WeeklyReport.objects.create(plan=self.plan, week=7, wins="A real update", submitted_at=timezone.make_aware(datetime(2026, 11, 17)))
        result = report_streak(self.plan, self.plan.start_date + timedelta(days=56))
        self.assertEqual(result["streak"], 0)
        self.assertEqual(result["missedWeeks"], [8])
        WeeklyReport.objects.create(plan=self.plan, week=8, wins="Another update", submitted_at=timezone.make_aware(datetime(2026, 11, 24)))
        result = report_streak(self.plan, self.plan.start_date + timedelta(days=56))
        self.assertEqual(result["streak"], 2)
        self.assertEqual(result["missedWeeks"], [])
