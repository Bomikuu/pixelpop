from rest_framework.test import APIClient

from finance.models import AuditEvent, CashLoan, CashLoanPosting
from finance.tests.test_cash_loan_ledger import CashLoanLedgerTests


class CashLoanApiTests(CashLoanLedgerTests):
    def setUp(self):
        super().setUp()
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_private_quote_and_create(self):
        path = "/api/v1/finance/cash-loans/"
        self.assertIn(APIClient().get(path).status_code, (401, 403))
        data = self.data()
        response = self.client.post(path + "quote/", data, format="json")
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["total_interest"], "4740.00")
        self.assertEqual(CashLoanPosting.objects.count(), 0)
        first = self.client.post(path, data, format="json")
        self.assertEqual(first.status_code, 201, first.data)
        again = self.client.post(path, data, format="json")
        self.assertEqual(again.status_code, 201)
        self.assertEqual(CashLoan.objects.count(), 1)
        self.assertEqual(AuditEvent.objects.filter(subject_type="CashLoan").count(), 1)
        self.assertEqual(self.client.patch(path + str(first.data["id"]) + "/", {"name": "New", "version": 99}, format="json").status_code, 409)

    def test_invalid_terms_have_field_errors(self):
        response = self.client.post("/api/v1/finance/cash-loans/quote/", self.data(rate="letters"), format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("rate", response.data)

    def test_history_is_private_paginated_and_read_only(self):
        loan = self.loan()
        CashLoanPosting.objects.bulk_create([CashLoanPosting(loan=loan, account=self.card, date=self.day, kind="charges", effect=0, notes="Read-history fixture") for _ in range(25)])
        path = f"/api/v1/finance/cash-loans/{loan.pk}/history/?page_size=20"
        self.assertIn(APIClient().get(path).status_code, (401, 403))
        before = CashLoanPosting.objects.count()
        first = self.client.get(path)
        self.assertEqual(first.status_code, 200, first.data)
        self.assertEqual(len(first.data["results"]), 20)
        self.assertEqual(first.data["count"], before)
        self.assertIsNotNone(first.data["next"])
        self.assertEqual(len(self.client.get(path + "&page=2").data["results"]), before - 20)
        self.assertEqual(CashLoanPosting.objects.count(), before)
