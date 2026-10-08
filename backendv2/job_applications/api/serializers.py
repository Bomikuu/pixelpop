from rest_framework import serializers

from job_applications.models import ApplicantProfile, ApplicationAISettings, JobApplication, ApplicationArtifact, ApplicationActivity, GenerationRun, DraftProposal
from job_applications.services.providers import CATALOG, validate_model
from job_applications.services.review import artifact_review_state, profile_ready, source_fingerprint
from job_applications.services.resumes import structure_resume
from job_applications.services.sections import split_sections


class ProfileSerializer(serializers.ModelSerializer):
    resume_sections = serializers.SerializerMethodField()

    def get_resume_sections(self, obj):
        # Read-only structure also works for résumé text saved before heading import.
        return split_sections(structure_resume(obj.resume_text))

    class Meta:
        model = ApplicantProfile
        exclude = ["owner"]
        read_only_fields = ["id", "updated_at"]

    def validate(self, data):
        changed = any(name in data and data[name] != getattr(self.instance, name) for name in
                      ("full_name", "email", "phone", "location", "portfolio_url", "facts", "resume_text"))
        if changed and not data.get("sources_confirmed", False):
            data["sources_confirmed"] = False
        if data.get("sources_confirmed") and not (data.get("facts", self.instance.facts).strip() or data.get("resume_text", self.instance.resume_text).strip()):
            raise serializers.ValidationError({"facts": "Add experience or résumé text before confirming sources."})
        return data


class AISettingsSerializer(serializers.ModelSerializer):
    expected_version = serializers.IntegerField(min_value=1, write_only=True, required=True)
    monthly_budget_usd = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0, allow_null=True, required=False)
    class Meta:
        model = ApplicationAISettings
        exclude = ["owner"]
        read_only_fields = ["id", "updated_at", "version"]

    def validate(self, data):
        provider = data.get("provider", self.instance.provider)
        if provider not in CATALOG:
            raise serializers.ValidationError({"provider": "Choose a supported provider from Application AI settings."})
        validate_model(provider, data.get("model", self.instance.model))
        refinement = data.get("refinement_model", self.instance.refinement_model)
        if refinement:
            validate_model(provider, refinement)
        return data


class ApplicationSerializer(serializers.ModelSerializer):
    latest_response = serializers.SerializerMethodField()
    client_link = serializers.SerializerMethodField()

    class Meta:
        model = JobApplication
        exclude = ["owner"]
        read_only_fields = ["id", "created_at", "updated_at", "linked_project", "converted_at"]

    def get_client_link(self, obj):
        if not obj.converted_at:
            return None
        project = obj.linked_project
        if not project or project.client.owner_id != obj.owner_id:
            return {"unavailable": True, "converted_at": obj.converted_at}
        return {"client_id": project.client_id, "client_name": project.client.name, "project_id": project.pk,
                "project_title": project.title, "converted_at": obj.converted_at, "unavailable": False}

    def get_latest_response(self, obj):
        record = obj.activities.filter(kind="response").first()
        return {"message": record.message[:240], "occurred_on": record.occurred_on} if record else None

    def validate_questions(self, value):
        if not isinstance(value, list) or len(value) > 40 or any(not isinstance(item, str) or not item.strip() or len(item) > 2000 for item in value):
            raise serializers.ValidationError("Use at most 40 non-empty screening questions, up to 2,000 characters each.")
        return [item.strip() for item in value]


class ArtifactSerializer(serializers.ModelSerializer):
    review = serializers.SerializerMethodField()
    requirements_stale = serializers.SerializerMethodField()

    def review_context(self, obj):
        profile = self.context.get("profile") or ApplicantProfile.objects.get(owner=obj.application.owner)
        return self.context.get("application") or obj.application, profile

    def get_review(self, obj):
        application, profile = self.review_context(obj)
        return artifact_review_state(obj, application, profile)

    def get_requirements_stale(self, obj):
        application, profile = self.review_context(obj)
        return obj.kind == "assessment" and bool(obj.body) and (not profile_ready(profile) or obj.assessment_digest != source_fingerprint(application, profile))

    class Meta:
        model = ApplicationArtifact
        exclude = ["application"]
        read_only_fields = ["id", "kind", "warnings", "evidence", "revision", "edited", "provider", "model", "updated_at", "reviewed_at", "reviewed_digest", "requirements", "assessment_digest"]


