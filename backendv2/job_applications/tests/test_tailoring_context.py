import copy
import uuid
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from job_applications.api.action_serializers import RequirementDecisionSerializer
from job_applications.api.serializers import ProfileSerializer
from job_applications.models import ApplicantProfile, ApplicationAISettings, ApplicationRequirementDecision, JobApplication
from job_applications.services.budget import quote_generations, verify_quote
from job_applications.services.project_experience import answers_digest, project_experience_text, tailoring_context
from job_applications.services.review import ReviewConflict, normalize_requirements, source_fingerprint


class TailoringContextTests(TestCase):
    def setUp(self):
        self.owner = get_user_model().objects.create_user(username="tailoring-owner")
        self.profile = ApplicantProfile.objects.create(owner=self.owner, facts="Built a React CMS.", resume_text="## Profile\nReact developer.", sources_confirmed=True)
        self.settings = ApplicationAISettings.objects.create(owner=self.owner)
        self.application = JobApplication.objects.create(owner=self.owner, role="Developer", company="Example", posting="Build a Java inventory service.")
        self.project = {"id": str(uuid.uuid4()), "name": "Independent CMS", "system_type": "Custom CMS websites", "context": "independent", "tools": ["React", "Django"], "contributions": "Implemented inventory administration.", "outcomes": "", "year": None, "status": "confirmed"}

    def test_empty_projects_preserve_profile_and_legacy_digest(self):
        before = source_fingerprint(self.application, self.profile)
        serializer = ProfileSerializer(self.profile, data={"project_experience": []}, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        self.assertEqual(self.profile.facts, "Built a React CMS.")
        self.assertTrue(self.profile.sources_confirmed)
        self.assertEqual(before, source_fingerprint(self.application, self.profile))

    def test_project_edit_resets_confirmation_and_changes_sources(self):
        before = source_fingerprint(self.application, self.profile)
        serializer = ProfileSerializer(self.profile, data={"project_experience": [self.project]}, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        self.assertFalse(self.profile.sources_confirmed)
        self.assertNotEqual(before, source_fingerprint(self.application, self.profile))

    def test_validation_requires_contributions_and_unique_ids(self):
        for projects in [[self.project, self.project], [{**self.project, "contributions": ""}], [{**self.project, "extra": "unknown"}], [{**self.project, "year": 9999}]]:
            with self.subTest(projects=projects):
                serializer = ProfileSerializer(self.profile, data={"project_experience": projects}, partial=True)
                self.assertFalse(serializer.is_valid())
                self.assertIn("project_experience", serializer.errors)

    def test_unconfirmed_projects_never_supply_evidence(self):
        self.profile.project_experience = [{**self.project, "status": "unconfirmed"}]
        self.assertEqual(project_experience_text(self.profile), "")
        self.profile.project_experience = [self.project]
        self.assertIn(self.project["contributions"], project_experience_text(self.profile))
        row = {"text": "Inventory service", "posting_excerpt": "inventory service", "importance": "required", "status": "supported", "sources": [{"source": "project_experience", "excerpt": self.project["contributions"]}], "explanation": "Recorded implementation."}
        self.assertEqual(normalize_requirements([row], self.application, self.profile)[0]["status"], "supported")
        self.profile.project_experience[0]["status"] = "unconfirmed"
        self.assertEqual(normalize_requirements([row], self.application, self.profile)[0]["status"], "not_evidenced")

    def test_only_current_confirmed_answers_are_sources(self):
        digest = source_fingerprint(self.application, self.profile)
        before = answers_digest(self.application, self.profile)
        for index, decision in enumerate(["needs_review", "not_met", "evidence_added"]):
            ApplicationRequirementDecision.objects.create(application=self.application, requirement_key=str(index) * 64, requirement="Java", importance="required", decision=decision, note=decision, source_digest=digest)
        context = tailoring_context(self.application, self.profile, self.settings)
        self.assertEqual(context["applicant_answers"], [{"requirement": "Java", "note": "evidence_added"}])
        self.assertNotEqual(before, answers_digest(self.application, self.profile))

    def test_fact_confirmation_is_separate_from_wording_approval(self):
        data = {"requirement_key": "a" * 64, "assessment_revision": 1, "source_digest": "b" * 64, "expected_version": 0, "decision": "evidence_added", "note": "I implemented the service."}
        serializer = RequirementDecisionSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("accuracy_confirmed", serializer.errors)
        serializer = RequirementDecisionSerializer(data={**data, "accuracy_confirmed": True})
        self.assertTrue(serializer.is_valid(), serializer.errors)

    @patch("job_applications.services.budget.model_price", return_value=None)
    @patch("job_applications.services.budget.validate_model")
    @patch("job_applications.services.budget.configured", return_value=True)
    def test_setting_changes_invalidate_quote_without_changing_draft(self, *_mocks):
        quote = quote_generations(self.application, self.profile, self.settings, ["resume"], "tailor")["items"][0]
        self.settings.tailoring_emphasis = "strong"
        self.settings.version += 1
        self.settings.save()
        with self.assertRaises(ReviewConflict):
            verify_quote(self.application, self.profile, self.settings, {"kind": "resume", "mode": "tailor", "expected_revision": 0, "quote_token": quote["quote_token"]})
        self.assertEqual(self.profile.resume_text, "## Profile\nReact developer.")

    def test_profile_endpoint_is_owner_scoped(self):
        other = get_user_model().objects.create_user(username="other-tailoring-owner")
        ApplicantProfile.objects.create(owner=other, project_experience=[copy.deepcopy(self.project)])
        client = APIClient()
        client.force_authenticate(self.owner)
        response = client.get("/api/v1/job-applications/profile/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["project_experience"], [])
