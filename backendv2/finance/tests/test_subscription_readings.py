import uuid
from datetime import datetime, timedelta
from decimal import Decimal
from django.test import TestCase
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from finance.services.subscriptions.common import MANILA
from finance.services.subscriptions.readings import save_meter, save_reading, reading_intervals, record_meter_event
from .subscription_fixtures import SubscriptionFixturesMixin


class ReadingTests(SubscriptionFixturesMixin, TestCase):
    def test_intervals_and_duplicate_timestamp(self):
        service, _, _, _ = self.make_service(variable=True)
        meter = save_meter(service.pk, {"name": "Main", "unit": "kWh"}, self.user)
        start = datetime(2025, 1, 1, tzinfo=MANILA)
        for day, value in ((0, "12500"), (4, "12535"), (9, "12585"), (14, "12640")):
            data = {"recorded_at": start + timedelta(days=day), "value": value, "request_id": uuid.uuid4()}
            row = save_reading(meter.pk, data, self.user)
            self.assertEqual(save_reading(meter.pk, data, self.user).pk, row.pk)
        self.assertEqual([r["usage"] for r in reading_intervals(meter.pk)], [Decimal(35), Decimal(50), Decimal(55)])
        with self.assertRaises(ValidationError):
            save_reading(meter.pk, {"recorded_at": start, "value": "1", "request_id": uuid.uuid4()}, self.user)
        with self.assertRaises(ValidationError):
            save_reading(meter.pk, {"recorded_at": timezone.now() + timedelta(days=1), "value": "99999", "request_id": uuid.uuid4()}, self.user)

    def test_explicit_rollover_and_same_day_readings(self):
        service, _, _, _ = self.make_service(variable=True)
        meter = save_meter(service.pk, {"name": "Main", "unit": "kWh", "rollover_modulus": "1000"}, self.user)
        start = datetime(2025, 1, 1, tzinfo=MANILA)
        save_reading(meter.pk, {"recorded_at": start, "value": "990", "request_id": uuid.uuid4()}, self.user)
        record_meter_event(meter.pk, {"kind": "rollover", "occurred_at": start + timedelta(hours=1), "before_value": "1000", "after_value": "0", "request_id": uuid.uuid4()}, self.user)
        save_reading(meter.pk, {"recorded_at": start + timedelta(hours=2), "value": "10", "request_id": uuid.uuid4()}, self.user)
        self.assertEqual(reading_intervals(meter.pk)[0]["usage"], Decimal(20))
