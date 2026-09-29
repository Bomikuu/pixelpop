from importlib import import_module

from django.apps import apps
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from finance.models import Account, LoanReceivable, Person, Transaction
from finance.services.balances import today
from finance.services.people import person_key


class PeopleDirectoryTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user("people-directory-test", password="test-only-password")
        self.client = APIClient()
        self.client.force_authenticate(self.user)
        self.account = Account.objects.create(name="Cash", kind="cash")

    def test_independent_person_has_zero_history_and_name_is_unique(self):
        response = self.client.post("/api/v1/finance/contacts/", {"name": " Mother ", "relationship": "Mother", "notes": "Family"}, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["name"], "Mother")
        self.assertEqual(len(response.data["key"]), 40)
        duplicate = self.client.post("/api/v1/finance/contacts/", {"name": "mother", "relationship": "Other"}, format="json")
        self.assertEqual(duplicate.status_code, 400)
        month = today().strftime("%Y-%m")
        summary = self.client.get("/api/v1/finance/people/", {"month": month, "person_key": response.data["key"]})
        self.assertEqual(summary.status_code, 200)
        self.assertEqual(summary.data["results"][0]["given"], "0.00")
        self.assertEqual(summary.data["results"][0]["lent"], "0.00")

    def test_giving_and_loan_use_one_person_and_rename_keeps_history_key(self):
        contact = self.client.post("/api/v1/finance/contacts/", {"name": "Father", "relationship": "Father"}, format="json").data
        gift = self.client.post("/api/v1/finance/transactions/", {
            "kind": "expense", "name": "Support", "contact": contact["id"],
            "amount": "250", "account": self.account.pk, "date": str(today()),
        }, format="json")
        loan = self.client.post("/api/v1/finance/loans/", {
            "contact": contact["id"], "principal": "500", "account": self.account.pk,
            "date": str(today()), "existing": True,
        }, format="json")
        self.assertEqual(gift.status_code, 201)
        self.assertEqual(loan.status_code, 201)
        self.assertEqual(gift.data["recipient"], "Father")
        self.assertEqual(loan.data["person"], "Father")
        renamed = self.client.patch(f"/api/v1/finance/contacts/{contact['id']}/", {"name": "Dad"}, format="json")
        self.assertEqual(renamed.status_code, 200)
        self.assertEqual(renamed.data["key"], contact["key"])
        self.assertEqual(Transaction.objects.get(pk=gift.data["id"]).recipient, "Dad")
        self.assertEqual(LoanReceivable.objects.get(pk=loan.data["id"]).person, "Dad")
        summary = self.client.get("/api/v1/finance/people/", {"month": today().strftime("%Y-%m"), "person_key": contact["key"]})
        self.assertEqual(summary.data["results"][0]["given"], "250.00")
        self.assertEqual(summary.data["results"][0]["lent"], "500.00")

    def test_unknown_contact_does_not_create_money_record(self):
        response = self.client.post("/api/v1/finance/transactions/", {
            "kind": "expense", "name": "Support", "contact": 999999,
            "amount": "25", "account": self.account.pk, "date": str(today()),
        }, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertFalse(Transaction.objects.exists())

    def test_legacy_name_only_write_uses_saved_person(self):
        contact = self.client.post("/api/v1/finance/contacts/", {"name": "Mother", "relationship": "Mother"}, format="json").data
        response = self.client.post("/api/v1/finance/loans/", {
            "person": " mother ", "principal": "20", "account": self.account.pk,
            "date": str(today()), "existing": True,
        }, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["contact"], contact["id"])

    def test_contacts_require_authentication(self):
        self.client.force_authenticate(user=None)
        self.assertIn(self.client.get("/api/v1/finance/contacts/").status_code, (401, 403))
        self.assertIn(self.client.post("/api/v1/finance/contacts/", {"name": "Friend", "relationship": "Friend"}, format="json").status_code, (401, 403))

    def test_backfill_preserves_old_person_history_key(self):
        Transaction.objects.create(kind="expense", name="Gift", recipient=" Mother ", amount=10, account=self.account, date=today())
        LoanReceivable.objects.create(person="mother", principal=20, account=self.account, date=today(), existing=True)
        import_module("finance.migrations.0016_people_directory").backfill_people(apps, None)
        self.assertEqual(Person.objects.count(), 1)
        contact = Person.objects.get()
        self.assertEqual(contact.key, person_key("Mother"))
        self.assertEqual(Transaction.objects.get().contact_id, contact.pk)
        self.assertEqual(LoanReceivable.objects.get().contact_id, contact.pk)
