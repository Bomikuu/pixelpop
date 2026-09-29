from datetime import timedelta

from django.utils import timezone
from zoneinfo import ZoneInfo


MANILA = ZoneInfo("Asia/Manila")


def local_today():
    return timezone.localdate(timezone=MANILA)


def week_for_date(start_date, on_date):
    day = (on_date - start_date).days
    return day // 7 + 1 if 0 <= day < 84 else None


def plan_period(start_date, on_date):
    day = (on_date - start_date).days
    return "upcoming" if day < 0 else "active" if day < 84 else "finished"


def phase_for_week(week):
    if not 1 <= week <= 12:
        raise ValueError("Week must be between 1 and 12.")
    return (week - 1) // 2 + 1


def week_start(plan, week):
    if not 1 <= week <= 12:
        raise ValueError("Week must be between 1 and 12.")
    return plan.start_date + timedelta(days=(week - 1) * 7)


def tuesday_in_week(plan, week):
    start = week_start(plan, week)
    return start + timedelta(days=(1 - start.weekday()) % 7)
