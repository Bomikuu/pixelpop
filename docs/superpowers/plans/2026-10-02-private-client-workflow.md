# Private Client Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let Mico manage private clients, multiple projects per client, stage checklists, project documents, payment milestones, and change requests inside the Business dashboard.

**Architecture:** Create an owner-scoped Django `client_workflow` app independent of `LeadershipPlan`, expose DRF session-authenticated endpoints under `/api/v1/client-workflow/`, and add client/project routes inside the existing Business dashboard shell. Snapshot editable master templates into each new project in one database transaction.

**Tech Stack:** Django, Django REST Framework, existing session/CSRF auth, React 19, React Router, Tailwind CSS, existing dashboard UI components.

**Spec:** `docs/superpowers/specs/2026-10-02-client-workflow-and-public-guide-design.md`

## Global Constraints

- A client has one authenticated owner and may have multiple independent projects.
- The client-workflow data does not depend on the 12-week `LeadershipPlan`.
- The agreement draft is jurisdiction-neutral; local/international values are editable project fields, not auto-inserted legal terms.
- Payment/signature statuses are manually recorded and never represented as independently verified.
- Never store API keys, passwords, or other raw access credentials in workflow records.
- No automatic email, e-signing, payment processing, DOCX generation, finance synchronization, or deployment.
- Keep the existing Business dashboard styling and controls. Design variance: low; motion: low; density: medium.
- Project instructions prohibit running automated tests, builds, or browser automation unless the user explicitly requests them. The manual review steps below are acceptance checks for the user or for later authorization, not commands to run unasked.

## Review Focus

1. A user with no leadership plan can still open Clients and create a project; Task 3 checks the setup-dialog bypass and null-safe header.
2. A guessed client/project/document ID owned by another user returns an unavailable response; Task 2 checks every nested resource scope.
3. A failed project create leaves no stages, items, or documents behind; Task 1 checks transaction atomicity.
4. Editing a master template leaves an existing project's document unchanged; Tasks 1 and 5 check snapshot independence.
5. An empty or interrupted document edit does not silently disappear or print as a completed agreement; Task 5 checks draft/unsaved/placeholder states.

---

## File map

- `backendv2/client_workflow/models/`: owner-scoped client, project, stage/checklist, template/document, milestone/change-request models.
- `backendv2/client_workflow/services/defaults.py`: nine stage definitions, default checklist items, seven initial template bodies and titles.
- `backendv2/client_workflow/services/projects.py`: atomic project creation and template snapshotting.
- `backendv2/client_workflow/api/`: serializers, owner-scoped DRF views, URL router.
- `pixelpopup-frontend/src/features/business-dashboard/client-workflow/`: API wrapper and focused client/project/template components.
- `pixelpopup-frontend/src/features/business-dashboard/BusinessDashboard.jsx`: sidebar entry, nested routing, leadership-plan-independent client shell.

### Task 1: Private data model and atomic project initialization

**Files:**
- Create: `backendv2/client_workflow/__init__.py`, `apps.py`, `models/__init__.py`, `models/client.py`, `models/project.py`, `models/workflow.py`, `models/document.py`, `models/commercial.py`
- Create: `backendv2/client_workflow/services/__init__.py`, `services/defaults.py`, `services/projects.py`, `migrations/__init__.py`, `migrations/0001_initial.py`
- Modify: `backendv2/core/settings.py` (add `client_workflow` to `INSTALLED_APPS`)

**Interfaces:**
- Produces `Client`, `Project`, `ProjectStage`, `ChecklistItem`, `MasterTemplate`, `ProjectDocument`, `PaymentMilestone`, `ChangeRequest` with the fields and status values in the spec.
- Produces `STAGES`, `DEFAULT_CHECKLIST`, and `DEFAULT_TEMPLATES` in `services/defaults.py`; stage keys are stable ASCII identifiers (`inquiry`, `discovery`, `recap`, `proposal`, `agreement`, `access`, `build`, `handover`, `support`).
- Produces `ensure_master_templates(owner: User) -> dict[str, MasterTemplate]` and `create_project(*, owner: User, client: Client, fields: dict) -> Project` in `services/projects.py`.

