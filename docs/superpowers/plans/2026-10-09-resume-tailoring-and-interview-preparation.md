# Resume Tailoring and Interview Preparation Implementation Plan

> **For agentic workers:** Implement task-by-task using native execution in this session. Do not dispatch subagents unless explicitly requested. The optional superpowers execution skills are not available in this session; follow the project instructions directly.

**Goal:** Reuse additional ASTA and independent project experience across postings, generate editable hypothetical experience proposals inside Tailor résumé, distinguish wording approval from factual confirmation, and link reviewed examples and confirmed résumé changes to Interview preparation.

**Architecture:** Extend the existing Django applicant profile and AI settings, not a second résumé system. Preserve the existing signed cost quotes, generation records, section-by-section proposal review, revision history, and download templates. Keep practice material separate from résumé facts and self-reported confirmed experience separate from independently verified evidence.

**Tech Stack:** Django/DRF, React, Tailwind, existing shadcn/Radix controls, Lucide icons, existing AI provider adapters.

**Spec:** The design brief below consolidates the in-chat proposals the user asked to plan. This expanded plan requires review before implementation.

## Global Constraints

- Business dashboard only; preserve personal-dashboard and public portfolio behavior.
- Reuse existing forms, editor, choice tiles, dialogs, and cost approval. Keep new form processes in separate files.
- No new dependencies.
- Hypothetical project-style examples are allowed as explicitly labeled practice proposals. Do not present them as completed work, attach them to an employer, or fabricate clients, dates, qualifications, metrics, outcomes, or proficiency.
- Selecting a skill, reviewing a proposal, and confirming actual experience are separate actions. None constitutes independent verification.
- No automatic AI calls, retries, document replacement, application submission, or paid generation of interview notes.
- Existing profile and résumé content must survive the migration unchanged.
- No tests, builds, migrations, commits, or deployment commands run without user authorization. Proposed tests below are acceptance criteria; running them needs separate approval.

## Design Brief

### Existing implementation

Selectable Frontend, Backend, DevOps, and System types tags already exist in Application profile. They edit `facts` through the existing profile endpoint. Source-backed Tailor résumé already exists under an application's Checks tab. Hypothetical experience proposals and Interview preparation also exist, but are not connected to the requested reusable project and gap-preparation workflow.

### Additional project experience

Add a separate editable project list in Application profile. Each record has a descriptive system name, type, ASTA/independent/client context, tools, actual personal contributions, optional year, optional outcomes, and a confirmation state. Customer names are optional and omitted from generated materials unless supplied. A descriptive name such as Inventory Management System is acceptable; never manufacture a historical project from a requirement.

The user's reported background includes React, Vue, Nuxt, Next.js, Django/Python, custom CMS websites, inventory/POS, restaurant systems, and local-business landing pages. Reported DevOps tools include Docker, Linux, Nginx, CI/CD, AWS, Vercel, Netlify, and migrations. Do not silently create project records or infer specific AWS services, scale, deployment architecture, metrics, or years from these lists. Skill suggestions remain explicit user selections.

### Tailoring parameters

Application AI settings gains two reusable defaults:

- `tailoring_emphasis`: `conservative` or `strong`, default `conservative`. Strong changes emphasis and wording, not the evidence standard. It elevates relevant confirmed independent/ASTA contributions and naturally uses supported posting terminology.
- `unconfirmed_claims`: `review_questions` or `exclude`, default `review_questions`. Questions surfaces the highest-priority unresolved requirement; Exclude omits unsupported résumé additions while retaining gap visibility in assessment/preparation.

Show both settings in Checks → Tailor résumé with an Edit tailoring settings shortcut. Changing settings must not overwrite existing drafts or automatically generate anything.

### Hypothetical Experience Proposals Inside Tailor Resume

Add **Generate experience examples** beside the existing source-backed tailoring action. This is the user's requested dummy-example workflow, not another skill-tag picker. The user selects requirement gaps, project themes/system types, and suggested tools. Selected unfamiliar tools are proposal parameters, not confirmed profile skills. Show the selected parameters in a compact review dialog before the cost estimate; do not silently persist them into `facts`.

