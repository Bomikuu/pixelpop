from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from brainstorm.models import BrainstormIdea
from finance.models import Category, Deadline
from finance.services.audit import log_record, snapshot_record


INITIAL_PRIORITY = {"high": "high", "medium": "medium", "low": "low", "someday": "low"}


@transaction.atomic
def carry_idea(idea_id: int, *, title: str | None, description: str | None,
               priority: str | None, due_date, category_id: int | None, actor):
    idea = get_object_or_404(BrainstormIdea.objects.select_for_update().select_related("task", "group"), pk=idea_id)
    if idea.task_id:
        return idea, idea.task
    if not idea.board.is_active:
        raise ValidationError({"board": "Reactivate this board before carrying an idea to a task."})
    title = (title if title is not None else idea.title).strip()
    if not title or len(title) > 160:
        raise ValidationError({"title": "Enter a task title of at most 160 characters."})
    description = description if description is not None else idea.description
    if len(description) > 4000:
        raise ValidationError({"description": "Use a description of at most 4,000 characters."})
    priority = priority or INITIAL_PRIORITY[idea.urgency]
    if priority not in dict(Deadline.PRIORITIES):
        raise ValidationError({"priority": "Choose high, medium, or low."})
    category = None
    if category_id is not None:
        category = Category.objects.filter(pk=category_id).first()
        if category is None:
            raise ValidationError({"category": "Choose an existing category."})
    before = snapshot_record(idea)
    task = Deadline.objects.create(
        title=title, notes=description, kind="task", priority=priority,
        due_date=due_date, category=category, status="pending", created_by=actor,
    )
    idea.task = task
    idea.status = "carried_over"
    idea.carried_over_at = timezone.now()
    idea.save(update_fields=["task", "status", "carried_over_at", "updated_at"])
    log_record(idea, actor=actor, action="carried", before=before, after=snapshot_record(idea))
    return idea, task
