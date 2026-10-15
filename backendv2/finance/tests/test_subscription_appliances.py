from datetime import date
from decimal import Decimal
from django.test import TestCase
from rest_framework.exceptions import ValidationError
from finance.services.subscriptions.appliances import estimate_appliances
from .subscription_fixtures import SubscriptionFixturesMixin


class ApplianceTests(SubscriptionFixturesMixin, TestCase):
    def test_estimate_is_not_a_reading_or_expense(self):
        service, _, _, cycle = self.make_service(variable=True)
        cycle.period_start, cycle.period_end = date(2025, 1, 1), date(2025, 1, 31)
        cycle.save()
        draft = {"name": "Device", "watts": "1000", "hours_per_day": "8", "days_used": 30, "quantity": 1}
        result = estimate_appliances(service.pk, cycle.pk, [draft])
        self.assertEqual(result["cycle_kwh"], Decimal("240.000000"))
        self.assertFalse(service.meters.exists())
        with self.assertRaises(ValidationError):
            estimate_appliances(service.pk, cycle.pk, [{**draft, "hours_per_day": "25"}])