For example, a missing Java requirement and an inventory/POS theme can produce a hypothetical Java implementation example with editable résumé-style bullets. Label the example **Hypothetical — not confirmed work**. Use a descriptive project theme, no fabricated customer or year, no invented metrics, and no attachment to ASTA or another employer. Keep existing genuine contributions intact when illustrating how a missing tool could relate to them.

The state transition is explicit:

1. **Generated example:** editable wording in a separate pending proposal; the saved résumé is unchanged.
2. **Approve example for preparation:** the user approves wording/theme for study. This does not confirm that the work happened or change requirement evidence status.
3. **Confirm actual contribution:** a separate action lets the user enter/correct what actually happened and attest that it is accurate. Save that as an application clarification or reusable project record, then invalidate stale source-dependent assessments/quotes. No proof upload or automatic study-completion inference is required.
4. **Review résumé inclusion:** confirmed facts become eligible for a new source-backed tailoring proposal; the normal section review controls apply before saving the résumé.

Unconfirmed examples stay outside downloadable résumé text. They remain available for preparation and future correction even if the user approves their wording. Avoid a single ambiguous Approve button that conflates these stages.

After wording approval, offer **Prepare for this example**. After confirmed résumé inclusion, offer **Prepare for these résumé changes**. Both open the existing cost approval flow before an AI call. The system retains the originating requirement/example/proposal revision so preparation addresses the actual reviewed content, not a generic Java tutorial. Approval must never automatically trigger a paid second generation.

### One-question clarification

When there is a fresh assessment, choose one unresolved required requirement first, then preferred, then unspecified, retaining assessment order within each group. Ask where/how the applicant used that requirement. Responses are Confirm experience with actual details, Not used, or Leave unresolved. Reuse the existing requirement-decision endpoint and version/digest guards. Other gaps stay visible; answering one must not imply all requirements are satisfied. If there is no current assessment, offer Reassess fit rather than generating against stale requirements.

### Close this skill gap

Add an action to partial/not-evidenced requirements. It opens a short dialog showing the gap and optionally a related real project from the profile. It offers:

- Add a factual clarification without an AI call.
- Generate a hypothetical experience example using the same parameter/review workflow as Tailor résumé.
- Prepare an interview study plan, after explicit cost approval.

Preparation covers a refresher or study path, a related practice-project exercise, likely technical questions, implementation trade-offs, and proposed talking-point wording labeled as unconfirmed where unsupported. Clearly distinguish **Refresh confirmed experience** from **Study an unfamiliar requirement**. Include the approved example or confirmed résumé contribution, why it matters for this posting, how to implement/test the exercise, questions about design decisions, and answers grounded in available facts. This is practice material, not historical experience. Review approval saves preparation, not project completion or résumé evidence. The user can separately update their actual experience and explicitly confirm it later; proof uploads are not required.

### Review and export

Confirmed project details may support a pending tailored résumé proposal. Every changed section retains its before/after comparison, rationale, and traceable sources. Preserve the existing original and ATS-friendly templates, editable section order, copy, print, and Word/PDF downloads. Study-plan content lives in Interview preparation and never gets appended automatically to résumé downloads. No acceptance probability or invented ATS score.

## Review Focus

1. Existing profiles without new fields retain their facts, résumé text, and confirmation state after migration.
2. Profile edits after a cost quote invalidate that quote and pending source-dependent reviews; saved drafts remain intact.
3. Settings changes in another tab require a new quote without invalidating unrelated manual draft text.
4. Selecting parameters or approving hypothetical wording never confirms a contribution, changes evidence status, or inserts the example into résumé exports.
5. Repeated/stale study-plan requests, provider errors, budget limits, and cross-owner requests preserve drafts and obey existing access controls.

## File Map

Backend changes stay in `backendv2/job_applications/`:

