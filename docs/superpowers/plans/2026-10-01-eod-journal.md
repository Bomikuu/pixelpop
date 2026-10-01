# End of Day Journal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

The named execution sub-skills are unavailable in this session. The owner already chose native execution; after plan review, implement tasks in this session without subagents.

**Goal:** Add a private EOD journal under Planning, with separate entries per group and date, a month collage, copyable recaps, and safe JSON import.

**Architecture:** A focused Django `end_of_day` app owns groups, entries, date validation, copy formatting, and import preview/commit. Authenticated endpoints mount at `/api/v1/finance/eod/`. A React EOD view composes small group, card, detail, entry-form, and import-form components using existing personal-dashboard primitives.

**Tech Stack:** Django 5, Django REST Framework, SQLite, React 19, Tailwind CSS, existing shadcn/Radix components and Lucide icons; no new dependency.

**Spec:** `docs/superpowers/specs/2026-10-01-eod-journal-design.md`

## Global Constraints

- One `EndOfDayEntry` per `(group, date)` pair. The same date in different groups is valid. The migration creates immutable-name **Personal**; users may add or rename other groups, but not delete groups in this release.
- Compare all dates in `Asia/Manila` while retaining the global UTC setting. Reject future entry dates and future month browsing.
- JSON group precedence: entry `group`, bulk top-level `group`, selected UI group ID. Match names case-insensitively; flag any supplied unknown name in preview, even an overridden top-level name. Never create groups during import.
- Import skips existing saved pairs without overwriting. Duplicate pairs within the payload and invalid/future rows block the entire commit. Preview writes nothing; commit revalidates atomically.
- Workday copy uses supplied custom text or derives from items, then summary. Non-working days never fabricate workday copy.
- Reuse dashboard behavior and Brainstorming's short reduced-motion-safe hover. Use an EOD X-cluster pattern; no dragging. Preserve unrelated dirty changes, especially `backendv2/db.sqlite3`.
- Project instructions prohibit running tests/builds/lint unless explicitly requested. The owner authorized one focused visual test; write focused test cases but do not run an automated suite.

## Review Focus

1. Near UTC midnight, today in Manila may differ: both API validation and UI limits must use the Manila date. Task 1 test checks this boundary.
2. Two entries dated alike in different groups must coexist, while a same-group duplicate must fail. Task 1 test checks both.
3. Bulk import with a valid top-level group, per-entry override, and unknown name must report the unknown name without creating it or writing entries. Task 2 test checks this.
4. A saved pair appearing between preview and commit must be skipped without affecting other eligible rows. Task 2 test checks this race.
5. Switching group or editing an entry into another group/month must reset the selection to that destination; mobile selection must expose detail. Task 3 focused UI check covers both.

---

### Task 1: Group and entry persistence, formatting, and CRUD

**Files:**
- Create: `backendv2/end_of_day/__init__.py`, `apps.py`, `models.py`, `migrations/__init__.py`, `migrations/0001_initial.py`, `migrations/0002_personal_group.py`
- Create: `backendv2/end_of_day/services/__init__.py`, `services/formatting.py`, `api/__init__.py`, `api/serializers.py`, `api/views.py`, `api/urls.py`, `tests/__init__.py`, `tests/test_eod.py`
- Modify: `backendv2/core/settings.py`, `backendv2/core/urls.py`, `backendv2/finance/services/audit.py`

**Interfaces:**
- `EndOfDayGroup(name, created_at, updated_at)` has case-insensitive unique name. The data migration creates `Personal`; renaming it is rejected.
- `EndOfDayEntry(group, date, type, title, summary, items, slack_message, bullet_list, created_at, updated_at)` has database uniqueness on `(group, date)`.
- `manila_today() -> date` uses `timezone.localdate(timezone=ZoneInfo("Asia/Manila"))`.
- `copy_outputs(entry) -> {"slack_message": str, "bullet_list": list[str]}` returns custom or deterministic fallback.
- `GET/POST /api/v1/finance/eod/groups/`, `PATCH /api/v1/finance/eod/groups/<int:pk>/`; `GET/POST /api/v1/finance/eod/entries/`, `PATCH /api/v1/finance/eod/entries/<int:pk>/`.
- `GET entries/?month=YYYY-MM&group=<id>` returns `{month, today, entries}` oldest-first. Entry writes use group ID; response includes group ID/name and derived copy.

- [ ] **Step 1: Write model/API cases.** In `tests/test_eod.py`, assert Personal exists after migration; case-insensitive group duplicate and Personal rename are rejected; two same-day entries in different groups succeed; same-group duplicate fails; unauthenticated CRUD is denied; Manila midnight boundary blocks only future dates; malformed/future month and unknown group fail; edit-to-occupied pair leaves original intact; workday fallback/custom copy and non-workday output are correct; audit snapshots exclude journal prose.
- [ ] **Step 2: Implement models and migrations.** Make the group name unique via a case-insensitive database constraint, create the Personal group in `0002_personal_group.py`, and use `UniqueConstraint(fields=["group", "date"], ...)` for entries.
- [ ] **Step 3: Implement serializers and formatting.** Enforce required workday title/summary, non-working title default, bounded strings/lists and element types, group existence, Manila date limit, duplicate-pair validation, and deterministic copy output.
- [ ] **Step 4: Implement authenticated views and wiring.** Reuse `PrivateMixin`; list only selected group/month, add/rename groups and create/edit entries, catch uniqueness races as readable validation errors, and record group/entry changes in finance audit with group/date/type/title but no private prose. Add EOD to audit area allowlists.
- [ ] **Step 5: Review and commit.** Parse changed Python files and run `git diff --check` only; do not run the test suite or stage the dirty SQLite file. Commit Task 1 files alone.

