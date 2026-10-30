import calendar
from datetime import date, timedelta

from django.db import transaction
from rest_framework.exceptions import ValidationError

from finance.models import Deadline, RecurringSchedule, Transaction
from .balances import today


def occurrence(schedule, index):
    anchor = schedule.anchor_date
    unit = schedule.frequency
    multiplier = schedule.interval
    if unit in ("days", "weeks", "weekly"):
        return anchor + timedelta(days=index * multiplier * (7 if unit in ("weeks", "weekly") else 1))
    months = index * multiplier * {"monthly": 1, "months": 1, "quarterly": 3, "yearly": 12, "years": 12}[unit]
    month_index = anchor.year * 12 + anchor.month - 1 + months
    year, month = divmod(month_index, 12)
    return date(year, month + 1, min(anchor.day, calendar.monthrange(year, month + 1)[1]))


@transaction.atomic
def materialize(until=None):
    from .subscriptions.common import workspace_lock
    workspace_lock()
    until = max(until or today(), today() + timedelta(days=90))
    if until > today() + timedelta(days=366 * 5):
        raise ValidationError({"month": "Choose a month within the next five years."})
    schedules = list(RecurringSchedule.objects.select_for_update().filter(active=True).prefetch_related("subscription__prices", "category", "account"))
    existing_deadlines = {(row.schedule_id, row.due_date): row for row in Deadline.objects.filter(schedule__in=schedules, due_date__lte=until).select_related("subscription_cycle", "expense__subscription_allocation")}
    income_schedules = [row for row in schedules if row.kind == "income"]
    existing_income = set(Transaction.objects.filter(schedule__in=income_schedules, scheduled_date__lte=until).values_list("schedule_id", "scheduled_date")) if income_schedules else set()
    for schedule in schedules:
        service = getattr(schedule, "subscription", None)
        if service and service.expires_on and service.expires_on < today():
            from .subscriptions.lifecycle import change_lifecycle
            import uuid
            change_lifecycle(service.pk, "expire", service.expires_on + timedelta(days=1), service.created_by,
                request_id=uuid.uuid5(uuid.NAMESPACE_URL, f"subscription:{service.pk}:expiry:{service.expires_on}"))
            continue
        if service and not schedule.variable_amount:
            current_price = max((price for price in service.prices.all() if price.effective_date <= today()), key=lambda price: price.effective_date, default=None)
            if current_price and schedule.amount != current_price.amount:
                schedule.amount = current_price.amount
                schedule.save(update_fields=["amount", "updated_at"])
        if schedule.system_key:
            due = today()
            if due >= schedule.anchor_date and (schedule.pk, due) not in existing_deadlines:
                Deadline.objects.get_or_create(
                    schedule=schedule, due_date=due,
                    defaults={"created_by": schedule.created_by, "title": schedule.title, "kind": "task", "important": schedule.important, "notes": schedule.notes},
                )
            continue
        for index in range(20000):
            due = occurrence(schedule, index)
            if due > until:
                break
            if service and service.expires_on and due > service.expires_on:
                break
            defaults = dict(created_by=schedule.created_by, category=schedule.category, notes=schedule.notes)
            if schedule.kind == "income":
                if schedule.account_id and schedule.amount and (schedule.pk, due) not in existing_income:
                    Transaction.objects.get_or_create(schedule=schedule, scheduled_date=due, defaults={**defaults, "date": due, "name": schedule.title, "kind": "income", "receipt_state": "expected", "account": schedule.account, "amount": schedule.amount})
            else:
                item = existing_deadlines.get((schedule.pk, due))
                created = False
                if item is None:
                    item, created = Deadline.objects.get_or_create(schedule=schedule, due_date=due, defaults={**defaults, "title": schedule.title, "kind": schedule.kind, "important": schedule.important, "amount": None if schedule.variable_amount else schedule.amount, "due_time": schedule.due_time, "reminder_days": schedule.reminder_days, "settlement_kind": schedule.settlement_kind, "credit_card": schedule.account if schedule.settlement_kind == "credit_card_payment" else None})
                item.schedule = schedule
                from .subscriptions.cycles import ensure_cycle
                cycle = ensure_cycle(item)
                if created and cycle and not schedule.variable_amount:
                    price = max((price for price in service.prices.all() if price.effective_date <= due), key=lambda price: price.effective_date, default=None) if service else cycle.subscription.prices.filter(effective_date__lte=due).order_by("-effective_date").first()
                    if price and item.amount != price.amount:
                        item.amount = price.amount
                        item.save(update_fields=["amount", "updated_at"])
        else:
            raise ValidationError({"schedule": "This schedule spans too many occurrences. Use a more recent anchor date."})
