from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from finance import models
from finance.services.subscriptions.exports import export_subscriptions
from .subscription_fixtures import SubscriptionFixturesMixin


class ReminderExportTests(SubscriptionFixturesMixin, TestCase):
    def test_service_claim_does_not_acknowledge_checklist(self):
        checklist = models.ReminderDelivery.objects.create(user=self.user, checklist_date=self.day, phase="start", slot_key="checklist")
        alert = models.ReminderDelivery.objects.create(user=self.user, checklist_date=self.day, phase="service", kind="subscription", slot_key="service", payload={"message": "Read the meter", "destination": "/dashboard/bills/subscriptions/1"})
        client = APIClient()
        client.force_authenticate(self.user)
        response = client.post(f"/api/v1/finance/reminders/deliveries/{alert.pk}/claim/", {}, format="json")
        self.assertEqual(response.data["kind"], "subscription")
        checklist.refresh_from_db()
        self.assertIsNone(checklist.acknowledged_at)

    def test_csv_neutralizes_formula_text(self):
        service, schedule, _, _ = self.make_service()
        schedule.title = "=HYPERLINK(1)"
        schedule.save()
        response = export_subscriptions("catalog", {}, service.pk)
        self.assertIn("'=HYPERLINK(1)", response.content.decode())