class ProposalSerializer(serializers.ModelSerializer):
    generation_mode = serializers.CharField(source="generation.mode", read_only=True)
    kind = serializers.CharField(source="artifact.kind", read_only=True)
    stale = serializers.SerializerMethodField()
    warnings = serializers.SerializerMethodField()

    def get_stale(self, obj):
        from job_applications.services.clarifications import fix_context_changed
        return (obj.base_revision != obj.artifact.revision or not profile_ready(self.context["profile"])
                or obj.source_digest != source_fingerprint(self.context["application"], self.context["profile"])
                or obj.generation.mode == "fix" and fix_context_changed(self.context["application"], obj.generation.quote_snapshot))

    def get_warnings(self, obj):
        return obj.generation.result.get("warnings", [])

    class Meta:
        model = DraftProposal
        fields = ["id", "kind", "generation_mode", "base_revision", "source_digest", "original_body", "source_reference", "sections", "version", "status", "created_at", "updated_at", "stale", "warnings"]
        read_only_fields = fields


class ProposalVersionSerializer(serializers.Serializer):
    expected_version = serializers.IntegerField(min_value=1)


class SectionDecisionSerializer(serializers.Serializer):
    id = serializers.RegexField(r"^section-\d+$", max_length=40)
    decision = serializers.ChoiceField(choices=["unreviewed", "proposed", "original"])
    proposed = serializers.CharField(max_length=30000, allow_blank=True, trim_whitespace=False)


class ProposalUpdateSerializer(ProposalVersionSerializer):
    sections = SectionDecisionSerializer(many=True, allow_empty=False)

    def validate_sections(self, value):
        if len(value) > 80 or len({item["id"] for item in value}) != len(value):
            raise serializers.ValidationError("Supply at most 80 distinct sections.")
        if sum(len(item["proposed"]) for item in value) > 30000:
            raise serializers.ValidationError("Proposed text must be at most 30,000 characters in total.")
        return value


class ManualReviewSerializer(serializers.Serializer):
    expected_revision = serializers.IntegerField(min_value=1)
    source_digest = serializers.RegexField(r"^[a-f0-9]{64}$")


class ActivitySerializer(serializers.ModelSerializer):
    kind = serializers.ChoiceField(choices=["note", "response", "follow_up", "interview"])

    class Meta:
        model = ApplicationActivity
        exclude = ["application"]
        read_only_fields = ["id", "created_at", "details"]


class GenerationSerializer(serializers.ModelSerializer):
    application_id = serializers.IntegerField(read_only=True)
    application_role = serializers.CharField(source="application.role", read_only=True)
    proposal_id = serializers.SerializerMethodField()
    proposal_status = serializers.SerializerMethodField()

    def get_proposal_id(self, obj):
        proposal = getattr(obj, "proposal", None)
        return proposal.pk if proposal else None

    def get_proposal_status(self, obj):
        proposal = getattr(obj, "proposal", None)
        return proposal.status if proposal else None

    class Meta:
        model = GenerationRun
        exclude = ["application"]


class GenerateRequestSerializer(serializers.Serializer):
    request_id = serializers.UUIDField()
    kind = serializers.ChoiceField(choices=[item[0] for item in ApplicationArtifact.KINDS])
    mode = serializers.ChoiceField(choices=["routine", "refine", "experience", "discover", "tailor", "check", "fix"], default="routine")
    expected_revision = serializers.IntegerField(min_value=0)
    confirm_replace = serializers.BooleanField(default=False)
    quote_token = serializers.CharField(max_length=12000)

    def validate(self, data):
        if data["mode"] in ("experience", "discover", "tailor", "check", "fix") and data["kind"] != "resume":
            raise serializers.ValidationError({"kind": "Résumé optimization and experience proposals apply only to the résumé."})
        return data
