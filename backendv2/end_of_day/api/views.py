import re
from datetime import date

from django.db import IntegrityError, transaction
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from end_of_day.models import EndOfDayEntry, EndOfDayGroup
from end_of_day.services.formatting import manila_today
from end_of_day.services.imports import apply_import, preview_import
from finance.api.views import PrivateMixin
from finance.services.audit import log_record, snapshot_record
from .serializers import EntrySerializer, GroupSerializer


def _save(serializer, message):
    try:
        with transaction.atomic():
            return serializer.save()
    except IntegrityError as error:
        raise ValidationError(message) from error


def _group_id(request):
    try:
        value = int(request.query_params.get("group", ""))
    except (TypeError, ValueError):
        raise ValidationError({"group": "Choose an EOD group."})
    if value < 1 or not EndOfDayGroup.objects.filter(pk=value).exists():
        raise ValidationError({"group": "Choose an existing EOD group."})
    return value


class GroupListView(PrivateMixin, APIView):
    def get(self, request):
        return Response(GroupSerializer(EndOfDayGroup.objects.all(), many=True).data)

    @transaction.atomic
    def post(self, request):
        serializer = GroupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        group = _save(serializer, {"name": "A group with this name already exists."})
        log_record(group, actor=request.user, action="added", after=snapshot_record(group))
        return Response(GroupSerializer(group).data, status=201)


class GroupDetailView(PrivateMixin, APIView):
    @transaction.atomic
    def patch(self, request, pk):
        group = get_object_or_404(EndOfDayGroup.objects.select_for_update(), pk=pk)
        before = snapshot_record(group)
        serializer = GroupSerializer(group, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        group = _save(serializer, {"name": "A group with this name already exists."})
        log_record(group, actor=request.user, action="edited", before=before, after=snapshot_record(group))
        return Response(GroupSerializer(group).data)


class EntryListView(PrivateMixin, APIView):
    def get(self, request):
        month = request.query_params.get("month", "")
        if not re.fullmatch(r"\d{4}-(0[1-9]|1[0-2])", month):
            raise ValidationError({"month": "Use a month in YYYY-MM format."})
        year, number = map(int, month.split("-"))
        try:
            date(year, number, 1)
        except ValueError as error:
            raise ValidationError({"month": "Choose a valid month."}) from error
        today = manila_today()
        if (year, number) > (today.year, today.month):
            raise ValidationError({"month": "Future months are not available."})
        rows = EndOfDayEntry.objects.filter(group_id=_group_id(request), date__year=year, date__month=number).select_related("group").order_by("date", "id")
        return Response({"month": month, "today": today.isoformat(), "entries": EntrySerializer(rows, many=True).data})

    @transaction.atomic
    def post(self, request):
        serializer = EntrySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        entry = _save(serializer, {"date": "This group already has an entry for that date."})
        log_record(entry, actor=request.user, action="added", after=snapshot_record(entry))
        return Response(EntrySerializer(entry).data, status=201)


class EntryDetailView(PrivateMixin, APIView):
    @transaction.atomic
    def patch(self, request, pk):
        entry = get_object_or_404(EndOfDayEntry.objects.select_related("group").select_for_update(), pk=pk)
        before = snapshot_record(entry)
        serializer = EntrySerializer(entry, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        entry = _save(serializer, {"date": "This group already has an entry for that date."})
        log_record(entry, actor=request.user, action="edited", before=before, after=snapshot_record(entry))
        return Response(EntrySerializer(entry).data)


class ImportPreviewView(PrivateMixin, APIView):
    def post(self, request):
        return Response(preview_import(request.data, _group_id(request)))


class ImportCommitView(PrivateMixin, APIView):
    def post(self, request):
        return Response(apply_import(request.data, _group_id(request), request.user))
