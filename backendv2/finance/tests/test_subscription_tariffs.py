from decimal import Decimal
from django.test import SimpleTestCase
from rest_framework.exceptions import ValidationError
from finance.services.subscriptions.tariffs import calculate_tariff, usage_allowance


class TariffTests(SimpleTestCase):
    def test_flat_tiered_and_fee_rounding(self):
        self.assertEqual(calculate_tariff("35", {"flat_rate": "11"})["total"], Decimal("385.00"))
        self.assertEqual(calculate_tariff("15", {"tiers": [{"up_to": "10", "rate": "5"}, {"up_to": None, "rate": "8"}]})["total"], Decimal("90.00"))
        config = {"flat_rate": "11", "charges": [{"name": "Service", "kind": "fixed", "amount": "100"}, {"name": "Tax", "kind": "percent", "amount": "10", "base": "subtotal"}]}
        self.assertEqual(calculate_tariff("100", config)["total"], Decimal("1320.00"))
        self.assertEqual(calculate_tariff("100", config, usage_only=True)["total"], Decimal("1100.00"))

    def test_allowance_is_feasible_and_unknown_is_not_zero(self):
        self.assertIsNone(calculate_tariff("0", {})["total"])
        config = {"flat_rate": "11", "charges": [{"name": "Fee", "kind": "fixed", "amount": "100"}]}
        self.assertEqual(usage_allowance("50", config)["reason"], "fees_exceed_budget")
        allowance = usage_allowance("3000", config)["usage_limit"]
        self.assertLessEqual(calculate_tariff(allowance, config)["total"], Decimal("3000"))
        self.assertIsNone(usage_allowance("3000", {"flat_rate": "0"})["usage_limit"])
        for invalid in ("NaN", "Infinity", "-1", "1.0000001"):
            with self.assertRaises(ValidationError):
                calculate_tariff(invalid, {"flat_rate": "11"})
