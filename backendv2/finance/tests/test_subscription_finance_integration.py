import uuid
from decimal import Decimal
from django.test import TestCase
from finance import models
from finance.services.summaries import deadline_summary
from finance.services.subscriptions.payments import pay_cycle
from .subscription_fixtures import SubscriptionFixturesMixin


class FinanceIntegrationTests(SubscriptionFixturesMixin, TestCase):
    def test_partial_counts_payment_once_and_only_remainder_unpaid(self):
        _, _, deadline, cycle = self.make_service()
        pay_cycle(cycle.pk, {"amount": "400", "account": self.make_cash().pk, "date": self.day, "expected_revision": cycle.revision, "request_id": uuid.uuid4()}, self.user)
        result = deadline_summary(models.Deadline.objects.filter(pk=deadline.pk))
        self.assertEqual(result["paid"], Decimal("400"))
        self.assertEqual(result["unpaid"], Decimal("600"))
        self.assertEqual(models.Transaction.objects.count(), 1)
