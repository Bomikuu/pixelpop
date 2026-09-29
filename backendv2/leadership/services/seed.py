from django.db import transaction

from leadership.models import MetricDefinition, TeamGoal, WeeklyAction


PHASES = [
    {
        "name": "Establish Standards",
        "goal": "Create basic operating standards for the Network team.",
        "success": "PR template exists; the team understands the process; new PRs use it.",
        "actions": [
            "Create Network PR template", "Add Notion ticket requirement",
            "Add PR type: Feature / Bugfix / Amendment / Refactor",
            "Add goal and expected impact field", "Add QA/test instructions",
            "Add screenshot/demo requirement for UI work", "Add documentation requirement",
            "Define code review expectations", "Document Network development workflow",
            "Share the process with the team",
        ],
    },
    {
        "name": "Build Engineering Feedback Loops",
        "goal": "Make quality checks visible and repeatable.",
        "success": "PRs have reviewers; CI is visible; merge requirements are understood; preventable issues are caught.",
        "actions": [
            "Ensure linting runs automatically", "Ensure build pipeline runs for PRs",
            "Review current automated tests", "Add E2E checks where valuable",
            "Add Slack notification for new PRs", "Add notification for CI/build failures",
            "Define who reviews PRs", "Start actively reviewing junior developers' PRs",
            "Document common code-review expectations", "Track whether PR checklist requirements are followed",
        ],
    },
    {
        "name": "Goal-Based Team Execution",
        "goal": "Move the team away from purely task-based execution.",
        "success": "Weekly goals have owners and measures; completed tasks are checked against outcomes.",
        "actions": [
            "Define 1–3 weekly team goals", "Connect tasks to a goal",
            "Give each goal an owner", "Define success metric for each important goal",
            "Define sprint planning rules", "Document sprint meeting structure",
            "Add blocker discussion to sprint meetings",
            "Review whether completed tasks achieved the actual goal",
            "Remove unnecessary or inefficient sprint practices",
            "Ask team members what process is creating friction",
        ],
    },
    {
        "name": "Metrics & Consistent Communication",
        "goal": "Create a repeatable reporting habit.",
        "success": "Weekly metrics and changes are reviewed and the Network update is shared.",
        "actions": [
            "Collect PQL numbers", "Compare against previous period",
            "Review booking request conversions", "Review Search Console clicks",
            "Review Search Console impressions", "Review CTR",
            "Review average position", "Review Ahrefs organic keywords",
            "Review important PostHog funnels", "Identify important changes",
            "Write what we learned", "Write what action should happen next",
            "Post Network weekly update in Slack",
        ],
    },
    {
        "name": "Team Development & Delegation",
        "goal": "Develop people instead of becoming the permanent problem solver.",
        "success": "Meaningful ownership moves to team members and coaching results are recorded.",
        "actions": [
            "Document team members' strengths", "Identify what each person wants to improve",
            "Give at least one person a stretch assignment",
            "Give a junior ownership instead of only implementation tasks",
            "Coach someone through a problem without immediately providing the answer",
            "Ask for options and tradeoffs before giving your solution",
            "Let another team member review a PR", "Let another team member run QA",
            "Let another team member prepare a metrics report",
            "Record leadership evidence from each delegation",
        ],
    },
    {
        "name": "Make the Team Less Dependent on Me",
        "goal": "Validate that the processes work without you operating everything.",
        "success": "Another person can perform key processes and remaining dependencies are explicit.",
        "actions": [
            "Select backup point person", "Let another developer coordinate PR reviews",
            "Rotate weekly metrics reporting", "Let someone else lead part of sprint planning",
            "Let someone else communicate a project update",
            "Verify documentation lets another person perform the process",
            "Identify remaining single-person knowledge",
            "Convert personal knowledge into team documentation",
            "Review which processes are actually followed",
            "Improve or remove processes that create unnecessary friction",
        ],
    },
]

METRICS = [
    ("PQL", "count", "number", "up"),
    ("Booking requests", "count", "number", "up"),
    ("Booking conversion", "%", "ratio", "up"),
    ("Search Console clicks", "count", "number", "up"),
    ("Search Console impressions", "count", "number", "up"),
    ("Search Console CTR", "%", "ratio", "up"),
    ("Search Console average position", "position", "number", "down"),
    ("Ahrefs organic keywords", "count", "number", "up"),
    ("Organic pages", "count", "number", "up"),
    ("Clinic profile views", "count", "number", "up"),
    ("Search usage", "count", "number", "up"),
    ("Feature adoption", "%", "ratio", "up"),
    ("Funnel conversion", "%", "ratio", "up"),
]

REPORT_CHECKLIST = [
    "Collect PQL numbers", "Compare against previous period",
    "Review booking request conversions", "Review Search Console clicks",
    "Review Search Console impressions", "Review CTR", "Review average position",
    "Review Ahrefs organic keywords", "Review important PostHog funnels",
    "Identify important changes", "Write what we learned",
    "Write what action should happen next", "Post Network weekly update in Slack",
]


@transaction.atomic
def seed_plan(plan):
    if not plan.actions.exists():
        actions = []
        goals = []
        for phase_index, phase in enumerate(PHASES, start=1):
            first_week = phase_index * 2 - 1
            split = (len(phase["actions"]) + 1) // 2
            for action_index, title in enumerate(phase["actions"]):
                week = first_week + (action_index >= split)
                actions.append(WeeklyAction(
                    plan=plan, planned_week=week, current_week=week,
                    phase=phase_index, title=title, seeded=True,
                ))
            for week in (first_week, first_week + 1):
                goals.append(TeamGoal(
                    plan=plan, week=week, title=phase["goal"],
                    success_measure=phase["success"], is_primary=True,
                ))
        WeeklyAction.objects.bulk_create(actions)
        TeamGoal.objects.bulk_create(goals)
    for name, unit, value_type, desired_direction in METRICS:
        MetricDefinition.objects.get_or_create(
            plan=plan, name=name,
            defaults={"unit": unit, "value_type": value_type, "desired_direction": desired_direction, "seeded": True},
        )
