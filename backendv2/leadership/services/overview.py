from collections import defaultdict

from leadership.models import (
    Delegation, KnowledgeItem, LeadershipEvidence, LeadershipHealthAssessment,
    MetricDefinition, MetricEntry, Process, ProcessObservation, WeeklyAction,
)
from leadership.models.evidence import HEALTH_CATEGORIES
from .calendar import phase_for_week, plan_period, week_for_date
from .reporting import report_streak
from .seed import PHASES


def is_single_point_of_failure(item):
    return bool(item.important and (item.backup_owner_id is None or not item.backup_tested))


def build_overview(plan, as_of):
    period = plan_period(plan.start_date, as_of)
    week = week_for_date(plan.start_date, as_of)
    phase = phase_for_week(week) if week else None
    actions = list(WeeklyAction.objects.filter(plan=plan).select_related("owner"))
    chains = defaultdict(list)
    for action in actions:
        chains[str(action.lineage_id)].append(action)
    completed_chains = sum(any(action.status == "completed" for action in chain) for chain in chains.values())
    current_actions = [action for action in actions if action.current_week == week and action.status != "moved"]
    current_actions.sort(key=lambda action: ({"high": 0, "medium": 1, "low": 2}[action.priority], action.due_date or as_of, action.pk))
    latest_observations = {}
    for observation in ProcessObservation.objects.filter(plan=plan).order_by("process_id", "-week", "-id"):
        latest_observations.setdefault(observation.process_id, observation)
    adopted = sum(observation.team_using == "yes" for observation in latest_observations.values())
    ownership = Delegation.objects.filter(plan=plan, took_work_back=False, progress__gt=0).values("new_owner_id").distinct().count()
    metric_movements = []
    if week:
        entries = {(entry.definition_id, entry.week): entry for entry in MetricEntry.objects.filter(plan=plan, week__in=[week, max(1, week - 1)])}
        for definition in MetricDefinition.objects.filter(plan=plan).order_by("id"):
            current = entries.get((definition.pk, week))
            previous = entries.get((definition.pk, week - 1)) if week > 1 else None
            if current:
                metric_movements.append({
                    "id": definition.pk, "name": definition.name, "unit": definition.unit,
                    "current": str(current.value) if current.value is not None else (current.numerator / current.denominator * 100 if current.denominator else None),
                    "previous": str(previous.value) if previous and previous.value is not None else (previous.numerator / previous.denominator * 100 if previous and previous.denominator else None),
                    "movement_note": current.movement_note, "impact_note": current.impact_note,
                })
    knowledge_at_risk = sum(is_single_point_of_failure(item) for item in KnowledgeItem.objects.filter(plan=plan).select_related("backup_owner"))
    assessments = {item.category: item for item in LeadershipHealthAssessment.objects.filter(plan=plan)}
    health_gaps = [
        {"category": category, "level": assessments[category].level if category in assessments else "not_started",
         "rationale": assessments[category].rationale if category in assessments else "Not assessed yet."}
        for category, _ in HEALTH_CATEGORIES
        if category not in assessments or assessments[category].level in ("needs_more", "not_started")
    ]
    primary_goal = None
    if week:
        primary_goal = plan.goals.filter(week=week, is_primary=True).order_by("id").first()
    return {
        "period": period, "currentWeek": week, "currentPhase": phase,
        "phaseName": PHASES[phase - 1]["name"] if phase else None,
        "phaseGoal": primary_goal.title if primary_goal else (PHASES[phase - 1]["goal"] if phase else None),
        "phaseSuccess": primary_goal.success_measure if primary_goal else (PHASES[phase - 1]["success"] if phase else None),
        "completed_actions": completed_chains, "total_actions": len(chains),
        "current_week_completed": sum(action.status == "completed" for action in current_actions),
        "current_week_total": len(current_actions),
        "processes_introduced": Process.objects.filter(plan=plan).count(),
        "adopted_processes": adopted,
        "evidence_items": LeadershipEvidence.objects.filter(plan=plan).count(),
        "ownership_people": ownership,
        "current_actions": [{
            "id": action.pk, "title": action.title, "status": action.status,
            "priority": action.priority, "due_date": action.due_date,
            "owner": action.owner.name if action.owner else None,
        } for action in current_actions[:8]],
        "reporting": report_streak(plan, as_of),
        "metric_movements": metric_movements[:6],
        "knowledge_at_risk": knowledge_at_risk,
        "health_gaps": health_gaps,
    }
