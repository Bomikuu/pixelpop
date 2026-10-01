from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from brainstorm.models import BrainstormGroup, BrainstormIdea
from finance.services.audit import log_record, snapshot_record


def _ordered_ideas(group_id):
    return list(
        BrainstormIdea.objects.select_for_update()
        .filter(group_id=group_id)
        .order_by("sort_order", "-created_at", "-id")
    )


def _normalize(ideas):
    for rank, idea in enumerate(ideas):
        idea.sort_order = rank


@transaction.atomic
def move_idea(idea_id, group_id, *, before_id=None, after_id=None, actor=None):
    """Move one idea within its board and persist the affected group ranks."""
    if before_id is not None and after_id is not None:
        raise ValidationError({"before_id": "Choose either before or after, not both."})

    idea = get_object_or_404(
        BrainstormIdea.objects.select_for_update().select_related("board", "group", "task"),
        pk=idea_id,
    )
    if not idea.board.is_active:
        raise ValidationError({"board": "Reactivate this board before arranging ideas."})

    destination = get_object_or_404(BrainstormGroup.objects.select_for_update(), pk=group_id)
    if destination.board_id != idea.board_id:
        raise ValidationError({"group": "Move ideas between groups on the same board."})

    anchor_id = before_id if before_id is not None else after_id
    if anchor_id is not None:
        if anchor_id == idea.id:
            raise ValidationError({"before_id": "Choose a different idea as the drop target."})
        anchor = get_object_or_404(BrainstormIdea, pk=anchor_id)
        if anchor.board_id != idea.board_id or anchor.group_id != destination.id:
            raise ValidationError({"before_id": "Choose an idea in the destination group."})

    old_group_id = idea.group_id
    old_group = _ordered_ideas(old_group_id)
    destination_group = old_group if old_group_id == destination.id else _ordered_ideas(destination.id)
    old_order = [item.id for item in old_group]
    destination_order = [item.id for item in destination_group]

    old_group = [item for item in old_group if item.id != idea.id]
    if old_group_id == destination.id:
        destination_group = old_group
    if before_id is not None:
        position = next(index for index, item in enumerate(destination_group) if item.id == before_id)
    elif after_id is not None:
        position = next(index for index, item in enumerate(destination_group) if item.id == after_id) + 1
    else:
        position = len(destination_group)
    destination_group.insert(position, idea)

    if old_group_id == destination.id and [item.id for item in destination_group] == old_order:
        return idea

    before = snapshot_record(idea)
    idea.group = destination
    idea.updated_at = timezone.now()
    _normalize(old_group)
    _normalize(destination_group)
    changed = destination_group if old_group_id == destination.id else old_group + destination_group
    BrainstormIdea.objects.bulk_update(changed, ["group", "sort_order", "updated_at"])
    if old_group_id != destination.id or [item.id for item in destination_group] != destination_order:
        log_record(idea, actor=actor, action="edited", before=before, after=snapshot_record(idea))
    return idea
