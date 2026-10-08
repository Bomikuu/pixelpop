# Application Review and Matching Résumé Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Project/request constraints take precedence: execute natively in this session, do not dispatch subagents, and do not run tests, builds, migrations, or Git mutations without a subsequent user request. If the named execution skill is unavailable, disclose that and use this plan directly.

**Goal:** Add an actionable checklist, source-backed requirement matching, persistent section approvals, and tailored résumé exports matching the existing PDF to Business Job Applications.

**Architecture:** Keep accepted artifacts separate from generated proposals. Derive checklist and export eligibility from artifact review provenance and a deterministic source fingerprint; persist proposal decisions with optimistic concurrency. Extend existing provider output and owner-scoped endpoints, then compose focused Business feature components using shared controls.

**Tech Stack:** Existing Django/DRF, React/Vite, Tailwind, shadcn-based controls, ReactMarkdown/remark-gfm, MarkdownIt and python-docx. No new dependency.

**Spec:** `docs/superpowers/specs/2026-10-04-application-review-and-resume-design.md`

**Implementation status (2026-10-04):** Implemented natively and source-reviewed. The named execution skill was unavailable; this plan was followed directly without subagents. Completed review boxes below mean source inspection, not executed tests. No tests, build, browser workflow, live provider request, migration, Git mutation or deployment was performed. Migration `0002_application_review` remains for the user to apply. Runtime behavior and final Word/PDF pagination remain unverified.

**Inline design review:** No changes to `DESIGN.md` or its sidecar. Checked the existing design documents, shared Button/Tabs controls, checklist/comparison/review components, `ArtifactEditor`, and `resume.css`.

- Palette: existing cobalt actions, white surfaces, slate text; green/amber status also has icon/text.
- Dashboard typography: incumbent Instrument Sans and existing size hierarchy retained.
- Document typography: dedicated Times New Roman, based on the user-approved original résumé reference.
- Layout: existing tabs/panels; comparison columns stack on smaller screens and wide résumé preview scrolls locally.
- Rules: shared controls, immutable original text, explicit review/save/accept actions, and no decorative motion.

Not canonized as a global rule: the résumé's serif/A4 styling. The font detector exception was recorded for this intentional reference match; dashboard typography and unrelated pre-existing drift were left untouched. Final visual verification was not attempted under the project's no-testing instruction.

## Global Constraints

- Preserve the existing owner-scoped Django session/CSRF API, provider tiles and credentials handling, reviewed profile, application records, revisions, history, manual editing, and original PDF download.
- Do not migrate the feature back to Personal.
- No unrelated fixes, dependency changes, commits, pushes, deployments, database mutations, tests, builds, or browser automation are included in this request.
- An additive migration is part of the implementation deliverable, but applying it requires explicit instruction.
- Use text and icons as well as semantic colors for state.
- Design variance is low; motion is low and limited to existing interaction feedback; information density is medium.
- Do not change global typography or add decorative dashboard cards.
- Export the current saved accepted version; disable export from unresolved proposals or unsaved edits, explain why, and offer review/save actions.
- The original PDF download remains byte-for-byte the existing asset.

## Review Focus

These are source-review/acceptance scenarios, not permission to run tests. Each appears in the owning task's review step.

1. Two tabs, a changed source or a newer accepted revision must not silently overwrite review decisions or accepted text.
2. Duplicate headings, missing headings, removed sections and unstructured uploaded text must not cause missing or invented résumé content.
3. Unsupported AI requirements/excerpts must not appear as demonstrated qualifications; old assessment output must remain readable.
4. No screening questions, closed applications and changed source confirmations must yield honest checklist state without automatic status changes.
5. Long lists, links, Unicode text and missing contact fields must remain readable and complete in résumé preview/Word/print without external image loading.

## Files and Responsibilities

All new files live in the existing job-applications modules. Existing shared Clients/Templates renderers remain unchanged.

