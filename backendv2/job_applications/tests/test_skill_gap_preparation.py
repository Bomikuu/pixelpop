import uuid

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.exceptions import ValidationError

from job_applications.api.budget_actions import QuoteSerializer
from job_applications.models import ApplicantProfile, ApplicationArtifact, ApplicationRequirementDecision, DraftProposal, GenerationRun, JobApplication
from job_applications.services.project_experience import answers_digest
from job_applications.services.requirements import requirement_key
from job_applications.services.review import ReviewConflict, accept_proposal, require_current_proposal, source_fingerprint
from job_applications.services.sections import compare_sections
from job_applications.services.skill_gap_preparation import WARNING, append_preparation, approved_preparation_body, preparation_items, skill_gap_context


class SkillGapPreparationTests(TestCase):
    def setUp(self):
        self.owner = get_user_model().objects.create_user(username="preparation-owner")
        self.profile = ApplicantProfile.objects.create(owner=self.owner, facts="Built a Django inventory system.", sources_confirmed=True)
        self.application = JobApplication.objects.create(owner=self.owner, role="Developer", company="Example", posting="Java required.")
        self.row = {"text": "Java", "posting_excerpt": "Java required.", "importance": "required", "status": "not_evidenced", "sources": [], "explanation": "No Java evidence supplied."}
        self.digest = source_fingerprint(self.application, self.profile)
        self.assessment = ApplicationArtifact.objects.create(application=self.application, kind="assessment", body="Missing Java evidence.", revision=1, requirements=[self.row], assessment_digest=self.digest)
        self.resume = ApplicationArtifact.objects.create(application=self.application, kind="resume", body="## Profile\nDjango developer.", revision=1)
        self.preparation = ApplicationArtifact.objects.create(application=self.application, kind="interview_prep", body="## Existing preparation\nPreserve this.", revision=1)
        self.selection = {"assessment_revision": 1, "requirement_key": requirement_key(self.row), "related_project_id": None, "system_type": "Inventory / POS systems", "tools": ["Java"], "example_proposal_id": None, "resume_proposal_id": None, "reference_version": None}

    def make_example(self):
        context = skill_gap_context(self.application, self.profile, self.selection, "example")
        result = append_preparation({"body": "### Illustrative implementation\n- Implement a Java inventory service as a practice exercise.", "requirements": [], "evidence": ["invented"], "warnings": []}, self.preparation.body, context, "example")
        run = GenerationRun.objects.create(application=self.application, kind="interview_prep", mode="example", status="completed", result=result, quote_snapshot={"selection": self.selection, "answers_digest": answers_digest(self.application, self.profile)})
        sections = compare_sections(self.preparation.body, result["body"])
        for section in sections:
            section["decision"] = "proposed"
        return DraftProposal.objects.create(artifact=self.preparation, generation=run, base_revision=self.preparation.revision, source_digest=self.digest, original_body=self.preparation.body, sections=sections)

    def test_quote_kind_and_selection_are_explicit(self):
        for data in [{"kinds": ["resume"], "mode": "example", "selection": self.selection}, {"kinds": ["interview_prep"], "mode": "example"}, {"kinds": ["resume"], "mode": "tailor", "selection": self.selection}]:
            self.assertFalse(QuoteSerializer(data=data).is_valid())
        self.assertTrue(QuoteSerializer(data={"kinds": ["interview_prep"], "mode": "example", "selection": self.selection}).is_valid())

    def test_wording_approval_preserves_resume_facts_and_evidence(self):
        proposal = self.make_example()
        self.assertEqual(proposal.generation.result["evidence"], [])
        self.assertIn(WARNING, proposal.generation.result["body"])
        accept_proposal(proposal, proposal.version, self.application, self.profile)
        self.resume.refresh_from_db()
        self.profile.refresh_from_db()
        self.assessment.refresh_from_db()
        self.assertEqual(self.resume.body, "## Profile\nDjango developer.")
        self.assertEqual(self.profile.facts, "Built a Django inventory system.")
        self.assertEqual(self.profile.project_experience, [])
        self.assertEqual(self.assessment.requirements[0]["status"], "not_evidenced")
        self.assertIn("Preserve this.", self.preparation.body)
        self.assertFalse(self.application.activities.filter(details__experience_confirmed=True).exists())
        self.assertFalse(self.application.generations.filter(mode="gapplan").exists())

    def test_study_uses_exact_approved_example_and_version(self):
        proposal = self.make_example()
        accept_proposal(proposal, 1, self.application, self.profile)
        selection = {**self.selection, "example_proposal_id": proposal.pk, "reference_version": proposal.version}
        context = skill_gap_context(self.application, self.profile, selection, "gapplan")
        self.assertEqual(context["approved_reference"], approved_preparation_body(proposal))
        self.assertNotIn("Preserve this.", context["approved_reference"])
        self.assertTrue(context["reference_is_hypothetical"])
        with self.assertRaises(ReviewConflict):
            skill_gap_context(self.application, self.profile, {**selection, "reference_version": 999}, "gapplan")

    def test_foreign_reference_and_project_are_rejected(self):
        with self.assertRaises(ReviewConflict):
            skill_gap_context(self.application, self.profile, {**self.selection, "example_proposal_id": 999, "reference_version": 1}, "gapplan")
        with self.assertRaises(ValidationError):
            skill_gap_context(self.application, self.profile, {**self.selection, "related_project_id": str(uuid.uuid4())}, "example")

    def test_answer_changes_block_old_proposals(self):
        proposal = self.make_example()
        ApplicationRequirementDecision.objects.create(application=self.application, requirement_key=requirement_key(self.row), requirement="Java", importance="required", decision="evidence_added", note="My actual implementation.", source_digest=self.digest)
        with self.assertRaises(ReviewConflict):
            require_current_proposal(proposal, 1, self.application, self.profile)
        self.assertTrue(preparation_items(self.application, self.profile)["items"][0]["stale"])

    def test_stale_assessment_is_rejected(self):
        self.profile.facts += " Updated sources."
        with self.assertRaises(ReviewConflict):
            skill_gap_context(self.application, self.profile, self.selection, "example")

    def test_provider_headings_stay_in_one_preparation_block(self):
        context = skill_gap_context(self.application, self.profile, self.selection, "example")
        result = append_preparation({"body": "## Implementation\nExample.\n## Trade-offs\nDetails.\n```markdown\n## Code example\n```", "requirements": [], "evidence": [], "warnings": []}, "", context, "example")
        self.assertIn("### Implementation", result["preparation_body"])
        self.assertIn("### Trade-offs", result["preparation_body"])
        self.assertIn("```markdown\n## Code example", result["preparation_body"])

    def test_rejected_example_cannot_be_used_as_an_approved_reference(self):
        proposal = self.make_example()
        for section in proposal.sections:
            section["decision"] = "original"
        accept_proposal(proposal, 1, self.application, self.profile)
        selection = {**self.selection, "example_proposal_id": proposal.pk, "reference_version": proposal.version}
        with self.assertRaises(ReviewConflict):
            skill_gap_context(self.application, self.profile, selection, "gapplan")

    def test_legacy_hypothetical_resume_proposal_cannot_be_accepted(self):
        proposal = self.make_example()
        proposal.generation.mode = "experience"
        proposal.generation.save(update_fields=["mode"])
        with self.assertRaises(ValidationError):
            accept_proposal(proposal, 1, self.application, self.profile)
