from django.test import TestCase
from finance import models
from finance.services.subscriptions.catalog import ensure_subscription
from finance.services.subscriptions.cycles import ensure_cycle
from .subscription_fixtures import SubscriptionFixturesMixin


class BackfillTests(SubscriptionFixturesMixin, TestCase):
    def test_legacy_payment_links_without_a_second_expense(self):
        service, _, deadline, cycle = self.make_service()
        expense = models.Transaction.objects.create(kind="expense", amount="1000", name="Old bill", date=self.day, account=self.make_cash(), deadline=deadline)
        ensure_cycle(deadline)
        ensure_cycle(deadline)
        self.assertEqual(models.Transaction.objects.count(), 1)
        self.assertEqual(cycle.allocations.get().transaction_id, expense.pk)

    def test_tasks_income_and_card_repayments_are_excluded(self):
        for kind, settlement in (("task", "expense"), ("reminder", "expense"), ("income", "expense"), ("payment", "credit_card_payment")):
            schedule = models.RecurringSchedule.objects.create(title="Excluded", kind=kind, settlement_kind=settlement, anchor_date=self.day)
            self.assertIsNone(ensure_subscription(schedule))