- Backend model/migration: `backendv2/job_applications/models.py`, `migrations/0002_application_review.py`.
- Review and checklist logic: new `services/review.py`, `services/sections.py`.
- Provider generation: existing `services/providers.py`, `services/generation.py`.
- API: existing `api/serializers.py`, `api/views.py`; new `api/review_actions.py` to isolate proposal/review actions from current view orchestration.
- Résumé Word export: new `services/resume_export.py`.
- Frontend orchestration: existing `ApplicationDetail.jsx`, `ArtifactEditor.jsx`, `ApplicationHistory.jsx` and `api.js` as necessary.
- Feature UI: new `ApplicationChecklist.jsx`, `RequirementsComparison.jsx`, `ProposalReview.jsx`, `ResumeDocument.jsx`.
- Local formatting: new `documentSections.js`, `resumePrint.js`, `resume.css`.
- Handoff notes: existing `backendv2/job_applications/README.md`.

## Task 1: Persisted Review State, Checklist and Proposal API

**Interfaces:**

- `source_fingerprint(application, profile) -> str`: SHA-256 of canonical JSON of role/company/posting/questions and profile name/email/phone/location/portfolio_url/facts/resume_text. Exclude timestamps, status/dates, provider preferences and filename-only changes. Source confirmation is checked separately.
- `artifact_review_state(artifact, application, profile) -> dict`: `{reviewed, needs_review, exportable}`. Approval requires non-empty text, a confirmation-ready profile, non-null `reviewed_at`, and matching `reviewed_digest`.
- `application_checklist(application, profile, artifacts) -> dict`: `preparation` rows `{id, label, state, action}`; `completed`, `total`, `next_action`, separate `submission` and `follow_up` rows. Actions use stable keys `profile`, `resume`, `cover_letter`, `answers`, `posting`, `activity`.
- `split_sections(body: str) -> list[dict]`: preserve raw Markdown, including headings and preamble; use top-level section headings and proposal-local positional IDs. A document with no reliable headings becomes a single Whole document section.
- `compare_sections(original: str, proposed: str) -> list[dict]`: rows `{id, title, original, proposed, change, decision}` with `change` in `unchanged/changed/added/removed`, and `decision` in `unreviewed/proposed/original`. Align normalized heading plus occurrence number, not title alone. Keep unmatched original sections as explicit removal rows. If either whole document cannot be split reliably, compare the whole document rather than inventing a mapping.
- `accept_proposal(proposal, expected_version, application, profile) -> ApplicationArtifact`: atomic version/source/base-revision check, decision completeness, assemble chosen sections, save a revision, record approval provenance and activity.

- [x] Add `reviewed_at` (nullable datetime), `reviewed_digest` (blank 64-char string), `requirements` (JSON list) and `assessment_digest` (blank 64-char string) to `ApplicationArtifact`; old rows receive no invented approval.
- [x] Add `DraftProposal` linked to artifact and its generation, with `base_revision`, `source_digest`, `original_body`, `sections` JSON, `version` (initial 1), `status` (`pending/accepted/discarded`), and timestamps. Keep generated source text in `GenerationRun.result`; persist user-editable decisions in the proposal. Add the migration by hand matching these fields; do not execute it.
- [x] Implement `sections.py` and `review.py`. Profile review counts only when confirmed and usable. Screening answers are Not needed when there are no questions; preparation denominator is otherwise profile plus résumé/letter/answers. A saved submission date establishes submission; Applied/Interviewing/Offer also represent explicit submission status. Rejected/Withdrawn close follow-up scheduling, not preparation history. Follow-up does not increase preparation denominator.
- [x] Extend `ArtifactSerializer` with read-only computed review state and provenance. Add proposal read/write serializers with bounded IDs/text/decisions and immutable original data; reject unknown section IDs, duplicate IDs, accepted/discarded modifications and assembled text over 30,000 characters.
- [x] Add `ApplicationReviewActionsMixin` in `api/review_actions.py` and use it from `ApplicationViewSet`. Owner scope always comes from `self.get_object()`. Routes under `applications/{id}/`: GET `proposals/` (paginated, kind filter); PATCH `proposals/{proposal_id}/` with `{expected_version, sections: [{id, decision, proposed}]}`; POST `proposals/{proposal_id}/accept/` and `/discard/` with `{expected_version}`; POST `review/{kind}/` with `{expected_revision, source_digest}` for résumé/letter/answers.
- [x] Retrieve details with `source_digest`, artifact review state and `checklist`; do not embed an unbounded list of proposal bodies. Proposal editing and acceptance lock the application first, then artifact/proposal in consistent order. Return 409 on stale versions/sources/revisions, field errors for invalid decisions, and 404 for another owner's records.
- [x] Ensure every manual body save clears document review provenance. A manual Mark reviewed records approval of the current saved revision/source and logs activity. Do not alter application status automatically.
- [x] Source-review scenarios: two tabs submitting the same version, profile edited after a page loaded, duplicate headings, a removed original section, no questions, a rejected application with a follow-up date, and approval attempts without confirmed sources. Confirm accepted text and old revision rows remain intact on rejection/conflict.

