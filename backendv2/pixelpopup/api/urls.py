from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    public_page_by_slug,
    verify_page_password,
    PageAdminViewSet,
    SceneAdminViewSet,
    AssetAdminViewSet,
    ClientRequestAdminViewSet,
    PaymentAdminViewSet,
)

router = DefaultRouter()
router.register(r"admin/pages", PageAdminViewSet, basename="admin-pages")
router.register(r"admin/scenes", SceneAdminViewSet, basename="admin-scenes")
router.register(r"admin/assets", AssetAdminViewSet, basename="admin-assets")
router.register(r"admin/requests", ClientRequestAdminViewSet, basename="admin-requests")
router.register(r"admin/payments", PaymentAdminViewSet, basename="admin-payments")

urlpatterns = [
    # Public
    path("public/pages/<slug:slug>/", public_page_by_slug, name="public-page-by-slug"),
    path("public/pages/<slug:slug>/verify-password/", verify_page_password, name="verify-page-password"),
    # Admin CRUD
    path("", include(router.urls)),
]
