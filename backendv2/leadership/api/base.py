from django.db import IntegrityError
from django.db.models import Q
from django.db.models.deletion import ProtectedError
from rest_framework import viewsets
from rest_framework.authentication import SessionAuthentication
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated

from leadership.models import LeadershipPlan


def current_plan(request):
    plan = LeadershipPlan.objects.filter(owner=request.user, status="active").first()
    if plan is None:
        raise NotFound("Set up your leadership plan first.")
    return plan


class LeadershipPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class PrivateLeadershipMixin:
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)
        response["Cache-Control"] = "private, no-store"
        response["Vary"] = "Cookie"
        return response


class PlanScopedViewSet(PrivateLeadershipMixin, viewsets.ModelViewSet):
    pagination_class = LeadershipPagination
    model = None
    search_fields = ()

    def get_queryset(self):
        plan = current_plan(self.request)
        queryset = self.model.objects.filter(plan=plan).order_by("-id")
        week = self.request.query_params.get("week")
        if week is not None:
            if not week.isdigit() or not 1 <= int(week) <= 12:
                raise ValidationError({"week": "Choose a week from 1 to 12."})
            if any(field.name == "current_week" for field in self.model._meta.fields):
                queryset = queryset.filter(current_week=int(week))
            elif any(field.name == "week" for field in self.model._meta.fields):
                queryset = queryset.filter(week=int(week))
        q = self.request.query_params.get("q", "").strip()
        if len(q) > 160:
            raise ValidationError({"q": "Use at most 160 characters."})
        if q and self.search_fields:
            predicate = Q()
            for field in self.search_fields:
                predicate |= Q(**{field + "__icontains": q})
            queryset = queryset.filter(predicate)
        return queryset

    def get_serializer_context(self):
        return {**super().get_serializer_context(), "plan": current_plan(self.request)}

    def perform_create(self, serializer):
        try:
            serializer.save(plan=current_plan(self.request))
        except IntegrityError as error:
            raise ValidationError("A record with these values already exists in this plan.") from error

    def perform_update(self, serializer):
        try:
            serializer.save()
        except IntegrityError as error:
            raise ValidationError("A record with these values already exists in this plan.") from error

    def perform_destroy(self, instance):
        try:
            instance.delete()
        except ProtectedError as error:
            raise ValidationError("This record is still used by another item. Update those items first.") from error
