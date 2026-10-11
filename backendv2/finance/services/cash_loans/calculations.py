"""Read-only contractual estimates; all arithmetic stays in Decimal."""

import calendar
from datetime import date
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP, localcontext

from rest_framework.exceptions import ValidationError

ZERO = Decimal("0.00")
CENT = Decimal("0.01")
MAX_MONEY = Decimal("1000000000000")


def cents(value):
    return value.quantize(CENT, rounding=ROUND_HALF_UP)


def number(value, field, positive=False, places=2):
    try:
        result = Decimal(str(value))
        if not result.is_finite() or result < 0 or (positive and result == 0) or result >= MAX_MONEY or result.as_tuple().exponent < -places:
            raise InvalidOperation
        return result
    except (InvalidOperation, ValueError, TypeError):
        raise ValidationError({field: f"Enter a {'positive' if positive else 'nonnegative'} number with at most {places} decimal places."})


def choice(data, key, values, default):
    value = data.get(key, default)
    if value not in values:
        raise ValidationError({key: "Choose a supported option."})
    return value


def due_date(anchor, offset):
    year, month = divmod(anchor.year * 12 + anchor.month - 1 + offset, 12)
    if not 1 <= year <= 9999:
        raise ValidationError({"term_months": "The schedule exceeds the supported calendar."})
    return date(year, month + 1, min(anchor.day, calendar.monthrange(year, month + 1)[1]))


def calculate_loan(terms):
    principal = number(terms.get("loan_amount"), "loan_amount", positive=True)
    rate = number(terms.get("rate", "0"), "rate", places=6)
    rate_period = choice(terms, "rate_period", ("monthly", "annual_nominal"), "monthly")
    method = choice(terms, "interest_method", ("add_on", "diminishing"), "add_on")
    fee_kind = choice(terms, "fee_kind", ("fixed", "percentage"), "fixed")
    treatment = choice(terms, "fee_treatment", ("upfront", "separate", "financed"), "separate")
    policy = choice(terms, "credit_policy", ("principal", "full_installments"), "principal")
    fee_value = number(terms.get("fee_value", "0"), "fee_value", places=4 if fee_kind == "percentage" else 2)
    charge = number(terms.get("monthly_charge", "0"), "monthly_charge")
    try:
        raw_months = str(terms.get("term_months", ""))
        months = int(raw_months)
        if str(months) != raw_months or not 1 <= months <= 1200:
            raise ValueError
    except (ValueError, TypeError):
        raise ValidationError({"term_months": "Enter a whole number from 1 to 1,200 months."})
    dates = {}
    for field in ("loan_date", "first_payment_date"):
        try:
            dates[field] = date.fromisoformat(str(terms.get(field)))
        except (ValueError, TypeError):
            raise ValidationError({field: "Enter a valid date."})
    if dates["first_payment_date"] < dates["loan_date"]:
        raise ValidationError({"first_payment_date": "First payment cannot precede loan release."})
    with localcontext() as context:
        context.prec = 48
        try:
            fee = cents(principal * fee_value / 100) if fee_kind == "percentage" else cents(fee_value)
            net = principal - fee if treatment == "upfront" else principal
            if net <= 0:
                raise ValidationError({"fee_value": "The upfront fee must leave positive cash proceeds."})
            financed = principal + fee if treatment == "financed" else principal
            periodic = rate / 100 / (12 if rate_period == "annual_nominal" else 1)
            contractual_interest = cents(financed * periodic * months) if method == "add_on" else ZERO
            if method == "add_on" or periodic == 0:
                principal_part = cents(financed / months)
                interest_part = cents(contractual_interest / months)
                regular_base = principal_part + interest_part
            else:
                growth = (1 + periodic) ** months
                regular_base = cents(financed * periodic * growth / (growth - 1))
            remaining = financed
            principal_used = interest_used = ZERO
            rows = []
            for index in range(months):
                last = index == months - 1
                if method == "add_on":
                    interest = contractual_interest - interest_used if last else interest_part
                    payment_principal = financed - principal_used if last else principal_part
                else:
                    interest = cents(remaining * periodic)
                    payment_principal = remaining if last else regular_base - interest
                if payment_principal <= 0 or payment_principal > remaining or interest < 0:
                    raise ValidationError({"term_months": "This amount, rate and term cannot produce positive cent-rounded installments. Use a shorter term or verify the rate."})
                remaining = cents(remaining - payment_principal)
                principal_used += payment_principal
                interest_used += interest
                payment = payment_principal + interest + charge
                rows.append({"index": index + 1, "due_date": due_date(dates["first_payment_date"], index), "principal": payment_principal, "interest": interest, "charges": charge, "payment": payment, "remaining_principal": remaining})
            installment_total = sum((row["payment"] for row in rows), ZERO)
            outlay = installment_total + (fee if treatment in ("upfront", "separate") else ZERO)
            if max(financed, outlay, installment_total) >= MAX_MONEY:
                raise ValidationError({"loan_amount": "The repayment total exceeds the supported monetary range."})
            return {
                "financed_principal": cents(financed), "net_cash_received": cents(net), "processing_fee": fee,
                "total_interest": interest_used, "total_charges": charge * months,
                "regular_payment": rows[0]["payment"], "final_payment": rows[-1]["payment"],
                "installment_total": installment_total, "total_cash_outlay": outlay,
                "borrowing_cost": interest_used + fee + charge * months,
                "additional_reservation": interest_used + charge * months if policy == "full_installments" else ZERO,
                "schedule": rows,
            }
        except (InvalidOperation, OverflowError):
            raise ValidationError({"rate": "These terms exceed the supported calculation range."})


def compare_terms(terms, months):
    if not isinstance(months, list) or not 1 <= len(months) <= 12:
        raise ValidationError({"months": "Compare between 1 and 12 terms."})
    return [{"term_months": term, **calculate_loan({**terms, "term_months": term})} for term in months]
