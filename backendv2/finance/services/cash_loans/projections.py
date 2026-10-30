"""Read models, stable obligations and payment candidates."""

from datetime import date
from decimal import Decimal

from django.db.models import Prefetch, Q, Sum
from django.utils import timezone

from finance.models import CashLoan, CashLoanAllocation, CashLoanInstallment, Deadline, MoneyMovement
from finance.services.balances import ZERO, today
from finance.services.queries import month_range
from .ledger import fee_remaining, installments_as_of, json_values, paid_allocations, remaining_components, total


def installment_data(item, day=None):
    day = day or today()
    remaining = remaining_components(item, day)
    due = sum(remaining.values(), ZERO)
    expected = item.principal + item.interest + item.fees
    allocated = [row for row in item.allocations.all() if row.movement.date <= day and (row.reversed_on is None or row.reversed_on > day)]
    posted = {key: sum((getattr(row, key) for row in item.postings.all() if row.date <= day), ZERO) for key in ("interest", "fees")}
    adjusted = {key: sum((getattr(row, key) for row in item.adjustments.all() if row.date <= day), ZERO) for key in ("interest", "fees")}
    unposted = {key: max(ZERO, getattr(item, key) - adjusted[key] - max(ZERO, posted[key])) for key in ("interest", "fees")}
    return {"id": item.pk, "index": item.index, "due_date": item.due_date, "principal": item.principal, "interest": item.interest, "charges": item.fees, "payment": expected, "remaining_principal": item.remaining_principal, "remaining": remaining, "remaining_due": due, "paid_amount": sum((a.principal + a.interest + a.fees for a in allocated), ZERO), "unposted": unposted, "statement_id": item.statement_id, "deadline_id": item.deadline_id, "status": "paid" if due == ZERO else "overdue" if item.due_date < day else "partially_paid" if due < expected else "pending", "allocations": [{"id": a.pk, "movement_id": a.movement_id, "date": a.movement.date, "amount": a.principal + a.interest + a.fees, "principal": a.principal, "interest": a.interest, "fees": a.fees} for a in allocated]}


def materialize_cash_loan_deadlines(loan_id):
    loan = CashLoan.objects.get(pk=loan_id)
    for item in loan.installments.select_related("deadline").all():
        remaining = sum(remaining_components(item).values(), ZERO)
        completed = loan.cancelled or not item.active or remaining == ZERO
        defaults = {"title": f"{loan.name} · installment {item.index}", "kind": "payment", "amount": item.principal + item.interest + item.fees, "due_date": item.due_date, "credit_card": loan.card, "cash_loan": loan, "status": "paid" if completed else "pending", "completed_at": timezone.now() if completed else None, "notes": "Pay or allocate a recorded card payment from this cash loan."}
        if item.deadline_id:
            for key, value in defaults.items():
                setattr(item.deadline, key, value)
            item.deadline.save(update_fields=list(defaults))
        else:
            item.deadline = Deadline.objects.create(**defaults, created_by=loan.created_by)
            item.save(update_fields=["deadline"])


def loan_detail(loan_id, month=None, compact=False, include_history=False):
    loan = CashLoan.objects.select_related("card", "receiving_account").get(pk=loan_id)
    schedule = loan.schedules.order_by("-version").first()
    original = loan.schedules.order_by("version").first()
    items = loan.installments.filter(active=True).order_by("due_date", "index", "id").prefetch_related(Prefetch("allocations", queryset=CashLoanAllocation.objects.select_related("movement")), "postings", "adjustments")
    rows = [installment_data(item) for item in items]
    remaining = {key: sum((row["remaining"][key] for row in rows), ZERO) for key in ("principal", "interest", "fees")}
    remaining_fee = fee_remaining(loan)
    remaining["fees"] += remaining_fee
    total_remaining = sum(remaining.values(), ZERO)
    upcoming = next((row for row in rows if row["remaining_due"] > ZERO), None)
    status = "cancelled" if loan.cancelled else "fully_paid" if total_remaining == ZERO else "overdue" if any(row["status"] == "overdue" for row in rows) else "active"
    if compact:
        return json_values({"id": loan.pk, "name": loan.name, "card_id": loan.card_id, "version": loan.version, "status": status, "remaining": remaining, "remaining_total": total_remaining, "quote": {key: value for key, value in schedule.quote.items() if key != "schedule"}, "original_quote": {key: value for key, value in original.quote.items() if key != "schedule"}, "next_installment": upcoming, "paid_installments": sum(row["status"] == "paid" for row in rows), "total_installments": len(rows)})
    versions = [{"version": s.version, "effective_date": s.effective_date, "terms": s.terms, "quote": s.quote} for s in loan.schedules.order_by("version")]
    return json_values({"id": loan.pk, "name": loan.name, "card_id": loan.card_id, "card_name": loan.card.name, "receiving_account_id": loan.receiving_account_id, "receiving_account_name": loan.receiving_account.name, "version": loan.version, "status": status, "terms": schedule.terms, "original_terms": loan.terms, "quote": schedule.quote, "original_quote": original.quote, "remaining": remaining, "remaining_total": total_remaining, "separate_fee_remaining": remaining_fee, "paid_installments": sum(row["status"] == "paid" for row in rows), "total_installments": len(rows), "next_installment": upcoming, "schedule": rows, "transactions": loan_history(loan_id, month) if include_history else [], "schedule_history": versions})


