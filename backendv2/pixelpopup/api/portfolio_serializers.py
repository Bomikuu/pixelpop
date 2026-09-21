from rest_framework import serializers

from pixelpopup.models import (
    Article,
    ArticleCategory,
    ArticleTag,
    CoverLetter,
    CoverLetterTemplate,
    JobApplication,
    ProfessionalProfile,
)


class ProfessionalProfilePublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfessionalProfile
        fields = (
            "slug",
            "full_name",
            "headline",
            "professional_summary",
            "email",
            "location",
            "website_url",
            "linkedin_url",
            "github_url",
            "resume_url",
            "signature",
        )


class JobApplicationPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobApplication
        fields = (
            "company_name",
            "company_website",
            "job_title",
            "recipient_name",
            "recipient_title",
        )


class CoverLetterPublicSerializer(serializers.ModelSerializer):
    application = JobApplicationPublicSerializer(read_only=True)
    profile = ProfessionalProfilePublicSerializer(read_only=True)

    class Meta:
        model = CoverLetter
        fields = (
            "slug",
            "version",
            "subject",
            "opening",
            "body",
            "closing",
            "highlights",
            "published_at",
            "application",
            "profile",
        )


class ArticleCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ArticleCategory
        fields = ("name", "slug", "description", "order")


class ArticleTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArticleTag
        fields = ("name", "slug")


class ArticleListSerializer(serializers.ModelSerializer):
    category = ArticleCategorySerializer(read_only=True)
    tags = ArticleTagSerializer(many=True, read_only=True)
    author = ProfessionalProfilePublicSerializer(source="author_profile", read_only=True)
    author_name = serializers.CharField(source="author_profile.full_name", read_only=True)
    cover_image_url = serializers.SerializerMethodField()
    reading_time_minutes = serializers.SerializerMethodField()

    class Meta:
        model = Article
        fields = (
            "slug",
            "title",
            "excerpt",
            "category",
            "tags",
            "author",
            "author_name",
            "cover_image_url",
            "cover_image_alt",
            "is_featured",
            "published_at",
            "reading_time_minutes",
        )

    def get_cover_image_url(self, obj) -> str:
        if not obj.cover_image:
            return ""
        request = self.context.get("request")
        return request.build_absolute_uri(obj.cover_image.url) if request else obj.cover_image.url

    def get_reading_time_minutes(self, obj) -> int:
        return max(1, round(len(obj.content.split()) / 200))


class ArticleDetailSerializer(ArticleListSerializer):
    class Meta(ArticleListSerializer.Meta):
        fields = ArticleListSerializer.Meta.fields + (
            "content",
            "content_format",
            "seo_title",
            "seo_description",
            "updated_at",
        )


class ProfessionalProfileAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfessionalProfile
        fields = (
            "id",
            "slug",
            "full_name",
            "headline",
            "professional_summary",
            "email",
            "phone",
            "location",
            "website_url",
            "linkedin_url",
            "github_url",
            "resume_url",
            "signature",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("created_at", "updated_at")


class CoverLetterTemplateAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = CoverLetterTemplate
        fields = (
            "id",
            "name",
            "slug",
            "description",
            "subject_template",
            "opening_template",
            "body_template",
            "closing_template",
            "default_highlights",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("created_at", "updated_at")


class JobApplicationAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobApplication
        fields = (
            "id",
            "slug",
            "company_name",
            "company_website",
            "job_title",
            "job_url",
            "recipient_name",
            "recipient_title",
            "recipient_email",
            "source",
            "job_description",
            "notes_private",
            "status",
            "applied_at",
            "created_by",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("created_at", "updated_at")


class CoverLetterAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = CoverLetter
        fields = (
            "id",
            "application",
            "profile",
            "template",
            "slug",
            "version",
            "subject",
            "opening",
            "body",
            "closing",
            "highlights",
            "status",
            "published_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("created_at", "updated_at")


class ArticleCategoryAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArticleCategory
        fields = ("id", "name", "slug", "description", "order")


class ArticleTagAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArticleTag
        fields = ("id", "name", "slug")


class ArticleAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Article
        fields = (
            "id",
            "title",
            "slug",
            "excerpt",
            "content",
            "content_format",
            "category",
            "tags",
            "author",
            "author_profile",
            "cover_image",
            "cover_image_alt",
            "seo_title",
            "seo_description",
            "status",
            "is_featured",
            "published_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("author_profile", "created_at", "updated_at")