- Modify `models.py`, `api/serializers.py`, `services/review.py` for profile/settings persistence and source digests.
- Create `api/project_serializers.py` and `services/project_experience.py` for project validation and source formatting.
- Create additive migration `migrations/0008_tailoring_project_experience.py`, dependent on `0007_application_action_workflow` (recheck the latest migration before execution).
- Modify `services/resume_optimization.py`, `services/generation.py`, and `services/budget.py` to consume settings/projects and support quoted gap preparation.
- Create `services/skill_gap_preparation.py` to isolate hypothetical-example and study-plan prompts/context.
- Modify `api/budget_actions.py` and generation request serializers for the new preparation mode.
- Modify `services/requirements.py` and `api/requirement_actions.py` only as needed to expose current user-confirmed answers to the tailoring context.
- Create focused tests in `tests/test_tailoring_context.py` and `tests/test_skill_gap_preparation.py`, with `tests/__init__.py`.

Frontend changes stay in `pixelpopup-frontend/src/features/business-dashboard/job-applications/`:

- Modify `ApplicantProfileForm.jsx`; create `ProjectExperienceEditor.jsx` and `ProjectExperienceForm.jsx`.
- Modify `ApplicationAISettings.jsx`; create `TailoringPreferences.jsx`.
- Modify `ResumeOptimization.jsx` and `ApplicationDetail.jsx` for parameter visibility and action wiring.
- Create `TailoringClarificationForm.jsx`, `SkillGapPreparationForm.jsx`, and `ExperienceExampleReview.jsx` for parameter selection, separate example decisions, and actual-contribution confirmation.
- Modify `RequirementsComparison.jsx` for Close this skill gap.
- Create `InterviewGapPreparation.jsx` for compact study-plan summaries and links to the existing preparation editor/review.
- Preserve `ProfileSkillSuggestions.jsx` and existing document/template components unless integration specifically requires a small change.

## Task 1 — Persist Project Experience and Tailoring Defaults

**Interfaces:**

- `ApplicantProfile.project_experience`: JSON list, default `[]`, maximum 30 records.
- Record shape: `{id: UUID, name: string[1..160], system_type: string[1..80], context: asta|independent|client, tools: string[0..40][1..80], contributions: string[0..4000], outcomes: string[0..2000], year: integer|null, status: unconfirmed|confirmed}`.
- Year is optional; when supplied, validate 1900 through the current Manila year. Confirmed records require nonempty personal contributions. Unknown keys, duplicate IDs, and malformed records get field-level validation errors. Total serialized project text is capped at 30,000 characters.
- Existing `GET/PATCH profile/` reads/writes this list. Editing it resets `sources_confirmed`, matching existing profile editing.
- AI settings reads/writes the two enums through existing `GET/PATCH settings/` and `expected_version` handling.

- [x] Add nested serializers and model fields; preserve existing fields and defaults.
- [x] Add the non-destructive migration; do not run it before authorization.
- [x] Implement `project_experience_text(profile, confirmed_only=True) -> str` with deterministic formatting/order. Include actual tools/contributions, omit absent years/outcomes, and exclude unconfirmed records.
- [x] Add project records to `source_fingerprint()`; old reports become stale after actual source changes, not because a skill suggestion was displayed.
- [ ] Pin acceptance cases: old-profile round trip, empty projects, malformed nested data, duplicate IDs, unconfirmed filtering, changing project text resetting confirmation/digest, owner isolation.

## Task 2 — Add the Reusable Project and Preference UI

**Interfaces:**

- `ProjectExperienceEditor({value, onChange, disabled})` manages the controlled project list inside the existing profile draft; no separate autosave.
- `ProjectExperienceForm({record, onChange, onDone, disabled, validationErrors})` edits one record inline inside the profile draft using shared form fields and inline errors; Save profile persists it.
- `TailoringPreferences({value, onChange, disabled, errors})` renders two compact choice groups using existing ChoiceTiles.

