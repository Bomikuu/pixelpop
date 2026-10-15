from decimal import Decimal
from django.test import TestCase
from finance.services.subscriptions.forecasts import forecast_obligations
from finance.services.subscriptions.summaries import monthly_equivalent
from .subscription_fixtures import SubscriptionFixturesMixin


class ForecastTests(SubscriptionFixturesMixin, TestCase):
    def test_normalization_does_not_duplicate_actual_obligations(self):
        service, schedule, _, _ = self.make_service(amount=Decimal("1200"), frequency="weekly")
        self.assertEqual(monthly_equivalent(schedule, schedule.amount), Decimal("5200.00"))
        service.archived = True
        service.save()
        result = forecast_obligations(self.day, self.day)
        self.assertEqual(len(result["rows"]), 1)
        self.assertEqual(result["total"], Decimal("1200"))
