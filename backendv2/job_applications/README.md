# Job applications

## Résumé optimization

In an application's **Application package → Tailored résumé**, use the existing three-step workflow:

1. **Find opportunities** (`resume`, mode `discover`): compare the posting with confirmed profile sources and the current résumé. Advice separates covered keywords, supported but under-emphasized skills, and missing evidence. Posting/source quotations are checked on the server. Each available destination links to its résumé section editor.
2. **Tailor résumé** (`resume`, mode `tailor`): prepare one complete proposal covering supported keyword placement, genuine achievements, clear wording, relevant experience, a role-specific summary and differentiators. Section-level before/after review includes reasons and traceable source quotes. Accepting reviewed sections is explicit; saved drafts and the original PDF/layout are preserved.
3. **Final check** (`resume`, mode `check`): review the saved résumé for prioritized keyword, positioning, achievement, consistency, unsupported-claim, length and common text-formatting issues. Findings open the appropriate section editor. This is qualitative advice, not an ATS parsing test, acceptance probability or employer score.

All three actions require a fresh signed cost quote and use the existing provider, usage ledger and monthly allowance. Tailoring and final checks use the configured refinement model when present. Reports live in `GenerationRun.result` rather than a new table; report modes never replace or approve an artifact. They carry a résumé revision/body hash and source fingerprint, becoming stale after source or draft changes (including unsaved editor changes in the UI). Conflicting report results stay read-only in AI usage, never as insertable résumé alternatives. No new migration or dependency is needed for this workflow.

Hypothetical experience suggestions remain a separate action; optimization uses only confirmed source facts. Source quotations are traceability checks, not independent verification of an applicant's claims. Review the AI's interpretation and every proposed claim yourself. Manual edits to a proposal mark its earlier AI rationale as historical. No tests, builds, live provider calls or database operations were run for this extension; review is source-only.

Private, owner-scoped job application records for the business dashboard at `/business/applications`. Older `/dashboard/applications` links redirect to the business workspace; existing records and API ownership are unchanged.

Install backend requirements and apply migrations using the same database environment as the running backend:

```sh
cd backendv2
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python manage.py migrate
```

For production, use the existing Neon migration workflow with the production database URL; no local personal database is deployed with this feature.

Set any desired provider keys in `backendv2/.env` locally or the backend production secret environment:

```dotenv
OPENAI_API_KEY=your-openai-key
GEMINI_API_KEY=your-gemini-key
ANTHROPIC_API_KEY=your-anthropic-key
OPENROUTER_API_KEY=your-openrouter-key
DEEPSEEK_API_KEY=your-deepseek-key
JOB_APPLICATION_IMPORT_HOSTS=
```

Choose a provider with the avatar-style tiles under business dashboard **Career → Application AI**, or **Job applications → Application AI**. The browser receives configuration status and model choices, never keys. Without a key, profile editing, manual drafts, Word exports, and application tracking still work. Model choices are maintained in `services/providers.py`; dated rates and output limits are maintained in `services/pricing.py`. Rates are estimates and provider bills remain authoritative.

See [Vendor integration instructions](PROVIDERS.md) for account/key creation, local and Vercel configuration, models, request formats, privacy, costs and troubleshooting for all five vendors. Each provider also has inline setup help in Application AI.

OpenRouter initially offers `openai/gpt-6-luna` and `openai/gpt-6.1-sol`, pinned to the OpenAI provider with fallbacks disabled. DeepSeek offers `deepseek-flash` and `deepseek-v4-pro`; quotes and recorded token estimates use peak uncached rates, not actual invoice totals. New adapters keep the existing JSON validation, manual review, quote/reservation/reconciliation safeguards and server-side credentials. This provider addition does not need a new dependency or migration. It was source-reviewed only; no tests, builds, live calls, deployment or secret changes were performed.

Document editing reuses the Clients/Templates Markdown toolbar; previews can be hidden. **My original résumé PDF** retrieves the existing portfolio asset unchanged, not a recreation from extracted text. Cover letters retain the shared document preview, Print / PDF controls, and Word export.

## Application preparation and review

The application checklist derives progress from confirmed, usable profile sources and reviewed résumé/cover-letter/answer drafts. Saving text is not approval. Answers are **Not needed** when no screening questions are supplied. Submission and follow-up are separate: preparation never marks an application submitted. Record submission/status and follow-up dates explicitly.

