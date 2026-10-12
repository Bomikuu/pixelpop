"""Lender-driven amendments and settlements, preserving the original contract."""

import uuid
from datetime import date

from rest_framework.exceptions import ValidationError

from finance.models import CashLoan, CashLoanAdjustment, CashLoanInstallment
from finance.services.balances import ZERO, today
from finance.services.settlements import action_date
from .calculations import calculate_loan, number
from .ledger import add_posting, add_schedule, fee_remaining, json_values, lock_accounts, operation, paid_allocations, post_installment_charges, record_event, remaining_components, total
from .payments import allocate_payment
from .projections import loan_detail, materialize_cash_loan_deadlines


def preview_settlement(loan_id, data):
    loan = CashLoan.objects.get(pk=loan_id)
    if loan.cancelled:
        raise ValidationError("This loan is cancelled.")
    detail = loan_detail(loan_id)
    remaining = {key: number(value, key) for key, value in detail["remaining"].items()}
    interest = number(data.get("settlement_interest", remaining["interest"]), "settlement_interest")
    fees = number(data.get("settlement_fees", remaining["fees"]), "settlement_fees")
    early_fee = number(data.get("early_fee", "0"), "early_fee")
    if interest > remaining["interest"] or fees > remaining["fees"]:
        raise ValidationError({"settlement_interest": "Use the separate early-settlement fee for additional lender charges."})
    payment = remaining["principal"] + interest + fees + early_fee
    if payment <= 0:
        raise ValidationError("This loan has no remaining obligation.")
    if data.get("settlement_amount") is not None and number(data["settlement_amount"], "settlement_amount") != payment:
        raise ValidationError({"settlement_amount": "The lender amount must equal remaining principal plus settlement interest, fees and early-settlement fee."})
    posted_unpaid = sum((max(ZERO, number(row["remaining"][key], key) - number(row["unposted"][key], key)) for row in detail["schedule"] for key in ("interest", "fees")), ZERO)
    separate_posted = total(loan.postings.filter(kind__in=("processing_fee", "rebate"), installment__isnull=True, account=loan.card), "fees") - total(paid_allocations(loan.allocations.filter(installment__isnull=True)), "fees")
    posted_unpaid += min(number(detail["separate_fee_remaining"], "fees"), max(ZERO, separate_posted))
    released_reservation = sum((number(row["unposted"][key], key) for row in detail["schedule"] for key in ("interest", "fees")), ZERO) if detail["terms"].get("credit_policy") == "full_installments" else ZERO
    return json_values({"principal": remaining["principal"], "interest": interest, "fees": fees, "early_fee": early_fee, "payment": payment, "scheduled_remaining": detail["remaining_total"], "interest_rebate": remaining["interest"] - interest, "fee_rebate": remaining["fees"] - fees, "difference": number(detail["remaining_total"], "remaining") - payment, "card_debt_change": -remaining["principal"] - posted_unpaid, "reservation_change": -released_reservation})


def waive_component(loan, key, value, day, actor):
    for item in loan.installments.filter(active=True).order_by("-due_date", "-id"):
        if value <= ZERO:
            break
        remaining = remaining_components(item)
        waived = min(value, remaining[key])
        if waived <= 0:
            continue
        posted = total(item.postings.all(), key)
        paid = total(paid_allocations(item.allocations), key)
        posted_outstanding = max(ZERO, posted - paid)
        unposted = max(ZERO, remaining[key] - posted_outstanding)
        posted_rebate = max(ZERO, waived - unposted)
        CashLoanAdjustment.objects.create(loan=loan, installment=item, date=day, notes="Lender-confirmed settlement rebate", created_by=actor, **{key: waived})
        if posted_rebate:
            add_posting(loan, loan.card, day, "rebate", -posted_rebate, actor, installment=item, notes="Reversal of posted borrowing cost", **{key: -posted_rebate})
        value -= waived
    if key == "fees" and value > 0:
        waived = min(value, fee_remaining(loan))
        posted = total(loan.postings.filter(kind="processing_fee", account=loan.card), "fees")
        paid = total(paid_allocations(loan.allocations.filter(installment__isnull=True)), "fees")
        rebate = min(waived, max(ZERO, posted - paid))
        CashLoanAdjustment.objects.create(loan=loan, date=day, fees=waived, notes="Lender-confirmed processing-fee waiver", created_by=actor)
        if rebate:
            add_posting(loan, loan.card, day, "rebate", -rebate, actor, fees=-rebate, notes="Processing-fee rebate")
        value -= waived
    if value > 0:
        raise ValidationError("The rebate exceeds remaining obligations.")