## Task 2: Evidence-Backed Assessment and Non-Destructive Generation

**Consumes:** Task 1 fingerprint/section helpers and proposal model.

**Produces:** All provider responses have `{body, warnings, evidence, requirements}`. Requirements rows use `{text, posting_excerpt, importance, status, sources: [{source, excerpt}], explanation}`, with enums `required/preferred/unspecified`, `supported/partial/not_evidenced`, and sources `facts/resume_text`. Other document kinds return `requirements: []`.

- [x] Extend the bounded provider JSON schema and response validation: at most 60 requirement rows and 8 excerpts per row; text/excerpts/explanations at most 2,000 characters each. Preserve body and existing warnings/evidence limits. Keep old saved generation results readable.
- [x] Prompt assessment output to quote the supplied posting and approved profile text, distinguish absence of evidence from lack of ability, and avoid match probabilities. Document generation uses level-two section headings so the review and résumé template have clear boundaries; don't invent source facts or contact information.
- [x] Add `normalize_requirements(requirements, application, profile) -> list[dict]` in `review.py`. Check posting excerpts and named source excerpts against whitespace-normalized original strings. Flag untraceable requirements; remove invalid sources and downgrade unsupported claimed matches to Not evidenced. Label assessment AI-assisted even when excerpts are valid.
- [x] Modify `generate_artifact`: capture source fingerprint/base revision before the provider call; preserve run usage/error handling. Assessment generation saves normalized metadata and its fingerprint along with the narrative. Document generation creates a pending `DraftProposal` and never overwrites artifact.body or review provenance. Sources/accepted revision changed during the provider call produce the existing conflict run behavior, not a proposal accepted against different data.
- [x] For an initial résumé proposal, use reviewed résumé text as the read-only baseline if available; otherwise use an empty baseline. Cover letters/answers without a saved draft have an empty baseline. Subsequent proposals compare against the saved artifact. Refinement requires a saved artifact and uses its body; multiple generations preserve previous pending proposals.
- [x] Make generation/history responses distinguish Proposal ready from Accepted/saved artifact without claiming preparation is complete. Preparing missing drafts skips a kind already having a pending proposal, and skips answers when there are no questions. Generation remains explicit and selected-provider-only.
- [x] Source-review scenarios: missing key, valid/invalid quotation, unsupported employment years, old result without requirements, failed refinement, source changed during generation, initial source résumé with no Markdown headings, and two generations against the same accepted revision. No live provider calls.

## Task 3: Business Checklist, Requirement Rows and Persistent Review UI

**Consumes:** Task 1 detail/checklist/proposal API and Task 2 structured assessment.

**Produces:** Focused UI within existing application routes; no navigation changes outside Job Applications.

- [x] Build `ApplicationChecklist` using existing icons/buttons/progress primitive (or semantic progress if no current primitive). Show preparation fraction, icon/text states, next-action button and separate submission/follow-up rows. Invoke application-detail callbacks for existing forms/tabs, not a separate checklist store.
- [x] Build `RequirementsComparison` with status filters, source blockquotes, source labels, stale-source notice and Generate/Reassess action. Retain legacy assessment text. Display untraceable requirements as an AI warning, never a verified match. No invented numeric score.
- [x] Build `ProposalReview` with a kind/proposal selector, paginated pending proposals, version-aware saved decisions, original/proposed text and line-level added/removed emphasis. Use shared MarkdownEditor for proposed text. Each section can Use proposed or Keep original; edits reset its decision until explicitly chosen again. Show unsaved review state, Save review, unresolved count, Accept reviewed draft, and a confirmation dialog for Discard.
- [x] Keep section originals immutable. Initial unstructured text has a Whole document/source-reference explanation; no falsely paired sections. For additions/removals, show explicit no-original/no-proposal placeholders with icons. Stack labeled sides on mobile; keyboard focus and selection states remain visible and non-color-only.
- [x] Proposal accept/discard reloads detail and proposal state. 409 displays an actionable stale/conflict notice without dropping local text. Leaving with unsaved review edits uses the existing unsaved-changes confirmation/beforeunload pattern. Saved decisions survive reopening.
- [x] Compose Checklist below the event-style header in `ApplicationDetail`; retain Original posting and History & usage. Application package has Requirements, existing artifact draft tabs and Review. Generation completion opens Review for a document proposal rather than displaying it as a saved accepted artifact.
- [x] Extend `ArtifactEditor` with review status, Mark reviewed callback and links to pending proposals. Manual edit/save clears approval in server response; generation/regeneration means Propose changes. Preserve current editor, previous revisions, original PDF and source information. Hide/disable tailored résumé exports for unsaved/unreviewed text and direct the user to review/save.
- [x] Source-review scenarios: absent profile data, no questions, a proposal already pending, API errors/abort, navigation with local edits, stale source, pending proposal pagination, unchanged sections, and keyboard-only action flow. No browser automation or initiated tests.

