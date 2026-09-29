from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from finance.models import (
    Account,
    Asset,
    AssetFinancing,
    AssetFinancingPayment,
    BalanceAdjustment,
    MoneyMovement,
    Transaction,
)
from finance.services.balances import today


class AccountDetailTests(TestCase):
    def setUp(self):
        self.day = today()
        self.user = get_user_model().objects.create_user("account-detail-test", password="test-only-password")
        self.client = APIClient()
        self.client.force_authenticate(self.user)
        self.bank = Account.objects.create(name="Bank", kind="bank")
        self.card = Account.objects.create(name="Card", kind="credit_card", credit_limit=Decimal("1000"))
        self.other = Account.objects.create(name="Other", kind="cash")
        BalanceAdjustment.objects.create(account=self.bank, amount=Decimal("1000"), date=self.day, reason="Opening balance")

    def test_account_detail_and_transaction_filter_keep_accounts_separate(self):
        Transaction.objects.create(account=self.bank, kind="expense", name="Lunch", amount=100, date=self.day)
        Transaction.objects.create(account=self.bank, kind="income", name="Paid work", amount=200, date=self.day)
        Transaction.objects.create(account=self.bank, kind="income", receipt_state="expected", name="Expected work", amount=500, date=self.day)
        Transaction.objects.create(account=self.other, kind="expense", name="Other purchase", amount=30, date=self.day)
        Transaction.objects.create(account=self.card, kind="expense", name="Card purchase", amount=300, date=self.day)
        MoneyMovement.objects.create(kind="credit_card_payment", source=self.bank, destination=self.card, amount=100, date=self.day)

        month = self.day.strftime("%Y-%m")
        response = self.client.get(f"/api/v1/finance/accounts/{self.bank.pk}/detail/", {"month": month})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["summary"]["balance"], "1000.00")
        self.assertEqual(response.data["summary"]["received_income"], "200.00")
        self.assertEqual(response.data["summary"]["expenses"], "100.00")
        self.assertEqual(response.data["summary"]["expected_income"], "500.00")
        self.assertEqual(len(response.data["charts"]["monthly"]), 12)

        ledger = self.client.get(f"/api/v1/finance/accounts/{self.bank.pk}/ledger/", {"month": month})
        self.assertEqual(ledger.status_code, 200)
        self.assertEqual(ledger.data["count"], 4)
        self.assertNotIn("Expected work", [entry["name"] for entry in ledger.data["results"]])
        self.assertNotIn("Other purchase", [entry["name"] for entry in ledger.data["results"]])

        transactions = self.client.get("/api/v1/finance/transactions/", {"account": self.bank.pk, "month": month})
        self.assertEqual(transactions.status_code, 200)
        self.assertEqual(transactions.data["count"], 3)
        self.assertEqual(transactions.data["summary"]["count"], 3)
        self.assertEqual(self.client.get("/api/v1/finance/transactions/", {"account": "bad"}).status_code, 400)

        card = self.client.get(f"/api/v1/finance/accounts/{self.card.pk}/detail/", {"month": month})
        self.assertEqual(card.data["summary"]["balance"], "200.00")
        self.assertEqual(card.data["summary"]["card_charges"], "300.00")
        self.assertEqual(card.data["summary"]["card_payments"], "100.00")

    def test_financing_cash_is_not_counted_twice_in_ledger(self):
        asset = Asset.objects.create(name="Home", kind="house", value=100000, valuation_date=self.day)
        financing = AssetFinancing.objects.create(
            asset=asset,
            lender="Lender",
            opening_principal=1000,
            balance_as_of=self.day,
            next_due_date=self.day + timedelta(days=30),
            monthly_due=100,
            annual_rate=5,
            remaining_months=12,
        )
        payment = AssetFinancingPayment.objects.create(
            financing=financing,
            account=self.bank,
            date=self.day,
            cash_amount=100,
            principal=80,
            interest=20,
        )
        Transaction.objects.create(
            account=self.bank,
            kind="expense",
            name="Home financing interest",
            amount=20,
            date=self.day,
            asset_financing_payment=payment,
        )
        response = self.client.get(f"/api/v1/finance/accounts/{self.bank.pk}/ledger/")
        self.assertEqual(response.data["count"], 2)
        self.assertEqual(
            [entry["effect"] for entry in response.data["results"] if entry["kind"] == "asset_financing_payment"],
            ["-100.00"],
        )
        detail = self.client.get(f"/api/v1/finance/accounts/{self.bank.pk}/detail/", {"month": self.day.strftime("%Y-%m")})
        self.assertEqual(detail.data["summary"]["balance"], "900.00")
        self.assertEqual(detail.data["summary"]["expenses"], "20.00")

    def test_fund_value_uses_contributions_withdrawals_and_corrections(self):
        fund = Account.objects.create(name="MP2", kind="fund", fund_type="mp2")
        BalanceAdjustment.objects.create(account=fund, amount=Decimal("100"), date=self.day, reason="Opening balance")
        MoneyMovement.objects.create(kind="fund_contribution", source=self.bank, destination=fund, amount=50, date=self.day)
        MoneyMovement.objects.create(kind="fund_withdrawal", source=fund, destination=self.bank, amount=20, date=self.day)
        BalanceAdjustment.objects.create(account=fund, amount=Decimal("5"), date=self.day, reason="Provider correction")

        detail = self.client.get(f"/api/v1/finance/accounts/{fund.pk}/detail/", {"month": self.day.strftime("%Y-%m")})
        self.assertEqual(detail.data["summary"]["balance"], "135.00")
        self.assertEqual(detail.data["summary"]["contributions"], "50.00")
        self.assertEqual(detail.data["summary"]["withdrawals"], "20.00")
        self.assertEqual(detail.data["summary"]["net_change"], "135.00")
        ledger = self.client.get(f"/api/v1/finance/accounts/{fund.pk}/ledger/")
        self.assertEqual(ledger.data["count"], 4)

    def test_history_pages_reach_entries_past_the_old_modal_cap(self):
        for index in range(105):
            BalanceAdjustment.objects.create(account=self.other, amount=1, date=self.day, reason=f"Correction {index}")
        first = self.client.get(f"/api/v1/finance/accounts/{self.other.pk}/ledger/")
        last = self.client.get(f"/api/v1/finance/accounts/{self.other.pk}/ledger/", {"page": 6})
        self.assertEqual(first.data["count"], 105)
        self.assertEqual(len(first.data["results"]), 20)
        self.assertEqual(len(last.data["results"]), 5)
        self.assertEqual(len({entry["id"] for entry in first.data["results"] + last.data["results"]}), 25)
