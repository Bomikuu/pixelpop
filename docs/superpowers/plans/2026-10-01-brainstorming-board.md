# Brainstorming Board Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a private Brainstorming idea wall under Planning, import the owner's attached ideas, and carry selected ideas to the existing task system without requiring a due date.

**Architecture:** A focused `brainstorm` Django app owns boards, groups, ideas, import validation, and private API endpoints. The existing `finance.Deadline` task becomes optionally undated, while bills and scheduled items remain dated. A React page reuses personal-dashboard controls and the backend audit service records safe action summaries.

**Tech Stack:** Django 5, DRF, SQLite migrations, React 19, Tailwind CSS, existing shadcn-style primitives, Lucide.

**Spec:** `docs/superpowers/specs/2026-10-01-brainstorming-board-design.md`

## Global Constraints

- Personal dashboard only; no business or public brainstorming route and no AI API.
- Use the supplied JSON as an idempotent **local database import** after migrations; never publish it as a frontend asset or overwrite existing ideas.
- One board is the active workspace; never mix ideas across boards.
- A carried idea stays on its board and links to at most one existing `Deadline(kind="task")`.
- `due_date=None` is legal for tasks/reminders only; bills, subscriptions, payments, recurrence, and installments stay dated.
- Preview, invalid requests, and no-op edits must not create audit rows; audit snapshots exclude source text, notes, reference URL, pasted JSON, and credentials.
- Preserve unrelated changes and the personal SQLite database. Project instructions prohibit running tests or builds unless explicitly requested; test commands below are **deferred**, not permission to run them.

## Review Focus

1. Importing the same multi-board file twice must leave board/group/idea counts unchanged on the second run (Task 3 test).
2. An imported idea whose group or URL is invalid must be reported without corrupting valid ideas in the same document (Task 3 test).
3. Two carry requests for one idea must return/reuse the linked task rather than create two tasks (Task 4 test).
4. An undated task must be visible and completable but must not appear in overdue/calendar/month-only results (Task 1 test).
5. Moving an idea to a group on a different board must fail without moving or disclosing the idea (Task 2 test).

---

### Task 1: Support undated tasks in the existing task system

**Files:**
- Modify: `backendv2/finance/models.py` — nullable `Deadline.due_date`, task priority.
- Create: `backendv2/finance/migrations/0022_deadline_optional_date_priority.py`.
- Modify: `backendv2/finance/api/serializers.py` — null-date validation and priority field.
- Modify: `backendv2/finance/api/views.py` — explicit `undated=1` task filter.
- Modify: `backendv2/finance/services/summaries.py` — neutral undated urgency and dated-only next/overdue calculations.
- Modify: `pixelpopup-frontend/src/features/personal-dashboard/components/RecordList.jsx` — No date period for task list and null-date display.
- Modify: `pixelpopup-frontend/src/features/personal-dashboard/components/forms/formDefinitions.js` — optional task date, priority, dated recurrence requirement.
- Create: `backendv2/finance/tests/test_undated_tasks.py`.

**Interfaces:** `Deadline.priority` is `high|medium|low` (default `medium`); `Deadline.due_date` is nullable. `GET /api/v1/finance/deadlines/?undated=1` lists undated tasks/reminders only and ignores the month filter. `urgency(undated_pending_task) -> "unscheduled"`; other kinds reject null dates. A null date also rejects a due time or recurring schedule, and sets reminder days to zero. Add a database constraint so non-task/reminder records cannot persist without a date.

- [ ] Write tests for null task create/complete, bill-without-date rejection, dated recurrence requirement, `undated=1` isolation, and exclusion from overview overdue/calendar/monthly summaries.
- [ ] Add the additive migration and serializer/model validation; keep existing dated records unchanged.
- [ ] Make urgency, deadline summaries, ordering, list filtering, and the task form/list safe for null dates. Keep financing and recurrence date paths untouched.
- [ ] Review all direct `Deadline.due_date` dereferences found by a narrow search; protect only paths that can receive undated tasks.
- [ ] Deferred verification if requested: `cd backendv2 && .venv/bin/python manage.py test finance.tests.test_undated_tasks --settings=finance.tests.settings` (expect pass).
- [ ] Commit only this task's code/tests/migration, excluding `backendv2/db.sqlite3`.

