from django.db import IntegrityError, transaction
from django.db.models import Case, Count, IntegerField, Max, Q, Value, When
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from brainstorm.models import BrainstormBoard, BrainstormGroup, BrainstormIdea
from brainstorm.services.imports import apply_import, preview_import
from brainstorm.services.carry import carry_idea
from brainstorm.services.move import move_idea
from finance.api.views import PrivateMixin
from finance.services.audit import log_record, record_label, snapshot_record
from .serializers import BoardSerializer, CarrySerializer, GroupSerializer, IdeaSerializer, MoveIdeaSerializer


class IdeaPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 100


def _save(serializer, **kwargs):
    try:
        return serializer.save(**kwargs)
    except IntegrityError as error:
        raise ValidationError("A board, group, or idea with this name already exists.") from error


class BoardListView(PrivateMixin, APIView):
    def get(self, request):
        boards = BrainstormBoard.objects.annotate(idea_count=Count("ideas", filter=~Q(ideas__status="archived")))
        return Response(BoardSerializer(boards, many=True).data)

    @transaction.atomic
    def post(self, request):
        serializer = BoardSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        board = _save(serializer)
        BrainstormGroup.objects.create(board=board, name="Ideas")
        log_record(board, actor=request.user, action="added", after=snapshot_record(board))
        return Response({**BoardSerializer(board).data, "idea_count": 0}, status=201)