- [ ] **Step 1:** Define model choices, ownership relations, uniqueness for one stage/document kind per project and one master kind per owner, ordering, and safe text/decimal field limits.
- [ ] **Step 2:** Add the nine stage/default-checklist definitions and seven neutral, clearly placeholder-marked template bodies; do not prefill video example terms as commitments.
- [ ] **Step 3:** Implement `ensure_master_templates` idempotently and `create_project` with `transaction.atomic()`, rejecting a client not owned by `owner` and cloning every stage, checklist item, and template document.
- [ ] **Step 4:** Add the initial migration and app registration. Review that the new migration contains no delete/alter operation on existing tables.
- [ ] **Step 5:** Review creation paths for transaction rollback on invalid data and verify that changing a master body cannot mutate a project's saved body.
- [ ] **Step 6:** Commit only this task's files as `feat: add client workflow records and defaults`.

### Task 2: Owner-scoped API

**Files:**
- Create: `backendv2/client_workflow/api/__init__.py`, `api/base.py`, `api/serializers.py`, `api/views.py`, `api/urls.py`
- Modify: `backendv2/core/urls.py` (include `/api/v1/client-workflow/`)

**Interfaces:**
- Consumes `create_project`, `ensure_master_templates`, and the models from Task 1.
- Produces DRF routes `clients/`, `projects/`, `stages/`, `checklist-items/`, `templates/`, `documents/`, `payment-milestones/`, and `change-requests/` with list/create/retrieve/PATCH actions as applicable; no DELETE endpoint is needed because clients use archive state. Filter child lists with `?client=<id>` or `?project=<id>`; clients support `?q=`, `?archived=`, and pagination.
- Private response contract: JSON errors keyed by field where possible, `Cache-Control: private, no-store`, `Vary: Cookie`.

- [ ] **Step 1:** Add a shared session-authenticated/`IsAuthenticated` base with owner-filtered querysets; do not expose an unscoped model manager through nested IDs.
- [ ] **Step 2:** Add serializers with field validation, immutable owner/project parent on update, and explicit “reported received”/signature-manual wording. Reject cross-owner foreign keys rather than silently reparenting.
- [ ] **Step 3:** Route the listed endpoints and use `create_project` for project POST, not raw serializer save. Ensure template defaults are available to an authenticated user with no leadership plan.
- [ ] **Step 4:** Review 401/403 behavior, cross-owner guessed IDs for *every* resource, missing parent IDs, pagination/search, and `no-store` headers. Do not run automated tests unless separately authorized.
- [ ] **Step 5:** Commit only this API task as `feat: expose private client workflow API`.

### Task 3: Business navigation and client directory

**Files:**
- Create: `pixelpopup-frontend/src/features/business-dashboard/client-workflow/api.js`, `ClientsView.jsx`, `ClientDetailView.jsx`, `ClientForm.jsx`
- Modify: `pixelpopup-frontend/src/features/business-dashboard/BusinessDashboard.jsx`

**Interfaces:**
- Consumes Task 2 API via `clientWorkflowApi(path, options = {}, csrf = "")`, matching the existing `leadershipApi` request/error convention.
- Produces routes `/business/clients`, `/business/clients/:clientId`, `/business/clients/:clientId/projects/:projectId`, and `/business/clients/templates` within the existing `/business/*` page.

- [ ] **Step 1:** Add a **Clients** sidebar destination under a client-work group; route nested paths without confusing team-member routes.
- [ ] **Step 2:** Let client routes render the Business shell when `bootstrap.plan` is absent; retain the leadership setup dialog for leadership-only routes and render a null-safe client header.
- [ ] **Step 3:** Build the searchable active/archived client list, create/edit form, and client detail with project list using existing Button/Input/Dialog/empty-state patterns.
- [ ] **Step 4:** Check loading, empty, validation-error, owner-only, narrow-screen, and no-leadership-plan states in the code and hand off a concise manual acceptance path. Do not run browser automation unasked.
- [ ] **Step 5:** Commit only this frontend directory and `BusinessDashboard.jsx` as `feat: add business clients directory`.

### Task 4: Project stages, checklists, and notes