### Task 2: Group-aware JSON preview and atomic import

**Files:**
- Create: `backendv2/end_of_day/services/imports.py`
- Modify: `backendv2/end_of_day/api/views.py`, `api/urls.py`, `tests/test_eod.py`

**Interfaces:**
- `preview_import(payload: object, fallback_group_id: int) -> dict` returns `{counts: {create, skip, error}, rows: [{date, group, action, errors}], errors}` without writing. `action` is `create`, `skip`, or `error`.
- `apply_import(payload: object, fallback_group_id: int, actor) -> dict` revalidates inside `transaction.atomic()` and returns created/skipped group/date labels and counts. Any invalid payload raises validation error before writes.
- `POST /api/v1/finance/eod/import/preview/?group=<id>` and `POST /api/v1/finance/eod/import/?group=<id>`.

- [ ] **Step 1: Write import cases.** Assert single and bulk shapes, selected-group fallback, top-level group, per-entry override, same date in different groups, duplicate pair in one payload, unknown names (including unused overridden top-level name), malformed rows, month/date mismatch, future date, existing-pair skip, no preview writes, atomic invalid-batch failure, and preview-to-commit race skip.
- [ ] **Step 2: Implement normalization and preview.** Parse only accepted shapes/fields; resolve supplied names case-insensitively against saved groups before row validation; report every unknown supplied name, never create it; preserve selected-group fallback for omitted names; return group/date findings without journal text.
- [ ] **Step 3: Implement commit.** Reuse normalization, fail before any write on errors, create eligible pairs in one transaction, and skip already-existing pairs at commit time. Handle uniqueness races without replacing a saved entry; audit successful imports without storing pasted prose.
- [ ] **Step 4: Review and commit.** Parse changed Python files and run `git diff --check` only; do not run backend tests or stage SQLite. Commit Task 2 files alone.

### Task 3: EOD page, group selector, collage, detail, and forms

**Files:**
- Create: `pixelpopup-frontend/src/features/personal-dashboard/views/EodView.jsx`
- Create: `pixelpopup-frontend/src/features/personal-dashboard/components/eod/EodCard.jsx`, `EodDetail.jsx`, `EodEntryForm.jsx`, `EodGroupForm.jsx`, `EodImportForm.jsx`, `EodActionMenu.jsx`, `EodPattern.jsx`, `eod.css`
- Modify: `pixelpopup-frontend/src/features/personal-dashboard/Dashboard.jsx`, `views/EventsView.jsx`

**Interfaces:**
- `EodView({ dashboard, notify })` reads `eod/groups/` and `eod/entries/?month=YYYY-MM&group=<id>` via `useRecords(path, dashboard.request, dashboard.version)`; writes via `dashboard.mutate`.
- `EodCard({ entry, selected, onSelect, patternVariant })` is a keyboard-selectable date card, not draggable.
- `EodDetail({ entry, onEdit, onCopy, detailRef })` shows the selected group/date and status; `onCopy(text, label)` reports clipboard success/failure.
- `EodEntryForm({ draft, onChange, errors, disabled, maxDate, groups })` and `EodGroupForm({ draft, onChange, errors, disabled })` reuse `FormModalShell`, `FormField`, and `SelectableField` conventions.
- `EodImportForm({ rawJson, onChange, preview, disabled })` keeps pasted text after errors and shows resolved groups and create/skip/error results.

- [ ] **Step 1: Wire route and scope.** Add EOD under Planning with `/dashboard/eod`, a concise breadcrumb description, and Events area filter. Suppress the dashboard's generic summary-month field for EOD.
- [ ] **Step 2: Build group/month state.** Default to Personal/current Manila month; expose group select, add group, and rename non-Personal group. Cap forward navigation at current month; fetch only selected group/month and choose today's or latest saved entry, resetting selection when scope changes.
- [ ] **Step 3: Build board/detail.** Render saved dates only in chronological, left-starting, stable varied-span grid; show status, title/preview, and item count. Present selected detail, separate Slack/bullet Copy actions, empty/loading/error states, and mobile below-board detail with focus/scroll on selection.
- [ ] **Step 4: Build actions and modals.** One Add menu provides entry/group/import. Entry modal preselects current group, permits group/date edits, hides workday-only fields for non-working types, and limits future dates. Group modal adds/renames with errors. Import modal previews resolved groups, disables commit on errors, and refreshes after success. Follow edited entries into their destination group/month; show dashboard toasts for save/copy failures.
- [ ] **Step 5: Apply requested visual behavior.** Use Tailwind for ordinary layout and a small feature CSS rule for clustered X marks and Brainstorming-like one-shot wiggle; disable motion when reduced motion is requested. No drag affordance.
- [ ] **Step 6: Review and commit.** Parse changed JSX and run `git diff --check` only; do not run a build or UI suite. Commit Task 3 files alone.

### Task 4: Authorized focused visual pass

**Files:** Edit only Task 3 UI files if the pass reveals a defect.

**Interfaces:** Local `/dashboard/eod` desktop and mobile views, using existing authentication if available; do not import example records into personal data.

- [ ] **Step 1: Inspect one desktop and one mobile viewport.** Check group selector, collage flow, detail readability, modal width, focus, contrast, and overflow. Browser automation is allowed only for this focused visual test.
- [ ] **Step 2: Fix and recheck directly affected UI defects.** Keep to one bounded visual-fix batch; if the local app is unavailable, report that instead of changing infrastructure or user data.
- [ ] **Step 3: Handoff.** Confirm `backendv2/db.sqlite3` remains unstaged; report delivered behavior, visual check result, and manual checks left to the owner.