### Task 2: Board, group, and idea persistence/API

**Files:**
- Create: `backendv2/brainstorm/apps.py`, `models.py`, `migrations/0001_initial.py`, `services/fingerprints.py`, `api/serializers.py`, `api/views.py`, `api/urls.py`, package `__init__.py` files.
- Modify: `backendv2/core/settings.py`, `backendv2/core/urls.py` — install app and mount `/api/v1/finance/brainstorm/`.
- Create: `backendv2/brainstorm/tests/test_boards.py`.

**Interfaces:** `fingerprint_title(title: str) -> str` performs Unicode normalization, casefolding, punctuation removal, and whitespace collapse. Models are `BrainstormBoard`, `BrainstormGroup`, and `BrainstormIdea` with fields and uniqueness from the spec. Limits: board/group name 120 characters, idea title 160, description/source text/notes 4,000 each, reference URL 2,048, at most 20 tags of at most 32 characters each. Private endpoints: `boards/` GET/POST, `boards/<id>/` PATCH, `groups/` POST, `groups/<id>/` PATCH, `ideas/?board=<id>` GET, `ideas/` POST, and `ideas/<id>/` PATCH/DELETE. Idea PATCH supports group move, urgency/status, archive, and content edits; only same-board groups are accepted.

- [ ] Write tests for board isolation, same-board title fingerprint collisions, Unicode/punctuation normalization, cross-board group rejection, protected group rename/create, and delete leaving a linked task intact.
- [ ] Add models/migration and model-level uniqueness; validate tags, status/urgency, HTTP(S) reference URLs, group ownership, and bounded text lengths in serializers/services.
- [ ] Add private list/mutation endpoints using existing session auth and no-store conventions; keep board list and idea list separate.
- [ ] Deferred verification if requested: run `brainstorm.tests.test_boards` under `finance.tests.settings` (expect pass).
- [ ] Commit only the new app's persistence/API slice.

### Task 3: Preview, import, and local seed command

**Files:**
- Create: `backendv2/brainstorm/services/imports.py`, `management/commands/import_brainstorm.py`, `tests/test_imports.py`.
- Modify: `backendv2/brainstorm/api/views.py`, `api/urls.py` — preview and confirm endpoints.

**Interfaces:** `preview_import(payload: dict) -> dict` is read-only; `apply_import(payload: dict, actor=None, source="dashboard") -> dict` atomically creates valid boards/groups/ideas and skips duplicates. Accept `{board,groups}` or `{boards:[...]}`, ignore `duplicates_removed`, cap the serialized request at 1 MiB and 50 boards/200 groups/1,000 ideas, and return board/group counts, `created`, `duplicates_skipped`, `invalid`, and indexed error details. `POST import/preview/` never mutates; `POST import/` confirms. `manage.py import_brainstorm <json-path>` invokes the same service.

- [ ] Write tests for preview immutability, both JSON shapes, intra-upload/database duplicates, invalid idea reporting, malformed-document 400, size cap, and second-run idempotence.
- [ ] Implement one parser shared by preview/confirm/command and atomic, constraint-safe writes; imports never update existing records.
- [ ] Add the command with an explicit file path argument and machine-readable counts; do not embed the user's JSON in source or frontend assets.
- [ ] Deferred verification if requested: run `brainstorm.tests.test_imports` under `finance.tests.settings` (expect pass).
- [ ] Commit only import code and tests.

### Task 4: Carry to task and safe Events log integration

