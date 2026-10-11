from datetime import date
from decimal import Decimal

from django.test import SimpleTestCase
from rest_framework.exceptions import ValidationError

from finance.services.cash_loans.calculations import calculate_loan, compare_terms, due_date


def terms(**changes):
    return {"loan_amount": "50000", "rate": "0.79", "term_months": 12, "fee_value": "350", "fee_treatment": "separate", "loan_date": "2026-10-12", "first_payment_date": "2026-11-12", **changes}


class CashLoanCalculationTests(SimpleTestCase):
    def test_add_on_exact_totals_and_final_rounding(self):
        q = calculate_loan(terms())
        for key, expected in {"total_interest": "4740.00", "installment_total": "54740.00", "total_cash_outlay": "55090.00", "regular_payment": "4561.67", "final_payment": "4561.63"}.items():
            self.assertEqual(q[key], Decimal(expected))
        self.assertEqual(sum(r["principal"] for r in q["schedule"]), Decimal("50000"))
        self.assertEqual(q["schedule"][-1]["remaining_principal"], Decimal("0"))

    def test_dates_keep_original_anchor_and_leap_year(self):
        self.assertEqual(due_date(date(2028, 1, 31), 1), date(2028, 2, 29))
        self.assertEqual(due_date(date(2028, 1, 31), 2), date(2028, 3, 31))

    def test_zero_and_nominal_annual(self):
        q = calculate_loan(terms(rate="0", interest_method="diminishing"))
        self.assertEqual(q["total_interest"], 0)
        self.assertEqual(q["installment_total"], 50000)
        self.assertEqual(calculate_loan(terms(rate="12", rate_period="annual_nominal")), calculate_loan(terms(rate="1")))

    def test_fees_and_charges(self):
        self.assertEqual(calculate_loan(terms(fee_treatment="upfront"))["net_cash_received"], 49650)
        q = calculate_loan(terms(fee_treatment="financed", monthly_charge="10"))
        self.assertEqual(q["financed_principal"], 50350)
        self.assertEqual(q["total_charges"], 120)
        self.assertEqual(q["borrowing_cost"], q["total_cash_outlay"] - Decimal("50000"))
        self.assertEqual(calculate_loan(terms(fee_kind="percentage", fee_value="1"))["processing_fee"], 500)

    def test_diminishing_and_compare(self):
        data = terms(interest_method="diminishing")
        q = calculate_loan(data)
        self.assertEqual(sum(r["principal"] for r in q["schedule"]), 50000)
        self.assertEqual(q["total_interest"], sum(r["interest"] for r in q["schedule"]))
        self.assertGreater(q["schedule"][0]["interest"], q["schedule"][-1]["interest"])
        self.assertEqual(len(compare_terms(data, [6, 12, 24])), 3)
        self.assertEqual(data["term_months"], 12)

    def test_invalid_and_tiny_inputs_fail_cleanly(self):
        for changes in ({"rate": "NaN"}, {"loan_amount": "0"}, {"term_months": "1.5"}, {"loan_amount": "0.01", "term_months": 60}, {"fee_treatment": "upfront", "fee_value": "50000"}, {"first_payment_date": "2026-01-01"}):
            with self.subTest(changes=changes), self.assertRaises(ValidationError):
                calculate_loan(terms(**changes))
