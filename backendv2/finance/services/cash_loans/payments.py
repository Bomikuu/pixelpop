"""Explicit allocation of card movements; allocation is never a second payment."""

from datetime import date

from django.utils import timezone
from rest_framework.exceptions import ValidationError

from finance.models import CashLoan, CashLoanAllocation, CashLoanInstallment, MoneyMovement
from finance.services.balances import ZERO, today
from finance.services.settlements import action_date, move_money
from .calculations import number
from .ledger import fee_remaining, lock_accounts, operation, paid_allocations, post_installment_charges, record_event, remaining_components, total
from .projections import materialize_cash_loan_deadlines


def allocate_payment(data, actor):
    def allocate():
        loan = CashLoan.objects.get(pk=data["loan_id"])
        movement = MoneyMovement.objects.filter(pk=data.get("movement_id")).first() if data.get("movement_id") else None
        if data.get("movement_id") and not movement:
            raise ValidationError({"movement_id": "Choose an existing card payment."})
        source_id = movement.source_id if movement else data.get("source_account_id")
        lock_accounts([loan.card_id, source_id])
        if movement:
            movement = MoneyMovement.objects.select_for_update().get(pk=movement.pk)
            if movement.kind != "credit_card_payment" or movement.destination_id != loan.card_id:
                raise ValidationError({"movement_id": "This payment belongs to another card."})
            day = movement.date
        else:
            day = action_date(data.get("date"))
        entries = data.get("allocations", [])
        if not isinstance(entries, list) or not 1 <= len(entries) <= 1200:
            raise ValidationError({"allocations": "Allocate to at least one installment or the separate fee."})
        items = {row.pk: row for row in CashLoanInstallment.objects.filter(pk__in=[e.get("installment_id") for e in entries if e.get("installment_id")]).select_related("loan__card")}
        loan_ids = {loan.pk} | {row.loan_id for row in items.values()}
        locked = {row.pk: row for row in CashLoan.objects.select_for_update().filter(pk__in=sorted(loan_ids)).order_by("pk")}
        if any(row.cancelled or row.card_id != loan.card_id for row in locked.values()):
            raise ValidationError({"allocations": "Choose active loans on the same card."})
        if any(day < date.fromisoformat(row.terms["loan_date"]) for row in locked.values()):
            raise ValidationError({"date": "A payment cannot precede loan release."})
        posting_entries = data.get("postings", [])
        for entry in posting_entries:
            item = items.get(entry.get("installment_id"))
            if not item or not item.active:
                raise ValidationError({"postings": "Post charges only for a selected current installment."})
            post_installment_charges(item, day, actor, entry)
        allocation_total = ZERO
        pending = []
        seen = set()
        for entry in entries:
            item_id = entry.get("installment_id")
            if item_id in seen:
                raise ValidationError({"allocations": "Include each installment only once."})
            seen.add(item_id)
            item = items.get(item_id) if item_id else None
            target_loan = item.loan if item else loan
            if item_id and (not item or not item.active):
                raise ValidationError({"allocations": "Choose a current installment."})
            if item and day < item.schedule.effective_date:
                raise ValidationError({"date": "A payment cannot precede this schedule's effective date."})
            remaining = remaining_components(item, day) if item else {"principal": ZERO, "interest": ZERO, "fees": fee_remaining(loan, day)}
            current = remaining_components(item) if item else {"principal": ZERO, "interest": ZERO, "fees": fee_remaining(loan)}
            values = {key: number(entry.get(key, "0"), key) for key in remaining}
            if sum(values.values()) <= 0 or any(values[key] > min(remaining[key], current[key]) for key in values):
                raise ValidationError({"allocations": "Allocation must be positive and cannot exceed an outstanding component."})
            for key in ("interest", "fees"):
                if values[key] == 0:
                    continue
                postings = item.postings.filter(date__lte=day) if item else loan.postings.filter(kind="processing_fee", account=loan.card, date__lte=day)
                past = paid_allocations(item.allocations, day) if item else paid_allocations(loan.allocations.filter(installment__isnull=True), day)
                available = total(postings, key) - total(past, key)
                if values[key] > available:
                    raise ValidationError({"postings": "Confirm posting the actual interest/fee first; projected charges are not silently paid."})
            pending.append((target_loan, item, values))
            allocation_total += sum(values.values())
        if not movement:
            value = number(data.get("amount"), "amount", positive=True)
            if allocation_total > value:
                raise ValidationError({"amount": "Payment must cover all selected allocations."})
            movement = move_money({"kind": "credit_card_payment", "source": source_id, "destination": loan.card_id, "date": str(day), "amount": str(value), "request_id": data["request_id"], "notes": "Cash-loan installment allocation"}, actor)
        previous = paid_allocations(movement.cash_loan_allocations)
        used = sum((total(previous, key) for key in ("principal", "interest", "fees")), ZERO)
        if used + allocation_total > movement.amount:
            raise ValidationError({"movement_id": "This payment's remaining unallocated amount is too small."})
        allocations = []
        for target_loan, item, values in pending:
            row = CashLoanAllocation.objects.create(loan=target_loan, installment=item, movement=movement, created_by=actor, **values)
            allocations.append(row.pk)
        for pk in loan_ids:
            locked[pk].version += 1
            locked[pk].save(update_fields=["version", "updated_at"])
            materialize_cash_loan_deadlines(pk)
        record_event(loan, actor, "paid", {"movement": movement.pk, "allocated_amount": allocation_total}, f"cash-payment:{data['request_id']}")
        return {"loan_id": loan.pk, "movement_id": movement.pk, "allocation_ids": allocations}
    return operation(data, "allocate", actor, allocate)


def reverse_allocation(allocation_id, data, actor):
    def reverse():
        row = CashLoanAllocation.objects.select_related("loan", "movement").get(pk=allocation_id)
        lock_accounts([row.loan.card_id, row.movement.source_id])
        row = CashLoanAllocation.objects.select_for_update().get(pk=allocation_id)
        loan = CashLoan.objects.select_for_update().get(pk=row.loan_id)
        if row.reversed_on:
            raise ValidationError("This allocation is already reversed.")
        if row.loan.cancelled:
            raise ValidationError("Reconcile a cancelled loan before reversing its allocations.")
        if row.installment_id and not row.installment.active:
            raise ValidationError("This allocation belongs to a superseded schedule; reconcile the amendment first.")
        row.reversed_on = today()
        row.save(update_fields=["reversed_on"])
        loan.version += 1
        loan.save(update_fields=["version", "updated_at"])
        materialize_cash_loan_deadlines(row.loan_id)
        record_event(row.loan, actor, "adjusted", {"reversed_allocation": row.pk}, f"cash-reverse:{data['request_id']}")
        return {"loan_id": row.loan_id}
    return operation({**data, "allocation_id": allocation_id}, "reverse_allocation", actor, reverse)
