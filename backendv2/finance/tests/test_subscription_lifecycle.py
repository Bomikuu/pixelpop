import uuid
from datetime import date, timedelta
from django.test import TestCase
from finance import models
from finance.services.balances import today
from finance.services.recurrence import occurrence
from finance.services.subscriptions.lifecycle import change_lifecycle
from finance.services.subscriptions.eligibility import visible_obligations
from .subscription_fixtures import SubscriptionFixturesMixin


class LifecycleTests(SubscriptionFixturesMixin, TestCase):
    def test_month_end_and_six_month_cadence(self):
        _, schedule, _, _ = self.make_service(anchor_date=date(2025, 1, 31))
        self.assertEqual(occurrence(schedule, 1), date(2025, 2, 28))
        schedule.interval = 6
        self.assertEqual(occurrence(schedule, 1), date(2025, 7, 31))

    def test_pause_preserves_started_period_and_old_debt(self):
        service, schedule, _, cycle = self.make_service(variable=True)
        cycle.period_start, cycle.period_end = today() - timedelta(days=10), today() + timedelta(days=20)
        cycle.save()
        cycle.deadline.due_date = today() + timedelta(days=25)
        cycle.deadline.save()
        future = models.Deadline.objects.create(schedule=schedule, title="Future", kind="bill", due_date=today() + timedelta(days=50))
        future_cycle = models.SubscriptionCycle.objects.create(subscription=service, deadline=future)
        change_lifecycle(service.pk, "pause", today(), self.user, request_id=uuid.uuid4())
        cycle.refresh_from_db()
        future_cycle.refresh_from_db()
        self.assertIsNone(cycle.excluded_at)
        self.assertIsNotNone(future_cycle.excluded_at)
        self.assertEqual(list(visible_obligations(models.Deadline.objects.all()).values_list("pk", flat=True)), [cycle.deadline_id])
