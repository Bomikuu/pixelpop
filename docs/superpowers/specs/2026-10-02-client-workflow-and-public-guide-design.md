# Client workflow and public guide — design

## Intent and boundaries

Mico needs a repeatable process for future AI-automation and software clients: record each client and each engagement, know what to do next, retain the decisions and documents made along the way, and reuse templates without rewriting past projects. The Business dashboard is the private working system. A separate public portfolio How-to teaches the process without reading from or exposing private records.

The workflow is based on the stages described in [Tara AI Community's client-onboarding video](https://www.facebook.com/taraaicommunity/videos/1415689260539517/), adapted as a flexible checklist rather than a mandatory legal or commercial policy. Specifics mentioned in the video—such as a 30% deposit, two revisions, a three-business-day access window, and 30 days of bug fixes—are examples, not prefilled commitments.

Success means Mico can create a client, start a second project for the same client without overwriting the first, see the current stage and next unchecked action, edit a project-specific copy of each template, and manually record agreement and payment progress. A public reader can follow and copy the general process but cannot access the private agreement draft or client data.

## Chosen approach and alternatives

Use a client-first, project-second data model in a new Django app independent of the existing 12-week leadership plan. Expose it in the existing private Business dashboard shell. Keep the public How-to static in the portfolio's existing How-tos collection.

Alternatives considered:

1. One workflow per client repeats or overwrites information when the same client returns; reject.
2. A project-only list duplicates client contact details and fragments client history; reject.
3. A template-only guide has no durable client record or stage progress; reserve that limited experience for the public article.

## Private records and ownership

- `Client`: authenticated owner, display name, optional organization, contact name/email/phone, country, time zone, notes, archived flag, timestamps. Contact details are private and never rendered on public routes.
- `Project`: parent client, title, short service/request summary, project state (`lead`, `active`, `on_hold`, `completed`, `cancelled`), current workflow stage, optional client country, currency, intended governing-law text, quoted amount, dates, notes, timestamps. One client can own many projects. Country, currency, and governing law are project-level so international and local engagements can coexist.
- `ProjectStage`: one row per stage and project with status (`not_started`, `in_progress`, `waiting_on_client`, `complete`) and optional notes. Stage changes are manual; no stage is locked by another stage.
- `ChecklistItem`: project, stage, label, order, completion state/time. Seed the default items when a project is created; allow project-specific additions, edits, and completion. The next action is the first unchecked item in the current stage, or a prompt to choose the next stage when none remains. Do not infer that an invoice was paid or an agreement was signed from checklist completion.
- `MasterTemplate`: owner, fixed template kind, editable title/body, timestamps. Initial defaults are created per owner only when needed. Updating a master never changes an existing project document.
- `ProjectDocument`: project, template kind, editable title/body, timestamps. Project creation snapshots the then-current master templates. Unfilled placeholders stay visible and are flagged before copying or printing; saving a draft is still allowed.
- `PaymentMilestone`: project, description, amount, currency inherited from project, due date, status (`planned`, `invoiced`, `reported_received`), optional received date and notes. This is manual tracking, not payment verification or processing.
- `ChangeRequest`: project, description, optional price/timeline impact, status (`proposed`, `approved`, `declined`, `completed`), notes and timestamps. Approval is recorded manually; the app does not send or sign requests.

All queries and mutations are scoped to the authenticated owner. Use the existing Django session/CSRF pattern, reject cross-owner object IDs as unavailable, and send `Cache-Control: private, no-store` for private API responses. Do not store API keys, passwords, client secrets, or raw access credentials in these records. The access checklist tracks *whether* access was provided and by which secure channel, not the credential itself. No automatic client emails, e-signing, payment collection, or synchronization with the finance dashboard in this version.

## Workflow stages and seeded checklist

1. **Inquiry:** identify the organization/contact, request, decision-maker, next contact step, and discovery-call booking. No automatic price suggestion.
2. **Discovery:** document the current process step by step, frequency and time cost, actors, tools/subscriptions, success measure, failure handling, and approver. Recording a call requires the client's consent outside this app.
3. **Recap:** summarize the problem, current workflow, desired outcome, assumptions, exclusions/questions, and whether the client confirmed the recap.
4. **Proposal:** define outcome, deliverables, exclusions, phased timeline and dependencies, project price/currency, and proposed milestones. Keep tool jargon out of client-facing default copy.
5. **Agreement and deposit:** review the agreement draft, revisions versus new scope, client responsibilities, third-party costs, support window, signatures, and manually tracked initial payment. These checklist items are reminders, not legal or financial attestations.
6. **Access and kickoff:** request a dedicated account/role, client-owned subscriptions, secure API-key handling, realistic sample data, one communication channel, and one approval contact. No secret values are stored.
7. **Build and review:** record brief progress updates (done/next/blocked), an intermediate demo, testing notes, and any change request before undertaking out-of-scope work.
8. **Handover:** user instructions, technical documentation, training/walkthrough, completion report, final invoice status, and agreed support start/end dates.
9. **Support and close:** track reported issues against the agreed support terms and close the project manually. Do not auto-classify an issue as included or billable.

The default list is editable per project. The interface should show incomplete actions prominently without preventing a non-linear real-world project.

## Template behavior and contract boundary

Provide seven reusable master templates: discovery questionnaire, recap email, proposal, agreement draft, access request, progress update, and handover checklist. Project documents are independent snapshots. Each supports edit, save, copy to clipboard, and a print-friendly view so the browser can save a PDF. There is no generated DOCX, integrated e-signature, outgoing email, or embedded payment in this version.

The agreement draft is jurisdiction-neutral. It uses explicit placeholders for parties, project scope/exclusions, fees and milestones, revisions/change requests, client responsibilities, third-party costs, ownership/license terms, confidentiality and data handling, support, external-service dependencies, limitation of liability, termination, governing law, and signatures. It does **not** preselect a deposit percentage, promise a non-refundable fee, prescribe a liability cap, or claim legal enforceability. A project may record a country, currency, and governing-law text for local or foreign work, but changing that field does not silently insert country-specific legal clauses. Show a clear “draft for professional review” notice before print/copy.

The proposal and checklists may use editable example language, but example quantities and dates must be marked as examples or placeholders. Do not fabricate client outcomes, savings, approvals, or payments.

## Private UI and navigation

Add **Clients** under the Business dashboard navigation. The client list shows search, active/archived filter, project count, and the most relevant project stage without exposing sensitive details in decorative previews. A client detail view shows contact/context and all projects. A project detail view is an editorial work surface inside the existing dashboard shell:

- Compact breadcrumb/title and stage/status summary at top, consistent with current dashboard pages.
- Current **Next action** near the top, with a direct link to the relevant checklist item.
- Stage index on desktop; a wrapping, keyboard-accessible stage navigation on mobile.
- Main reading column for the stage's checklist, notes, and relevant project document. Templates open in an editing view rather than putting a long legal draft inside a small modal.
- Separate, accessible areas for payment milestones and change requests, with manual status language.
- Empty states that explain the next useful action; explicit loading, save-error, and unsaved-change states.

Use existing Tailwind/shadcn-style dashboard controls. Design read: a private operating notebook nested in the Business workspace; the public counterpart is a readable article. Design variance is **low** (inherit the established white/slate/cobalt system), motion intensity **low**, information density **medium**. No new visual identity, heavy decoration, or global dashboard redesign. Client data should remain legible on narrow screens and all interactive controls should support keyboard focus and descriptive labels.

## Public How-to

Add a static guide to the existing `/portfolio/how-tos` directory using the current article shell, typography, table-of-contents pattern, and SEO route metadata. It explains the nine stages with a practical checklist for each, copyable blank discovery questions, a recap-email outline, and a proposal outline. It may link to the source video with attribution. It does not expose private API data, the full agreement draft, project-specific prices or contacts, or a misleading claim that one contract works in every jurisdiction. Its content is source-authored in the frontend, not stored in Django.

## Data flow and failure handling

Frontend private pages call a new `/api/v1/client-workflow/` API using existing same-origin session/CSRF conventions. The Django app owns its models, serializers, views, migrations, and URL configuration. Neither the public guide nor its SEO generation fetches that API. Project creation is atomic: create the project, stage/checklist records, and document snapshots together so a partially initialized workflow cannot appear. If an edit fails, keep the user's unsaved input in the UI and show an actionable error. Pagination/search should keep the client list usable as records grow; archived clients remain retrievable but are not the default list.

## Acceptance criteria and scope limits

- An authenticated user can create, edit, archive, and find their clients; one client can have multiple independently progressing projects.
- Stage status, checklists, notes, template snapshots, milestones, and change requests survive reloads and are private to the owner.
- Master-template edits do not alter existing project documents.
- Project documents can be edited, copied, and printed with visible placeholders and a legal-review notice where relevant.
- The public guide is accessible without authentication and contains no private data or full agreement draft.
- Existing Business dashboard routes and existing portfolio How-to pages keep working and styling remains consistent.
- No auto-sending, credential storage, e-signing, payment processing, or claims of legal validity are introduced.

Per project instructions, implementation validation will be narrow and manual unless the user explicitly requests tests or builds. Deployment is outside this design's authorization.