def loan_history(loan_id, month=None):
    loan = CashLoan.objects.select_related("card").get(pk=loan_id)
    posting_rows = loan.postings.select_related("account")
    adjustment_rows = loan.adjustments.all()
    movements = MoneyMovement.objects.filter(cash_loan_allocations__loan=loan).distinct().select_related("source", "destination")
    if month:
        start, end = month_range(month)
        posting_rows = posting_rows.filter(date__range=(start, end))
        adjustment_rows = adjustment_rows.filter(date__range=(start, end))
        movements = movements.filter(date__range=(start, end))
    movements = movements.prefetch_related(Prefetch("cash_loan_allocations", queryset=CashLoanAllocation.objects.filter(loan=loan, reversed_on__isnull=True), to_attr="loan_history_allocations"))
    postings = [{"id": "posting-" + str(row.pk), "date": row.date, "kind": row.kind, "name": loan.name + " · " + row.kind.replace("_", " "), "amount": abs(row.effect), "effect": row.effect, "account_name": row.account.name, "notes": row.notes} for row in posting_rows.order_by("-date", "-pk")]
    payments = []
    for row in movements:
        allocations = row.loan_history_allocations
        allocated = sum((a.principal + a.interest + a.fees for a in allocations), ZERO)
        payments.append({"id": "movement-" + str(row.pk), "movement_id": row.pk, "date": row.date, "kind": "credit_card_payment", "name": "Card payment · " + (row.source.name if row.source else ""), "amount": row.amount, "allocated_to_loan": allocated, "effect": -row.amount, "account_name": loan.card.name, "notes": "Card movement shown once; allocations do not deduct cash again.", "allocations": [{"id": a.pk, "installment_id": a.installment_id, "principal": a.principal, "interest": a.interest, "fees": a.fees} for a in allocations]})
    adjustments = [{"id": "adjustment-" + str(row.pk), "date": row.date, "kind": "adjustment", "name": "Lender adjustment", "amount": row.principal + row.interest + row.fees, "notes": row.notes} for row in adjustment_rows.order_by("-date", "-pk")]
    return json_values(sorted(postings + payments + adjustments, key=lambda r: (str(r["date"]), str(r["id"])), reverse=True))


def loan_cards(card_id):
    return [loan_detail(pk) for pk in CashLoan.objects.filter(card_id=card_id).order_by("-pk").values_list("pk", flat=True)]


def payment_candidates(card_id):
    rows = []
    for movement in MoneyMovement.objects.filter(kind="credit_card_payment", destination_id=card_id).select_related("source").order_by("-date", "-pk"):
        allocated = paid_allocations(movement.cash_loan_allocations)
        used = total(allocated, "principal") + total(allocated, "interest") + total(allocated, "fees")
        left = movement.amount - used
        if left > ZERO:
            rows.append({"id": movement.pk, "date": movement.date, "amount": movement.amount, "allocated": used, "available": left, "source_name": movement.source.name if movement.source else "Recorded payment"})
    return json_values(rows)


def loan_financial_summary(as_of=None, start=None, end=None):
    day = as_of or today()
    result = {"principal": ZERO, "remaining_interest": ZERO, "remaining_payments": ZERO}
    result.update(scheduled=ZERO, repayments=ZERO, borrowing_costs=ZERO)
    for loan in CashLoan.objects.all():
        if date.fromisoformat(loan.terms["loan_date"]) > day:
            continue
        items, _ = installments_as_of(loan, day)
        items = items.select_related("statement").prefetch_related(Prefetch("allocations", queryset=CashLoanAllocation.objects.select_related("movement")), "adjustments")
        for item in items:
            remaining = remaining_components(item, day)
            result["principal"] += remaining["principal"]
            result["remaining_interest"] += remaining["interest"]
            result["remaining_payments"] += sum(remaining.values(), ZERO)
            if start and end and start <= item.due_date <= end and (not item.statement_id or item.statement.status != "pending"):
                result["scheduled"] += sum(remaining.values(), ZERO)
        result["remaining_payments"] += fee_remaining(loan, day)
        if start and end:
            allocations = paid_allocations(loan.allocations, day).filter(movement__date__range=(start, end))
            paid = allocations.aggregate(principal_total=Sum("principal"), interest_total=Sum("interest"), fees_total=Sum("fees"))
            result["repayments"] += sum((value or ZERO for value in paid.values()), ZERO)
            postings = loan.postings.filter(date__range=(start, min(end, day)))
            costs = postings.aggregate(interest_total=Sum("interest"), fees_total=Sum("fees"))
            result["borrowing_costs"] += sum((value or ZERO for value in costs.values()), ZERO)
    return result
