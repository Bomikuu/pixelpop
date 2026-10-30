from datetime import timedelta
from decimal import Decimal
import uuid

from django.contrib.auth import get_user_model
from django.db import connection
from django.test import TestCase
from django.test.utils import CaptureQueriesContext

from finance.models import Account, BalanceAdjustment, Deadline, MoneyMovement, RecurringSchedule, Transaction
from finance.services.balances import account_balance, account_balances, today
from finance.services.cash_loans.ledger import create_cash_loan
from finance.services.recurrence import materialize
from finance.services.reminders import checklist_for
from finance.tests.test_cash_loan_calculations import terms


class FinanceQueryEfficiencyTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_superuser("speed-audit", "audit@example.com", "test-password")
        self.day = today()
        self.bank = Account.objects.create(name="Bank", kind="bank")
        self.card = Account.objects.create(name="Card", kind="credit_card", credit_limit=100000)
        self.fund = Account.objects.create(name="Archived fund", kind="fund", fund_type="investment", active=False)
        for account in (self.bank, self.card, self.fund):
            BalanceAdjustment.objects.create(account=account, amount=1000, date=self.day - timedelta(days=2))
        Transaction.objects.create(account=self.bank, kind="income", receipt_state="expected", name="Expected", amount=500, date=self.day)
        Transaction.objects.create(account=self.bank, kind="income", receipt_state="received", name="Received", amount=200, date=self.day)
        Transaction.objects.create(account=self.card, kind="expense", name="Card purchase", amount=50, date=self.day)
        MoneyMovement.objects.create(kind="credit_card_payment", source=self.bank, destination=self.card, amount=100, date=self.day)
        self.client.force_login(self.user)

    def test_grouped_balances_match_individual_ledgers_and_keep_constant_query_count(self):
        create_cash_loan({**terms(loan_date=str(self.day), first_payment_date=str(self.day + timedelta(days=30))), "name": "Loan", "card_id": self.card.pk, "receiving_account_id": self.bank.pk, "fee_treatment": "upfront", "request_id": str(uuid.uuid4())}, self.user)
        Account.objects.bulk_create([Account(name=f"Extra {index}", kind="cash") for index in range(15)])
        accounts = list(Account.objects.all())
        for day in (self.day - timedelta(days=1), self.day):
            expected = {account.pk: account_balance(account, day) for account in accounts}
            with self.assertNumQueries(6):
                actual = account_balances(accounts, day)
            self.assertEqual(actual, expected)

    def test_accounts_list_reuses_balances_as_account_count_grows(self):
        with CaptureQueriesContext(connection) as first:
            response = self.client.get("/api/v1/finance/accounts/?page_size=100")
        self.assertEqual(response.status_code, 200)
        Account.objects.bulk_create([Account(name=f"Extra {index}", kind="cash") for index in range(15)])
        with CaptureQueriesContext(connection) as second:
            response = self.client.get("/api/v1/finance/accounts/?page_size=100")
        self.assertEqual(response.status_code, 200)
        self.assertLessEqual(len(second), len(first) + 1)
        expected = {account.pk: account_balance(account) for account in Account.objects.all()}
        for row in response.json()["results"]:
            self.assertEqual(Decimal(row["balance"]), expected[row["id"]])

    def test_existing_checklist_does_not_repeat_daily_setup(self):
        expected = checklist_for(self.user, self.day)
        with CaptureQueriesContext(connection) as queries:
            actual = checklist_for(self.user, self.day)
        self.assertEqual(actual, expected)
        self.assertLessEqual(len(queries), 12)

    def test_repeated_materialization_reuses_existing_cycles(self):
        schedule = RecurringSchedule.objects.create(title="Monthly bill", kind="bill", amount=100, anchor_date=self.day - timedelta(days=365), frequency="monthly", created_by=self.user)
        materialize(self.day + timedelta(days=90))
        expected = list(Deadline.objects.filter(schedule=schedule).values_list("pk", "amount", "due_date"))
        with CaptureQueriesContext(connection) as queries:
            materialize(self.day + timedelta(days=90))
        self.assertEqual(list(Deadline.objects.filter(schedule=schedule).values_list("pk", "amount", "due_date")), expected)
        self.assertLessEqual(len(queries), 15)
