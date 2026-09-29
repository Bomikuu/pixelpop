from django.db import transaction
from django.middleware.csrf import get_token
from django.utils.dateparse import parse_date
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import MethodNotAllowed, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from leadership import models
from leadership.services.calendar import local_today, phase_for_week, plan_period, tuesday_in_week, week_for_date
from leadership.services.seed import PHASES, REPORT_CHECKLIST, seed_plan
from leadership.services.overview import build_overview
from .base import PlanScopedViewSet, PrivateLeadershipMixin, current_plan
from .serializers import (
    ContinuityCheckSerializer, DailyCheckInSerializer, DelegationSerializer, FrictionItemSerializer,
    KnowledgeItemSerializer, LeadershipEvidenceSerializer,
    LeadershipHealthAssessmentSerializer, MetricDefinitionSerializer,
    MetricEntrySerializer, MonthlyReflectionSerializer, PlanSerializer,
    PRReviewSerializer, ProcessObservationSerializer, ProcessSerializer,
    QualityObservationSerializer, TeamGoalSerializer, TeamMemberSerializer,
    WeeklyActionSerializer, WeeklyLeadershipReviewSerializer, WeeklyReportSerializer,
)


class BootstrapView(PrivateLeadershipMixin, APIView):
    def get(self, request):
        plan = models.LeadershipPlan.objects.filter(owner=request.user, status="active").first()
        week = week_for_date(plan.start_date, local_today()) if plan else None
        return Response({
            "user": {"id": request.user.pk, "name": request.user.get_full_name() or request.user.get_username()},
            "csrfToken": get_token(request),
            "plan": PlanSerializer(plan).data if plan else None,
            "period": plan_period(plan.start_date, local_today()) if plan else "setup",
            "currentWeek": week,
            "currentPhase": phase_for_week(week) if week else None,
            "reportDueDate": tuesday_in_week(plan, week) if week and week >= 7 else None,
            "phases": [{"number": index, "name": phase["name"], "goal": phase["goal"], "success": phase["success"]} for index, phase in enumerate(PHASES, 1)],
            "reportChecklist": REPORT_CHECKLIST,
        })


class OverviewView(PrivateLeadershipMixin, APIView):
    def get(self, request):
        return Response(build_overview(current_plan(request), local_today()))


class PlanViewSet(PrivateLeadershipMixin, viewsets.ModelViewSet):
    serializer_class = PlanSerializer
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        return models.LeadershipPlan.objects.filter(owner=self.request.user).order_by("-id")

    @transaction.atomic
    def perform_create(self, serializer):
        if models.LeadershipPlan.objects.filter(owner=self.request.user, status="active").exists():
            raise ValidationError("You already have an active leadership plan.")
        plan = serializer.save(owner=self.request.user)
        seed_plan(plan)


class WeeklyActionViewSet(PlanScopedViewSet):
    model = models.WeeklyAction
    serializer_class = WeeklyActionSerializer
    search_fields = ("title", "notes")

    @action(detail=True, methods=["post"])
    @transaction.atomic
    def carry(self, request, pk=None):
        source = self.get_object()
        if source.status in ("completed", "moved") or source.current_week >= 12:
            raise ValidationError("Only an unfinished action before Week 12 can move to next week.")
        if models.WeeklyAction.objects.filter(source_action=source).exists():
            raise ValidationError("This action was already moved.")
        follow_up = models.WeeklyAction.objects.create(
            plan=source.plan, lineage_id=source.lineage_id, source_action=source,
            planned_week=source.planned_week, current_week=source.current_week + 1,
            phase=phase_for_week(source.current_week + 1), title=source.title,
            description=source.description, owner=source.owner, due_date=None,
            priority=source.priority, notes=source.notes,
            evidence_urls=source.evidence_urls, leadership_result=source.leadership_result,
            seeded=False,
        )
        source.status = "moved"
        source.save(update_fields=["status", "updated_at"])
        return Response({"source": self.get_serializer(source).data, "follow_up": self.get_serializer(follow_up).data})


class TeamMemberViewSet(PlanScopedViewSet):
    model = models.TeamMember
    serializer_class = TeamMemberSerializer
    search_fields = ("name", "role")

    @action(detail=True, methods=["post"], url_path="mark-self")
    @transaction.atomic
    def mark_self(self, request, pk=None):
        member = self.get_object()
        # Lock the plan to serialize competing designation requests.
        models.LeadershipPlan.objects.select_for_update().get(pk=member.plan_id)
        models.TeamMember.objects.filter(plan_id=member.plan_id, is_self=True).exclude(pk=member.pk).update(is_self=False)
        if not member.is_self:
            member.is_self = True
            member.save(update_fields=["is_self"])
        return Response(self.get_serializer(member).data)


