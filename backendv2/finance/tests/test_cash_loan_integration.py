import uuid
from datetime import timedelta
from decimal import Decimal

from rest_framework.exceptions import ValidationError

from finance.models import Deadline, Transaction
from finance.services.balances import ensure_account_capacity
from finance.services.cash_loans.ledger import additional_credit_reservation, post_charges
from finance.services.cash_loans.lifecycle import amend_cash_loan, settle_cash_loan
from finance.services.cash_loans.payments import allocate_payment
from finance.services.cash_loans.projections import materialize_cash_loan_deadlines
from finance.services.quick_entry import save_quick_entries
from finance.services.settlements import settle_deadline
from finance.services.summaries import deadline_summary, overview
from finance.tests.test_cash_loan_ledger import CashLoanLedgerTests


class CashLoanIntegrationTests(CashLoanLedgerTests):
    def test_deadlines_are_unique_and_not_expenses(self):
        loan = self.loan()
        materialize_cash_loan_deadlines(loan.pk)
        self.assertEqual(Deadline.objects.filter(cash_loan=loan).count(), 12)
        self.assertEqual(Transaction.objects.count(), 0)
        with self.assertRaises(ValidationError):
            settle_deadline(loan.installments.first().deadline_id, {}, self.user)

    def test_quick_entry_respects_reserved_credit(self):
        self.loan(credit_policy="full_installments")
        with self.assertRaises(ValidationError):
            save_quick_entries([{"kind": "expense", "name": "Too large", "amount": Decimal("46000"), "date": self.day, "account": self.card, "category": None, "request_id": uuid.uuid4()}], self.user)
        self.assertEqual(Transaction.objects.count(), 0)
        Transaction.objects.create(kind="expense", name="Purchase", amount=46000, account=self.card, date=self.day)
        with self.assertRaises(ValidationError):
            ensure_account_capacity(self.card, self.day)

    def test_historical_reservation_survives_amendment(self):
        before = self.day - timedelta(days=2)
        loan = self.loan(loan_date=str(before), credit_policy="full_installments")
        amend_cash_loan(loan.pk, {"version": 1, "effective_date": str(self.day), "rate": "0", "first_payment_date": str(self.day + timedelta(days=30)), "request_id": str(uuid.uuid4())}, self.user)
        self.assertEqual(additional_credit_reservation(self.card.pk, before), 4740)
        self.assertEqual(additional_credit_reservation(self.card.pk), 0)

    def test_backdated_allocation_cannot_overconsume_later_payment(self):
        before = self.day - timedelta(days=1)
        loan = self.loan(loan_date=str(before))
        item = loan.installments.first()
        data = {"loan_id": loan.pk, "source_account_id": self.bank.pk, "date": str(self.day), "amount": "4100", "allocations": [{"installment_id": item.pk, "principal": "4100"}], "request_id": str(uuid.uuid4())}
        allocate_payment(data, self.user)
        with self.assertRaises(ValidationError):
            allocate_payment({**data, "date": str(before), "request_id": str(uuid.uuid4())}, self.user)
        self.assertEqual(item.allocations.count(), 1)

    def test_posted_rebate_is_not_income_and_nets_borrowing_cost(self):
        loan = self.loan(fee_value="0")
        post_charges(loan.pk, {"installment_id": loan.installments.first().pk, "interest": "395", "request_id": str(uuid.uuid4())}, self.user)
        loan.refresh_from_db()
        settle_cash_loan(loan.pk, {"version": loan.version, "settlement_interest": "0", "settlement_fees": "0", "source_account_id": self.bank.pk, "request_id": str(uuid.uuid4())}, self.user)
        data = overview(self.day.strftime("%Y-%m"))
        self.assertEqual(data["month"]["expenses"], 0)
        self.assertEqual(data["today"]["spent"], 0)
        self.assertEqual(data["month"]["income"], 0)
        self.assertEqual(data["month"]["cash_outflow"], 50000)
        self.assertEqual(data["position"]["debt"], 0)
        self.assertEqual(data["cash_loans"]["remaining_payments"], 0)
        self.assertEqual(Deadline.objects.filter(cash_loan=loan, status="pending").count(), 0)

    def test_separate_cash_fee_is_one_cash_outflow(self):
        loan = self.loan()
        post_charges(loan.pk, {"processing_fee": True, "account_id": self.bank.pk, "request_id": str(uuid.uuid4())}, self.user)
        data = overview(self.day.strftime("%Y-%m"))
        self.assertEqual(data["month"]["expenses"], 350)
        self.assertEqual(data["month"]["cash_outflow"], 350)
        self.assertEqual(data["cash_loans"]["repayments"], 0)

    def test_partial_deadline_keeps_original_amount_and_statement_counts_once(self):
        loan = self.loan()
        item = loan.installments.first()
        original = item.deadline.amount
        allocate_payment({"loan_id": loan.pk, "source_account_id": self.bank.pk, "amount": "100", "date": str(self.day), "postings": [], "allocations": [{"installment_id": item.pk, "principal": "100"}], "request_id": str(uuid.uuid4())}, self.user)
        item.deadline.refresh_from_db()
        self.assertEqual(item.deadline.amount, original)
        statement = Deadline.objects.create(title="Card statement", kind="payment", amount=5000, due_date=item.due_date, credit_card=self.card, settlement_kind="credit_card_payment")
        item.statement = statement
        item.save(update_fields=["statement"])
        summary = deadline_summary(Deadline.objects.filter(pk__in=[statement.pk, item.deadline_id]))
        self.assertEqual(summary["unpaid"], 5000)

    def test_amended_items_cannot_receive_backdated_charges_or_payments(self):
        before = self.day - timedelta(days=2)
        loan = self.loan(loan_date=str(before))
        amend_cash_loan(loan.pk, {"version": 1, "effective_date": str(self.day), "rate": "0.79", "first_payment_date": str(self.day + timedelta(days=30)), "request_id": str(uuid.uuid4())}, self.user)
        item = loan.installments.filter(active=True).first()
        with self.assertRaises(ValidationError):
            post_charges(loan.pk, {"date": str(before), "installment_id": item.pk, "interest": "395", "request_id": str(uuid.uuid4())}, self.user)
        with self.assertRaises(ValidationError):
            allocate_payment({"loan_id": loan.pk, "source_account_id": self.bank.pk, "date": str(before), "amount": "100", "postings": [], "allocations": [{"installment_id": item.pk, "principal": "100"}], "request_id": str(uuid.uuid4())}, self.user)