**Requirements** compares the posting with reviewed experience/portfolio facts and résumé text. Results are AI-assisted, not verified qualifications or a numerical match score. Exact source excerpts are checked against supplied text; invalid quotations are removed and the row becomes **Not evidenced**. That label means missing evidence in the records, not missing ability. Source changes flag an assessment for explicit reassessment; existing narrative-only assessments remain readable.

**Needs attention** starts collapsed with a visible review count. **Start evidence note** uses existing source excerpts or explicit placeholders, never fabricated experience. It defaults to **Needs review**, without changing AI coverage or adding a shared profile fact automatically.

Under **Requirements → Propose résumé experience**, save a résumé first and keep the structured assessment current. After approving the normal cost quote, `mode=experience` generates hypothetical experience wording for partial/not-evidenced requirements—not a Currently learning section. The backend preserves the existing résumé and appends additions only to a pending proposal. Edit or reject the examples through the existing section-review controls before accepting. Suggestions never change evidence status or shared profile facts automatically; unsupported employers, dates, credentials and achievements are not fabricated as facts. Assessment revisions are included in the quote and rechecked after generation. No new database schema is required.

Résumé, cover-letter and screening-answer generation creates a **pending proposal**, never overwriting the saved artifact. Review the read-only original beside proposed text, choose **Keep original** or **Use proposed** for each changed section, then **Save review** and **Accept reviewed draft**. Editing proposed text resets that section's decision for a fresh review. Decisions survive reopening. Unstructured source résumés are compared as a whole document rather than guessing section matches. Discarding leaves saved drafts intact; accepted text keeps the prior revision in history.

Each proposal has a version, source fingerprint and base artifact revision. A newer review in another tab, changed source, or newer saved draft returns HTTP 409 instead of overwriting it. Saving a manual draft clears approval; **Mark reviewed** approves its current revision against confirmed sources. Changing posting/profile source text invalidates previous approval. History distinguishes **Proposal ready**, **Accepted**, and **Discarded**.

## Tailored résumé exports

The résumé builder edits individual sections in the existing form shell and Markdown toolbar; **Apply to draft** does not save or approve them. **Full Markdown** remains available. A draft changed while a section is open must be reopened rather than overwritten.

**Original layout** is the default for preview, Word export and browser **Print / PDF**: A4, Times New Roman, centered contact headings, thin rules, and approximately 25% label/date plus 75% content columns from the original résumé. **ATS-friendly** is an optional single-column Arial layout. This document styling is restricted to the résumé, not Business controls; the original portfolio PDF is unchanged. Explicit dated entries use:

The original-layout template follows the supplied PDF's compact proportions: approximately 9.5pt body, 13pt name/title, 8.75pt tracked section labels, 10mm top margin and 16mm side margins. Simple skills use two columns. Word and browser pagination/font availability may differ; content is never clipped to force identical page breaks.

```markdown
## Professional experience
### May 2018 – Aug 2019 | Software Developer, employer from your sources
- A source-supported achievement.
```

Alternatively, put `### Software Developer, employer from your sources` on one line and `May 2018 – Aug 2019` on the following line. Both explicit formats use the date rail in Original layout and inline dates in ATS-friendly. Word exports accept only `layout=original` or `layout=ats`.

Ordinary headings and unstructured text remain in the content column; the renderer never invents a date. Safe links, formatting and lists are retained, while raw HTML and remote images are excluded. Missing contacts are omitted. Content flows naturally and is never cut to force the original six-page count; Word and browser pagination can differ.

Only a current, saved, reviewed résumé is exportable. Unsaved edits block export. Word checks approval server-side; Print / PDF rechecks the saved revision/source before opening the captured preview in the browser print dialog. Choose **Save as PDF** there—this is not a server-generated PDF download. Pending proposals are not export sources. Manual drafting and approval work without an AI key.

The additive review migration must be applied to the database used by the running backend. It was written but **not executed** during this implementation. From the repository root, when ready:

```sh
cd backendv2
.venv/bin/python manage.py migrate job_applications
```

Use your normal production Neon migration procedure separately; do not deploy the local SQLite file.

Job descriptions can always be pasted. Automatic import is disabled by default; populate the exact hostname allowlist only for public sites whose terms permit your importer. HTTPS connections are pinned to a validated public IP and each redirect is revalidated. No authentication, CAPTCHA bypass, or browser automation is used.

PDF, `.docx`, and UTF-8 `.txt` résumés up to 5 MB are extracted for review. PDF files must contain readable text and must be unencrypted, with at most 30 pages. The source file is discarded; only user-reviewed source text is saved. Confirm sources before generation. Uploaded text and generated drafts are private and sent only to the selected AI provider when generation is requested.

