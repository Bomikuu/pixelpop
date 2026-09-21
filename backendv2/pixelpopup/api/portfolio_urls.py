from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .portfolio_views import (
    ArticleAdminViewSet,
    ArticleCategoryAdminViewSet,
    ArticleTagAdminViewSet,
    CoverLetterAdminViewSet,
    CoverLetterTemplateAdminViewSet,
    JobApplicationAdminViewSet,
    ProfessionalProfileAdminViewSet,
    PublicArticleViewSet,
    PublicCoverLetterViewSet,
    PublicProfileViewSet,
)


router = DefaultRouter()
router.register(r"profiles", PublicProfileViewSet, basename="portfolio-profiles")
router.register(r"cover-letters", PublicCoverLetterViewSet, basename="portfolio-cover-letters")
router.register(r"articles", PublicArticleViewSet, basename="portfolio-articles")
router.register(r"admin/profiles", ProfessionalProfileAdminViewSet, basename="portfolio-admin-profiles")
router.register(r"admin/cover-letter-templates", CoverLetterTemplateAdminViewSet, basename="portfolio-admin-cover-letter-templates")
router.register(r"admin/job-applications", JobApplicationAdminViewSet, basename="portfolio-admin-job-applications")
router.register(r"admin/cover-letters", CoverLetterAdminViewSet, basename="portfolio-admin-cover-letters")
router.register(r"admin/article-categories", ArticleCategoryAdminViewSet, basename="portfolio-admin-article-categories")
router.register(r"admin/article-tags", ArticleTagAdminViewSet, basename="portfolio-admin-article-tags")
router.register(r"admin/articles", ArticleAdminViewSet, basename="portfolio-admin-articles")

urlpatterns = [path("", include(router.urls))]
