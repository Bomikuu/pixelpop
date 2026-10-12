from datetime import timedelta
from decimal import Decimal
import uuid

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.exceptions import ValidationError

from finance.models import Account, BalanceAdjustment, CashLoan, CashLoanPosting, Transaction
from finance.services.balances import account_balance, financial_position, today
from finance.services.cash_loans.ledger import create_cash_loan, available_credit, post_charges
from finance.tests.test_cash_loan_calculations import terms


class CashLoanLedgerTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user("cash-loan-test")
        self.bank = Account.objects.create(name="Bank", kind="bank")
        self.card = Account.objects.create(name="Card", kind="credit_card", credit_limit=100000)
        self.day = today()

    def data(self, **changes):
        return {**terms(loan_date=str(self.day), first_payment_date=str(self.day + timedelta(days=30))), "name": "Cash2Go", "card_id": self.card.pk, "receiving_account_id": self.bank.pk, "request_id": str(uuid.uuid4()), **changes}

    def loan(self, **changes):
        result = create_cash_loan(self.data(**changes), self.user)
        return CashLoan.objects.get(pk=result["loan_id"])

    def test_upfront_disbursement_not_income_or_double_expense(self):
        self.loan(fee_treatment="upfront")
        self.assertEqual(account_balance(self.bank), Decimal("49650"))
        self.assertEqual(account_balance(self.card), Decimal("50000"))
        self.assertEqual(available_credit(self.card), Decimal("50000"))
        self.assertEqual(Transaction.objects.filter(kind="income").count(), 0)
        self.assertEqual(Transaction.objects.get().amount, Decimal("350"))
        self.assertEqual(financial_position()["net_worth"], Decimal("-350"))

    def test_full_reservation_moves_to_debt_when_interest_posted(self):
        loan = self.loan(credit_policy="full_installments")
        self.assertEqual(available_credit(self.card), Decimal("45260"))
        item = loan.installments.first()
        post_charges(loan.pk, {"installment_id": item.pk, "interest": "395", "request_id": str(uuid.uuid4())}, self.user)
        self.assertEqual(account_balance(self.card), Decimal("50395"))
        self.assertEqual(available_credit(self.card), Decimal("45260"))

    def test_financed_fee_is_one_cost_and_liability(self):
        self.loan(fee_treatment="financed")
        self.assertEqual(account_balance(self.bank), 50000)
        self.assertEqual(account_balance(self.card), 50350)
        self.assertEqual(Transaction.objects.get().amount, 350)

    def test_retry_and_capacity_rollback(self):
        data = self.data()
        create_cash_loan(data, self.user)
        create_cash_loan(data, self.user)
        self.assertEqual(CashLoan.objects.count(), 1)
        with self.assertRaises(ValidationError):
            create_cash_loan({**data, "loan_amount": "60000"}, self.user)
        with self.assertRaises(ValidationError):
            self.loan(loan_amount="60000")
        self.assertEqual(CashLoan.objects.count(), 1)
        self.assertEqual(CashLoanPosting.objects.count(), 2)

    def test_separate_fee_cash_payment(self):
        loan = self.loan()
        self.assertEqual(Transaction.objects.count(), 0)
        post_charges(loan.pk, {"processing_fee": True, "account_id": self.bank.pk, "request_id": str(uuid.uuid4())}, self.user)
        self.assertEqual(account_balance(self.bank), 49650)
        self.assertEqual(account_balance(self.card), 50000)
        self.assertEqual(Transaction.objects.get().amount, 350)

    def test_backdate_and_invalid_account(self):
        previous = self.day - timedelta(days=2)
        self.loan(loan_date=str(previous))
        self.assertEqual(account_balance(self.card, previous - timedelta(days=1)), 0)
        self.assertEqual(account_balance(self.card, previous), 50000)
        with self.assertRaises(ValidationError):
            self.loan(receiving_account_id=self.card.pk)
