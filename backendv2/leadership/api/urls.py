from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views


router = DefaultRouter()
for prefix, view in (
    ("plans", views.PlanViewSet),
    ("actions", views.WeeklyActionViewSet),
    ("goals", views.TeamGoalViewSet),
    ("processes", views.ProcessViewSet),
    ("process-observations", views.ProcessObservationViewSet),
    ("metric-definitions", views.MetricDefinitionViewSet),
    ("metric-entries", views.MetricEntryViewSet),
    ("quality-observations", views.QualityObservationViewSet),
    ("pr-reviews", views.PRReviewViewSet),
    ("weekly-reports", views.WeeklyReportViewSet),
    ("weekly-reviews", views.WeeklyReviewViewSet),
    ("team-members", views.TeamMemberViewSet),
    ("daily-check-ins", views.DailyCheckInViewSet),
    ("delegations", views.DelegationViewSet),
    ("knowledge", views.KnowledgeItemViewSet),
    ("continuity-checks", views.ContinuityCheckViewSet),
    ("friction", views.FrictionItemViewSet),
    ("evidence", views.LeadershipEvidenceViewSet),
    ("health", views.LeadershipHealthViewSet),
    ("reflections", views.MonthlyReflectionViewSet),
):
    router.register(prefix, view, basename="leadership-" + prefix)

urlpatterns = [
    path("bootstrap/", views.BootstrapView.as_view()),
    path("overview/", views.OverviewView.as_view()),
    path("", include(router.urls)),
]
