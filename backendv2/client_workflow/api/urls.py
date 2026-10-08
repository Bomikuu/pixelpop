from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ChangeRequestViewSet, ChecklistItemViewSet, ClientViewSet, MasterTemplateViewSet,
    PaymentMilestoneViewSet, ProjectDocumentViewSet, ProjectViewSet, StageViewSet,
)
from .public_documents import PublicDocumentView, PublicDocumentDocxView


router = DefaultRouter()
for prefix, view in (
    ("clients", ClientViewSet),
    ("projects", ProjectViewSet),
    ("stages", StageViewSet),
    ("checklist-items", ChecklistItemViewSet),
    ("templates", MasterTemplateViewSet),
    ("documents", ProjectDocumentViewSet),
    ("payment-milestones", PaymentMilestoneViewSet),
    ("change-requests", ChangeRequestViewSet),
):
    router.register(prefix, view, basename="client-workflow-" + prefix)

urlpatterns = [
    path("documents/share/<str:token>/docx/", PublicDocumentDocxView.as_view()),
    path("documents/share/<str:token>/", PublicDocumentView.as_view()),
    path("", include(router.urls)),
]
