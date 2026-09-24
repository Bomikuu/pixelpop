"""Export daily Codex task counts without publishing task content or IDs."""

import argparse
import json
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo


TIMEZONE = ZoneInfo("Asia/Taipei")
DEFAULT_OUTPUT = Path(__file__).resolve().parents[1] / "src/pages/portfolio/data/codexActivity.json"


def task_dates(path):
    dates = set()
    with path.open(encoding="utf-8") as session:
        for line in session:
            try:
                record = json.loads(line)
            except json.JSONDecodeError:
                continue

            payload = record.get("payload") or {}
            is_turn = record.get("type") == "turn_context"
            is_start = record.get("type") == "event_msg" and payload.get("type") == "task_started"
            if not (is_turn or is_start):
                continue

            timestamp = record.get("timestamp")
            if not timestamp:
                continue
            try:
                local_date = datetime.fromisoformat(timestamp.replace("Z", "+00:00")).astimezone(TIMEZONE).date()
            except ValueError:
                continue
            dates.add(local_date)
    return dates


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sessions-dir", type=Path, default=Path.home() / ".codex/sessions")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    if not args.sessions_dir.is_dir():
        parser.error(f"Codex sessions directory not found: {args.sessions_dir}")

    days = defaultdict(set)
    tasks_by_year = defaultdict(set)
    for session_path in args.sessions_dir.rglob("*.jsonl"):
        for day in task_dates(session_path):
            days[day].add(session_path.name)
            tasks_by_year[day.year].add(session_path.name)

    result = {
        "generatedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "timezone": "Asia/Taipei",
        "firstTrackedDate": min(days).isoformat() if days else None,
        "years": {
            str(year): {
                "uniqueTasks": len(tasks_by_year[year]),
                "days": [
                    {"date": day.isoformat(), "count": len(days[day])}
                    for day in sorted(days)
                    if day.year == year
                ],
            }
            for year in sorted(tasks_by_year, reverse=True)
        },
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(f"Exported {len(days)} active days to {args.output}")


if __name__ == "__main__":
    main()