class DailyCheckInViewSet(PlanScopedViewSet):
    model = models.DailyCheckIn
    serializer_class = DailyCheckInSerializer
    http_method_names = ["get", "put", "head", "options"]

    def get_queryset(self):
        queryset = super().get_queryset().select_related("member").order_by("-date", "-id")
        member_id = self.request.query_params.get("member")
        if member_id is not None:
            if not member_id.isdigit() or not models.TeamMember.objects.filter(plan=current_plan(self.request), pk=member_id).exists():
                raise ValidationError({"member": "Choose a member from this plan."})
            queryset = queryset.filter(member_id=member_id)
        day = self.request.query_params.get("date")
        if day is not None:
            try:
                parsed = parse_date(day)
            except ValueError:
                parsed = None
            if parsed is None:
                raise ValidationError({"date": "Use YYYY-MM-DD."})
            queryset = queryset.filter(date=parsed)
        return queryset

    def update(self, request, *args, **kwargs):
        raise MethodNotAllowed("PUT")

    @action(detail=False, methods=["put"], url_path="day")
    @transaction.atomic
    def day(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        values = serializer.validated_data
        record, created = models.DailyCheckIn.objects.update_or_create(
            plan=current_plan(request), member=values["member"], date=values["date"],
            defaults={field: values.get(field, "") for field in models.DailyCheckIn.ANSWER_FIELDS},
        )
        return Response(self.get_serializer(record).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class TeamGoalViewSet(PlanScopedViewSet):
    model = models.TeamGoal
    serializer_class = TeamGoalSerializer
    search_fields = ("title", "outcome")

    def _clear_primary(self, plan, week, exclude=None):
        if week is not None:
            queryset = models.TeamGoal.objects.filter(plan=plan, week=week, is_primary=True)
            if exclude:
                queryset = queryset.exclude(pk=exclude)
            queryset.update(is_primary=False)

    @transaction.atomic
    def perform_create(self, serializer):
        plan = current_plan(self.request)
        if serializer.validated_data.get("is_primary"):
            self._clear_primary(plan, serializer.validated_data.get("week"))
        serializer.save(plan=plan)

    @transaction.atomic
    def perform_update(self, serializer):
        if serializer.validated_data.get("is_primary"):
            self._clear_primary(current_plan(self.request), serializer.validated_data.get("week", serializer.instance.week), serializer.instance.pk)
        serializer.save()


class WeeklyReportViewSet(PlanScopedViewSet):
    model = models.WeeklyReport
    serializer_class = WeeklyReportSerializer

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        report = self.get_object()
        if report.submitted_at is None:
            if not any((report.wins, report.metrics, report.changed, report.learned, report.next_actions)):
                raise ValidationError("Add at least one report note before submitting.")
            report.submitted_at = timezone.now()
            if report.report_date is None:
                report.report_date = local_today()
            report.save(update_fields=["submitted_at", "report_date", "updated_at"])
        return Response(self.get_serializer(report).data)


class WeeklyReviewViewSet(PlanScopedViewSet):
    model = models.WeeklyLeadershipReview
    serializer_class = WeeklyLeadershipReviewSerializer

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        review = self.get_object()
        if review.submitted_at is None:
            if not any((review.improved, review.adopted, review.did_not_work, review.should_delegate,
                        review.became_independent, review.process_change, review.promotion_evidence)):
                raise ValidationError("Add at least one reflection before submitting.")
            review.submitted_at = timezone.now()
            review.save(update_fields=["submitted_at", "updated_at"])
        return Response(self.get_serializer(review).data)


class MonthlyReflectionViewSet(PlanScopedViewSet):
    model = models.MonthlyReflection
    serializer_class = MonthlyReflectionSerializer

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        reflection = self.get_object()
        if reflection.submitted_at is None:
            reflection.submitted_at = timezone.now()
            reflection.save(update_fields=["submitted_at", "updated_at"])
        return Response(self.get_serializer(reflection).data)


def scoped_viewset(model, serializer, search_fields=()):
    return type(
        model.__name__ + "ViewSet",
        (PlanScopedViewSet,),
        {"model": model, "serializer_class": serializer, "search_fields": search_fields},
    )


ProcessViewSet = scoped_viewset(models.Process, ProcessSerializer, ("name", "description"))
ProcessObservationViewSet = scoped_viewset(models.ProcessObservation, ProcessObservationSerializer)
MetricDefinitionViewSet = scoped_viewset(models.MetricDefinition, MetricDefinitionSerializer, ("name",))
MetricEntryViewSet = scoped_viewset(models.MetricEntry, MetricEntrySerializer)
QualityObservationViewSet = scoped_viewset(models.QualityObservation, QualityObservationSerializer)
PRReviewViewSet = scoped_viewset(models.PRReview, PRReviewSerializer, ("name", "coaching_note"))
DelegationViewSet = scoped_viewset(models.Delegation, DelegationSerializer, ("title", "notes"))
KnowledgeItemViewSet = scoped_viewset(models.KnowledgeItem, KnowledgeItemSerializer, ("title", "notes"))
ContinuityCheckViewSet = scoped_viewset(models.ContinuityCheck, ContinuityCheckSerializer)
FrictionItemViewSet = scoped_viewset(models.FrictionItem, FrictionItemSerializer, ("friction", "result"))
LeadershipEvidenceViewSet = scoped_viewset(models.LeadershipEvidence, LeadershipEvidenceSerializer, ("problem", "action", "result"))
LeadershipHealthViewSet = scoped_viewset(models.LeadershipHealthAssessment, LeadershipHealthAssessmentSerializer)
