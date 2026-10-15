from rest_framework.test import APITestCase
from finance import models
from .subscription_fixtures import SubscriptionFixturesMixin


class SubscriptionApiTests(SubscriptionFixturesMixin, APITestCase):
    def test_authentication_strict_fields_and_revision_conflict(self):
        service, _, _, _ = self.make_service()
        path = f"/api/v1/finance/subscriptions/{service.pk}/"
        self.assertIn(self.client.get(path).status_code, (401, 403))
        self.client.force_authenticate(self.user)
        self.assertEqual(self.client.post(path, {"currency": "USD"}, format="json").status_code, 400)
        self.assertEqual(self.client.post(path, {"unknown": "value"}, format="json").status_code, 400)
        self.assertEqual(self.client.post(path, {"expected_revision": service.revision + 1, "title": "Stale"}, format="json").status_code, 409)
        self.assertEqual(models.Transaction.objects.count(), 0)

    def test_foreign_cycle_is_not_accepted(self):
        first, _, _, _ = self.make_service()
        _, _, _, foreign = self.make_service()
        self.client.force_authenticate(self.user)
        response = self.client.get(f"/api/v1/finance/subscriptions/{first.pk}/cycles/{foreign.pk}/")
        self.assertEqual(response.status_code, 404)
