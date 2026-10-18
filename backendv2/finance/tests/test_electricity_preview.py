from datetime import date
from decimal import Decimal
from django.test import SimpleTestCase
from rest_framework.exceptions import ValidationError
from rest_framework.test import APITestCase
from finance import models
from finance.services.subscriptions.electricity_preview import electricity_preview
from .subscription_fixtures import SubscriptionFixturesMixin


class ElectricityPreviewTests(SimpleTestCase):
    def test_amount_comparison_and_zero_baseline(self):
        result = electricity_preview({"mode": "bills", "previous_bill": "1500.50", "current_bill": "1200.25"})
        self.assertEqual(result["comparison"]["difference"], Decimal("-300.25"))
        self.assertEqual(result["comparison"]["percent"], Decimal("-20.01"))
        zero = electricity_preview({"mode": "bills", "previous_bill": "0", "current_bill": "500"})
        self.assertIsNone(zero["comparison"]["percent"])

    def test_usage_projection_includes_fees_once(self):
        result = electricity_preview({"mode": "readings", "previous_reading": "11000", "current_reading": "11250",
            "previous_date": date(2025, 10, 1), "reading_date": date(2025, 10, 16), "period_end": date(2025, 10, 31),
            "rate": "11", "fixed_fee": "150", "other_charges": "0", "expected_usage": "500"})
        self.assertEqual(result["usage"], Decimal("250"))
        self.assertEqual(result["projected_usage"], Decimal("500.000000"))
        self.assertEqual(result["current_energy_cost"], Decimal("2750.00"))
        self.assertEqual(result["projected_bill"], Decimal("5650.00"))
        self.assertEqual(result["progress"], Decimal("50"))
        self.assertFalse(result["over_expected"])

    def test_incomplete_input_does_not_invent_a_prediction(self):
        result = electricity_preview({"mode": "readings", "current_reading": "12500"})
        self.assertIn("previous_reading", result["missing"])
        self.assertIsNone(result["usage"])

    def test_negative_consumption_is_rejected(self):
        with self.assertRaises(ValidationError):
            electricity_preview({"mode": "readings", "previous_reading": "100", "current_reading": "90",
                "previous_date": date(2025, 1, 1), "reading_date": date(2025, 1, 10), "period_end": date(2025, 2, 1), "rate": "11"})


class ElectricityPreviewApiTests(SubscriptionFixturesMixin, APITestCase):
    def test_preview_does_not_write_financial_or_meter_records(self):
        service, _, _, _ = self.make_service(variable=True)
        self.client.force_authenticate(self.user)
        monitored = (models.Transaction, models.MeterReading, models.PredictionSnapshot, models.SubscriptionEvent, models.AuditEvent)
        before = [model.objects.count() for model in monitored]
        response = self.client.post(f"/api/v1/finance/subscriptions/{service.pk}/electricity-preview/",
            {"mode": "bills", "previous_bill": "1500.50", "current_bill": "1200.25"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["comparison"]["difference"], "-300.25")
        self.assertEqual([model.objects.count() for model in monitored], before)