API root: `/api/v1/job-applications/`. Session authentication, CSRF, and object ownership checks apply to profile, settings, imports, application records, draft revisions, generation history, proposals, review and exports. Generation is limited to 30 requests per user per hour. Each request carries a UUID for retry protection and the expected artifact revision. Concurrent saves retain newer text; a generated alternative is available in history if a revision conflict occurs. Proposal endpoints live under `applications/{id}/proposals/`; manual approval uses `applications/{id}/review/{kind}/`.

Focused manual verification: save a profile, preview each upload type, create a pasted posting, configure a provider, generate each draft, save edits, export Word, record a response, and refresh the application. Verify an unconfigured provider explains setup, an unapproved URL falls back to paste, and another authenticated user cannot load your application IDs.

For the review extension: reopen saved section decisions, accept/discard a proposal, edit a source/draft in another tab and verify stale acceptance is blocked, then review and export a résumé with long dated entries in Word and browser PDF. Check narrow-screen comparisons and keyboard navigation. Runtime/visual tests, builds, live provider calls, migrations and deployment were **not performed** for this extension; only source review and read-only inspection of the reference PDF were performed.

## Timeline, allowance, reusable answers and client conversion

### Application timeline

The application **Timeline** combines actual submission dates, replies, interviews, notes, follow-up changes, status changes and preparation/review activity. Filters and 20-item pages keep histories bounded (maximum 50). Upcoming records are separate from recorded history. All entries remain read-only; manual notes/replies do not automatically change status or schedule.

Status/date edits write old-to-new context atomically. Correcting a submission date records a correction rather than another submission. Legacy dates without an event are labeled current recorded dates; no employer interaction is inferred. The detail response keeps the latest 30 activities for compatibility; complete history is available through `applications/{id}/timeline/`.

### AI estimates and monthly guard

Set an optional **Monthly budget (USD)** in Application AI. It applies to this owner's job-generation requests across all providers/applications, using Asia/Manila calendar months and each run's start time. Blank means no app limit; zero stops new generation. Manual drafts, tracking, review and exports remain available.

Every new Generate/Refine/Prepare request first obtains a local signed quote. Quoting does not call an AI provider. The input allowance is UTF-8 byte length of instructions, content and schema plus 1,024 framing tokens; output allowance is 12,000 tokens for fit assessments and 6,000 for other artifacts. The provider request uses the same allowance as the signed quote. Assessments request concise prose and evidence without omitting material requirements. This is approximate, not a tokenization guarantee. Standard uncached rates, reasoning and additional provider fees may differ from billing. The guard is **not a guaranteed provider billing cap**.

Incomplete OpenAI responses distinguish output-limit exhaustion from content filtering; unrecognized failures show the response status without exposing raw provider payloads. Saved drafts stay intact and no paid retry is automatic. Failed requests may still be billed; inspect AI usage and vendor billing before requesting a fresh quote and retrying. Quotes issued under the earlier limit or prompt are invalidated by the existing quote verification.

Quotes expire after ten minutes and bind the owner, application, source fingerprint, draft revision, settings version, price and Manila month. Changed/expired quotes return 409; request a fresh estimate. Prepare missing drafts shows individual and combined estimates, then runs sequentially. If a later request cannot proceed, earlier saved results stay available.

The server locks the owner's AI settings while checking and reserving allowance, then releases DB locks before the provider call. Duplicate UUIDs cannot dispatch/reserve twice. Returned usable token usage replaces the held amount at the captured price, even if higher than the estimate or the draft conflicts with newer edits. Existing recorded costs are not repriced. Gemini 3.8 Flash has separate rates from January 1, 2027.

Failed/timed-out calls and missing usage keep unresolved held estimates. Unknown legacy costs are unavailable, not zero; reconcile current-month unknown unreserved runs before enabling protected generation. **AI requests across applications** in AI settings lets you filter unresolved requests and open their application. Reconcile against provider billing with a nonnegative amount (explicit zero is allowed) and a note. Stalled requests can be reconciled after five minutes; a late response preserves the manual charge and records returned token usage separately. Reconciliation is versioned and logged. Lowering a budget never erases usage or reservations.

