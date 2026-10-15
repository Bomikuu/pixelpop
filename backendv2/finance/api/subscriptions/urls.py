from django.urls import path
from .views import SubscriptionView

urlpatterns = [
    path("", SubscriptionView.as_view()),
    path("summary/", SubscriptionView.as_view(action="summary")),
    path("forecasts/", SubscriptionView.as_view(action="forecasts")),
    path("export/", SubscriptionView.as_view(action="export")),
    path("bulk-lifecycle/", SubscriptionView.as_view(action="bulk")),
    path("<int:pk>/", SubscriptionView.as_view()),
]
for suffix, action in (("analytics", "analytics"), ("history", "history"), ("payments", "payments"), ("lifecycle", "lifecycle"),
    ("prices", "prices"), ("tariffs", "tariffs"), ("cycles", "cycles"), ("meters", "meters"),
    ("appliances", "appliances"), ("appliance-preview", "appliance-preview"), ("tariff-preview", "tariff-preview"),
    ("planning-assumptions", "assumptions"), ("export", "export")):
    urlpatterns.append(path(f"<int:pk>/{suffix}/", SubscriptionView.as_view(action=action)))
urlpatterns += [
    path("<int:pk>/cycles/<int:cycle_id>/", SubscriptionView.as_view(action="cycles")),
    path("<int:pk>/cycles/<int:cycle_id>/configure/", SubscriptionView.as_view(action="configure")),
    path("<int:pk>/cycles/<int:cycle_id>/confirm/", SubscriptionView.as_view(action="confirm")),
    path("<int:pk>/cycles/<int:cycle_id>/pay/", SubscriptionView.as_view(action="pay")),
    path("<int:pk>/cycles/<int:cycle_id>/payment-candidates/", SubscriptionView.as_view(action="candidates")),
    path("<int:pk>/meters/<int:meter_id>/", SubscriptionView.as_view(action="meters")),
    path("<int:pk>/meters/<int:meter_id>/readings/", SubscriptionView.as_view(action="readings")),
    path("<int:pk>/meters/<int:meter_id>/readings/<int:reading_id>/", SubscriptionView.as_view(action="readings")),
    path("<int:pk>/meters/<int:meter_id>/events/", SubscriptionView.as_view(action="meter-events")),
    path("<int:pk>/appliances/<int:appliance_id>/", SubscriptionView.as_view(action="appliances")),
]
