from datetime import date, datetime
from decimal import Decimal
from django.test import TestCase
from finance import models
from finance.services.subscriptions.common import MANILA
from finance.services.subscriptions.predictions import predict_cycle
from finance.services.subscriptions.cycles import confirm_cycle
from finance.services.subscriptions.payments import pay_cycle
from finance.services.subscriptions.readings import save_reading
import uuid
from .subscription_fixtures import SubscriptionFixturesMixin


class PredictionTests(SubscriptionFixturesMixin, TestCase):
    def prepared(self):
        service, _, _, cycle = self.make_service(variable=True)
        tariff = models.UtilityTariff.objects.create(subscription=service, name="Flat", effective_date=date(2025, 1, 1), config={"flat_rate": "11"})
        cycle.period_start, cycle.period_end, cycle.tariff = date(2025, 1, 1), date(2025, 2, 1), tariff
        cycle.save()
        meter = models.Meter.objects.create(subscription=service, name="Main", unit="kWh")
        return service, cycle, meter

    def test_projection_uses_observation_time_not_wall_clock(self):
        _, cycle, meter = self.prepared()
        for day, value in ((1, "12500"), (15, "12640")):
            models.MeterReading.objects.create(meter=meter, recorded_at=datetime(2025, 1, day, tzinfo=MANILA), value=value)
        first = predict_cycle(cycle.pk, as_of=datetime(2025, 1, 15, tzinfo=MANILA))
        later = predict_cycle(cycle.pk, as_of=datetime(2025, 1, 25, tzinfo=MANILA))
        self.assertEqual(first["projected_usage"], Decimal("310.000000"))
        self.assertEqual(first["projected_amount"], Decimal("3410.00"))
        self.assertEqual(later["projected_amount"], first["projected_amount"])
        self.assertEqual(models.PredictionSnapshot.objects.count(), 0)

    def test_midcycle_interval_is_limited_not_false_total(self):
        _, cycle, meter = self.prepared()
        for day, value in ((5, "100"), (10, "150")):
            models.MeterReading.objects.create(meter=meter, recorded_at=datetime(2025, 1, day, tzinfo=MANILA), value=value)
        result = predict_cycle(cycle.pk)
        self.assertEqual(result["projected_usage"], Decimal("310.000000"))
        self.assertTrue(result["limited"])
        self.assertIsNone(result["consumption"]["usage"])

    def test_zero_bill_closes_without_posting_and_freezes_snapshot(self):
        _, cycle, _ = self.prepared()
        confirm_cycle(cycle.pk, "0", self.user, cycle.revision)
        cycle.refresh_from_db()
        self.assertIsNotNone(cycle.final_prediction_id)
        cycle.deadline.refresh_from_db()
        self.assertEqual(cycle.deadline.status, "paid")
        self.assertEqual(models.Transaction.objects.count(), 0)

    def test_correcting_paid_period_keeps_actual_and_frozen_prediction(self):
        _, cycle, meter = self.prepared()
        models.MeterReading.objects.create(meter=meter, recorded_at=datetime(2025, 1, 1, tzinfo=MANILA), value="100")
        last = models.MeterReading.objects.create(meter=meter, recorded_at=datetime(2025, 2, 1, tzinfo=MANILA), value="410")
        confirm_cycle(cycle.pk, "3410", self.user, cycle.revision)
        cycle.refresh_from_db()
        snapshot_id = cycle.final_prediction_id
        pay_cycle(cycle.pk, {"amount": "3410", "account": self.make_cash().pk, "date": self.day,
            "expected_revision": cycle.revision, "request_id": uuid.uuid4()}, self.user)
        save_reading(meter.pk, {"id": last.pk, "recorded_at": last.recorded_at, "value": "420", "note": "Corrected"}, self.user, last.revision)
        cycle.refresh_from_db()
        cycle.deadline.refresh_from_db()
        self.assertEqual(cycle.actual_amount, Decimal("3410"))
        self.assertEqual(cycle.final_prediction_id, snapshot_id)
        self.assertEqual(cycle.deadline.status, "paid")
        self.assertEqual(models.Transaction.objects.count(), 1)