Endpoints: `applications/{id}/quote/`, `applications/{id}/generate/` (requires `quote_token`), `applications/{id}/usage/`, owner-wide `usage/`, and `applications/{id}/usage/{uuid}/reconcile/`. Usage supports `scope=all|current|unresolved`. Settings PATCH requires `expected_version`.

### Reviewed reusable answers

**Job applications → Reusable answers** stores private availability/rate/experience/screening responses. Save, preview and explicitly mark reviewed. Editing the question/category/body invalidates review; archiving preserves text. All edits and review actions require the expected revision.

**Use reviewed answer** in the screening editor previews and rechecks a current active reviewed answer, then appends it to the local draft. It does not overwrite accepted text, save automatically or approve the application draft. Library text is not silently included in AI requests. Library changes do not rewrite existing artifacts. API: `answers/`, `answers/{id}/review/`; no hard-delete action.

### Linked client work

Use **Create linked client/project** on an application when you decide it represents client work, regardless of application status. Select an active existing owned client or review editable prefilled new-client/project data. Unknown contacts stay blank; applicant contacts are never copied as client contacts. Overlong company names show validation rather than being silently truncated. State defaults to Lead unless you choose another state.

Conversion calls the existing `client_workflow.services.projects.create_project` service to initialize inquiry stages, checklists and the owner's document templates. Optional client creation, project initialization, application linkage and activity are one transaction. Retries return the existing link; unavailable removed links do not silently create another. The application header opens the existing client/project pages. No payment, finance transaction, public publication or automatic application-status change is implied.

### Required database update and verification status

Additive migrations authored for this extension:

- `0003_application_timeline`
- `0004_application_ai_budget`
- `0005_reusable_answers`
- `0006_application_client_link` (depends on `client_workflow.0002_document_publication`)

They were **not applied**. When ready, run against the same database environment as your backend:

```sh
cd backendv2
.venv/bin/python manage.py migrate
```

Only source review was performed. Tests, builds, browser/visual checks, live provider requests, migration execution, commits, pushes and deployment were not run. Runtime/concurrency/provider behavior remains unverified. The local personal SQLite database was left untouched.

## Gap decisions, interview preparation, final checks and follow-ups

**Requirements → Resolve gap** saves a private applicant decision and explanatory note separately from AI evidence. Evidence added does not increase coverage. Only explicitly adding an accuracy-confirmed example to the shared profile changes generation sources; it appends to existing facts and requires profile reconfirmation. Assessment revision, source digest, decision version and profile timestamp checks reject stale writes. Changed sources retain notes but require reconfirmation; unmatched requirements retain historical notes. An active required **Not met** decision stays in Needs attention and prevents Strong alignment.

**Assessment changes** compares the latest two completed assessment results. Coverage deltas are shown only with the same recorded posting and requirement set. New assessment runs record a separate posting fingerprint; older changed-source runs without that baseline are labeled not directly comparable. Manual edits do not manufacture assessment history.

**Interview preparation** is optional. Its Markdown editor, revisions, manual approval, proposal review and cost quotes reuse the existing pipeline. Manual writing needs no API key; opening the tab never calls a provider. Suggested questions are practice material, not employer-confirmed questions. Interview preparation is excluded from Prepare missing drafts and submission readiness.

**Final submission checks** records rate, availability and final accuracy confirmations. Rate/availability can be Not applicable with an explanation; accuracy cannot. Changed sources or submission-document revisions invalidate confirmations while retaining notes. Saving checks never marks Ready/Applied or blocks recording a real submission separately.

**Job applications → Follow-ups** has server-paginated Due/Upcoming queues for scheduled Ready, Applied and Interviewing records using Manila dates. Ready means a pre-submission next action. Record what actually happened, reschedule, or explicitly keep/clear the reminder. Actions use application timestamps and retry UUIDs to prevent duplicate activities; no messages, push notifications, tasks or schedules are created. The detail checklist and Timeline open the same dedicated forms.

New endpoints: POST `applications/{id}/requirement-decision/`, POST `applications/{id}/submission-review/`, GET `applications/follow-ups/?range=due|upcoming&page=N`, and POST `applications/{id}/follow-up/`. They keep the existing session authentication, CSRF and owner scoping.

Apply additive migration **0007_application_action_workflow** to the running backend's database before using these features:

```sh
cd backendv2
.venv/bin/python manage.py migrate job_applications
```

Migration 0007 was authored but **not applied** here. These additions were source-reviewed only; runtime, concurrency and visual behavior remain unverified. No tests/builds, paid provider calls, database writes, dependency changes, commits or deployments were performed for this extension.
