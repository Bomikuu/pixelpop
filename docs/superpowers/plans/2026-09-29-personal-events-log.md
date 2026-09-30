# Personal Events Log Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a forward-only, read-only Events log for meaningful changes to personal-dashboard records.

**Architecture:** Django stores one append-only audit event per successful user action. An explicit audit service creates safe before/after diffs inside the domain write's transaction; existing CRUD and custom write endpoints call it. A private aggregated listing API feeds a standalone React page and action/area charts.

**Tech Stack:** Django 5, DRF, SQLite-compatible migrations, React 19, Tailwind CSS, existing shadcn-style primitives, Lucide, and Recharts.

**Spec:** `docs/superpowers/specs/2026-09-29-personal-events-log-design.md`

## Global Constraints

- Personal dashboard only; business dashboard and public read access are excluded.
- Record only new, successful, meaningful changes; no backfill, reads, backups, failed requests, no-op saves, or individual recurrence projections.
- Include changes from public shared-bill links with an honest shared-link source label; never assert an unverified person as the actor.
- Never store PINs, hashes, share tokens, auth/CSRF material, or full request payloads in an audit snapshot.
- All audit rows are read-only via API; preserve current authentication/authorization behavior.
- Do not add dependencies, apply migrations to the user's local database, run tests, or run a build without an explicit user request. Test commands below are deferred verification instructions, not authorization to run them.
- The worktree contains pre-existing edits, including an untracked nutrition activity API/migration. Preserve them and never include unrelated hunks in a commit; leave feature changes uncommitted where clean separation is impossible.

## Review Focus

1. A second request with the same `request_id` must not add a second event; pin this in Task 3 and Task 4 endpoint tests.
2. A rollback after a nested payment or financing validation failure must leave no event; pin this in Task 4.
3. A public shared-bill payment must say `Shared link`, never impersonate the selected payer; pin this in Task 4.
4. A PIN rotation or share-link change must never expose either old or new secret in the row/API; pin this in Task 1 and Task 4.
5. A selected month with more than one result page must produce chart totals for all matching events, not just the current page; pin this in Task 2.

---

### Task 1: Append-only event record and safe diff service

**Files:**
- Modify: `backendv2/finance/models.py` — `AuditEvent` model.
- Create: `backendv2/finance/migrations/0021_audit_event.py` — additive migration depending on the existing `0020_nutrition_activity` migration.
- Create: `backendv2/finance/services/audit.py` — allowlisted snapshots, labels, diff, and append.
- Create: `backendv2/finance/tests/test_events.py` — focused audit tests.

**Interfaces:**
- Produces `snapshot_record(instance: Model) -> dict[str, JSONValue]`: use an explicit model/field allowlist; normalize Decimal/date/choice/FK values into safe display data. For meals, include safe item summaries; for shared bills, never include PIN/token/hash fields.
- Produces `record_change(*, actor: User | None, source: str, action: str, area: str, subject_type: str, subject_id: str, label: str, before: dict | None, after: dict | None, actor_label: str | None = None, operation_key: str | None = None) -> AuditEvent | None`: compare snapshots, omit unchanged `edited` actions, store only changed fields, and use optional unique operation key for retries. Named actions such as PIN rotation may have an empty safe diff. Callers own the enclosing `transaction.atomic()`.
- `AuditEvent`: `created_at`, nullable actor FK, frozen `actor_label`, source, action, area, subject type/ID, frozen label, JSON changes, optional unique operation key. Index descending timestamp/ID and month/filter fields; no update/delete endpoint.

- [ ] Write `AuditServiceTests`: add/delete snapshots, changed-fields-only edit, no-op edit returns `None`, Decimal/date normalization, secret-field omission, and duplicate `operation_key` yields one row. Assert PIN/token/hash strings do not appear in serialized `changes`.
- [ ] Implement model, migration, and service with the interfaces above. Keep a small explicit area/field map rather than logging model `__dict__` or request bodies.
- [ ] Review migration dependency and snapshot allowlist against current `models.py`, including the untracked activity model; do not apply the migration locally.
- [ ] Deferred if testing is requested: `cd backendv2 && .venv/bin/python manage.py test finance.tests.test_events --settings=finance.tests.settings`; expect the Task 1 service cases to pass.

### Task 2: Private listing and complete-period aggregates

**Files:**
- Create: `backendv2/finance/api/events.py` — read-only view and response mapping.
- Modify: `backendv2/finance/api/urls.py` — `events/` route before router include.
- Modify: `backendv2/finance/tests/test_events.py` — API tests.

**Interfaces:**
- Produces `GET /api/v1/finance/events/?month=YYYY-MM&action=<value>&area=<value>&page=<n>` with DRF pagination (`results`, `count`, `next`, `previous`) plus `summary: {total, added, edited, deleted, other}` and `charts: {timeline: [{date, added, edited, deleted, other}], areas: [{area, count}]}`. Counts and charts use the full filtered queryset before pagination; date boundaries use Asia/Manila.
- Invalid month/action/area values return 400; default month is current month. Preserve `PrivateMixin` no-store/session policy. No POST/PATCH/DELETE route.

- [ ] Write `AuditEventsApiTests`: anonymous access denied; authenticated list sorted newest first; invalid filter rejected; all-month aggregation across 25+ events and two pages; action/area filters; no mutation method allowed.
- [ ] Implement the view and route. Use database aggregation for counts and a bounded day series; do not fetch all event rows to build charts.
- [ ] Deferred if testing is requested: run `finance.tests.test_events.AuditEventsApiTests`; expect all cases to pass.

