from leadership.models import WeeklyReport
from .calendar import plan_period, week_for_date


def report_streak(plan, as_of):
    period = plan_period(plan.start_date, as_of)
    completed = 0 if period == "upcoming" else 12 if period == "finished" else week_for_date(plan.start_date, as_of) - 1
    submitted = set(WeeklyReport.objects.filter(plan=plan, submitted_at__isnull=False, week__lte=completed).values_list("week", flat=True))
    # The recurring Tuesday report starts with the reporting phase (Week 7).
    missed = [week for week in range(7, completed + 1) if week not in submitted]
    streak = 0
    for week in range(completed, 6, -1):
        if week not in submitted:
            break
        streak += 1
    return {"streak": streak, "missedWeeks": missed}
