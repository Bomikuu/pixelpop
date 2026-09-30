"""Focused audit coverage. These tests are intentionally not run by this task."""

import uuid
from datetime import date

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from finance.models import Account, AuditEvent, BalanceAdjustment, SharedBill
from finance.services.audit import log_record, record_change, snapshot_record
from finance.services.shared_bills import create_bill, share_bill


class AuditServiceTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user("audit-owner", password="test-only-password")

    def test_only_changed_fields_are_kept_and_noop_edit_is_omitted(self):
        before = {"name": "Old", "monthly_budget": "100.00"}
        after = {"name": "New", "monthly_budget": "100.00"}
        row = record_change(actor=self.user, source="dashboard", action="edited", area="settings",
                            subject_type="Category", subject_id="1", label="New", before=before, after=after)
        self.assertEqual(row.changes, [{"field": "Name", "old": "Old", "new": "New"}])
        self.assertIsNone(record_change(actor=self.user, source="dashboard", action="edited", area="settings",
                                        subject_type="Category", subject_id="1", label="New", before=after, after=after))
        self.assertEqual(AuditEvent.objects.count(), 1)

    def test_snapshots_exclude_shared_secrets_and_mask_card_number(self):
        bill = SharedBill.objects.create(title="Dinner", total=500, date=date.today(),
                                         share_token="secret-share-token", edit_pin_hash="secret-pin-hash")
        snapshot = snapshot_record(bill)
        self.assertNotIn("share_token", snapshot)
        self.assertNotIn("edit_pin_hash", snapshot)
        account = Account.objects.create(name="Bank", last_four="1234")
        self.assertEqual(snapshot_record(account)["last_four"], "•••• 1234")

    def test_operation_key_prevents_duplicate_event(self):
        account = Account.objects.create(name="Wallet")
        values = dict(actor=self.user, action="added", after=snapshot_record(account), operation_key="account:one")
        self.assertIsNotNone(log_record(account, **values))
        self.assertIsNone(log_record(account, **values))
        self.assertEqual(AuditEvent.objects.count(), 1)


class AuditEventsApiTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user("audit-reader", password="test-only-password")
        self.client = APIClient()
        self.client.force_authenticate(self.user)
        self.month = timezone.localdate().strftime("%Y-%m")

    def test_private_read_only_api_and_invalid_filters(self):
        anonymous = APIClient().get("/api/v1/finance/events/")
        self.assertIn(anonymous.status_code, (401, 403))
        self.assertEqual(self.client.post("/api/v1/finance/events/", {}, format="json").status_code, 405)
        self.assertEqual(self.client.get("/api/v1/finance/events/?month=bad").status_code, 400)
        self.assertEqual(self.client.get("/api/v1/finance/events/?action=unknown").status_code, 400)

    def test_summary_and_charts_count_all_pages(self):
        for index in range(25):
            record_change(actor=self.user, source="dashboard", action="added", area="settings",
                          subject_type="Category", subject_id=str(index), label=f"Category {index}",
                          after={"name": f"Category {index}"})
        response = self.client.get("/api/v1/finance/events/", {"month": self.month})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["results"]), 20)
        self.assertEqual(response.data["summary"]["added"], 25)
        self.assertEqual(sum(day["added"] for day in response.data["charts"]["timeline"]), 25)
        self.assertEqual(response.data["charts"]["areas"][0]["count"], 25)

    def test_standard_crud_diff_and_noop(self):
        created = self.client.post("/api/v1/finance/categories/", {"name": "Groceries"}, format="json")
        self.assertEqual(created.status_code, 201)
        identifier = created.data["id"]
        self.assertEqual(AuditEvent.objects.last().action, "added")
        changed = self.client.patch(f"/api/v1/finance/categories/{identifier}/", {"name": "Food"}, format="json")
        self.assertEqual(changed.status_code, 200)
        self.assertEqual(AuditEvent.objects.first().changes[0], {"field": "Name", "old": "Groceries", "new": "Food"})
        self.client.patch(f"/api/v1/finance/categories/{identifier}/", {"name": "Food"}, format="json")
        self.assertEqual(AuditEvent.objects.count(), 2)
        self.assertEqual(self.client.delete(f"/api/v1/finance/categories/{identifier}/").status_code, 204)
        self.assertEqual(AuditEvent.objects.first().action, "deleted")

    def test_idempotent_expense_retry_and_failed_expense(self):
        account = Account.objects.create(name="Cash", kind="cash")
        BalanceAdjustment.objects.create(account=account, amount=100, date=timezone.localdate(), reason="Opening")
        data = {"kind": "expense", "name": "Tea", "amount": "20", "account": account.pk,
                "date": str(timezone.localdate()), "request_id": str(uuid.uuid4())}
        first = self.client.post("/api/v1/finance/transactions/", data, format="json")
        second = self.client.post("/api/v1/finance/transactions/", data, format="json")
        self.assertEqual((first.status_code, second.status_code), (201, 200))
        self.assertEqual(AuditEvent.objects.count(), 1)
        data.update(amount="1000", request_id=str(uuid.uuid4()))
        self.assertEqual(self.client.post("/api/v1/finance/transactions/", data, format="json").status_code, 400)
        self.assertEqual(AuditEvent.objects.count(), 1)

    def test_nutrition_weight_and_workspace_setting_edits(self):
        day = str(timezone.localdate())
        url = f"/api/v1/finance/nutrition/weights/{day}/"
        self.assertEqual(self.client.put(url, {"weight_kg": "72.50"}, format="json").status_code, 201)
        self.assertEqual(self.client.put(url, {"weight_kg": "72.25"}, format="json").status_code, 200)
        self.assertEqual(AuditEvent.objects.first().changes[0],
                         {"field": "Weight kg", "old": "72.50", "new": "72.25"})
        self.assertEqual(self.client.patch("/api/v1/finance/settings/", {"monthly_budget": "25000"}, format="json").status_code, 200)
        self.assertEqual(AuditEvent.objects.first().area, "settings")

    def test_failed_shared_link_payment_creates_no_event(self):
        bill = create_bill({
            "title": "Dinner", "total": "100", "date": str(timezone.localdate()),
            "participants": [
                {"name": "Miku", "is_me": True, "amount": "50"},
                {"name": "Alex", "is_me": False, "amount": "50"},
            ],
        }, self.user)
        bill = share_bill(bill.pk)
        response = APIClient().post(
            f"/api/v1/finance/shared-bills/share/{bill.share_token}/pay/",
            {"payer_id": "99", "kind": "payment", "amount": "50",
             "date": str(timezone.localdate()), "request_id": str(uuid.uuid4())}, format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertFalse(AuditEvent.objects.exists())

    def test_shared_link_payment_is_audited_without_claiming_a_person(self):
        bill = create_bill({
            "title": "Dinner", "total": "100", "date": str(timezone.localdate()),
            "participants": [
                {"name": "Miku", "is_me": True, "amount": "50"},
                {"name": "Alex", "is_me": False, "amount": "50"},
            ],
        }, self.user)
        bill = share_bill(bill.pk)
        guest = APIClient()
        payload = {"payer_id": "2", "kind": "payment", "amount": "50",
                   "date": str(timezone.localdate()), "request_id": str(uuid.uuid4())}
        url = f"/api/v1/finance/shared-bills/share/{bill.share_token}/pay/"
        first = guest.post(url, payload, format="json")
        self.assertEqual(first.status_code, 200)
        row = AuditEvent.objects.first()
        self.assertEqual((row.source, row.actor_label, row.action), ("shared_link", "Shared link", "reported"))
        self.assertNotIn(bill.share_token, str(row.changes))
        retry = guest.post(url, payload, format="json")
        self.assertEqual(retry.status_code, 200)
        self.assertEqual(AuditEvent.objects.count(), 1)

    def test_pin_rotation_never_stores_pin_or_hash(self):
        bill = create_bill({
            "title": "Dinner", "total": "100", "date": str(timezone.localdate()),
            "participants": [
                {"name": "Miku", "is_me": True, "amount": "50"},
                {"name": "Alex", "is_me": False, "amount": "50"},
            ],
        }, self.user)
        bill = share_bill(bill.pk)
        response = self.client.post(f"/api/v1/finance/shared-bills/{bill.pk}/pin/", {}, format="json")
        self.assertEqual(response.status_code, 200)
        row = AuditEvent.objects.get()
        self.assertEqual(row.action, "rotated")
        self.assertEqual(row.changes, [])
        self.assertNotIn(response.data["edit_pin"], str(row.changes))
