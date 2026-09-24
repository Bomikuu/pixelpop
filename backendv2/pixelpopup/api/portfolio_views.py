from django.http import HttpResponse
from django.utils import timezone
from django.utils.text import get_valid_filename
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, mixins, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response

from pixelpopup.models import (
    Article,
    ArticleCategory,
    ArticleTag,
    CoverLetter,
    CoverLetterTemplate,
    JobApplication,
    ProfessionalProfile,
)
from .portfolio_serializers import (
    ArticleAdminSerializer,
    ArticleCategoryAdminSerializer,
    ArticleCategorySerializer,
    ArticleDetailSerializer,
    ArticleListSerializer,
    ArticleTagAdminSerializer,
    CoverLetterAdminSerializer,
    CoverLetterPublicSerializer,
    CoverLetterTemplateAdminSerializer,
    JobApplicationAdminSerializer,
    ProfessionalProfileAdminSerializer,
    ProfessionalProfilePublicSerializer,
)


class PublicProfileViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ProfessionalProfilePublicSerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"

    def get_queryset(self):
        return ProfessionalProfile.objects.filter(is_active=True)


class PublicCoverLetterViewSet(mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = CoverLetterPublicSerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"

    def get_queryset(self):
        return (
            CoverLetter.objects.filter(
                status="published",
                published_at__lte=timezone.now(),
                profile__is_active=True,
            )
            .select_related("application", "profile")
        )

    @action(detail=True, methods=["get"])
    def download(self, request, slug=None):
        cover_letter = self.get_object()
        profile = cover_letter.profile
        application = cover_letter.application
        recipient = application.recipient_name or "Hiring Manager"
        company_line = f"{application.job_title} at {application.company_name}"
        letter_text = "\n\n".join(
            [
                recipient,
                company_line,
                cover_letter.subject,
                cover_letter.opening,
                cover_letter.body,
                cover_letter.closing,
                profile.signature or profile.full_name,
                profile.email,
            ]
        )
        filename = get_valid_filename(f"{cover_letter.slug}.txt")
        response = HttpResponse(letter_text, content_type="text/plain; charset=utf-8")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response


class PublicArticleViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    lookup_field = "slug"
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = {
        "category__slug": ["exact"],
        "tags__slug": ["exact"],
        "is_featured": ["exact"],
    }
    search_fields = ["title", "excerpt", "content"]
    ordering_fields = ["published_at", "title", "updated_at"]
    ordering = ["-published_at"]

    def get_queryset(self):
        return (
            Article.objects.filter(
                status="published",
                published_at__lte=timezone.now(),
            )
            .select_related("category", "author", "author_profile")
            .prefetch_related("tags")
            .distinct()
        )

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ArticleDetailSerializer
        return ArticleListSerializer

    @action(detail=False, methods=["get"])
    def categories(self, request):
        categories = ArticleCategory.objects.order_by("order", "name")
        return Response(ArticleCategorySerializer(categories, many=True).data)


class ProfessionalProfileAdminViewSet(viewsets.ModelViewSet):
    queryset = ProfessionalProfile.objects.all()
    serializer_class = ProfessionalProfileAdminSerializer
    permission_classes = [IsAdminUser]
    lookup_field = "slug"


class CoverLetterTemplateAdminViewSet(viewsets.ModelViewSet):
    queryset = CoverLetterTemplate.objects.all()
    serializer_class = CoverLetterTemplateAdminSerializer
    permission_classes = [IsAdminUser]
    lookup_field = "slug"


class JobApplicationAdminViewSet(viewsets.ModelViewSet):
    queryset = JobApplication.objects.select_related("created_by").all()
    serializer_class = JobApplicationAdminSerializer
    permission_classes = [IsAdminUser]
    lookup_field = "slug"
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "source"]
    search_fields = ["company_name", "job_title", "recipient_name"]
    ordering_fields = ["created_at", "updated_at", "applied_at", "company_name"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class CoverLetterAdminViewSet(viewsets.ModelViewSet):
    queryset = CoverLetter.objects.select_related("application", "profile", "template").all()
    serializer_class = CoverLetterAdminSerializer
    permission_classes = [IsAdminUser]
    lookup_field = "slug"
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "profile", "template", "application"]
    search_fields = ["subject", "application__company_name", "application__job_title"]
    ordering_fields = ["created_at", "updated_at", "published_at", "version"]


class ArticleCategoryAdminViewSet(viewsets.ModelViewSet):
    queryset = ArticleCategory.objects.all()
    serializer_class = ArticleCategoryAdminSerializer
    permission_classes = [IsAdminUser]
    lookup_field = "slug"


class ArticleTagAdminViewSet(viewsets.ModelViewSet):
    queryset = ArticleTag.objects.all()
    serializer_class = ArticleTagAdminSerializer
    permission_classes = [IsAdminUser]
    lookup_field = "slug"


class ArticleAdminViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.select_related("category", "author", "author_profile").prefetch_related("tags").all()
    serializer_class = ArticleAdminSerializer
    permission_classes = [IsAdminUser]
    lookup_field = "slug"
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "category", "tags", "is_featured"]
    search_fields = ["title", "excerpt", "content"]
    ordering_fields = ["created_at", "updated_at", "published_at", "title"]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
