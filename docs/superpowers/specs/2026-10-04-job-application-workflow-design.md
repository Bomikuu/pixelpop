# Job application workflow extensions — design

## Intent and scope

Extend the existing private Business Job Applications workspace with the four additions approved in chat: a unified application timeline, AI cost visibility with a monthly USD budget shared across providers, reviewed reusable answers, and conversion of paid opportunities into linked clients/projects. Keep human review and manual application submission. Do not add inbox synchronization, automatic platform submission, hiring automation, public sharing, or new user roles.

This is one application-workflow extension with four independently reviewable deliverables. Reuse existing application records, activity and generation history, approved drafts, Business routes, client/project services, and shared form/editor controls. Preserve the completed application checklist, requirement comparison, proposal review and résumé exports.

The in-chat design is approved. This written spec requires review before the implementation plan is written. Execute natively after plan approval. No tests, builds, lint/typecheck, browser automation, live provider calls, migration execution, Git mutations, or deployment are included. Additive migrations may be authored but not applied. Preserve unrelated dirty files and the local SQLite database.

## Visual direction

Mode: Operate. Extend the incumbent Business design: compact white surfaces, quiet solid borders, cobalt actions, existing typography, Tailwind and shared shadcn-based buttons, tabs, dialogs, fields, selectors and Markdown editor. Design variance low, motion low, density medium. Use distinct circular icons and text for event/status types; color supplements rather than replaces labels. No new global theme or typography.

Keep application header/checklist and current package/requirements/review/posting content. Add a clearly named Timeline within the application page. Keep AI usage in its own focused section/tab instead of mixing billing details into the timeline. Reusable answers are a tab within Job Applications, not a second dashboard navigation group. Client conversion is an explicit application-header action opening a review form; linked client/project actions replace it after conversion.

## 1. Unified application timeline

Present submissions, employer replies, interviews, notes, follow-ups, status changes, preparation/review activity and client conversion together chronologically. Filter by meaningful event group and show upcoming dates separately from historical activity. Pagination bounds long histories. Dates entered as date-only remain date-only; do not invent times.

Reuse `ApplicationActivity` for event records. Submission/status and follow-up-date changes from the existing application form write explicit activity, preserving old-to-new context. Record an explicit submission using the entered submission date; changing a date records its correction rather than implying a new application was sent. Existing application dates without corresponding historical events may be shown as clearly identified current recorded dates, not fabricated past actions.

The existing Record activity form continues to support replies, interviews, notes and follow-ups; add an explicit submission choice if needed for a complete recording flow. Logging a reply, interview or follow-up note alone must not silently change application status or scheduling. Scheduling remains editable in the existing details/status form. Future-dated interview/follow-up records are identified as upcoming, not completed.

System events remain read-only. Existing records remain readable. Do not backfill guessed employer interactions or duplicate a submission represented by both a saved date and an explicit submission event. New status/date events are written atomically with their application changes.

## 2. AI cost visibility and monthly budget

The user sets an optional monthly USD limit in Application AI settings. It applies across OpenAI, Gemini and Claude for this owner's job-application requests. Unset preserves current unrestricted behavior; zero blocks generation. Use calendar-month boundaries in Asia/Manila, consistent with the existing application date convention. Manual tracking, drafting, review and export do not require a budget or API key.

Show this month's recorded token-cost estimates, held reservations, budget and remaining amount, including costs from known existing runs in the month. Unknown usage/pricing is unavailable, never zero. The budget is an app-level estimate guard, not a guaranteed provider billing cap; provider billing remains authoritative. State that distinction before generation and in settings.

Before each paid generation, show the selected provider/model, a token-based estimate, its assumptions, configured output ceiling, pricing effective date and effect on the monthly allowance. Bulk Prepare missing drafts shows an estimate for each required request and the combined amount before confirmation. No paid call happens while obtaining a quote. Refresh/reject a quote if its source, saved revision, model or price configuration changed before execution.

Verify API model identifiers and current prices against official provider documentation when implementing this feature. Do not assume Codex model labels are public API identifiers. Keep verified prices/model choices server-side and dated; preserve existing saved artifacts/history. An unsupported saved preference requires explicit model selection, not silent replacement. No credential changes or automatic provider fallback.

The backend enforces the configured limit, atomically accounting for recorded costs and reservations for requests already in progress. Concurrent requests cannot independently reuse the same remaining allowance. Duplicate request IDs must not reserve or charge twice. Quote/confirmation UI alone is not enforcement. Actual returned usage replaces the held estimate when usable. If it exceeds the reservation, record it honestly and block further spending as appropriate rather than capping the recorded amount.

