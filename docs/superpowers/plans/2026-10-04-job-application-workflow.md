# Job Application Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **Project override:** execute natively, without subagents. If the execution skill is unavailable, follow these steps directly and disclose the fallback.

**Goal:** Add a unified timeline, monthly cross-provider AI spending guard, reviewed answer library, and atomic client/project conversion to Business Job Applications.

**Architecture:** Extend the existing owner-scoped Django application APIs and Business workspace. Keep each responsibility in focused service/API/UI files, reuse existing proposal and revision safeguards, and initialize converted projects through the existing client-workflow service. Each of the four tasks delivers one independently reviewable capability.

**Tech Stack:** Django/DRF, existing SQL database, React, Tailwind, existing shadcn/Radix controls, Lucide, shared Markdown editor; no new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-04-job-application-workflow-design.md`

## Global Constraints

- Execute natively after plan approval. No tests, builds, lint/typecheck, browser automation, live provider calls, migration execution, Git mutations, or deployment are included.
- Additive migrations may be authored but not applied. Preserve unrelated dirty files and the local SQLite database.
- Private Business platform only; existing session/CSRF authentication and object ownership apply to every endpoint.
- Preserve accepted artifacts, pending proposals, review/revision conflict handling, checklist, requirements comparison, and original-style résumé export.
- Keep human review and manual application submission. Do not add inbox synchronization, automatic platform submission, hiring automation, public sharing, or new user roles.
- Operate mode: incumbent typography, compact white surfaces, solid quiet borders, cobalt actions, low design variance, low motion, medium density. Read project design documents and applicable UI skills before UI edits.
- AI budget is an app-level estimate guard, not a guaranteed provider billing cap; provider billing remains authoritative.
- No credential changes, automatic provider fallback, generic FormDialog expansion, or changes to shared contract templates.

## Review Focus

Source review replaces executable verification in this authorization; no runtime correctness is claimed.

1. Legacy application dates and corrected submission dates: show recorded context without inventing or duplicating submissions.
2. Concurrent requests, duplicate IDs and month rollover: allowance is reserved once under an owner lock and assigned to the request-start Manila month.
3. Failed calls, absent usage, stale quotes and unknown historical costs: do not infer zero or release potentially charged reservations.
4. An answer changes after review/selection: invalidate review and prevent stale/unreviewed insertion without overwriting the local draft.
5. Cross-owner IDs, retries and removed links: conversion cannot leak records or create partial/duplicate clients/projects.

---

### Task 1: Unified application timeline

**Files:**
- Modify: `backendv2/job_applications/models.py`, `api/serializers.py`, `api/views.py`, `services/review.py`.
- Create: `backendv2/job_applications/services/timeline.py`, `api/timeline_actions.py`, `migrations/0003_application_timeline.py`.
- Create: `pixelpopup-frontend/src/features/business-dashboard/job-applications/ApplicationTimeline.jsx`.
- Modify: `pixelpopup-frontend/src/features/business-dashboard/job-applications/ApplicationDetail.jsx`.

Paths following `models.py` above are relative to `backendv2/job_applications/`.

**Interfaces:**
- Extend `record_activity(application, kind, message, *, occurred_on=None, details=None)`; existing callers remain valid. Default date remains Asia/Manila today.
- `record_application_changes(application, previous: dict) -> None` in `services/timeline.py` records actual status/submission/follow-up changes after saving under the application's existing transaction.
- `GET applications/{id}/timeline/?group=all&range=history&page=1&page_size=20` returns paginated events, `current_dates`, and a bounded upcoming preview/count. Groups: all, communication, scheduling, preparation, status; ranges: history, upcoming, all. Maximum page size 50; reject invalid filter values.
- `ApplicationTimeline({ applicationId, refreshKey, onActivity })` fetches its own bounded history.

- [x] Add read-only `ApplicationActivity.details` JSON metadata, default `{}`, with an additive migration depending on `0002_application_review`.
- [x] Capture old status/applied_on/follow_up_on in `perform_update`; write explicit old/new metadata atomically. Initial submitted-date recording uses that date; corrections are changes, not new submissions. Keep a posting-update event for actual posting/detail changes, not no-op saves. Record initial provided application dates on creation too.
- [x] Implement owner-scoped timeline action/mixin and serializers. Sort historical events by occurred_on then creation/id descending; upcoming by occurred_on then creation/id ascending. Do not invent times for date-only events. Saved dates lacking corresponding events appear as explicitly labeled current recorded dates. Distinguish current follow-up scheduling from the audit event that changed it.
- [x] Add Timeline and separate AI usage tabs in `ApplicationDetail`; reuse the existing activity form, circular event icons, empty/loading/error states and shared controls. System events have no edit actions. Keep existing generation history available until Task 2 moves it to its focused component.
- [x] Source-review legacy dates, corrected dates, future interviews, no-op saves, pagination and ownership. Confirm notes/replies do not implicitly change status or schedule, and date summary plus event do not claim two submissions.

**Deliverable:** Application activity is understandable chronologically without changing existing manual recording behavior.

### Task 2: AI quotes, monthly allowance and usage reconciliation

**Files:**
- Modify: `backendv2/job_applications/models.py`, `api/serializers.py`, `api/views.py`, `services/providers.py`, `services/generation.py`.
- Create: `backendv2/job_applications/services/pricing.py`, `services/budget.py`, `api/budget_actions.py`, `migrations/0004_application_ai_budget.py`.
- Create: `pixelpopup-frontend/src/features/business-dashboard/job-applications/GenerationQuoteDialog.jsx`, `ApplicationBudget.jsx`, `ApplicationUsage.jsx`, `CostReconciliationForm.jsx`.
- Modify: `pixelpopup-frontend/src/features/business-dashboard/job-applications/ApplicationAISettings.jsx`, `ApplicationDetail.jsx`, `ApplicationHistory.jsx`.

**Interfaces:**
- `build_generation_content(application, profile, artifact, kind, mode) -> str` in `services/generation.py`: one shared serialization for estimates and actual calls; no new AI context.
- `model_price(provider, model, on: date) -> dict | None` in `services/pricing.py`; rates are Decimal USD per million, with effective date and official source URL.
- `monthly_usage(owner, at=None) -> dict` in `services/budget.py`: month, spent_usd, held_usd, budget_usd, remaining_usd, unresolved_count, unknown_unreserved_count. Monetary values serialize as decimal strings; missing remains null.
- `quote_generations(application, profile, preferences, kinds, mode) -> dict`: items `{kind, expected_revision, quote_token, estimate_usd, assumptions, provider, model, pricing_date}`, combined estimate, budget summary, and blocked reason. No provider call or GenerationRun creation.
- `POST applications/{id}/quote/` accepts 1–4 distinct supported kinds and routine/refine mode. `POST applications/{id}/generate/` additionally requires each item's `quote_token` for a new request.
- `GET settings/` and PATCH responses additionally include `usage`; settings PATCH uses `expected_version`.
- `GET applications/{id}/usage/` returns paginated runs plus monthly owner usage. `POST applications/{id}/usage/{uuid}/reconcile/` accepts `{expected_version, amount_usd, note}`.
- `GenerationQuoteDialog({ quote, busy, onConfirm, onCancel })`; confirm supplies quoted items. `ApplicationUsage({ applicationId, refreshKey, onUseAlternative })` preserves proposals/conflict-alternative access.

- [x] Add nullable `ApplicationAISettings.monthly_budget_usd` Decimal(12,2), nonnegative validation and `version` default 1. Add GenerationRun immutable `quote_snapshot` JSON, nullable `quoted_cost_usd` and `reconciled_cost_usd` Decimal(12,6), reconciliation timestamp/note (2,000 characters), and `cost_version` default 1. Keep existing recorded token counts/cost/pricing date intact; migration depends on Task 1.
- [x] Centralize dated server-side prices and existing 6,000 output-token limit. Verified standard uncached USD/million rates: GPT-6 Luna 0.10/0.50; GPT-6.1 Sol 2/10; Gemini 3.1 Flash Lite 0.25/1.50; Gemini 3.8 Flash 0.75/3.75 through 2026-12-31, then 1.50/7.50 from 2027-01-01; Claude Haiku 4.5 1/5; Sonnet 4.6 3/15. Do not replace saved model choices silently. Sources: [OpenAI comparison](https://developers.openai.com/api/docs/models/compare), [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing), [Claude pricing](https://platform.claude.com/docs/en/about-claude/pricing). Recheck only if implementation is delayed beyond this dated verification.
- [x] Implement local quotes using instruction/content/schema UTF-8 byte length plus a 1,024-token framing allowance as an explicitly approximate input-token prediction; use the 6,000 output ceiling and round costs upward to six decimals. Explain output/reasoning/billing uncertainty. Sign quotes with Django timestamp signing, 10-minute expiry, binding owner/application/kind/mode/source digest/artifact revision/settings version/Manila month/price configuration. Reject changed or expired quotes with 409 and refresh guidance.
- [x] Implement monthly totals by request-start month in Asia/Manila. Effective amount is reconciled amount, otherwise recorded token-cost estimate, otherwise held quoted estimate. Unknown legacy amounts are counted separately, not zero. Null budget preserves unrestricted use; zero blocks all new generation. Enabled caps block unknown pricing and unreconciled unreserved legacy costs. Lowering a cap never erases spend.
- [x] Integrate reservations into the existing generation transaction. Consistent lock order: application → applicant profile → owner AI settings → artifact/run. Re-read settings under lock; verify quote and check allowance before creating the run. Duplicate UUID returns an existing completed result without another reservation; mismatched IDs or in-flight retries conflict. Never hold DB locks during the provider request.
- [x] Settle usable returned usage using the run's captured price, even if cost exceeds the held amount/cap or accepted-draft conflict occurs. Failures/missing usage retain held cost. Preserve returned token data separately from owner reconciliation. Allow explicit nonnegative reconciliation (including deliberate zero) of unresolved terminal runs or stalled running requests older than five minutes; require a note and expected cost version, write activity, and never overwrite manual reconciliation with a late provider response.
- [x] Add locked/versioned settings writes and bounded usage/reconciliation endpoints. Reject caller prices, foreign run IDs, negative/nonfinite/oversized costs and stale versions. Quotes never use the actual-call throttle or call providers; generation retains existing throttle. A changed budget/model/settings version invalidates unexecuted quotes.
- [x] Show monthly spend/held/remaining in AI settings and usage. Display unknown values as unavailable and explain reconciliation. Separate reconciliation form reuses FormModalShell/FormField; all actions have icons and field-level errors.
- [x] Route every Generate/Refine/Prepare missing drafts action through the quote dialog. Keep existing overwrite/proposal confirmation and unsaved-change guards. Bulk quotes show each request and combined cost; execute confirmed items sequentially with distinct IDs. Stop on stale quote/budget conflict, preserving completed results and reporting unexecuted items rather than claiming bulk atomicity.
- [x] Source-review concurrency across different applications, duplicate IDs, month rollover, cap zero/unset/below spend, unknown historical usage, failure/timeouts, stale quotes, reconciliation races and actual usage over estimate. Check provider adapters retain fixed URLs, server-side credentials and current schema/review safeguards. No live calls.

**Deliverable:** Generation has honest estimates, recorded usage and a backend-enforced monthly estimate allowance without losing potentially charged failures.

### Task 3: Reviewed reusable screening answers

**Files:**
- Modify: `backendv2/job_applications/models.py`, `api/urls.py`.
- Create: `backendv2/job_applications/api/answers.py`, `migrations/0005_reusable_answers.py`.
- Create: `pixelpopup-frontend/src/features/business-dashboard/job-applications/ReusableAnswersView.jsx`, `ReusableAnswerForm.jsx`, `ReusableAnswerPicker.jsx`.
- Modify: `pixelpopup-frontend/src/features/business-dashboard/job-applications/JobApplicationsView.jsx`, `ArtifactEditor.jsx`, `../BusinessDashboard.jsx`.

**Interfaces:**
- `ReusableAnswer`: owner, title(160), question(2,000), category availability/rates/experience/screening/other, body(8,000), is_archived, reviewed_at/reviewed_digest, revision default 1, created_at/updated_at.
- Private `answers/` ViewSet: list/create/retrieve/PATCH, plus `POST answers/{id}/review/`; no DELETE. Filters q (160), category, archived, reviewed; page size 20, max 50. PATCH/review require `expected_revision`; owner/digest/review metadata read-only.
- `ReusableAnswerPicker({ onInsert, onCancel })` calls `onInsert({ question, body })` only after rechecking the selected current reviewed, nonarchived record.
- Business path `applications/answers`; use the existing Business wildcard, not new Personal routes.

- [x] Add model/migration depending on Task 2. Digest question/category/body; edits to these clear review, while title-only edits need not. Archive retains text; archived answers cannot be marked reviewed or inserted.
- [x] Implement owner-scoped bounded APIs with optimistic revisions and explicit current-content review. Add/edit never automatically means reviewed. Reject empty required fields and oversized bodies at input level.
- [x] Add Reusable answers tab/deep-link and focused list/form/preview using existing MarkdownEditor, FormModalShell, filters, required markers, action icons and standard loading/empty/error states. Preserve AI avatar selections and current application routes.
- [x] Add Use reviewed answer action only to the screening-answer editor. Preview, then append the labeled question/answer with a separator to the current local text; do not discard unsaved text, save automatically or mark the artifact reviewed. Explain that inserted wording remains editable. Library content is not added to provider payloads.
- [x] Source-review editing after review, archiving between selection/insertion, foreign IDs, stale revisions, empty/large Markdown, and preserving existing accepted/unsaved draft text. Library edits must not rewrite application artifacts or alter unchanged profile fingerprints.

**Deliverable:** Reviewed user-written responses are reusable without bypassing draft review or inventing applicant facts.

### Task 4: Create a linked client and initialized project

**Files:**
- Modify: `backendv2/job_applications/models.py`, `api/serializers.py`, `api/views.py`.
- Create: `backendv2/job_applications/services/conversion.py`, `api/conversion_actions.py`, `migrations/0006_application_client_link.py`.
- Create: `pixelpopup-frontend/src/features/business-dashboard/job-applications/ApplicationConversionForm.jsx`.
- Modify: `pixelpopup-frontend/src/features/business-dashboard/job-applications/ApplicationDetail.jsx`, `JobApplicationsView.jsx`.
- Read/reuse, do not alter: `backendv2/client_workflow/api/serializers.py`, `services/projects.py`; frontend `client-workflow/ClientContactFields.jsx`, `ClientLocationFields.jsx`, `shared.jsx`, `api.js`.

**Interfaces:**
- Add nullable `JobApplication.linked_project` one-to-one Project relation with SET_NULL and nullable `converted_at`. Generic ApplicationSerializer exposes read-only linkage `{client_id, client_name, project_id, project_title, converted_at, unavailable}`; cannot accept link writes.
- `convert_application(application, owner, validated_data) -> (application, created: bool)` in `services/conversion.py` calls `client_workflow.services.projects.create_project(owner=owner, client=client, fields=fields)`.
- `POST applications/{id}/convert/` accepts `{client_id, project}` OR `{new_client, project}`, never both. New conversion returns 201; repeated valid conversion returns existing link with 200; removed prior link reports 409.
- Project input inherits existing ProjectSerializer validators but omits the relation and current_stage; outer conversion owns client selection. New-client input reuses ClientSerializer validators. All validation precedes client/project creation.
- `ApplicationConversionForm({ record, onCancel, onSaved, notify })`; pass existing Business `navigate` into ApplicationDetail. Links use `clients/{client_id}` and `clients/{client_id}/projects/{project_id}`.

- [x] Add link/timestamp and migration depending on Task 3 and `client_workflow.0002_document_publication`. Keep timestamp after SET_NULL so deleted links cannot cause silent reconversion.
- [x] Implement bounded nested serializers with owned nonarchived existing-client selection and field-level destination limits. Validate required client name/project title, optional contact data, state/country/currency and nonnegative quoted amount. Reject attempts to supply owner/link/current_stage. No applicant contact details become client details.
- [x] Implement conversion transaction, locking application and selected client. Recheck ownership/archive state and existing conversion before mutation. Create optional client, then initialized project through create_project, then link/timestamp and structured conversion activity atomically. Repeated/double-click requests return the saved link; failure leaves no orphan client/project. No finance records, automatic publishing or forced application-status change.
- [x] Add header action and focused review modal. Select an existing client using paginated search or create new; prefill company/name/organization, role/title, posting/summary and source URL/notes. All editable with explanation; never truncate overlong company values. Reuse phone/country/timezone/currency controls and shared amount validation. Existing state default remains lead unless explicitly changed; user can select active. Unknown contacts remain blank.
- [x] After success, replace conversion action with client/project links and show clear unavailable state if removed. Guard existing unsaved application work and keep drafts, history and usage intact.
- [x] Source-review foreign/archived client IDs, company over 160 characters, unknown contacts, retry/concurrency, rollback, removed links, default stage/checklist/template initialization and Business deep links.

**Deliverable:** A manually chosen paid opportunity becomes a linked, correctly initialized client project without duplicated entry or partial records.

### Task 5: Focused handoff and source review

**Files:**
- Modify: `backendv2/job_applications/README.md` and this plan's checkboxes only.

- [x] Review the directly changed source/diff against all four spec sections and the five Review Focus conditions. Check import/action names, migration dependency/model-state alignment, serializer/read-only boundaries and frontend prop/route contracts. Do not run executable validation or unrelated cleanup.
- [x] Document quote expiry, dated pricing/estimation assumptions, Manila month allocation, cap semantics, reconciliation, reviewed-answer behavior and atomic conversion in the existing feature README.
- [x] List the four additive migrations and the user-run command `cd backendv2 && .venv/bin/python manage.py migrate`. Clearly state they were authored, not applied; don't touch the local database.
- [x] Hand off a concise feature summary and disclose that runtime, visual, concurrency and provider behavior remain unverified. Do not commit, push or deploy.

## Execution record — 2026-10-05

Implemented natively. Added `WorkflowPages.jsx` for bounded pagination and an owner-wide `usage/` endpoint so AI settings can expose and reconcile requests across applications. Reused existing form, editor, dialog and selection components. Reviewed changed source only; runtime, visual, concurrency and live-provider behavior remain unverified. Migrations `0003`–`0006` are authored, not applied. No tests, builds, migration execution, Git mutations, deployment or local database changes were performed.

### Plan review result

Spec coverage is mapped to Tasks 1–4; safety/data boundaries and handoff to Task 5. Each task has a focused source-review gate, not an authorized test run. The four additions stay within one Job Applications workflow and share application/revision/ownership contracts, so this remains one native plan with independently reviewable tasks.
