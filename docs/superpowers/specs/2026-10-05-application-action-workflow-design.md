# Application action workflow

Date: 2026-10-05
Status: Specification and plan approved; implemented natively and source-reviewed. Migration and runtime verification remain pending.
Surface: Private Business dashboard → Job applications

## Outcome and scope

Turn the existing assessment into practical next actions, add interview preparation,
complete the submission checklist, and surface follow-ups needing attention.
Extend the existing Django `job_applications` app and React application workspace.
Do not create a second application tracker or move these features into the personal dashboard.

The user approved these four feature groups:

1. Resolve requirement gaps with truthful evidence or a recorded Not met decision,
   then reassess with a before/after comparison.
2. Prepare editable interview questions and source-backed talking points.
3. Review documents, rate, availability, and final accuracy before submission.
4. Show an in-app due/upcoming follow-up list with recording and rescheduling actions.

No automated applications, email sending, browser agents, push notifications,
scheduled jobs, provider/key changes, or automatic paid AI calls are included.
No dependency installation is needed. No tests, builds, deployment, commits, or database
migration execution are authorized by this design approval.

## Existing owners to extend

- `backendv2/job_applications/models.py`: owner-scoped profile, application, artifacts,
  generation history, proposals, timeline, and reusable answers.
- `services/review.py`: source fingerprints, document approvals, evidence normalization,
  checklist computation, timeline recording, and conflict responses.
- `services/generation.py`, `services/budget.py`: explicit generation, signed cost quotes,
  source/revision validation, monthly allowance, idempotent request IDs, and proposals.
- `api/review_actions.py`, `api/timeline_actions.py`, `api/views.py`: private application
  operations and timeline pagination.
- Frontend `ApplicationDetail`, `RequirementsComparison`, `AssessmentSummary`,
  `ArtifactEditor`, `ProposalReview`, `ApplicationChecklist`, and `JobApplicationsView`.
- Shared `FormModalShell`, `FormField`, `Button`, `Badge`, tabs, panels, dialogs,
  Markdown editor, and the current toast system.

Use new focused service/action/form components for the added processes. Do not expand
the generic form definition/dialog system or put all new processes in ApplicationDetail.

## 1. Resolve gaps

### Interaction

Add a Resolve gap action to partial/not-evidenced requirement rows. A shared form modal
shows the requirement, importance, posting excerpt, existing evidence, and review flags.
The user chooses a decision and supplies an explanatory note:

- Needs review: still unresolved.
- Evidence added: a factual example has been recorded; AI support is not automatically assumed.
- Not met: an acknowledged limitation, not a claim of experience.

Notes are saved against this application. Saving does not trigger generation.
For Evidence added, provide an explicit Add this example to my profile option and an
accuracy confirmation. Otherwise the note is private application context only and is
not silently used as an approved résumé fact.

Adding evidence to the profile appends, never replaces, its existing facts. The server
locks the application/profile and checks the resolution version and expected profile
timestamp before writing. Duplicate or stale saves return a conflict rather than
appending twice or overwriting another edit. Appending resets source confirmation;
the user reviews and saves the changed profile before reassessment or generation.
Explain that a shared-profile change can make other applications' assessments stale.

The requirement's AI-supported status changes only through source-backed reassessment.
Not met does not count as support, remove the requirement from the denominator, or
improve evidence coverage. An active Not met decision for a required item remains an
attention flag and prevents a Strong alignment label even if an AI row contradicts it.
Keep applicant decisions distinct from AI evidence status in the UI.

### Persistence and reassessment

Add an ApplicationRequirementDecision model with application FK, requirement key,
requirement/posting-excerpt/importance snapshot, decision, note, source digest, version,
and timestamps. Limit notes to 4,000 characters; enforce one decision per application
and requirement key. The key is a server-produced SHA-256 hash of whitespace-normalized,
case-folded requirement text, posting excerpt, and importance—not a row index.

Write operations reference the current assessment revision/digest and a requirement
key verified by the server. Owner scoping and expected-version checks apply.
Never accept an arbitrary requirement snapshot supplied by the browser.

Keep decisions when sources change, but mark them as needing reconfirmation rather
than silently carrying their completion into a changed posting. A matching key can
be shown with its earlier note after reassessment; changed/unmatched rows are not
automatically treated as the same requirement.

Use existing completed assessment GenerationRun results and quote_snapshot source
digests for before/after comparisons; do not fabricate historical snapshots or backfill
unsupported history. Pair requirement rows by the same server key. Show supported,
partial, and not-evidenced counts, percentage-point coverage change, changed rows, and
added/removed requirements. When the denominator or posting changed, explicitly say
the assessments are not directly comparable. Label older source snapshots historical.
If fewer than two applicable saved results exist, show an icon and explanatory empty state.
Reassessment uses the existing explicit cost quote and user approval.

## 2. Interview preparation

Add an optional `interview_prep` artifact kind and an Interview preparation tab on the
application detail page. Its editable Markdown document uses the existing editor and
safe image-free preview. Manual writing and saving work without a configured API key.

Optional AI generation proposes:

- Likely questions derived from the actual job requirements and screening questions.
- Source-backed talking points and truthful examples.
- Questions to ask the employer.
- Gaps, unknown facts, and topics requiring the applicant's own answer.

Do not invent employer interview questions as confirmed questions, claim interview
outcomes, or fabricate achievements. Label generated questions as practice suggestions.
Use the existing provider, model, signed quote, allowance, generation activity panel,
history, section-by-section proposal review, and stale/conflict safeguards.

