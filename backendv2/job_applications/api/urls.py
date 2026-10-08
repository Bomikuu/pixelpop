from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import ApplicationViewSet, ProfileView, ResumeView, SettingsView, PostingImportView
from .answers import ReusableAnswerViewSet
from .budget_actions import OwnerUsageView

router = DefaultRouter()
router.register("applications", ApplicationViewSet, basename="job-application")
router.register("answers", ReusableAnswerViewSet, basename="reusable-answer")
urlpatterns = [path("profile/", ProfileView.as_view()), path("resume/", ResumeView.as_view()), path("usage/", OwnerUsageView.as_view()),
               path("settings/", SettingsView.as_view()), path("import-posting/", PostingImportView.as_view()),
               path("", include(router.urls))]
