import uuid
from decimal import Decimal
from django.test import TestCase
from rest_framework.exceptions import ValidationError
from finance import models
from finance.services.balances import account_balance
from finance.services.subscriptions.common import Conflict
from finance.services.subscriptions.cycles import confirm_cycle
from finance.services.subscriptions.payments import pay_cycle, cycle_payment_state
from .subscription_fixtures import SubscriptionFixturesMixin


class PaymentTests(SubscriptionFixturesMixin, TestCase):
    def payment(self, cycle, account, amount, **changes):
        cycle.refresh_from_db()
        return {"account": account.pk, "amount": amount, "date": str(self.day), "expected_revision": cycle.revision, "request_id": str(uuid.uuid4()), **changes}

    def test_partial_payments_and_retries_count_once(self):
        _, _, _, cycle = self.make_service()
        account = self.make_cash()
        first = self.payment(cycle, account, "400")
        pay_cycle(cycle.pk, first, self.user)
        pay_cycle(cycle.pk, first, self.user)
        self.assertEqual(cycle_payment_state(cycle.pk)["remaining"], Decimal("600"))
        pay_cycle(cycle.pk, self.payment(cycle, account, "600"), self.user)
        self.assertEqual(models.Transaction.objects.count(), 2)
        self.assertEqual(account_balance(account), Decimal("9000"))
        self.assertEqual(cycle_payment_state(cycle.pk)["status"], "paid")
        with self.assertRaises(ValidationError):
            pay_cycle(cycle.pk, {**first, "amount": "500"}, self.user)

    def test_variable_actual_and_insufficient_funds(self):
        _, _, _, cycle = self.make_service(variable=True)
        account = self.make_cash("500")
        with self.assertRaises(ValidationError):
            pay_cycle(cycle.pk, self.payment(cycle, account, "100"), self.user)
        confirm_cycle(cycle.pk, "1000", self.user, cycle.revision)
        with self.assertRaises(ValidationError):
            pay_cycle(cycle.pk, self.payment(cycle, account, "1000"), self.user)
        self.assertEqual(models.Transaction.objects.count(), 0)
        self.assertEqual(account_balance(account), Decimal("500"))

    def test_linking_existing_expense_keeps_balance_and_metadata(self):
        _, _, _, cycle = self.make_service()
        account = self.make_cash()
        expense = models.Transaction.objects.create(kind="expense", amount="400", name="Already paid", date=self.day, account=account)
        before = account_balance(account)
        payload = {"transaction": expense.pk, "confirm_existing_transaction": True, "expected_revision": cycle.revision, "request_id": str(uuid.uuid4())}
        pay_cycle(cycle.pk, payload, self.user)
        pay_cycle(cycle.pk, payload, self.user)
        self.assertEqual(account_balance(account), before)
        self.assertEqual(models.Transaction.objects.count(), 1)
        expense.refresh_from_db()
        self.assertEqual(expense.name, "Already paid")

    def test_stale_price_revision_cannot_confirm_a_different_bill(self):
        _, _, _, cycle = self.make_service()
        data = self.payment(cycle, self.make_cash(), "1000")
        cycle.revision += 1
        cycle.save()
        with self.assertRaises(Conflict):
            pay_cycle(cycle.pk, data, self.user)
        self.assertEqual(models.Transaction.objects.count(), 0)