Interview preparation is not a required submission document and is excluded from
Prepare missing drafts. Opening the tab never makes an AI request. Include it in usage,
revisions, proposal review, and timeline labels without changing the existing four-kind
package behavior. Reuse existing copy/print document controls; no new export pipeline.

## 3. Submission checklist

Keep the existing computed profile/résumé/cover-letter/screening-answer review checks.
They remain derived from saved sources and artifact approvals, not manual checkboxes.
Screening answers remain Not needed when there are no actual questions.

Add three explicit applicant confirmations:

- Rate reviewed: requested/offered rate and currency have been checked where applicable.
- Availability reviewed: schedule, timezone, and start availability have been checked.
- Final accuracy checked: contact details, job/company, dates, claims, and attachments checked.

Allow a short editable note per confirmation; rate and availability can be marked
Not applicable with an explanation. Do not invent a rate or employment preference.

Add an ApplicationSubmissionReview model, one per application, storing these fixed-key
checks/notes, review digest, optimistic version, and timestamps. Server validation
rejects unknown keys/states and bounds notes to 2,000 characters per check. The digest
combines the current source fingerprint and submission-document revisions. Relevant
source/document changes invalidate confirmations while retaining notes for re-review.

Add a focused final-check modal and a clear ready/needs-review checklist summary.
Submission remains separately recorded by the user. Do not silently change an application
to Ready/Applied or prevent recording a real submission because its checklist is incomplete.
Record checklist changes on the timeline; do not treat a click as an actual submission.

## 4. Follow-up reminders

Add a Follow-ups tab beside the applications list, with Due and Upcoming views and
owner-scoped server pagination. Use the application's existing follow_up_on field,
timeline, and application detail route; do not create duplicate reminder/task records.

Follow-ups include scheduled applications in Ready, Applied, or Interviewing, matching
the current due-count eligibility. Clearly identify Ready items as pre-submission next
actions rather than implying the employer has received an application. Rejected,
Withdrawn, Draft, and Offer applications do not enter this first iteration's follow-up queue.
Use Asia/Manila date boundaries consistently with the current backend.

Due includes today/overdue, earliest first; Upcoming includes future dates, earliest first.
Show role, company, status, relative due text, latest recorded employer response when
available, and Open application / Record follow-up / Reschedule actions. Dates remain
visible in secondary text; urgency uses a circular icon and semantic tone, not color alone.

Record follow-up uses a focused form with actual note, occurred-on date, and optional
next follow-up date. Persist the activity and next date together, guarded by the expected
application update timestamp. If no next date is chosen, explicitly offer Clear reminder
or Keep current date; do not silently erase or postpone it. Reschedule updates the
existing date and records its old/new values using the current timeline service.
Recheck status, ownership, and date under a lock; prevent duplicate activity creation
using a client-generated request UUID scoped to the application.

This is an in-app reminder queue only. It neither sends messages nor adds infrastructure.
No follow-up date is automatically chosen for existing or new applications.

## API, safety, and failure behavior

Keep all new endpoints under `/api/v1/job-applications/` and the existing private mixin.
Use focused action mixins/services for requirement decisions, submission confirmations,
and follow-up scheduling. Never expose another owner's application/profile/activity.

Add read-only detail fields for requirement decisions, assessment comparison, and final
checks. Add paginated list/follow-up reads. Interview preparation extends existing kind
validation/routes instead of bypassing generation/review rules.

Save operations validate fixed choices, lengths, expected versions, current digests,
and references server-side. Use transactions and the established application → profile
→ artifact/settings lock ordering where those objects are involved. No partial updates
for compound evidence/follow-up actions. Record successful user actions on the timeline.

Failed forms retain input and show field errors; stale requests return 409 with refresh
guidance. Disable repeat submission while busy. Failed/uncertain AI requests retain the
current saved document and usage history; do not automatically retry a paid request.

## Appearance and accessibility

Preserve the existing circular coverage and keyword header, Needs attention beneath it,
white surfaces, compact borders, dashboard typography, Tailwind styling, shadcn/Radix
primitives, and circular category icons. Low visual variance and motion; medium density.

Reuse tabs and modal shells. Use icon-bearing action/save buttons, visible required
labels, application-owned validation, consistent white inputs, keyboard focus and
dialog focus restoration. Stack compact fields on mobile. Keep warnings readable and
distinguish manual decisions, recorded facts, AI suggestions, and historical results.
New empty states include an icon and a useful next step. Use the current toast system.

## Implementation boundaries and acceptance

New models and additive migration files remain inside job_applications. Do not mutate
SQLite, run migrations, change infrastructure/secrets, install dependencies, commit,
or deploy without a separate request. Preserve all unrelated working-tree changes.

The implementation is complete when:

- Gap decisions persist, retain earlier notes safely, and never falsely count as AI support.
- Profile evidence additions are explicit, conflict-safe, and require source reconfirmation.
- Real saved assessments provide transparent before/after comparisons or an honest empty state.
- Interview preparation supports manual editing and explicit quoted AI generation/review.
- Submission confirmations become stale on relevant changes; actual submissions stay separate.
- Due/upcoming follow-ups open the correct application and save notes/schedules consistently.
- Owner permissions, source/revision guards, paid-call consent, and existing document flows remain intact.
- Components follow the existing dashboard pattern with no duplicate form/editor/reminder system.

Validation for this task is focused source review only. Tests/builds/browser automation
require the user's explicit request. Report unverified runtime behavior honestly.

## Review handoff

The user approved the design direction in chat. After approval of this written
specification, create a scoped implementation plan for review and native execution.
This file's creation is not approval to begin product implementation or run migrations.
