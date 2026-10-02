from django.urls import include, path
from rest_framework.routers import DefaultRouter
from . import views
from . import shared_bills
from . import nutrition
from . import activity
from . import events
from . import reminders

router = DefaultRouter()
for prefix, view in (
    ("accounts", views.AccountViewSet), ("assets", views.AssetViewSet),
    ("loans", views.LoanViewSet), ("transactions", views.TransactionViewSet),
    ("contacts", views.PersonViewSet),
    ("categories", views.CategoryViewSet), ("deadlines", views.DeadlineViewSet),
    ("schedules", views.ScheduleViewSet), ("movements", views.MovementViewSet),
):
    router.register(prefix, view, basename="finance-" + prefix)

urlpatterns = [
    path("reminders/checklist/", reminders.ReminderChecklistView.as_view()),
    path("reminders/items/<int:pk>/toggle/", reminders.ReminderItemToggleView.as_view()),
    path("reminders/status/", reminders.ReminderStatusView.as_view()),
    path("reminders/subscriptions/", reminders.ReminderSubscriptionView.as_view()),
    path("reminders/pending/", reminders.ReminderPendingView.as_view()),
    path("reminders/deliveries/<int:pk>/claim/", reminders.ReminderClaimView.as_view()),
    path("reminders/dispatch/", reminders.ReminderDispatchView.as_view()),
    path("events/", events.AuditEventsView.as_view()),
    path("nutrition/profile/", nutrition.NutritionProfileView.as_view()),
    path("nutrition/setup/", nutrition.NutritionSetupView.as_view()),
    path("nutrition/weights/", nutrition.NutritionWeightListView.as_view()),
    path("nutrition/weights/<str:day>/", nutrition.NutritionWeightDetailView.as_view()),
    path("nutrition/meals/", nutrition.NutritionMealListView.as_view()),
    path("nutrition/meals/<int:pk>/", nutrition.NutritionMealDetailView.as_view()),
    path("nutrition/activities/", activity.NutritionActivityListView.as_view()),
    path("nutrition/activities/<int:pk>/", activity.NutritionActivityDetailView.as_view()),
    path("nutrition/summary/", nutrition.NutritionSummaryView.as_view()),
    path("nutrition/period-summary/", nutrition.NutritionPeriodSummaryView.as_view()),
    path("session/", views.SessionView.as_view()),
    path("overview/", views.OverviewView.as_view()),
    path("people/", views.PeopleView.as_view()),
    path("people-options/", shared_bills.PeopleOptionsView.as_view()),
    path("shared-bills/", shared_bills.SharedBillsView.as_view()),
    path("shared-bills/share/<str:token>/", shared_bills.PublicSharedBillView.as_view()),
    path("shared-bills/share/<str:token>/unlock/", shared_bills.PublicSharedBillMutationView.as_view(action="unlock")),
    path("shared-bills/share/<str:token>/participants/", shared_bills.PublicSharedBillMutationView.as_view(action="participants")),
    path("shared-bills/share/<str:token>/pay/", shared_bills.PublicSharedBillMutationView.as_view(action="pay")),
    path("shared-bills/share/<str:token>/approve/", shared_bills.PublicSharedBillMutationView.as_view(action="approve")),
    path("shared-bills/share/<str:token>/reject/", shared_bills.PublicSharedBillMutationView.as_view(action="reject")),
    path("shared-bills/share/<str:token>/close/", shared_bills.PublicSharedBillMutationView.as_view(action="close")),
    path("shared-bills/<int:pk>/", shared_bills.SharedBillView.as_view()),
    path("shared-bills/<int:pk>/pay/", shared_bills.SharedBillPayView.as_view()),
    path("shared-bills/<int:pk>/close/", shared_bills.SharedBillCloseView.as_view()),
    path("shared-bills/<int:pk>/pin/", shared_bills.SharedBillPinView.as_view()),
    path("shared-bills/<int:pk>/participants/", shared_bills.SharedBillParticipantView.as_view()),
    path("shared-bills/<int:pk>/ledger-allocation/", shared_bills.SharedBillLedgerAllocationView.as_view()),
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
