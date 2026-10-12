# Quick Entry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task, when available. These execution skills are not installed in this session; native execution can follow the checkboxes directly after user approval. Do not dispatch agents without the applicable authorization.

**Goal:** Record signed multiline income/expenses quickly, preview exact balances, and reconcile unassigned transactions without duplicates.

**Architecture:** Reuse Transaction with a nullable account. Add authenticated atomic batch-save and account-assignment actions, sharing existing validation, balance checks, and audit utilities. Keep parsing and decimal-safe predictions separate from the compact dashboard view.

**Tech Stack:** Existing React/Vite, Tailwind, shadcn/Radix, Lucide, Django/DRF, SQLite locally and PostgreSQL in production; no new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-11-quick-entry-design.md`

## Global Constraints

- Saved null-account transactions count toward income/spending once, without affecting account balances.
- Previews never write records or balances; changes are committed only on Save.
- Other Account is a null transaction account, not a new Account record.
- Use integer minor units in frontend calculations and Django Decimal on the backend.
- Preserve insufficient-balance, credit-limit, future-date, permission, and linked-history safeguards.
- Preserve manual account/category selections during reparsing until explicitly reset.
- No tests, builds, linting, browser automation, deployments, or production migrations unless requested.
- Reuse existing UI and feedback; no business-dashboard changes, unrelated refactors, or dependencies.
- Preserve unrelated worktree/index changes. Feature commits and pushing are not part of this execution plan.

## Review Focus

These are source-review acceptance cases, not permission to run tests:

1. Response lost after commit: retry returns the same records and cannot duplicate ledger/audit writes.
2. Duplicate text and inserted lines: independent request IDs survive; manual selections remain attached to the correct unchanged rows.
3. Unassigned entries and settlement: monthly totals do not change, while account balances change once.
4. Insufficient balance at an affected historical date: batch rolls back despite an acceptable aggregate current projection.
5. Stale data/concurrent assignment: the server rejects conflicting assignment without overwriting or partially settling other records.

---

## File responsibilities

Paths below are repository-relative. New helpers are feature-specific, not a finance rewrite.

- `backendv2/finance/models.py`: nullable Transaction.account only.
- `backendv2/finance/migrations/0025_transaction_optional_account.py`: additive schema alteration, depending on 0024_reminder_delivery.
- `backendv2/finance/api/serializers.py`: null-account display and ordinary-CRUD validation compatibility.
- `backendv2/finance/api/quick_entry.py` (new): restricted batch/assignment request serializers.
- `backendv2/finance/services/quick_entry.py` (new): atomic writes, retries, locking, capacity checks, and unsettled totals.
- `backendv2/finance/api/views.py`: thin TransactionViewSet actions and null-safe CRUD updates.
- `backendv2/finance/services/summaries.py`: overview's all-date unsettled summary only.
- `pixelpopup-frontend/src/features/personal-dashboard/quick-entry/model.js` (new): parsing, matching, row identity, and overrides.
- `pixelpopup-frontend/src/features/personal-dashboard/quick-entry/money.js` (new): exact arithmetic and account projections.
- `pixelpopup-frontend/src/features/personal-dashboard/hooks/useQuickEntryDraft.js` (new): debounce, synchronized edits, frozen save payload, retry states.
- `pixelpopup-frontend/src/features/personal-dashboard/components/quick-entry/QuickEntrySelect.jsx` (new): feature-specific account/category dropdowns using shared Select.
- `pixelpopup-frontend/src/features/personal-dashboard/components/quick-entry/UnsettledReminder.jsx` (new): user-specific snoozable reminder.
- `pixelpopup-frontend/src/features/personal-dashboard/components/forms/modules/ExpenseForm.js` and `IncomeForm.js`: retain nullable accounts when editing unsettled entries.
- `pixelpopup-frontend/src/features/personal-dashboard/components/quick-entry/QuickEntryRow.jsx` (new): compact row and existing Select primitives.
- `pixelpopup-frontend/src/features/personal-dashboard/components/quick-entry/BalancePreview.jsx` (new): projected cash and card capacity.
- `pixelpopup-frontend/src/features/personal-dashboard/components/quick-entry/UnsettledTransactions.jsx` (new): paginated reconciliation rows and bulk assignment.
- `pixelpopup-frontend/src/features/personal-dashboard/views/QuickEntryView.jsx` (new): tabs, textarea, date, preview, save orchestration.
- `pixelpopup-frontend/src/features/personal-dashboard/Dashboard.jsx`: navigation and view composition.
- `pixelpopup-frontend/src/features/personal-dashboard/views/OverviewView.jsx`: compact snoozable reminder.
- `pixelpopup-frontend/src/features/personal-dashboard/components/RecordList.jsx`: truthful unsettled account identity and reconciliation link.

Existing backup code snapshots the database directly and needs no change. Reuse `useDashboardData.request/mutate/refresh`, `financeApi`, shared Button/Tabs/Input/Textarea/Select, icons, and existing notification callbacks. Do not change SelectableField globally to force dropdowns.

### Task 1: Unassigned transaction compatibility

**Files:** models.py, migration 0025, api/serializers.py, api/views.py.

**Interfaces:** Transaction.account permits None. TransactionSerializer returns `account: null` and `account_name: "Other Account"` for those rows; ordinary new transaction forms still require an account.

- [x] Change only Transaction.account to `null=True, blank=True`; add the explicit AlterField migration.
- [x] Set a read-only null-safe account name. Permit null only for quick-entry creates and edits retaining an existing unsettled account; reject silently unassigning finalized ordinary transactions.
- [x] Make TransactionViewSet account locks and capacity calls null-safe. Explicit assignment from an unsettled record must enforce capacity; preserve existing protected-history validation.
- [x] Review source for null-account assumptions in directly affected serialization/audit paths. Existing totals and full database backups must remain intact.
- [x] Apply only the additive finance migration locally after the user approves execution including this step; do not migrate production or stage the SQLite database.

**Acceptance review:** Existing assigned records serialize identically; normal create without an account fails; unsettled records can be read/edited without attribute errors; settlement cannot bypass account capacity.

### Task 2: Atomic save, reconciliation, and summaries

**Files:** api/quick_entry.py, services/quick_entry.py, api/views.py, services/summaries.py.

**Interfaces:**

- `POST transactions/quick-entry/`: `{transactions: [{request_id, kind, amount, name, date, category, account}]}`. Decimal amounts are strings, FK values are IDs or null. Success returns `{results: [TransactionSerializer data], created_count, replayed_count}`.
- `GET transactions/unsettled/`: existing pagination shape `{count, next, previous, results, summary}`; summary contains `{count, expenses, income, net}` as decimal strings across all dates. Ignore month filters, apply optional q/kind filtering only to displayed rows, and keep summary across all unsettled rows.
- `POST transactions/settle/`: `{assignments: [{id, account}]}`. Success returns `{results: [TransactionSerializer data]}`; repeat identical assignments are harmless.
- Save errors: `{detail, transactions: {request_id: {field: [message]}}}`. Assignment errors: `{detail, assignments: {id: {field: [message]}}}`. Malformed envelopes use normal DRF field errors.
- `unsettled_summary() -> dict` supplies all-date summary to overview as `unsettled`.
- `save_quick_entries(rows, actor) -> {records, created_count, replayed_count}` and `settle_transactions(assignments, actor) -> list[Transaction]` own atomic domain writes.

- [x] Define strict request serializers restricted to these fields, requiring unique UUIDs/IDs within each batch and positive two-decimal amounts. Reuse TransactionSerializer's domain rules without its UUID uniqueness validator rejecting valid replays.
- [x] Canonicalize category/account IDs, amount, dates, and fallback names for replay comparisons. Derive payment_method from account; null uses other. Force received state and reject future dates.
- [x] Save in one transaction. Lock eligible accounts by ascending ID, resolve existing UUIDs, compare their canonical submitted fields, create only missing records, and check capacity after the final ledger state at affected dates and today. Report relevant row/account errors and roll back all new records on failure.
- [x] Recover concurrent request UUID uniqueness conflicts outside the failed savepoint; retry only the identical frozen batch against committed records. Never suppress other integrity errors or return partial success.
- [x] Audit only actual additions through existing log_record/snapshot_record. Replays must not add audit events.
- [x] Reconcile by locking chosen transaction rows and accounts in ascending ID order; allow only eligible ordinary records. Assign account/payment metadata, enforce capacity, and audit actual changes. Preserve amount/date/category/kind and reject a different previously assigned account.
- [x] Add thin authenticated actions using the current finance viewset/router; add overview.unsettled without changing monthly transaction aggregates. Keep existing endpoint routes and pagination conventions.

**Acceptance review:** `-500/-500` with distinct UUIDs produces two records; response-loss replay produces none additional; conflicting payload fails; one bad row rolls back every new row; inactive/fund accounts and credit-card income fail; assignment changes cash once and reporting zero times; concurrent conflicting assignments fail atomically.

### Task 3: Exact parsing and draft identity

**Files:** quick-entry/model.js, quick-entry/money.js, hooks/useQuickEntryDraft.js.

**Interfaces:**

- `parseQuickEntry(source, previousRows, {accounts, categories}) -> DraftRow[]`.
- DraftRow: `{id, requestId, raw, lineNumber, kind, amount, name, categoryId, accountId, categoryManual, accountManual, errors, hints}`. Amount is an unsigned decimal string; unassigned FKs are null. Invalid rows retain raw text and identity.
- `toMinorUnits(decimalString) -> bigint`, `formatMinorUnits(bigint) -> string`.
- `projectBalances(rows, accounts) -> {expenses, income, net, unassigned, overallCash, accounts}`; all calculation values are bigint, never serialized directly.
- `useQuickEntryDraft({accounts, categories, date, request, onSaved})` exposes source/rows, editing/reset/removal, reveal state, save/retry state, and row errors.

- [x] Implement explicit signed-amount parsing with valid thousands grouping, up to two decimals, positive absolute amount and existing DecimalField limits. Ignore empty lines; never discard invalid nonempty lines. Use generic Expense/Income names for amount-only input.
- [x] Add extensible expense/income keyword arrays mapped to available existing categories. Normalize only for matching; prefer longer whole phrases, then fixed priority. Match account names before institutions/aliases; unresolved bank aliases with multiple accounts get an ambiguity hint, not arbitrary selection.
- [x] Preserve row IDs for unchanged line occurrences, including duplicate text; reconcile edited gaps without shifting overrides on unaffected rows. Preserve category/account manual flags until explicit reset. Row removal and description/amount editing regenerate source text without affecting other rows.
- [x] Compute per-account projections in minor units: cash adds income/subtracts expenses; cards add debt/subtract available credit for expenses. Exclude funds from account choices, card income, and unassigned changes from overall cash. Display negative results honestly.
- [x] Debounce parsing for 200ms, but flush the latest source on blur/save. Freeze payload and controls while saving; retain exact UUIDs/payload after uncertain failure and offer retry before any resubmission. Definitive validation errors permit correction; never clear drafts on failure.
- [x] Save via Task 2 contract, associate server errors by request UUID, and invoke onSaved only after complete success. Returning from dropdowns must not hide the preview.

**Acceptance review:** `-1,500.50` parses exactly; 0/malformed amounts fail; unrelated-word substrings do not match; duplicate lines are independent; inserted lines preserve manual choices; preview calculations do not call a mutation API; no floating-point currency sums occur; stale debounce results cannot save.

### Task 4: Quick Entry and Unsettled UI

**Files:** new QuickEntryView and components/quick-entry files; Dashboard.jsx.

**Interfaces:** `QuickEntryView({dashboard, notify})` uses dashboard.data accounts/categories/settings/user and existing request/mutate/refresh. `UnsettledTransactions({dashboard, notify})` uses the Task 2 endpoints; no separate global state system.

- [x] Before UI edits, read required frontend skills and craft floor, and preserve existing dashboard tokens/component style. Record the Quick Entry surface direction as compact Operate: white controls, slate hierarchy, cobalt actions, low motion, dense review rows; no new visual world.
- [x] Compose Entry/Unsettled using shared Tabs. Entry autofocusses the textarea once, provides the signed-line example and date control defaulting to workspace today, and reveals compact previews after blur. Label date and disable future dates without browser-only error handling.
- [x] Build rows with circular sign/type icons, normal-weight semantic money colors, inline errors/hints, editable name/amount, and direct existing Select primitives for category/account even when there are fewer than three choices. Include reset-auto actions and accessible labels.
- [x] Build BalancePreview using Task 3 projections: affected account cash/debt/capacity, overall cash, and separate unassigned totals. Insufficient funds use icon + explanation and disable assigned save while still preserving the negative projection.
- [x] Add Save N transactions with save icon, active status, retry messaging, empty state, and disabled double-click protection. Announce confirmed success through Smokey and refresh balances/reports.
- [x] Build paginated all-date unsettled rows, per-row eligible account dropdowns, selected-row bulk assignment, matching projection/capacity feedback, loading/error/empty states, and inline settlement errors. Preserve choices after failures; refresh on success.
- [x] Register quick-entry under Money and render the new view through existing Dashboard route/header composition. Support `?view=unsettled` for direct reminder links. Do not change public SEO routes or duplicate the page title.

**Acceptance review:** Existing Button/Input/Textarea/Select/Tabs are reused; rows stack on mobile; focus and labels remain present; future-date and parsing errors are inline; selecting dropdowns leaves preview visible; typing/editing does not write; saved drafts clear only after success.

### Task 5: Unsettled visibility and handoff

**Files:** OverviewView.jsx, RecordList.jsx, feature spec/plan progress as necessary.

**Interfaces:** Overview reads `dashboard.data.overview.unsettled`. Reminder routes to `/dashboard/quick-entry?view=unsettled`. Per-user localStorage key `personal-dashboard:unsettled-snooze:<username>` stores the next local day threshold; storage failures must not break rendering.

- [x] Add a compact nonblocking dashboard reminder with count, income/expense/net, an info icon, Settle now, and Remind tomorrow. Hide when count is zero or snoozed; use workspace timezone for tomorrow and existing refresh behavior.
- [x] Show Other Account / Needs account in affected transaction account cells with a reconciliation link, without changing account-linked records or table column layout. Ensure null-account edit remains safe; do not silently select the first account in an edit form.
- [x] Review the requested diff and spec coverage, especially all five Review Focus cases. Confirm backups remain database-wide and ordinary linked settlements remain protected. Do not initiate tests or builds.
- [x] Update plan checkboxes and report files changed, migration status, unrun validation, and any blocker honestly. Do not commit application changes, push, deploy, or modify production as part of this plan.

**Acceptance review:** Unsettled reminder ignores summary-month filtering; snooze is local and user-specific; account/report labels are truthful; settled records disappear after refresh; no duplicate monthly amount is introduced.

## Execution review

Recommended: native implementation in this chat. The backend contracts, parser state, and UI depend closely on one another, so keeping one implementation context is the simplest approach. User approval of this plan includes the explicit local additive finance migration in Task 1; production remains unchanged. Automated/visual tests remain off unless the user asks.

## Native execution result

Implemented 2026-10-11 at `/dashboard/quick-entry`, including `?view=unsettled`.
Finance migration 0025 was applied only to the local SQLite database. Production was not modified.
Checkboxes record implementation and source review, not executed acceptance tests.
No tests, builds, linting, browser automation, or screenshots were run. Visual behavior and runtime acceptance remain unverified, per the user's validation restrictions.
The marketing-focused design-taste pre-flight was considered only where applicable; the existing dashboard's design system remains authoritative.
Unrelated worktree changes were preserved; application changes were not committed or pushed.
