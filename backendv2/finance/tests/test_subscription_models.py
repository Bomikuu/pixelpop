from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.db.models.deletion import ProtectedError
from django.test import TestCase
from finance import models
from .subscription_fixtures import SubscriptionFixturesMixin


class SubscriptionModelTests(SubscriptionFixturesMixin, TestCase):
    def test_profile_and_deadline_identities_are_unique(self):
        service, schedule, deadline, cycle = self.make_service()
        with self.assertRaises(IntegrityError), transaction.atomic():
            models.Subscription.objects.create(schedule=schedule)
        with self.assertRaises(IntegrityError), transaction.atomic():
            models.SubscriptionCycle.objects.create(subscription=service, deadline=deadline)
        with self.assertRaises(ProtectedError):
            deadline.delete()

    def test_period_boundaries_are_paired_and_ordered(self):
        _, _, _, cycle = self.make_service()
        cycle.period_start = self.day
        with self.assertRaises(ValidationError):
            cycle.full_clean()
        cycle.period_end = self.day
        with self.assertRaises(ValidationError):
            cycle.full_clean()