class BoardDetailView(PrivateMixin, APIView):
    @transaction.atomic
    def patch(self, request, pk):
        board = get_object_or_404(BrainstormBoard.objects.select_for_update(), pk=pk)
        before = snapshot_record(board)
        serializer = BoardSerializer(board, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        board = _save(serializer)
        after = snapshot_record(board)
        action = "archived" if before["is_active"] and not after["is_active"] else "restored" if not before["is_active"] and after["is_active"] else "edited"
        if before != after:
            log_record(board, actor=request.user, action=action, before=before, after=after)
        return Response(BoardSerializer(board).data)


class GroupListView(PrivateMixin, APIView):
    @transaction.atomic
    def post(self, request):
        serializer = GroupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        group = _save(serializer)
        log_record(group, actor=request.user, action="added", after=snapshot_record(group))
        return Response(GroupSerializer(group).data, status=201)


class GroupDetailView(PrivateMixin, APIView):
    @transaction.atomic
    def patch(self, request, pk):
        group = get_object_or_404(BrainstormGroup.objects.select_for_update(), pk=pk)
        before = snapshot_record(group)
        serializer = GroupSerializer(group, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        group = _save(serializer)
        log_record(group, actor=request.user, action="edited", before=before, after=snapshot_record(group))
        return Response(GroupSerializer(group).data)


class IdeaListView(PrivateMixin, APIView):
    def get(self, request):
        try:
            board_id = int(request.query_params.get("board", ""))
        except (TypeError, ValueError):
            raise ValidationError({"board": "Choose a board."})
        board = get_object_or_404(BrainstormBoard, pk=board_id)
        groups = GroupSerializer(board.groups.all(), many=True).data
        rows = BrainstormIdea.objects.filter(board=board).select_related("group", "task")
        status_filter = request.query_params.get("status", "")
        if status_filter:
            if status_filter not in dict(BrainstormIdea.STATUSES):
                raise ValidationError({"status": "Choose a valid status."})
            rows = rows.filter(status=status_filter)
        else:
            rows = rows.exclude(status="archived")
        urgency = request.query_params.get("urgency", "")
        if urgency:
            if urgency not in dict(BrainstormIdea.URGENCIES):
                raise ValidationError({"urgency": "Choose a valid urgency."})
            rows = rows.filter(urgency=urgency)
        if request.query_params.get("group"):
            group = get_object_or_404(BrainstormGroup, pk=request.query_params["group"], board=board)
            rows = rows.filter(group=group)
        if request.query_params.get("unconverted") == "1":
            rows = rows.filter(task__isnull=True)
        query = request.query_params.get("q", "").strip()
        if len(query) > 160:
            raise ValidationError({"q": "Search with at most 160 characters."})
        if query:
            rows = rows.filter(Q(title__icontains=query) | Q(description__icontains=query) | Q(source_text__icontains=query))
        sort = request.query_params.get("sort", "newest")
        if sort == "urgency":
            rows = rows.annotate(urgency_rank=Case(
                When(urgency="high", then=Value(0)), When(urgency="medium", then=Value(1)),
                When(urgency="low", then=Value(2)), default=Value(3), output_field=IntegerField(),
            )).order_by("urgency_rank", "-created_at", "-id")
        elif sort == "manual":
            rows = rows.order_by("group__sort_order", "group_id", "sort_order", "-created_at", "-id")
        elif sort == "newest":
            rows = rows.order_by("-created_at", "-id")
        else:
            raise ValidationError({"sort": "Choose manual, newest, or urgency."})
        paginator = IdeaPagination()
        page = paginator.paginate_queryset(rows, request, view=self)
        response = paginator.get_paginated_response(IdeaSerializer(page, many=True).data)
        response.data["board"] = BoardSerializer(board).data
        response.data["groups"] = groups
        return response

    @transaction.atomic
    def post(self, request):
        serializer = IdeaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        group = serializer.validated_data["group"]
        last_rank = BrainstormIdea.objects.filter(group=group).aggregate(last=Max("sort_order"))["last"]
        idea = _save(serializer, sort_order=(last_rank if last_rank is not None else -1) + 1)
        log_record(idea, actor=request.user, action="added", after=snapshot_record(idea))
        return Response(IdeaSerializer(idea).data, status=201)


class IdeaDetailView(PrivateMixin, APIView):
    @transaction.atomic
    def patch(self, request, pk):
        idea = get_object_or_404(BrainstormIdea.objects.select_for_update().select_related("group", "task"), pk=pk)
        before = snapshot_record(idea)
        serializer = IdeaSerializer(idea, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        idea = _save(serializer)
        after = snapshot_record(idea)
        action = "archived" if before["status"] != "archived" and after["status"] == "archived" else "restored" if before["status"] == "archived" and after["status"] != "archived" else "edited"
        if before != after:
            log_record(idea, actor=request.user, action=action, before=before, after=after)
        return Response(IdeaSerializer(idea).data)

    @transaction.atomic
    def delete(self, request, pk):
        idea = get_object_or_404(BrainstormIdea.objects.select_for_update(), pk=pk)
        before, label = snapshot_record(idea), record_label(idea)
        idea.delete()
        log_record(idea, actor=request.user, action="deleted", before=before, label=label, subject_id=pk)
        return Response(status=204)


class MoveIdeaView(PrivateMixin, APIView):
    def post(self, request, pk):
        serializer = MoveIdeaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        idea = move_idea(
            pk,
            serializer.validated_data["group"],
            before_id=serializer.validated_data.get("before_id"),
            after_id=serializer.validated_data.get("after_id"),
            actor=request.user,
        )
        return Response(IdeaSerializer(idea).data)


class ImportPreviewView(PrivateMixin, APIView):
    def post(self, request):
        return Response(preview_import(request.data))


class ImportCommitView(PrivateMixin, APIView):
    def post(self, request):
        return Response(apply_import(request.data, actor=request.user))


class CarryIdeaView(PrivateMixin, APIView):
    def post(self, request, pk):
        serializer = CarrySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        values = serializer.validated_data
        idea, task = carry_idea(
            pk, title=values.get("title"), description=values.get("description"),
            priority=values.get("priority"), due_date=values.get("due_date"),
            category_id=values.get("category"), actor=request.user,
        )
        return Response({"idea": IdeaSerializer(idea).data, "task": {"id": task.pk, "status": task.status, "due_date": task.due_date}})