def settle_cash_loan(loan_id, data, actor, cancelled=False):
    def settle():
        loan = CashLoan.objects.get(pk=loan_id)
        lock_accounts([loan.card_id, data.get("source_account_id")])
        loan = CashLoan.objects.select_for_update().get(pk=loan_id)
        if int(data.get("version", loan.version)) != loan.version:
            raise ValidationError({"version": "The loan changed. Refresh before settling."})
        day = action_date(data.get("date"))
        latest_payment = loan.allocations.order_by("-movement__date").first()
        if day < date.fromisoformat(loan.terms["loan_date"]) or (latest_payment and day < latest_payment.movement.date):
            raise ValidationError({"date": "Settlement must follow the release and recorded payments."})
        if loan.postings.filter(date__gt=day).exists() or loan.adjustments.filter(date__gt=day).exists():
            raise ValidationError({"date": "Settlement must follow all recorded loan postings and adjustments."})
        quote = preview_settlement(loan_id, data)
        waive_component(loan, "interest", number(quote["interest_rebate"], "interest"), day, actor)
        waive_component(loan, "fees", number(quote["fee_rebate"], "fees"), day, actor)
        early_fee = number(quote["early_fee"], "early_fee")
        if early_fee:
            schedule = loan.schedules.order_by("-version").first()
            index = (loan.installments.order_by("-index").first().index if loan.installments.exists() else 0) + 1
            CashLoanInstallment.objects.create(loan=loan, schedule=schedule, index=index, due_date=day, principal=ZERO, interest=ZERO, fees=early_fee, remaining_principal=ZERO, created_by=actor)
        allocations = []
        for item in loan.installments.filter(active=True).select_related("loan__card"):
            remaining = remaining_components(item)
            if sum(remaining.values()) <= 0:
                continue
            post = {}
            for key in ("interest", "fees"):
                posted = total(item.postings.all(), key)
                adjusted = total(item.adjustments.all(), key)
                amount = max(ZERO, getattr(item, key) - adjusted - max(ZERO, posted))
                post[key] = str(amount)
            if sum(number(v, k) for k, v in post.items()) > 0:
                post_installment_charges(item, day, actor, post)
            allocations.append({"installment_id": item.pk, **{key: str(value) for key, value in remaining.items()}})
        separate = fee_remaining(loan)
        if separate:
            posted = total(loan.postings.filter(installment__isnull=True, account=loan.card), "fees")
            paid = total(paid_allocations(loan.allocations.filter(installment__isnull=True)), "fees")
            unposted = max(ZERO, separate - max(ZERO, posted - paid))
            if unposted:
                add_posting(loan, loan.card, day, "processing_fee", unposted, actor, fees=unposted)
            allocations.append({"installment_id": None, "principal": "0", "interest": "0", "fees": str(separate)})
        payment = {"loan_id": loan.pk, "source_account_id": data.get("source_account_id"), "amount": quote["payment"], "date": str(day), "allocations": allocations, "request_id": str(uuid.uuid5(uuid.NAMESPACE_URL, "cash-settlement:" + str(data["request_id"])))}
        if data.get("movement_id"):
            payment["movement_id"] = data["movement_id"]
            movement = loan.card.incoming.filter(pk=data["movement_id"], kind="credit_card_payment").first()
            if not movement:
                raise ValidationError({"movement_id": "Choose an existing payment on this card."})
            movement_day = movement.date
            if movement_day != day:
                raise ValidationError({"date": "Use the original card-payment date when linking settlement."})
        result = allocate_payment(payment, actor)
        loan.refresh_from_db(fields=["version"])
        loan.version += 1
        loan.cancelled = cancelled
        loan.save(update_fields=["version", "cancelled", "updated_at"])
        materialize_cash_loan_deadlines(loan.pk)
        record_event(loan, actor, "closed" if cancelled else "settled", quote, f"cash-settle:{data['request_id']}")
        return {"loan_id": loan.pk, "movement_id": result["movement_id"]}
    return operation({**data, "loan_id": loan_id}, "cancel" if cancelled else "settle", actor, settle)


def cancel_cash_loan(loan_id, data, actor):
    # A released loan can only be cancelled after explicit lender reconciliation.
    return settle_cash_loan(loan_id, data, actor, cancelled=True)


def amend_cash_loan(loan_id, data, actor):
    def amend():
        loan = CashLoan.objects.get(pk=loan_id)
        lock_accounts([loan.card_id])
        loan = CashLoan.objects.select_for_update().get(pk=loan_id)
        if loan.cancelled or int(data.get("version", 0)) != loan.version:
            raise ValidationError({"version": "The loan changed or is cancelled. Refresh before amending."})
        day = action_date(data.get("effective_date"))
        unpaid = []
        for item in loan.installments.filter(active=True):
            remaining = remaining_components(item)
            if sum(remaining.values()) > 0:
                if item.due_date < day or item.postings.exists() or item.allocations.filter(reversed_on__isnull=True).exists():
                    raise ValidationError({"effective_date": "Resolve overdue, posted or partially paid installments before replacing future terms."})
                unpaid.append(item)
        principal = sum((remaining_components(item)["principal"] for item in unpaid), ZERO)
        if principal <= 0:
            raise ValidationError("There is no unpaid future principal to re-amortize.")
        if day < date.fromisoformat(loan.terms["loan_date"]) or loan.postings.filter(date__gt=day).exists() or loan.allocations.filter(movement__date__gt=day).exists() or loan.adjustments.filter(date__gt=day).exists():
            raise ValidationError({"effective_date": "Amendment must follow recorded loan history."})
        current = loan.schedules.order_by("-version").first().terms
        terms = {**current, **{key: data[key] for key in ("rate", "rate_period", "interest_method", "term_months", "monthly_charge", "first_payment_date", "credit_policy") if key in data}, "loan_amount": str(principal), "fee_value": "0", "fee_kind": "fixed", "fee_treatment": "separate", "loan_date": str(day)}
        quote = calculate_loan(terms)
        offset = loan.installments.filter(active=True).count() - len(unpaid)
        for item in unpaid:
            item.active = False
            item.save(update_fields=["active"])
        loan.version += 1
        loan.save(update_fields=["version", "updated_at"])
        add_schedule(loan, terms, quote, day, actor, offset)
        from finance.services.balances import ensure_account_capacity
        ensure_account_capacity(loan.card, day, "credit_policy")
        materialize_cash_loan_deadlines(loan.pk)
        record_event(loan, actor, "adjusted", {"schedule_version": loan.version, "principal": principal, "rate": terms["rate"]}, f"cash-amend:{data['request_id']}")
        return {"loan_id": loan.pk}
    return operation({**data, "loan_id": loan_id}, "amend", actor, amend)