### Task 3: Capture standard personal-dashboard CRUD

**Files:**
- Modify: `backendv2/finance/api/views.py` — shared CRUD capture around `FinanceViewSet` and `PersonViewSet` write paths.
- Modify: `backendv2/finance/tests/test_events.py` — endpoint coverage.

**Interfaces:**
- Consumes `snapshot_record` and `record_change` from Task 1.
- Produces one event per successful create/update/delete of accounts, assets, loans, transactions, contacts, categories, deadlines, and schedules. The outer API action is atomic with its audit write; subclass `perform_*` hooks retain their existing behavior. A soft-deleted record is reported as removed from the active workspace while retaining its frozen label.

- [ ] Write CRUD tests: add/edit/delete across a representative standard viewset plus contact; an edit records exact old/new fields; unchanged PATCH records nothing; transaction create retry with the same `request_id` records once; a validation failure records nothing.
- [ ] Implement a focused audited CRUD mixin used by both viewsets. Preserve `FinanceViewSet.create`'s existing idempotent early return and all subclass business validations; do not separately log nested adjustment/deadline rows created by a single action.
- [ ] Review the remaining standard viewset classes against the spec's coverage list and record an area/label mapping for each.
- [ ] Deferred if testing is requested: run the Task 3 cases in `finance.tests.test_events`; expect one audit row per meaningful API action.

### Task 4: Capture custom writes and shared-link actions

**Files:**
- Modify: `backendv2/finance/api/views.py` — account correction, movement, deadline settlement, asset financing/terms/payments, and workspace settings.
- Modify: `backendv2/finance/api/nutrition.py` — setup/profile, weight, and meal mutations.
- Modify: `backendv2/finance/api/activity.py` — activity mutations; preserve the pre-existing untracked file.
- Modify: `backendv2/finance/api/shared_bills.py` — owner and public-link mutations.
- Modify: `backendv2/finance/tests/test_events.py` — cross-area endpoint tests.

**Interfaces:**
- Consumes Task 1 `snapshot_record`/`record_change` and Task 3's action/area mapping. Custom write endpoints use an outer `transaction.atomic()` that includes their service call and one semantic event. `unlock` is authentication, not a data change; PIN rotation records only the fact of rotation, never its value. Public actions use `actor=None, source="shared_link", actor_label="Shared link"`.
- For idempotent services, derive `operation_key` from the existing stable request ID or stable settlement identity; a retry that returns an existing result produces no second event. A changed shared-bill participant/payment/review is one event, not one event per internal ledger row.

- [ ] Write endpoint tests for one operation in each area: correction/movement, settlement/financing, nutrition, owner shared bill, and public shared bill. Include no duplicate on retry, rollback after rejected payment, PIN/token redaction, and honest public source attribution.
- [ ] Add audit calls after successful writes and before transaction exit. Use before/after snapshots of the primary record or an explicit safe operation summary when the action creates a linked record. Do not alter validation or financial calculations.
- [ ] Audit every mutating method listed in `views.py`, `nutrition.py`, `activity.py`, and `shared_bills.py` against the spec; explicitly exclude read-only methods, unlock, backup, and recurrence materialization.
- [ ] Deferred if testing is requested: run the Task 4 cases in `finance.tests.test_events`; expect no event on failures or retries and no secrets in responses.

### Task 5: Standalone Events log page

**Files:**
- Create: `pixelpopup-frontend/src/features/personal-dashboard/views/EventsView.jsx` — data loading, filters, summaries, charts, paginated feed.
- Modify: `pixelpopup-frontend/src/features/personal-dashboard/Dashboard.jsx` — Workspace nav entry and route branch.

**Interfaces:**
- Consumes Task 2 endpoint through `dashboard.request`; local state holds action/area/page filters. The existing dashboard month query parameter is the source of truth for the period. Refresh after returning to the tab uses the existing dashboard version/visibility pattern.
- Produces `/dashboard/events`: four compact event-count summaries, stacked action-count timeline, activity-by-area breakdown, and an expandable newest-first read-only feed. Use existing `Panel`, `EmptyState`, shadcn-style controls, Lucide circular icons, Tailwind, and Recharts. Include a chart data table and explicit loading/error/no-history/no-match states.

- [ ] Implement `EventsView.jsx` with a `useEffect` request keyed to month/filters/page/dashboard version; cancel stale requests and preserve a retry action. Keep financial amounts and nutrition totals out of both charts.
- [ ] Add the sidebar route under Workspace and render `EventsView` without changing Overview's internal tabs. Keep the existing header, search, and month controls.
- [ ] Review keyboard expansion, text contrast, reduced-motion behavior, long before/after values, mobile stacking, pagination, and the forward-only notice against `PRODUCT.md`, `DESIGN.md`, and `DESIGN_GUIDELINES.md`.
- [ ] Deferred if visual testing is requested: inspect `/dashboard/events` at desktop and narrow mobile width, including empty/loaded/error states; do not run a build by default.

## Handoff checks

- Use a file-scoped diff review, not a repository-wide cleanup. Do not stage `backendv2/db.sqlite3` or unrelated pre-existing edits.
- The final response must distinguish implemented coverage from any deferred verification and state that events before deployment are not available.
