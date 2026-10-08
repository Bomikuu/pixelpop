# Application Action Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. For this project, preserve the user's native execution choice and no-tests/no-subagents instructions; use focused source review instead of automatic validation or independent agents.

**Goal:** Make application assessments actionable, add optional interview preparation, complete submission checks, and surface in-app follow-ups in the private Business dashboard.

**Architecture:** Extend the existing owner-scoped Django app with additive review models and focused services/actions. React consumes the existing application detail, quote/proposal/editor, modal and routing patterns; new processes live in dedicated components rather than generic form definitions. Follow-ups reuse `JobApplication.follow_up_on` and its activity ledger.

**Tech Stack:** Django, Django REST Framework, React, Tailwind CSS, existing shadcn/Radix primitives and Lucide icons; no new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-05-application-action-workflow-design.md`

**Status:** Approved and implemented natively; focused source review completed. Runtime/visual verification and migration execution were not performed.

## Global Constraints

- Surface: Private Business dashboard → Job applications; not the Personal dashboard.
- No automated applications, email sending, browser agents, push notifications, scheduled jobs, provider/key changes, or automatic paid AI calls are included.
- No dependency installation is needed.
- No tests, builds, deployment, commits, or database migration execution are authorized by this design approval.
- Keep all new endpoints under `/api/v1/job-applications/` and the existing private mixin.
- Preserve the existing circular coverage and keyword header, Needs attention beneath it, white surfaces, compact borders, dashboard typography, Tailwind styling, shadcn/Radix primitives, and circular category icons. Low visual variance and motion; medium density.
- New models and additive migration files remain inside job_applications. Do not mutate SQLite.
- Validation for this task is focused source review only. Tests/builds/browser automation require the user's explicit request. Report unverified runtime behavior honestly.
- Preserve all unrelated working-tree changes, including previously untracked files.

## Review Focus

- A concurrent save or repeated click must not append profile evidence twice, overwrite newer work, or duplicate a follow-up activity.
- Source/document changes must invalidate confirmations and applicant decisions without losing explanatory notes or unsaved form input.
- Changed requirement sets must not produce a misleading improvement percentage or hide an acknowledged required gap.
- Manual interview writing must work without an API key; opening tabs and saving forms must never make a paid call.
- Manila date boundaries, closed statuses and an empty next-date field must not silently schedule, erase or send a follow-up.

The task steps below explicitly trace these conditions through source review. Runtime cases remain unverified until testing is authorized.

---

### Task 1: Add review persistence and validated action contracts

**Files:**
- Modify: `backendv2/job_applications/models.py`
- Create: `backendv2/job_applications/migrations/0007_application_action_workflow.py`
- Create: `backendv2/job_applications/api/action_serializers.py`

**Interfaces:**
- Produces `ApplicationRequirementDecision`: application FK (`requirement_decisions`), requirement_key max64, requirement text, posting excerpt, importance, decision (`needs_review`, `evidence_added`, `not_met`), note max4000, source_digest max64, version starting1, created/updated timestamps; unique application/requirement_key.
- Produces `ApplicationSubmissionReview`: application one-to-one (`submission_review`), checks JSON, review_digest max64, version starting1, created/updated timestamps.
- Produces `RequirementDecisionSerializer`: requirement_key, assessment_revision, source_digest, expected_version (0 for new), decision, note, append_to_profile, accuracy_confirmed, expected_profile_updated_at when appending.
- Produces `SubmissionReviewSerializer`: expected_version (0 for new), review_digest, checks for exactly `rate`, `availability`, `accuracy`; states `needs_review`, `confirmed`, `not_applicable` (last state disallowed for accuracy), notes max2000; explanation required for not_applicable.
- Produces `FollowUpActionSerializer`: request_id UUID, expected_updated_at, action (`record`, `reschedule`), message max8000 for record, occurred_on, next_date nullable, empty_date_action (`keep`, `clear`) required if next_date absent. Reschedule requires a next_date or explicit clear.

- [x] Add the two owner-through-application models and `interview_prep` to artifact kinds, preserving existing choices and relationships.
- [x] Write additive migration 0007 depending on 0006, creating both models/constraint and altering artifact choices; no database command.
- [x] Add focused input serializers with explicit field/choice/length validation; reject unknown submission check keys and invalid accuracy exemption.
- [x] Source-review migration/model parity and new-record version0 handling; confirm no table/data removal or personal-dashboard change.

### Task 2: Persist gap decisions and compare real assessments

**Files:**
- Create: `backendv2/job_applications/services/requirements.py`
- Create: `backendv2/job_applications/api/requirement_actions.py`
- Modify: `backendv2/job_applications/api/views.py`

**Interfaces:**
- Consumes Task1 serializer/models, `source_fingerprint`, `ReviewConflict`, `record_activity`, existing private viewset and completed `GenerationRun.result`/`quote_snapshot`.
- Produces `requirement_key(row) -> str`: SHA256 of JSON array containing whitespace-normalized casefolded requirement text, posting_excerpt and importance.
- Produces `requirement_decisions(application, profile, assessment) -> dict`: `current` list of assessment rows enriched with server keys, matching decision/version/note and stale status, plus `historical` list of unmatched earlier decisions; view exposes these as requirement_decisions and historical_requirement_decisions.
- Produces `save_requirement_decision(application, profile, values) -> dict`: validate current saved assessment/revision/digest/key and decision version; append only on explicit accuracy-confirmed evidence; conflict on changed profile timestamp; return saved decision and whether profile changed.
- Produces `assessment_comparison(application, profile) -> dict`: latest two completed assessment results with traceable saved source digests, coverage counts, row changes, added/removed rows, historical flags, comparability flag and reason; honest unavailable state if fewer than2 usable results.
- Produces POST `applications/{id}/requirement-decision/`; detail includes `requirement_decisions`, `historical_requirement_decisions`, `assessment_comparison`.

- [x] Build keys and detail serialization from actual normalized assessment rows; never trust browser-provided snapshots.
- [x] Implement atomic write action locking application → profile → assessment → decision, checking expected versions and digests before any mutation.
- [x] Append evidence to existing facts only when requested; enforce profile facts length, reset sources_confirmed, increment decision version, record timeline action and keep applicant status distinct from AI support.
- [x] Build comparison from completed saved run results only, using the same normalized row/key function; flag changed keys/denominator or posting excerpts as not directly comparable and omit misleading coverage delta.
- [x] Wire the focused mixin and read-only detail fields without changing permissions or generation consent.
- [x] Source-review two simultaneous saves, duplicate append, stale profile/assessment, other owner's ID, missing historical results, unmatched keys and required Not met decisions. Confirm private notes never enter generation sources silently.

### Task 3: Add digest-bound submission confirmations

**Files:**
- Create: `backendv2/job_applications/services/submission.py`
- Create: `backendv2/job_applications/api/submission_actions.py`
- Modify: `backendv2/job_applications/api/views.py`
- Modify: `backendv2/job_applications/services/review.py`

**Interfaces:**
- Consumes Task1 submission serializer/model and existing computed `application_checklist`.
- Produces `submission_digest(application, profile, artifacts) -> str`: source fingerprint plus stable ordered resume/cover_letter/answers saved revision numbers (answers0 when not needed); excludes optional interview.
- Produces `submission_review_state(application, profile, artifacts) -> dict`: digest, version, fixed check rows, stale flag, completed/applicable counts and retained notes; stale confirmations treated unresolved.
- Produces `save_submission_review(application, profile, values) -> dict`: verify expected version/current digest under locks, save validated checks and timeline activity.
- Produces POST `applications/{id}/submission-review/` and detail `submission_review`; computed checklist includes combined ready/needs-review counts without mutating application status.

- [x] Implement stable digest and stale-safe state; preserve existing profile/document approvals and screening Not needed behavior.
- [x] Implement atomic confirmation save, locking application/profile and relevant artifacts before checking version/digest.
- [x] Expose detail data and add manual checks to checklist totals; submission date/status recording remains a separate unrestricted truthful action.
- [x] Source-review changed source, changed document revision, optional interview edits, unknown check keys, applicability note, stale write and other-owner access. Confirm old notes survive invalidation and no click marks Applied.

### Task 4: Extend optional interview preparation through the existing AI pipeline

**Files:**
- Modify: `backendv2/job_applications/services/generation.py`
- Modify: `backendv2/job_applications/api/views.py`
- Modify: `backendv2/job_applications/api/review_actions.py`
- Modify: `pixelpopup-frontend/src/features/business-dashboard/job-applications/api.js`
- Modify: `pixelpopup-frontend/src/features/business-dashboard/job-applications/ApplicationDetail.jsx`
- Modify: `pixelpopup-frontend/src/features/business-dashboard/job-applications/ProposalReview.jsx`
- Modify: `pixelpopup-frontend/src/features/business-dashboard/job-applications/ArtifactEditor.jsx`

**Interfaces:**
- `interview_prep` uses existing artifact save/revisions/review/proposal/quote/generate/usage interfaces; no new paid-call path.
- `labels.interview_prep = "Interview preparation"`; export `packageKinds = ["assessment", "resume", "cover_letter", "answers"]` and use it for all package readiness/prepare operations.

- [x] Extend kind allowlists/routes for save, revisions, proposals and manual review; retain existing résumé-only export security and four-item quote maximum.
- [x] Add interview prompt instructions for practice questions, source-backed examples, employer questions and explicitly unanswered gaps; do not represent suggested questions as employer-confirmed.
- [x] Add separate Interview preparation detail tab using ArtifactEditor; route quote generation, saved edits, proposal review, revision controls and activity labels through existing callbacks.
- [x] Replace implicit Object.keys(labels) package iteration with explicit packageKinds; keep interview separately selectable in proposal review and usage.
- [x] Source-review manual save without configured provider, opening tab without paid call, stale quote/proposal and package generation excluding interview. Keep preview image-free and copy/print existing controls.

### Task 5: Build gap and final-check UI with existing forms

**Files:**
- Create: `pixelpopup-frontend/src/features/business-dashboard/job-applications/RequirementDecisionForm.jsx`
- Create: `pixelpopup-frontend/src/features/business-dashboard/job-applications/AssessmentComparison.jsx`
- Create: `pixelpopup-frontend/src/features/business-dashboard/job-applications/SubmissionReviewForm.jsx`
- Modify: `pixelpopup-frontend/src/features/business-dashboard/job-applications/RequirementsComparison.jsx`
- Modify: `pixelpopup-frontend/src/features/business-dashboard/job-applications/AssessmentSummary.jsx`
- Modify: `pixelpopup-frontend/src/features/business-dashboard/job-applications/ApplicationChecklist.jsx`
- Modify: `pixelpopup-frontend/src/features/business-dashboard/job-applications/ApplicationDetail.jsx`
- Modify: `pixelpopup-frontend/src/features/business-dashboard/job-applications/JobApplicationsView.jsx`

**Interfaces:**
- Forms receive `record`, relevant row/state, `onCancel`, `onSaved`, `notify`; requirement form also receives `profile` and `onProfileChanged`.
- `AssessmentComparison({ comparison })` renders history counts, comparable percentage-point delta and change rows, or icon empty state.
- RequirementsComparison receives decisions and `onResolve(row)`; AssessmentCoverage/AssessmentSummary receive active applicant decisions.
- SubmissionReviewForm submits Task3 digest/version and fixed checks; ApplicationChecklist adds a final-check action.

- [x] Read PRODUCT.md, DESIGN.md, DESIGN_GUIDELINES.md and required UI skills before product UI edits; preserve low variance/motion and medium density rather than redesigning the header.
- [x] Add dedicated modal forms using FormModalShell/FormField and current Select/input/checkbox components, field errors, visible required labels and icon-bearing buttons. Preserve entries on API failure.
- [x] Show explicit profile append/accuracy controls only for Evidence added, with shared-profile/source-reconfirmation warning; refresh parent profile after append without marking sources confirmed automatically.
- [x] Add Resolve gap buttons, manual-vs-AI status labels, historical/reconfirmation notes and comparison panel to Requirements; keep gap navigation working.
- [x] Prevent Strong alignment for active required Not met decisions without changing supported denominator/counts; never boost coverage for a manual decision.
- [x] Add manual confirmation state and final-check modal to existing checklist; retain separate actual-submission action.
- [x] Source-review mobile field stacking, busy/unsaved guards, retained errors, label associations, dialog focus and notes on stale records; ensure profile refresh invalidates other relevant display state.

### Task 6: Add atomic owner-scoped follow-ups and routed queue

**Files:**
- Create: `backendv2/job_applications/services/followups.py`
- Create: `backendv2/job_applications/api/followup_actions.py`
- Modify: `backendv2/job_applications/api/views.py`
- Reuse unchanged: `backendv2/job_applications/services/timeline.py`
- Create: `pixelpopup-frontend/src/features/business-dashboard/job-applications/ApplicationFollowUps.jsx`
- Create: `pixelpopup-frontend/src/features/business-dashboard/job-applications/FollowUpForm.jsx`
- Modify: `pixelpopup-frontend/src/features/business-dashboard/job-applications/JobApplicationsView.jsx`
- Modify: `pixelpopup-frontend/src/features/business-dashboard/job-applications/ApplicationDetail.jsx`
- Modify: `pixelpopup-frontend/src/features/business-dashboard/BusinessDashboard.jsx`

**Interfaces:**
- GET `applications/follow-ups/?range=due|upcoming&page=N`: owner-only ready/applied/interviewing scheduled rows, Manila dates, date/id ordering, existing WorkflowPagination and latest response field.
- POST `applications/{id}/follow-up/`: Task1 validated payload; returns saved follow_up_on/updated_at plus activity when recorded and replay indicator.
- `apply_follow_up(application, values) -> dict`: under application lock, check request UUID replay before timestamp, verify eligible status, create actual follow_up activity and change next_date/clear/keep atomically; use record_application_changes for old/new scheduling.
- `/business/applications/followups` → initialTab `followups`; Follow-ups tab offers Due/Upcoming and existing WorkflowPages.
- `FollowUpForm({ record, mode, onCancel, onSaved, notify })` handles record/reschedule, UUID stable for retries, expected_updated_at and explicit empty-date behavior.

- [x] Implement queue filter/pagination with Manila today; Ready rows explicitly labeled pre-submission next action.
- [x] Implement atomic action and idempotency through existing ApplicationActivity.details request UUID scoped to locked application. Store normalized original payload with request metadata; replay identical request, conflict on changed reuse. Include reschedule-only requests in the activity ledger even when the date is unchanged.
- [x] Recheck ownership/status/date/timestamp before creation; do not send messages or create duplicate task/reminder records. Preserve existing timeline date-entry conventions and use next_date only for the explicit follow-up schedule.
- [x] Add routing, tab, relative due/date/status/latest reply rows with Open, Record follow-up and Reschedule actions; use current toast, circular icons and semantic urgency.
- [x] Reuse FollowUpForm from detail Timeline action and queue; refresh list/detail after saved changes and retain user input on stale/error response.
- [x] Source-review before/after Manila midnight, due today, excluded statuses, identical/different UUID retries, clear/keep distinction and partial-write rollback. Confirm no scheduler, API auto-call or hidden follow-up date selection.

### Task 7: Focused integration source review and handoff

**Files:**
- Modify: `backendv2/job_applications/README.md`
- Update: this plan's completed checkboxes and the linked spec's implementation status.

- [x] Review changed files only: Python imports/model/migration alignment, action route names, serializers and lock order; React import/export names, props, kind maps, form state and route validation.
- [x] Trace all five Review Focus conditions across backend and UI; fix only issues caused by or blocking these four approved features. Do not run tests, builds, linters, typechecks, migrations or browser automation.
- [x] Document new feature contracts, interview's optional nature and in-app-only follow-ups; state migration0007 must be applied separately before using new endpoints.
- [x] Report actual implementation, files/features and remaining unverified runtime behavior. No commits, push, deployment, dependency changes or SQLite edits.

## Plan self-review

All four spec sections map to Tasks2–6; Task1 provides additive persistence/contracts and Task7 covers the source-only handoff. Interfaces consistently use server requirement keys, source/revision/version guards, fixed check keys, existing proposal quotes and client request UUIDs. Runtime validation and migration application remain explicitly deferred under project instructions.

## Execution handoff

Native execution and the written plan were approved before product implementation. No subagents were dispatched. Implementation is complete with source-only review; apply migration 0007 separately before use. No tests/builds, browser automation, live AI calls, database changes, commits, pushes or deployment were performed.