When a budget is enabled, unknown model pricing blocks generation until a priced supported model is selected. Timeout/failure or missing usage must not silently release potentially charged spending. Retain a clearly labeled unresolved reservation; allow explicit owner reconciliation against the provider bill, recording the amount and an activity/audit note. Existing unknown-cost runs in the current month are visibly unresolved and must be reconciled before claiming the budget is enforceable. Zero is accepted only as an explicit reconciliation, not an inferred charge.

Request estimates are bounded predictions rather than exact charges: document token-estimation assumptions, output limits and any reasoning/additional-fee uncertainty. Keep recorded provider usage, estimated cost and reconciled amount distinguishable. A lower budget than spending already recorded is allowed but blocks further generation. Lowering/changing provider settings never removes recorded usage or existing reservations.

## 3. Reviewed reusable answers

Add a private, owner-scoped answer library with title, question, category (availability, rates, experience, screening, other), answer text and review provenance. Support search/category filtering, pagination, add/edit/archive, preview and explicit Mark reviewed. Reuse the shared Markdown editor and form modal with input-level validation and required markers. Do not delete answer text or application history when archiving.

Editing question/category/body clears reviewed status. A saved answer is not automatically approved. Availability, rates and experience are user-supplied; do not invent hours, compensation or credentials. Reviewed status acknowledges the current saved answer, not external verification or indefinite validity.

From the screening-answer draft editor, open a library selector, preview a reviewed answer and explicitly insert it. Search supports finding a relevant response without requiring automatic matching. Insertion changes the local draft only, preserves its existing text and makes it unsaved; normal Save draft/Mark reviewed or proposal-review rules still apply. Never overwrite the accepted application artifact directly. Unreviewed/archived library answers cannot be inserted through the reviewed-answer selector.

The library is not silently sent to AI providers. Copying an answer into a draft does not make all library content part of the AI source profile. Record insertion provenance when that draft is saved if practical, but do not make changes to the library retroactively rewrite documents or invalidate unchanged application source fingerprints.

## 4. Convert opportunity to client/project

Use an explicit Create linked client/project action when the user decides an opportunity is paid work. Do not require a specific application status or auto-convert an Offer; this accommodates freelance opportunities that are recorded differently. Do not claim a payment was received or write finance transactions.

The review modal offers an existing non-archived owned client or a new client. Prefill the new client's name/organization from the application company and the project's title from the role, summary from the reviewed posting, and source URL/reference in notes. All prefilled values are visibly editable. Respect destination field lengths and show validation instead of silently truncating information. Unknown client contact details stay blank; never copy the applicant's own email/phone as the client's contact.

Use existing client/project validation and country/currency/contact controls. The user confirms the project state and relevant project details, retaining existing workflow defaults unless explicitly changed. Validate all fields before creation. Reuse `client_workflow.services.projects.create_project` so stage/checklist/template initialization stays consistent. Do not duplicate that initialization logic or alter shared contract templates.

Create a new client (when selected), the initialized project, the application link and the conversion activity in one transaction. Scope existing-client selection and linked records to the application owner. Lock the application to prevent double-clicks/retries from creating duplicate clients/projects. One application converts to at most one project in this version; repeated requests return the existing link. If a linked record was removed, report that state rather than silently creating another.

Persist the linked project and conversion timestamp; derive its client from the project to avoid contradictory client/project fields. Exclude linkage from normal application-edit writes. The application header shows linked client/project names and routes to their existing Business pages. Keep the original application, drafts, activity and AI usage intact.

## Data/API boundaries

Keep new job-application models, serializers, services and endpoints in `backendv2/job_applications/`, with additive migrations depending on the existing client-workflow schema where necessary. Split timeline, budget, reusable-answer and conversion responsibilities into focused modules rather than expanding the generic form system. Frontend components stay in the existing Business Job Applications feature; touch Business route composition only where the new library/deep links require it.

All endpoints require the existing private session/CSRF access and object ownership. Validate expected versions for review/reconciliation/library edits where concurrent writes matter. Bound text, queries, pagination, cost values and related IDs server-side. Do not expose secrets or permit caller-supplied provider URLs/prices. Apply existing generation throttling to actual calls; the quote endpoint must not invoke an AI provider.

## Acceptance and handoff

Source-review timeline ordering/date-only handling, duplicate submissions, future interviews and existing-history compatibility; concurrent budget requests/retries, unknown usage, reconciliations and month rollover; reviewed-answer invalidation and non-destructive insertion; owner isolation and atomic, idempotent client conversion. Preserve existing proposal/revision safeguards and résumé export eligibility.

Implementation handoff names the additive migration and required user-run command, documents budget assumptions/reconciliation and client conversion behavior, and clearly states that runtime, visual and provider behavior remain unverified without requested testing. Do not commit, push, apply migrations or deploy as part of this feature.