**Files:**
- Create: `backendv2/brainstorm/services/carry.py`, `tests/test_carry.py`.
- Modify: `backendv2/brainstorm/api/views.py`, `api/urls.py` — `POST ideas/<id>/carry/`.
- Modify: `backendv2/finance/services/audit.py`, `backendv2/finance/api/events.py` only if required by the existing area mapping.
- Modify: `pixelpopup-frontend/src/features/personal-dashboard/views/EventsView.jsx` — Brainstorming area filter.

**Interfaces:** `carry_idea(idea_id: int, *, title: str, description: str, priority: str, due_date: date | None, category_id: int | None, actor: User) -> tuple[BrainstormIdea, Deadline]` performs an atomic, row-locked conversion. The idea becomes `carried_over` and links to the task; repeat calls return the existing link without a second task/event. Model/serializer exposes linked task status, including a missing-link state if the task is later deleted. Brainstorm audit actions use `area="brainstorm"` and only safe fields; one import is one summary event.

- [ ] Write tests for prefilled/mapped priority, optional date, category, retry idempotence, linked-task deletion/re-carry, no audit on failures/previews/no-op edits, and no pasted JSON/source text/notes/URL in audit diffs.
- [ ] Implement carry service and endpoint without changing task completion behavior.
- [ ] Add safe audit calls around successful board/group/idea/import/carry mutations; extend event area labels/filtering.
- [ ] Deferred verification if requested: run `brainstorm.tests.test_carry` under `finance.tests.settings` (expect pass).
- [ ] Commit only conversion and audit integration.

### Task 5: Personal dashboard Brainstorming page

**Files:**
- Create: `pixelpopup-frontend/src/features/personal-dashboard/views/BrainstormView.jsx` and focused components under `components/brainstorm/` for board tabs, idea card, idea dialog, import dialog, and carry dialog.
- Modify: `pixelpopup-frontend/src/features/personal-dashboard/Dashboard.jsx` — Planning navigation and route branch.

**Interfaces:** `/dashboard/brainstorm` owns selected board, search/filter/sort, modal state, and API loading. Existing personal dashboard request/mutate/toast flow is reused. The canvas is grouped, not draggable Kanban; board/group changes and card hover/focus have low-motion CSS with reduced-motion alternatives. Touch users retain a visible actions trigger. Import dialog preserves pasted JSON on preview/save errors and confirms only after preview.

- [ ] Inspect the existing dashboard primitives and theme immediately before editing; state the one-line design read plus low variance, low motion, medium density.
- [ ] Implement board tabs plus add/edit/deactivate board and add/rename group controls; build the grouped card sheet, empty/loading/error states, compact search/filter/sort, direct urgency/status actions, move/archive/delete actions, and keyboard/touch-safe menus.
- [ ] Implement JSON paste → preview → confirm and carry-to-task dialogs with clear pending/success/error states and preserved drafts.
- [ ] Perform a bounded source review for responsive layout, focus return, escape/discard behavior, readable metadata, and reduced motion. Do not run browser tests/build unless requested.
- [ ] Commit only Brainstorming UI and route integration.

### Task 6: Migrate and import the approved local ideas

**Files/Data:** Local `backendv2/db.sqlite3` and the owner-supplied attachment at `/home/micxsz/.codex/attachments/60175049-8109-4ff2-ae50-bbfd80d17c95/Pasted text.txt`.

- [ ] Confirm the exact database path and that the attachment parses as the expected multi-board JSON; inspect current migration state without changing data.
- [ ] Create a recoverable, timestamped SQLite backup outside tracked source paths before the first database write.
- [ ] Apply only the new additive migrations through Django's migration graph, then run `manage.py import_brainstorm <attachment-path>` once.
- [ ] Read back board/group/idea counts and the import summary; check a second preview reports the imported titles as duplicates without running a second write.
- [ ] Leave `backendv2/db.sqlite3` and its backup out of Git commits; report the backup location, imported counts, and deferred test/build status.

## Handoff

This plan is for native implementation unless the owner chooses otherwise. No tests or builds are run by default under `AGENTS.md`; all verification commands above are prepared for an explicit request. Preserve the pre-existing local database changes and keep commits scoped by task.
