import uuid

from rest_framework.exceptions import ValidationError

from finance.models import CashLoan, MoneyMovement, Transaction
from finance.services.balances import account_balance
from finance.services.cash_loans.lifecycle import amend_cash_loan, cancel_cash_loan, preview_settlement, settle_cash_loan
from finance.services.cash_loans.projections import loan_detail
from finance.tests.test_cash_loan_ledger import CashLoanLedgerTests


class CashLoanLifecycleTests(CashLoanLedgerTests):
    def test_preview_and_lender_settlement_preserve_contract(self):
        loan = self.loan(fee_value="0")
        data = {"settlement_interest": "0", "settlement_fees": "0", "early_fee": "0", "settlement_amount": "50000", "source_account_id": self.bank.pk, "date": str(self.day), "version": loan.version, "request_id": str(uuid.uuid4())}
        quote = preview_settlement(loan.pk, data)
        self.assertEqual(quote["interest_rebate"], "4740.00")
        self.assertEqual(Transaction.objects.count(), 0)
        settle_cash_loan(loan.pk, data, self.user)
        settle_cash_loan(loan.pk, data, self.user)
        detail = loan_detail(loan.pk)
        self.assertEqual(detail["status"], "fully_paid")
        self.assertEqual(detail["original_quote"]["total_interest"], "4740.00")
        self.assertEqual(account_balance(self.bank), 0)
        self.assertEqual(account_balance(self.card), 0)
        self.assertEqual(MoneyMovement.objects.count(), 1)

    def test_amend_future_preserves_original_rows(self):
        loan = self.loan()
        original = list(loan.installments.values_list("id", flat=True))
        amend_cash_loan(loan.pk, {"version": 1, "effective_date": str(self.day), "rate": "0.5", "term_months": 24, "first_payment_date": str(self.day), "request_id": str(uuid.uuid4())}, self.user)
        self.assertEqual(loan.installments.filter(pk__in=original).count(), 12)
        self.assertEqual(loan.installments.filter(active=True).count(), 24)
        self.assertEqual(account_balance(self.card), 50000)
        self.assertEqual(loan.schedules.count(), 2)

    def test_cancel_requires_cash_and_no_silent_debt_disappearance(self):
        loan = self.loan(fee_treatment="upfront")
        with self.assertRaises(ValidationError):
            cancel_cash_loan(loan.pk, {"settlement_interest": "0", "settlement_fees": "0", "source_account_id": self.bank.pk, "request_id": str(uuid.uuid4())}, self.user)
        loan.refresh_from_db()
        self.assertFalse(loan.cancelled)
        self.assertEqual(account_balance(self.card), 50000)
        self.assertEqual(loan.adjustments.count(), 0)

    def test_bad_lender_total_rejects(self):
        loan = self.loan()
        with self.assertRaises(ValidationError):
            preview_settlement(loan.pk, {"settlement_amount": "10"})