## Task 4: Original-Style Résumé Preview, Print/PDF and Word

**Consumes:** Accepted artifact body, current reviewed profile and server review state from Task 1.

**Interfaces:**

- Frontend `documentSections(body) -> [{id, title, body}]`: Markdown section parsing consistent with server boundaries; preserve preamble/unstructured content rather than dropping it.
- `ResumeDocument({body, profile, pageRef})`: dedicated serif A4 presentation, not the shared contract renderer.
- `printResume({html, win, title, onMessage})`: print captured sanitized rendered content with dedicated résumé CSS in a window opened by the click. The editor rechecks current approval/revision through the existing application endpoint first; no external asset fetch.
- Backend `render_resume_docx(profile, body) -> bytes`: matching résumé styling using existing python-docx/MarkdownIt.

- [x] Inspect the relevant pages of the existing six-page PDF as a read-only reference; keep the original asset untouched. Derive the A4 margins, centered contact heading, Times New Roman body, thin rules, approximately 25% label/date column and 75% content column from the reference.
- [x] Implement `ResumeDocument`, `documentSections.js` and `resume.css`: serif heading/contact, uppercase section labels, label/content columns, compact list/paragraph spacing and natural multi-page flow. Use safe Markdown rendering, suppress images/raw HTML, and preserve all accepted content even where specialized date/experience parsing is unavailable. Missing contacts are omitted, not placeholders or invented values.
- [x] Implement `resumePrint.js` with the same document structure and print typography. Use browser Save as PDF through Print / PDF and tell the user that it opens the print dialog. Do not claim a one-click server PDF download. Handle blocked popups with existing toast/error messaging.
- [x] Implement `resume_export.py` with A4 page sizing, Times New Roman, matching margins, section rules and borderless label/content tables. Use true paragraph/list/link formatting; keep long entries able to flow across pages and avoid orphan headings. Preserve raw content through fallback sections. Do not change `client_workflow/services/docx_export.py`.
- [x] Extend the existing résumé Word export to use `render_resume_docx` and require current server-side approval. Keep cover-letter export generic. Render the dedicated résumé preview in `ArtifactEditor`; offer original PDF, approved Word and Print / PDF, with explicit save/review guidance for blocked actions. No unresolved proposal is an export source.
- [x] Source-review scenarios: very long experience bullets, a single unstructured document, duplicate headings, Unicode names, safe links, missing email/phone, source changed before Word request and hidden preview. PDF/Word may paginate differently from the original; text must never be omitted to force six pages.

## Task 5: Handoff and Bounded Source Review

- [x] Update `backendv2/job_applications/README.md` with proposal/review lifecycle, requirement-evidence labels, résumé export distinction, original PDF preservation and migration command for the user to execute when ready.
- [x] Review changed imports/API names, additive migration/model parity, owner-scoped queries, locking order, provider schemas, review invalidation and text-preserving export fallbacks against this plan/spec. Preserve unrelated dirty changes and leave SQLite local.
- [x] Mark plan tasks implemented only when their required edits are complete. Record any unverified behavior honestly.
- [x] Handoff states that migration execution and runtime/visual tests were not performed, and lists the narrowly relevant user verification actions. Do not run tests/builds, call a provider, apply the migration, commit, push or deploy as part of handoff.