- [x] Add compact project rows below skill suggestions, with Add project, edit, and remove controls. Display confirmation status, system type, and tools; expand long contributions explicitly.
- [x] Keep confirmation separate from suggestions. Allow saving unconfirmed records without enabling them as generation evidence.
- [x] Use an optional year field, tool tags, context/type dropdowns, and full-width contribution/outcome text areas. Preserve unsaved profile text and existing modal behavior; do not create a nested modal unless the current modal stack supports it.
- [x] Add conservative/strong and review-questions/exclude controls to Application AI settings, preserving its save/version and provider selection flow.
- [ ] Manual acceptance checklist: add/edit/remove round trip; confirmation resets; disabled saving state; keyboard controls; narrow-screen wrapping; fields show inline errors; cancellation keeps the previously saved profile.

## Task 3 — Connect Source-Backed Tailoring and One Priority Question

**Interfaces:**

- `tailoring_context(application, profile, preferences) -> dict`: exact keys `emphasis`, `unconfirmed_claims`, `confirmed_project_experience`, `applicant_answers`.
- Source quotations gain `project_experience` as a named source, validated against `project_experience_text(profile)`, not against model-generated prose.
- `TailoringClarificationForm` posts the selected requirement through the existing requirement-decision contract; no AI call is made to choose or save the question.

- [x] Add context to the shared generation-content builder so assessment, résumé tailoring, answers, and interview preparation use the same confirmed project sources.
- [x] Update assessment/source schemas and source validators to recognize exact project quotations; do not relax facts/resume/clarification validation.
- [x] Apply conservative/strong prompt instructions only to résumé emphasis, keeping unsupported experience excluded in both modes.
- [x] Connect current user-confirmed requirement answers to tailoring context. Do not treat Not used or unresolved responses as affirmative evidence; warn on contradictory details.
- [x] In Checks → Tailor résumé, show active defaults and the settings shortcut. For review_questions, offer the one priority question before quoting; users can leave it unresolved and continue with supported tailoring.
- [x] Ensure the signed cost quote includes changed project/answer/settings context. A question answer, project edit, or settings change requires a fresh estimate; never re-use an old approval.
- [x] Wire Confirm actual contribution to the existing requirement-decision/profile flow; require accurate contribution text and explicit factual confirmation, not only wording approval. Show Confirmed by applicant, not Independently verified.
- [ ] Pin acceptance cases: priority ordering, remaining gaps unchanged, answered vs Not used, strong mode not inventing tools/years/outcomes, deterministic quotation tracing, and stale quote/proposal rejection preserving drafts.

## Task 4 — Add Hypothetical Example Review and Linked Interview Preparation

**Interfaces:**

- `example` and `gapplan` are new generation modes allowed only with `kind=interview_prep`. Hypothetical content uses this separate artifact/proposal channel, never the saved résumé artifact.
- Quote requests select `{assessment_revision, requirement_key, related_project_id|null, system_type, tools, example_proposal_id|null, resume_proposal_id|null}`; tools is a list of at most 40 strings of 1–80 characters and system_type is at most 80 characters. Example mode requires a fresh partial/not-evidenced requirement and no proposal references. Gapplan may reference one accepted example or one accepted résumé proposal, never both; referenced proposals must belong to this application, have the expected artifact kind, and match the displayed accepted revision. Sign the complete selection into the quote snapshot. The generate request derives the selection from the approved snapshot, not a fresh unchecked client override.
- `skill_gap_context(application, profile, selection, mode) -> dict` validates the current assessment, current requirement key, source digest, and related project ownership.
- Output uses the existing `body/warnings/evidence/requirements` schema and ordinary interview-prep proposal review. Requirements is empty; hypothetical examples have empty evidence and a persistent hypothetical warning. Unsupported talking points are labeled unconfirmed. GenerationRun stores the selected parameters and proposal references in the signed quote snapshot; ApplicationActivity records wording approval separately from factual confirmation. No additional table is necessary for hypothetical examples.

