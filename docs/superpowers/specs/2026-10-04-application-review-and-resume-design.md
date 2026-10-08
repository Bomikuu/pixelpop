# Job application review and matching résumé — design

## Intent and approved scope

Extend the private Business → Career → Job applications workspace with the four improvements approved by the user: an actionable application checklist, a requirement-to-source comparison, section-level review of AI document proposals, and tailored résumé exports matching the existing portfolio résumé's visual structure. The user submits applications himself. This is not an application-submission agent, hiring system, or public sharing feature.

Preserve the existing owner-scoped Django session/CSRF API, provider tiles and credentials handling, reviewed profile, application records, revisions, history, manual editing, and original PDF download. Do not migrate the feature back to Personal. No unrelated fixes, dependency changes, commits, pushes, deployments, database mutations, tests, builds, or browser automation are included in this request. An additive migration is part of the implementation deliverable, but applying it requires explicit instruction.

## Visual direction

Mode: **Operate**. Extend the incumbent Business interface: compact white panels, restrained neutral borders, cobalt actions, existing shadcn-based tabs/dialogs and Tailwind utilities, and existing formatting controls. Use text and icons as well as semantic colors for state. Design variance is low; motion is low and limited to existing interaction feedback; information density is medium. Do not change global typography or add decorative dashboard cards.

The application header is followed by a compact checklist with progress and a next-action link. Application-package tabs organize Requirements, document drafts, and Review; retain Original posting and History & usage. Requirement rows pair the actual requirement with supporting source excerpts. Document review uses original/proposed columns on desktop, stacked labeled blocks on mobile, and a persistent count of unresolved sections. Reuse current panels, buttons, dialogs, empty/error states, Markdown editor, and hideable preview where their behavior fits. Keep new behavior in focused feature components rather than enlarging the generic form system.

## 1. Application checklist

- **Profile reviewed:** the profile has usable facts or résumé text and `sources_confirmed` is true.
- **Résumé approved:** a non-empty accepted résumé has been explicitly reviewed against the current profile and posting.
- **Cover letter approved:** the same rule for the cover letter.
- **Screening answers reviewed:** required only when actual screening questions were supplied; otherwise show Not needed and exclude it from the progress denominator.
- **Submitted:** explicitly recorded through the existing application status/date form, never inferred from AI generation or document export. Later statuses such as Interviewing or Offer do not erase recorded submission.
- **Follow-up:** show the saved date, Due or Upcoming when relevant, and a link to record a follow-up. With no date, offer Set follow-up. Closed applications show Not applicable. This is a scheduling/action indicator rather than an eternally incomplete preparation step.

Calculate preparation progress from applicable review steps; show submission and follow-up separately so an otherwise complete preparation checklist does not imply an application was sent. The next action opens the correct profile, document review, screening answers, or existing status/activity form. Explicit review acknowledgments also work for manually written drafts, without an AI key. Draft text alone is not approval.

Document edits invalidate that document's approval. Changes to reviewed source facts, contact details, résumé text, job posting, role/company, or screening questions mark affected reviews as needing review again. Provider preference changes alone do not invalidate factual review. Show Needs review rather than silently resetting an application status chosen by the user.

## 2. Requirements comparison

Extend fit-assessment output with a bounded structured requirements array: requirement text, importance (required/preferred/unspecified), status (supported/partial/not_evidenced), source excerpts identifying profile facts or reviewed résumé text, and an explanation. Keep the existing assessment body, warnings and evidence. Validate the additional provider output on the server for all three adapters.

Use the actual user-reviewed posting and profile snapshot. Excerpts must be found in the named source; invalid or missing excerpts cannot produce a Supported label. A source excerpt establishes traceability, not external verification of a qualification. Label the whole assessment AI-assisted and require the user's judgment. Never infer years, certification, eligibility, employment dates, or skills that are absent from sources. Not evidenced means the supplied records do not demonstrate the requirement, not that the applicant necessarily lacks it. Do not present a hiring probability or invented match percentage.

Rows show requirement, status icon/label, excerpt/source, and a concise gap or clarification. Filters select All, Supported, Partial, or Not evidenced. A source/ posting fingerprint ties the comparison to its input snapshot; changed sources produce a stale notice and explicit reassessment action, not a hidden paid generation call. Old assessments without structured data remain readable with an action to generate the comparison. Manual editing of the narrative does not rewrite structured AI evidence.

## 3. Proposals, comparison and approval

Generation of a résumé, cover letter, or screening answers creates a saved **proposal**, not an immediate replacement of the accepted artifact. Fit assessments are informational and remain independently generated. Preserve failed/conflicting runs and their existing usage/history behavior. Do not add an automatic provider fallback.

A proposal records its generation, application/kind, base artifact revision, source fingerprint, original snapshot, ordered proposed sections, per-section decisions and user-edited proposed text. Use Markdown section boundaries and stable proposal-local identifiers, not mutable heading text as an identifier. Duplicate headings remain separate. Legacy unstructured documents remain usable; fall back to a clearly labeled whole-document section when a reliable section boundary cannot be found. The original profile résumé is displayed read-only for the first résumé proposal; a previous saved artifact is the baseline on subsequent proposals. Unmatched original sections are visible and are never silently removed.