**Files:**
- Create: `pixelpopup-frontend/src/features/business-dashboard/client-workflow/ProjectWorkflowView.jsx`, `StageNavigation.jsx`, `WorkflowChecklist.jsx`, `ProjectForm.jsx`
- Modify: `pixelpopup-frontend/src/features/business-dashboard/BusinessDashboard.jsx` (route project detail from Task 3)

**Interfaces:**
- Consumes Task 2 project/stage/checklist endpoints and Task 3 API wrapper.
- Produces an editable project page where the current stage is explicit, stage status is one of `not_started`, `in_progress`, `waiting_on_client`, `complete`, and `nextAction` is the first unchecked item in that stage.

- [ ] **Step 1:** Add client-scoped project creation/editing with country, currency, governing-law text, amount, and state fields; do not auto-generate legal terms from country.
- [ ] **Step 2:** Build desktop stage index and wrapping mobile stage navigation with semantic buttons, active state, focus styling, and no rigid stage lock.
- [ ] **Step 3:** Add checklist add/edit/complete, stage status/notes save, and top **Next action** link targeting the first unchecked item.
- [ ] **Step 4:** Review blank project, all-checked stage, non-linear stage change, save error, and mobile layout manually when authorized; preserve local edits if a save fails.
- [ ] **Step 5:** Commit only project-workflow files and the route change as `feat: track client project stages`.

### Task 5: Template library and project documents

**Files:**
- Create: `pixelpopup-frontend/src/features/business-dashboard/client-workflow/TemplateLibraryView.jsx`, `ProjectDocumentsView.jsx`, `DocumentEditor.jsx`, `documentActions.js`
- Modify: `pixelpopup-frontend/src/features/business-dashboard/BusinessDashboard.jsx` (template route)

**Interfaces:**
- Consumes Task 2 `templates/` and `documents/` endpoints and Task 3 API wrapper.
- Produces document edit/save, copy, and print-friendly actions; `documentActions.js` owns placeholder detection and copy/print helpers.

- [ ] **Step 1:** Add master-template editing and per-project document editing as full reading surfaces, not tiny modal textareas.
- [ ] **Step 2:** Show unsaved-change state and retain local text after a failed save; warn before discarding local edits on in-app navigation or closing the editor.
- [ ] **Step 3:** Detect `{{placeholder}}` tokens and show a specific warning before copying/printing; for agreement drafts, also show “Draft for professional review” and never present a saved draft as signed.
- [ ] **Step 4:** Provide copy and a document-only print layout via print CSS so browser Save as PDF excludes dashboard navigation, without adding a PDF/DOCX dependency. Review master edits against existing project snapshots and empty-document handling.
- [ ] **Step 5:** Commit only document/template files and route changes as `feat: add client document templates`.

### Task 6: Manual commercial and change tracking

**Files:**
- Create: `pixelpopup-frontend/src/features/business-dashboard/client-workflow/PaymentMilestonesView.jsx`, `ChangeRequestsView.jsx`
- Modify: `pixelpopup-frontend/src/features/business-dashboard/client-workflow/ProjectWorkflowView.jsx`

**Interfaces:**
- Consumes Task 2 `payment-milestones/` and `change-requests/` endpoints.
- Produces project-scoped milestone and change-request lists/forms with exact status labels from the spec.

- [ ] **Step 1:** Add milestone amount/due-date forms and statuses `planned`, `invoiced`, `reported_received`; display currency from the project and label receipt as manually reported.
- [ ] **Step 2:** Add change-request description, optional price/timeline impact, and statuses `proposed`, `approved`, `declined`, `completed`.
- [ ] **Step 3:** Place both areas on project detail without displacing the current stage/next-action hierarchy. Review zero-value/empty states and cross-project IDs through the scoped API contract.
- [ ] **Step 4:** Commit only these files and their direct project-page integration as `feat: track client milestones and changes`.

## Handoff

Keep existing unrelated worktree changes, including `backendv2/db.sqlite3` and the earlier How-tos edits, untouched. Do not push, deploy, run tests, or run builds without a further user request. At completion, report which manual acceptance paths remain for the user to check.