- [x] Add both modes to quote/generate validation; add example/context instructions and kind-specific output/budget handling through existing generation services. Never relax the source-backed résumé prompts to enable example generation.
- [x] Add Generate experience examples in Checks → Tailor résumé and Close this skill gap on unresolved requirement rows; both use the same parameter form and quoted example generation.
- [x] Implement `ExperienceExampleReview` with editable bullets and clearly separate Approve example for preparation, Confirm actual contribution, and Discard actions. Approval preserves the hypothetical label and leaves the saved résumé/profile/evidence unchanged.
- [x] Link Prepare for this example/these résumé changes to `gapplan` and the existing cost dialog. Include the exact accepted example or confirmed résumé change, selected tools, original requirement, and current source context in the quoted preparation payload.
- [x] Generate relevant practice exercises, refreshers, likely questions, and trade-offs; never present simulated implementation as historical work.
- [x] Reuse existing generation feedback and proposal review. Preserve prior preparation text in the pending proposal, grouped by requirement, without silently replacing it. No automatic résumé update on acceptance.
- [x] Add compact gap-plan cards under Files / Preview → Interview preparation with status, requirement, review/open actions, and explicit expansion for study details.
- [ ] Pin acceptance cases: unsupported Java generates labeled examples but no résumé change; unfamiliar tool parameters do not enter facts; wording approval does not count as evidence; factual confirmation invalidates stale source context; preparation references the reviewed example; wrong kind/foreign/stale proposal references are rejected; retry idempotency/provider failure/budget limits preserve drafts; no automatic paid second call; prior preparation retained; résumé/export content unchanged after example or study-plan acceptance.

## Task 5 — Integrate Review States and Handoff

**Interfaces:** Existing résumé proposal acceptance and document-export contracts remain unchanged. User-confirmed project facts become eligible sources only after explicitly saving/confirming the profile; generated study plans do not change those facts.

- [x] Show a clear distinction between Confirmed experience, Missing evidence, and Practice preparation wherever those records are displayed.
- [x] Display the approved hypothetical example and its requirement link in Interview preparation, with preparation status and an explicit factual-confirmation shortcut. Never display Wording approved as Experience verified.
- [x] Ensure copy/print/Word/PDF routes use the saved reviewed résumé only, not pending suggestions or Interview preparation body.
- [x] Record selected example parameters, example wording approval, factual confirmation, project/profile source changes, saved clarification, preparation generation, and résumé acceptance through existing activity logging without adding notifications unrelated to the task.
- [x] Document these decisions in the business-application section of DESIGN.md, without changing unrelated dashboard patterns.
- [ ] With explicit testing approval, run only `backendv2/.venv/bin/python backendv2/manage.py test job_applications.tests.test_tailoring_context job_applications.tests.test_skill_gap_preparation` from the project root. Mock providers; use isolated test records, not the user's SQLite data. Confirm the project's database test configuration before running.
- [ ] With explicit visual-testing approval, inspect one desktop/mobile batch covering profile project editing, tailoring controls, priority question, example parameter/review controls, and linked interview preparation. No build by default.
- [ ] Commit in feature groups only if requested: project profile/settings; tailoring context/clarification; gap-preparation workflow/UI. Leave the personal database local and untouched.

## Execution Handoff

Implemented natively on 2026-10-09 after approval. The additive `job_applications.0008_tailoring_project_experience` migration was applied only to the local SQLite database with explicit user permission. No production migration, deployment, commit, push, dependency installation, tests, builds, or browser automation were run.

Focused regression tests were added in the two named test modules but remain unexecuted. Checked implementation steps reflect source review, not successful runtime or visual testing. Manual acceptance cases and test execution remain unchecked. The existing skill tags, original résumé templates, export routes, section review, cost approval and provider adapters are retained. New tools/themes never auto-create project history; hypothetical wording stays in preparation until actual contributions are confirmed separately and reviewed through source-backed tailoring.