Each changed, added or removed section can **Use proposed**, **Keep original**, or remain Unreviewed. Show original and proposed text, with readable inserted/removed-line emphasis. The proposed side reuses the Markdown formatting controls and can be edited before choosing it. A section without an original has an explicit empty state; keeping original for it means omit that new section. Removing a section requires an explicit decision. Unchanged sections need not be re-approved individually. If initial source text is unstructured, explain that it is the source reference rather than pretending it has a one-to-one section match.

Save decisions and edited proposed text in Django so closing/reopening the page does not lose review. An edited section becomes unresolved again. A final **Accept reviewed draft** action is available only when all required section decisions are resolved. Acceptance assembles the selected content, saves a new artifact revision atomically, records review against the exact source snapshot, and preserves earlier saved text in revision history. A manually saved artifact has a separate explicit **Mark reviewed** action.

Rejecting/discarding a proposal leaves the accepted document intact. A newer artifact revision or changed source fingerprint blocks acceptance with a 409 and a clear refresh/review message; no newer edits are overwritten. Saving review decisions is also version-checked to prevent two tabs replacing each other's review. A new generation does not delete an earlier unaccepted proposal. Existing generated artifacts are retained as saved text but are not retrospectively claimed to be approved.

## 4. Matching résumé layout and export

Reference: `pixelpopup-frontend/public/portfolio/Mico_Ang_Senior_Software_Developer.pdf` (existing six-page A4 PDF). Its visual structure is authoritative: Times New Roman serif text, centered name/role and contact line, generous page margins, thin black section rules, uppercase tracked labels in the left column, content in the right column, compact experience bullets, and dates beside experience/education entries. The original PDF download remains byte-for-byte the existing asset.

Create a dedicated résumé preview/print template within Job applications rather than changing the shared Clients/Templates document design. Accepted Markdown headings supply section labels; profile fields supply contact information. Preserve all accepted text, dates, lists and links. Content that cannot be mapped to a special entry layout uses the normal section content column rather than being dropped or guessed. Missing contact fields are omitted. Do not invent education, employer names, dates or projects to fill a layout.

Offer **Print / PDF** using the dedicated print template and **Download Word** using the existing `python-docx` dependency with matching A4 margins, serif text, section rules and column proportions. Clearly identify that PDF is saved through the browser's print dialog. Preview uses the same document structure as print, with page-break-safe headings/entries and natural pagination. Do not promise byte-identical line wraps or six pages for changed content or across Word/browser font engines.

Export the current saved accepted version; disable export from unresolved proposals or unsaved edits, explain why, and offer review/save actions. Existing unreviewed saved drafts can be previewed but must be explicitly marked reviewed before the new tailored résumé export. The original PDF download remains available regardless of approval. Preserve the generic cover-letter Word/Print export; this request changes résumé formatting only.

## Data, compatibility and boundaries

Add review provenance to `ApplicationArtifact` and structured comparison metadata to the assessment. Add a focused proposal/review model (or equivalent additive model fields with the same persistence and concurrency guarantees), linked to the existing application and generation. No destructive migration or historical backfill that invents approvals. Derive checklist state from source/review provenance and existing application data instead of storing a second, contradictory set of checklist booleans.

Keep all endpoints beneath `/api/v1/job-applications/`, requiring current private access and owner scope. Add focused endpoints for proposal decisions/acceptance/discard and explicit manual review. Server-side validation enforces revision/source checks and export eligibility; hidden/disabled buttons alone are not safeguards. Existing `body`, warnings, evidence and revision history remain compatible. Use bounded JSON schemas, field errors, loading/empty/stale states, and sanitized Markdown; no remote image loading, untrusted HTML, external network fetch during export, or secrets in browser responses.

Backend responsibilities remain within `backendv2/job_applications/`: review/checklist services, generation output normalization, serializers/endpoints and résumé Word rendering. Frontend responsibilities remain within `pixelpopup-frontend/src/features/business-dashboard/job-applications/`: checklist, requirement comparison, proposal review, résumé template/export and detail-page composition. Extend shared components only if unavoidable; do not change unrelated client templates, global themes, public portfolio content or personal records.

## Verification boundaries and acceptance criteria

Per project instructions, implementation includes source review but no initiated tests, build, lint, typecheck, browser automation, database migration execution, or external AI call unless the user requests them. Do not claim runtime or layout validation that was not performed. A future explicitly authorized focused verification should cover owner isolation, proposal persistence, source/revision conflicts, missing/invalid evidence, duplicate/absent headings, mixed accepted/rejected sections, manual approval invalidation, no-question checklists, closed follow-ups, and long résumé pagination.

Success means the next action is clear; supported requirements cite real supplied text; generation cannot overwrite an accepted document; review survives reopening; stale reviews cannot be accepted; and tailored résumé preview/Word/Print-PDF share the original layout language without omitting accepted content. Existing applications and the original résumé download continue to work.
