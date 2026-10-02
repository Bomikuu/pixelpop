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
    until = max(until or today(), today() + timedelta(days=90))
    if until > today() + timedelta(days=366 * 5):
        raise ValidationError({"month": "Choose a month within the next five years."})
    for schedule in RecurringSchedule.objects.select_for_update().filter(active=True):
        for index in range(20000):
            due = occurrence(schedule, index)
            if due > until:
                break
            defaults = dict(created_by=schedule.created_by, category=schedule.category, notes=schedule.notes)
            if schedule.kind == "income":
                if schedule.account_id and schedule.amount:
                    Transaction.objects.get_or_create(schedule=schedule, scheduled_date=due, defaults={**defaults, "date": due, "name": schedule.title, "kind": "income", "receipt_state": "expected", "account": schedule.account, "amount": schedule.amount})
            else:
                Deadline.objects.get_or_create(schedule=schedule, due_date=due, defaults={**defaults, "title": schedule.title, "kind": schedule.kind, "important": schedule.important, "amount": None if schedule.variable_amount else schedule.amount, "due_time": schedule.due_time, "reminder_days": schedule.reminder_days, "settlement_kind": schedule.settlement_kind, "credit_card": schedule.account if schedule.settlement_kind == "credit_card_payment" else None})
        else:
            raise ValidationError({"schedule": "This schedule spans too many occurrences. Use a more recent anchor date."})
