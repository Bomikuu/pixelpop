import uuid
from decimal import Decimal

from rest_framework.exceptions import ValidationError

from finance.models import Account, CashLoanAllocation, MoneyMovement
from finance.services.balances import account_balance
from finance.services.cash_loans.payments import allocate_payment, reverse_allocation
from finance.services.cash_loans.projections import loan_detail
from finance.services.settlements import move_money
from finance.tests.test_cash_loan_ledger import CashLoanLedgerTests


class CashLoanPaymentTests(CashLoanLedgerTests):
    def payment(self, loan, **changes):
        item = loan.installments.first()
        return {"loan_id": loan.pk, "source_account_id": self.bank.pk, "date": str(self.day), "amount": "4561.67", "allocations": [{"installment_id": item.pk, "principal": "4166.67", "interest": "395", "fees": "0"}], "postings": [{"installment_id": item.pk, "interest": "395", "fees": "0"}], "request_id": str(uuid.uuid4()), **changes}

    def test_new_payment_and_retry_only_deduct_once(self):
        loan = self.loan()
        data = self.payment(loan)
        result = allocate_payment(data, self.user)
        allocate_payment(data, self.user)
        self.assertEqual(MoneyMovement.objects.count(), 1)
        self.assertEqual(CashLoanAllocation.objects.count(), 1)
        self.assertEqual(account_balance(self.bank), Decimal("45438.33"))
        self.assertEqual(account_balance(self.card), Decimal("45833.33"))
        self.assertEqual(loan_detail(loan.pk)["paid_installments"], 1)
        reverse_allocation(result["allocation_ids"][0], {"request_id": str(uuid.uuid4())}, self.user)
        self.assertEqual(account_balance(self.bank), Decimal("45438.33"))
        self.assertEqual(loan_detail(loan.pk)["paid_installments"], 0)

    def test_existing_payment_link_does_not_touch_cash(self):
        loan = self.loan()
        movement = move_money({"kind": "credit_card_payment", "source": self.bank.pk, "destination": self.card.pk, "amount": "5000", "date": str(self.day), "request_id": str(uuid.uuid4())}, self.user)
        data = self.payment(loan, movement_id=movement.pk)
        data.pop("source_account_id")
        data.pop("amount")
        allocate_payment(data, self.user)
        self.assertEqual(account_balance(self.bank), 45000)
        self.assertEqual(account_balance(self.card), 45395)
        self.assertEqual(MoneyMovement.objects.count(), 1)

    def test_partial_and_projected_interest_requires_confirmation(self):
        loan = self.loan()
        data = self.payment(loan, postings=[])
        with self.assertRaises(ValidationError):
            allocate_payment(data, self.user)
        self.assertEqual(MoneyMovement.objects.count(), 0)
        item = loan.installments.first()
        allocate_payment(self.payment(loan, amount="100", allocations=[{"installment_id": item.pk, "principal": "100", "interest": "0", "fees": "0"}], postings=[]), self.user)
        self.assertEqual(loan_detail(loan.pk)["schedule"][0]["status"], "partially_paid")

    def test_consumed_payment_and_cross_card_reject_atomically(self):
        loan = self.loan()
        movement = move_money({"kind": "credit_card_payment", "source": self.bank.pk, "destination": self.card.pk, "amount": "100", "date": str(self.day), "request_id": str(uuid.uuid4())}, self.user)
        item = loan.installments.first()
        data = {"loan_id": loan.pk, "movement_id": movement.pk, "allocations": [{"installment_id": item.pk, "principal": "100"}], "request_id": str(uuid.uuid4())}
        allocate_payment(data, self.user)
        with self.assertRaises(ValidationError):
            allocate_payment({**data, "request_id": str(uuid.uuid4())}, self.user)
        self.assertEqual(CashLoanAllocation.objects.count(), 1)

    def test_another_cards_installment_is_rejected(self):
        loan = self.loan()
        other_card = Account.objects.create(name="Other card", kind="credit_card", credit_limit=100000)
        other = self.loan(card_id=other_card.pk)
        item = other.installments.first()
        before = account_balance(self.bank)
        with self.assertRaises(ValidationError):
            allocate_payment(self.payment(loan, amount="100", allocations=[{"installment_id": item.pk, "principal": "100"}], postings=[]), self.user)
        self.assertEqual(account_balance(self.bank), before)
        self.assertEqual(MoneyMovement.objects.count(), 0)

    def test_one_movement_can_be_allocated_across_two_loans(self):
        first = self.loan(loan_amount="25000", fee_value="0")
        second = self.loan(loan_amount="25000", fee_value="0")
        data = self.payment(first, amount="100", postings=[], allocations=[{"installment_id": first.installments.first().pk, "principal": "40"}, {"installment_id": second.installments.first().pk, "principal": "60"}])
        allocate_payment(data, self.user)
        allocate_payment(data, self.user)
        self.assertEqual(MoneyMovement.objects.count(), 1)
        self.assertEqual(CashLoanAllocation.objects.count(), 2)
        self.assertEqual(account_balance(self.bank), 49900)
        self.assertEqual(account_balance(self.card), 49900)

    def test_insufficient_payment_rolls_back_confirmed_charges(self):
        loan = self.loan()
        before = loan.postings.count()
        with self.assertRaises(ValidationError):
            allocate_payment(self.payment(loan, amount="1"), self.user)
        self.assertEqual(loan.postings.count(), before)
        self.assertEqual(MoneyMovement.objects.count(), 0)
        self.assertEqual(CashLoanAllocation.objects.count(), 0)
