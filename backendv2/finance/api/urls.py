from django.urls import include, path
from rest_framework.routers import DefaultRouter
from . import views
from . import shared_bills

router = DefaultRouter()
for prefix, view in (
    ("accounts", views.AccountViewSet), ("assets", views.AssetViewSet),
    ("loans", views.LoanViewSet), ("transactions", views.TransactionViewSet),
    ("categories", views.CategoryViewSet), ("deadlines", views.DeadlineViewSet),
    ("schedules", views.ScheduleViewSet), ("movements", views.MovementViewSet),
):
    router.register(prefix, view, basename="finance-" + prefix)

urlpatterns = [
    path("session/", views.SessionView.as_view()),
    path("overview/", views.OverviewView.as_view()),
    path("people/", views.PeopleView.as_view()),
    path("people-options/", shared_bills.PeopleOptionsView.as_view()),
    path("shared-bills/", shared_bills.SharedBillsView.as_view()),
    path("shared-bills/share/<str:token>/", shared_bills.PublicSharedBillView.as_view()),
    path("shared-bills/share/<str:token>/unlock/", shared_bills.PublicSharedBillMutationView.as_view(action="unlock")),
    path("shared-bills/share/<str:token>/participants/", shared_bills.PublicSharedBillMutationView.as_view(action="participants")),
    path("shared-bills/share/<str:token>/pay/", shared_bills.PublicSharedBillMutationView.as_view(action="pay")),
    path("shared-bills/<int:pk>/", shared_bills.SharedBillView.as_view()),
    path("shared-bills/<int:pk>/pay/", shared_bills.SharedBillPayView.as_view()),
    path("shared-bills/<int:pk>/pin/", shared_bills.SharedBillPinView.as_view()),
    path("shared-bills/<int:pk>/participants/", shared_bills.SharedBillParticipantView.as_view()),
    path("shared-bills/<int:pk>/payments/<int:payment_id>/approve/", shared_bills.SharedBillPaymentDecisionView.as_view()),
    path("shared-bills/<int:pk>/payments/<int:payment_id>/reject/", shared_bills.SharedBillPaymentDecisionView.as_view(approve=False)),
    path("shared-bills/<int:pk>/share/", shared_bills.SharedBillShareView.as_view()),
    path("shared-bills/<int:pk>/revoke-share/", shared_bills.SharedBillRevokeView.as_view()),
    path("shared-bills/<int:pk>/archive/", shared_bills.SharedBillArchiveView.as_view()),
    path("reports/", views.OverviewView.as_view()),
    path("settings/", views.SettingsView.as_view()),
    path("backup/", views.DatabaseBackupView.as_view()),
    path("search/", views.SearchView.as_view()),
    path("calendar/", views.CalendarView.as_view()),
    path("", include(router.urls)),
]
