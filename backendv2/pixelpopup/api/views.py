from django.utils import timezone
from django.shortcuts import get_object_or_404

from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.decorators import action
from rest_framework.permissions import IsAdminUser, AllowAny
from rest_framework.response import Response

from pixelpopup.models import Page, Scene, Asset, ClientRequest, Payment
from .serializers import (
    PageSerializer,
    SceneSerializer,
    AssetSerializer,
    ClientRequestSerializer,
    PaymentSerializer,
)
from pixelpopup.api.template_io import export_page_template, import_page_template

# ---------- Public read-only endpoint ----------
@api_view(["GET"])
@permission_classes([AllowAny])
def public_page_by_slug(request, slug: str):
    """
    Minimal public endpoint:
    - Only returns published pages
    - Enforces expires_at
    - Does NOT handle password verification here (recommended separate endpoint)
    """
    now = timezone.now()
    page = get_object_or_404(Page, slug=slug, status="published")

    if page.expires_at and page.expires_at <= now:
        return Response({"detail": "This page has expired."}, status=status.HTTP_410_GONE)

    # If password is enabled, you can either:
    # A) return limited metadata and require a /verify-password call, OR
    # B) allow full content but frontend must prompt anyway
    # MVP suggestion: return flag only, and require verify call to fetch full payload
    if page.password_enabled:
        return Response(
            {
                "slug": page.slug,
                "title": page.title,
                "password_required": True,
                "theme_id": page.theme_id,
                "theme_settings": page.theme_settings,
            },
            status=status.HTTP_200_OK,
        )

    return Response(PageSerializer(page, context={"request": request}).data, status=status.HTTP_200_OK)


# OPTIONAL: password verification endpoint (simple, still minimal)
@api_view(["POST"])
@permission_classes([AllowAny])
def verify_page_password(request, slug: str):
    """
    Body: { "password": "..." }
    Returns full Page payload if correct.
    """
    from django.contrib.auth.hashers import check_password

    now = timezone.now()
    page = get_object_or_404(Page, slug=slug, status="published")

    if page.expires_at and page.expires_at <= now:
        return Response({"detail": "This page has expired."}, status=status.HTTP_410_GONE)

    if not page.password_enabled:
        return Response(PageSerializer(page, context={"request": request}).data)

    password = (request.data or {}).get("password", "")
    if not password or not page.password_hash or not check_password(password, page.password_hash):
        return Response({"detail": "Invalid password."}, status=status.HTTP_403_FORBIDDEN)

    return Response(PageSerializer(page, context={"request": request}).data, status=status.HTTP_200_OK)


# ---------- Admin CRUD (staff only) ----------
class PageAdminViewSet(viewsets.ModelViewSet):
    queryset = Page.objects.all().order_by("-updated_at")
    serializer_class = PageSerializer
    permission_classes = [IsAdminUser]

    @action(detail=True, methods=["post"])
    def preflight(self, request, pk=None):
        page = self.get_object()
        result = run_page_preflight(page)
        return Response(result, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        page = self.get_object()
        result = run_page_preflight(page)
        if not result["ok"]:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)

        page.status = "published"
        page.save(update_fields=["status", "updated_at"])
        return Response(
            {"ok": True, "message": "Page published.", "page_id": page.id, "slug": page.slug},
            status=status.HTTP_200_OK,
        )
        
    @action(detail=True, methods=["get"])
    def export(self, request, pk=None):
        page = self.get_object()
        payload = export_page_template(page, request=request)
        return Response(payload, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], url_path="import")
    def import_template(self, request):
        """
        Body:
        {
          "template": { ...export json... },
          "slug": "new-slug",
          "title": "optional title",
          "owner_id": 1,
          "reuse_assets_by_filename": true
        }
        """
        template = (request.data or {}).get("template")
        slug = (request.data or {}).get("slug")
        title = (request.data or {}).get("title")
        owner_id = (request.data or {}).get("owner_id")
        reuse_assets = (request.data or {}).get("reuse_assets_by_filename", True)

        if not isinstance(template, dict):
            return Response({"detail": "template must be an object"}, status=status.HTTP_400_BAD_REQUEST)
        if not slug or not isinstance(slug, str):
            return Response({"detail": "slug is required"}, status=status.HTTP_400_BAD_REQUEST)

        page, report = import_page_template(
            template,
            slug=slug,
            title=title,
            owner_id=owner_id,
            reuse_assets_by_filename=bool(reuse_assets),
        )

        return Response(
            {"ok": True, "page_id": page.id, "slug": page.slug, "report": report},
            status=status.HTTP_201_CREATED,
        )



class SceneAdminViewSet(viewsets.ModelViewSet):
    queryset = Scene.objects.select_related("page").all()
    serializer_class = SceneSerializer
    permission_classes = [IsAdminUser]


class AssetAdminViewSet(viewsets.ModelViewSet):
    queryset = Asset.objects.select_related("page").all()
    serializer_class = AssetSerializer
    permission_classes = [IsAdminUser]


class ClientRequestAdminViewSet(viewsets.ModelViewSet):
    queryset = ClientRequest.objects.select_related("assigned_to", "page").all().order_by("-updated_at")
    serializer_class = ClientRequestSerializer
    permission_classes = [IsAdminUser]


class PaymentAdminViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related("request").all().order_by("-updated_at")
    serializer_class = PaymentSerializer
    permission_classes = [IsAdminUser]
