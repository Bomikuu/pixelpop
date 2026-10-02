from datetime import date
from decimal import Decimal
from zoneinfo import ZoneInfo

from django.db import transaction
from django.db.models import Q, Sum
from django.utils import timezone

from end_of_day.models import EndOfDayEntry
from finance.models import Deadline, Meal, MealItem, NutritionProfile, RecurringSchedule, Transaction


MANILA = ZoneInfo("Asia/Manila")
DAILY_TASKS = (
    ("eod", "Complete EOD", "/dashboard/eod"),
    ("job", "Apply for a job", "/dashboard/deadlines"),
    ("app", "Make a new app", "/dashboard/deadlines"),
    ("pr", "Make a PR", "/dashboard/deadlines"),
    ("review_pr", "Review a PR", "/dashboard/deadlines"),
    ("calories", "Track your calories", "/dashboard/nutrition"),
    ("expenses", "Record expenses", "/dashboard/transactions"),
)
AUTO_KEYS = ("eod", "calories", "expenses")
ACTION_URLS = {key: url for key, _, url in DAILY_TASKS}


def manila_today():
    return timezone.localdate(timezone=MANILA)


@transaction.atomic
def ensure_daily_reminders(user):
    schedules = []
    for key, title, _ in DAILY_TASKS:
        schedule, _ = RecurringSchedule.objects.get_or_create(
            created_by=user,
            system_key=key,
            defaults={
                "title": title,
                "kind": "task",
                "important": True,
                "anchor_date": manila_today(),
                "frequency": "days",
                "interval": 1,
            },
        )
        schedules.append(schedule)
    return schedules


def _ensure_occurrence(schedule, day):
    if not schedule.active or day < schedule.anchor_date:
        return None
    item, _ = Deadline.objects.get_or_create(
        schedule=schedule,
        due_date=day,
        defaults={
            "created_by": schedule.created_by,
            "title": schedule.title,
            "kind": "task",
            "important": schedule.important,
            "notes": schedule.notes,
        },
    )
    return item


def sync_automatic_tasks(user, day: date):
    schedules = {item.system_key: item for item in ensure_daily_reminders(user)}
    completed = {
        "eod": EndOfDayEntry.objects.filter(date=day).exists(),
        "calories": Meal.objects.filter(user=user, date=day).exists(),
        "expenses": Transaction.objects.filter(created_by=user, date=day, kind="expense").exists(),
    }
    for key in AUTO_KEYS:
        item = _ensure_occurrence(schedules[key], day)
        if item is None:
            continue
        should_be = "completed" if completed[key] else "pending"
        if item.status != should_be:
            item.status = should_be
            item.completed_at = timezone.now() if completed[key] else None
            item.save(update_fields=["status", "completed_at", "updated_at"])
    return completed


def checklist_for(user, day: date):
    schedules = ensure_daily_reminders(user)
    for schedule in schedules:
        _ensure_occurrence(schedule, day)
    sync_automatic_tasks(user, day)

    meal_count = Meal.objects.filter(user=user, date=day).count()
    calories = MealItem.objects.filter(meal__user=user, meal__date=day).aggregate(value=Sum("calories"))["value"] or Decimal("0")
    profile = NutritionProfile.objects.filter(user=user).first()
    target = profile.daily_target_kcal if profile else None

    rows = Deadline.objects.filter(
        created_by=user, important=True, kind__in=("task", "reminder"),
    ).filter(Q(due_date__lte=day) | Q(due_date__isnull=True)).select_related("schedule").order_by("due_date", "id")
    items = []
    for row in rows:
        key = row.schedule.system_key if row.schedule_id else None
        if key and (not row.schedule.active or not row.schedule.important):
            continue
        if key and row.due_date != day:
            continue
        if row.status != "pending" and row.due_date and row.due_date < day:
            if not row.completed_at or timezone.localtime(row.completed_at, MANILA).date() != day:
                continue
        item = {
            "deadline_id": row.pk,
            "title": row.title,
            "completed": row.status == "completed",
            "important": True,
            "source": key or "task",
            "automatic": key in AUTO_KEYS,
            "due_date": row.due_date.isoformat() if row.due_date else None,
            "action_url": ACTION_URLS.get(key, "/dashboard/deadlines"),
        }
        if key == "calories":
            item.update({"meal_count": meal_count, "calories": str(calories), "target_kcal": str(target) if target else None})
        items.append(item)
    return {"date": day.isoformat(), "items": items, "all_complete": all(row["completed"] for row in items)}
