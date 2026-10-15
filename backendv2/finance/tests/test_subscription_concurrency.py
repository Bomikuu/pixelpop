"""Run only on a separately authorized PostgreSQL test database, never Neon production."""
import uuid
from concurrent.futures import ThreadPoolExecutor
from unittest import skipUnless
from django.db import connection, connections
from django.test import TransactionTestCase
from rest_framework.exceptions import APIException
from finance import models
from finance.services.subscriptions.payments import pay_cycle
from .subscription_fixtures import SubscriptionFixturesMixin


@skipUnless(connection.vendor == "postgresql", "PostgreSQL row-lock verification requires an authorized test DB.")
class PaymentConcurrencyTests(SubscriptionFixturesMixin, TransactionTestCase):
    def run_workers(self, payloads, cycle):
        def worker(payload):
            try:
                return pay_cycle(cycle.pk, payload, self.user).pk
            except APIException:
                return None
            finally:
                connections.close_all()
        with ThreadPoolExecutor(max_workers=2) as executor:
            return list(executor.map(worker, payloads))

    def test_concurrent_payments_cannot_exceed_remaining(self):
        _, _, _, cycle = self.make_service()
        account = self.make_cash()
        models.WorkspaceSettings.objects.get_or_create(pk=1)
        base = {"amount": "700", "account": account.pk, "date": str(self.day), "expected_revision": cycle.revision}
        result = self.run_workers([{**base, "request_id": uuid.uuid4()}, {**base, "request_id": uuid.uuid4()}], cycle)
        self.assertEqual(sum(value is not None for value in result), 1)
        self.assertEqual(models.Transaction.objects.count(), 1)

    def test_concurrent_exact_retry_returns_one_allocation(self):
        _, _, _, cycle = self.make_service()
        account = self.make_cash()
        models.WorkspaceSettings.objects.get_or_create(pk=1)
        payload = {"amount": "700", "account": account.pk, "date": str(self.day), "expected_revision": cycle.revision, "request_id": uuid.uuid4()}
        result = self.run_workers([payload, payload], cycle)
        self.assertEqual(result[0], result[1])
        self.assertEqual(models.Transaction.objects.count(), 1)
