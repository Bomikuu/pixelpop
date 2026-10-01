from zoneinfo import ZoneInfo

from django.utils import timezone


def manila_today():
    return timezone.localdate(timezone=ZoneInfo("Asia/Manila"))


def copy_outputs(entry):
    if entry.type != "workday":
        return {"slack_message": "", "bullet_list": []}
    bullets = entry.items or entry.bullet_list or []
    in_progress = entry.in_progress or []
    heading = f"EOD – {entry.date.strftime('%a, %b')} {entry.date.day}, {entry.date.year}"
    done_lines = ["Done", *(f"• {item}" for item in bullets)]
    progress_lines = ["In Progress", *(f"• {item}" for item in in_progress)]
    slack = entry.slack_message or "\n".join([heading, *done_lines, "", *progress_lines])
    return {"slack_message": slack, "bullet_list": bullets}
