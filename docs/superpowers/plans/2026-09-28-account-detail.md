# Per-Account Detail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Open every account/fund card into a private detail page with account-specific Summary charts, Transactions, and complete paginated History.

**Architecture:** Keep `/dashboard/*` and its existing account/card/form primitives. Add read-only account-scoped summary and ledger API actions, filter the existing transaction API by account, and render one new account detail view with three tabs. Server calculations own money semantics; React displays them without recomputing balances.

**Tech Stack:** Django 5, DRF, React 19, Vite, Tailwind CSS, existing shadcn/Radix controls, Recharts, Lucide, Card.js.

**Spec:** `docs/superpowers/specs/2026-09-28-account-detail-design.md`

## Global Constraints

- English (Philippines), PHP, Asia/Manila; authenticated dashboard only, noindex and private responses.
- Preserve all existing uncommitted work. No schema migration, new dependency, bank sync, or global dashboard redesign.
- Month remains in `?month=YYYY-MM`; account ID is in `/dashboard/accounts/:id`; transient list filters and paging stay out of URLs.
- Use the existing light/cobalt dashboard surface, Instrument Sans, Lucide, Card.js card face; variance 2/10, motion 1/10, density 6/10.
- History is posted account-affecting activity. Expected income appears only in Transactions, marked expected; financing cash and associated fee expense must not double count.
- Project `AGENTS.md` prohibits running tests, builds, lint, type checks, or browser automation without an explicit user testing request. Write narrowly scoped tests where useful, but leave them unrun and report that limitation. Do not touch the personal database.

## Review Focus

- Credit-card expense vs repayment: debt moves in opposite directions; test account balance and chart labels.
- Financing payment with linked fee transaction: ledger cash effect appears once; test full cash amount vs fee.
- Expected income: visible in Transactions, absent from posted balance/history; test both views.
- More than 100 mixed history entries: older entries remain reachable with stable 20-row pagination; test page boundaries/ties.
- Switching account or month during a slow request: old account data never appears under the new identity; review keyed request/loading behavior.

---

### Task 1: Account-scoped financial read model

**Files:**
- Create: `backendv2/finance/services/account_detail.py`
- Modify: `backendv2/finance/api/views.py` (`AccountViewSet`)
- Test: `backendv2/finance/tests/test_account_detail.py`

**Interfaces:**
- Produces: `account_summary(account: Account, month: str) -> dict` containing current account-kind figures and twelve dated month rows for inflow/outflow and month-end balance/debt/value; `account_ledger(account: Account, month: str | None) -> list[dict]` containing posted events ordered by `date, created_at, kind, id` descending with a signed account effect.
- Produces: authenticated `GET accounts/:id/detail/?month=YYYY-MM` returning serialized account + summary/charts; `GET accounts/:id/ledger/?month=YYYY-MM&page=N` (or no month for All time) returning DRF pagination with `page_size=20` and no 100-row cap.

- [ ] **Step 1: Add focused backend cases.** Cover cash, credit card, fund, opening/correction, expected income, financing cash/fee, cross-account isolation, and >100 mixed entries with equal dates.
- [ ] **Step 2: Implement the service.** Use `account_balance(account, as_of)` for month-end snapshots and the same ledger source models; make credit-card deltas debt-relative and fund deltas value-relative. Do not invent provider balances.
- [ ] **Step 3: Add the read-only DRF actions.** Validate month with existing `month_range`; paginate the complete sorted ledger through `FinancePagination`. Keep the existing `history` modal action unchanged.
- [ ] **Step 4: Source-review signed amounts and pagination.** Record that backend tests remain unrun unless testing is authorized.

### Task 2: Filter existing transactions by account

**Files:**
- Modify: `backendv2/finance/api/views.py` (`TransactionViewSet.get_queryset`)
- Modify: `pixelpopup-frontend/src/features/personal-dashboard/components/RecordList.jsx`
- Test: `backendv2/finance/tests/test_account_detail.py`

**Interfaces:**
- Consumes: account ID from Task 1 route.
- Produces: `GET transactions/?account=<id>` with account filter applied before summary/charts/pagination. `RecordList` accepts an `accountScoped` presentation prop plus `fixedParams={{ account: id }}`; account mode retains search, month/all-time, category/type and edit restrictions but omits global summary/chart duplication and redundant account column.

- [ ] **Step 1: Add API filter cases.** Valid account ID returns only its income/expenses and matching totals; malformed ID returns a clear 400; omitted ID preserves the global list.
- [ ] **Step 2: Add account filtering in `TransactionViewSet.get_queryset`.** Call `super()` first, then filter on `account_id` after numeric validation.
- [ ] **Step 3: Add account presentation to `RecordList`.** Preserve canonical list controls and 20-row server paging; hide only redundant summary/chart/account UI in account mode.
- [ ] **Step 4: Source-review the existing global Transactions, Income, and Expenses modes for unchanged behavior.** Tests remain unrun absent authorization.

### Task 3: Route, identity, and Summary charts

**Files:**
- Create: `pixelpopup-frontend/src/features/personal-dashboard/views/AccountDetailView.jsx`
- Create: `pixelpopup-frontend/src/features/personal-dashboard/components/AccountSummaryCharts.jsx`
- Modify: `pixelpopup-frontend/src/features/personal-dashboard/Dashboard.jsx`
- Modify: `pixelpopup-frontend/src/features/personal-dashboard/components/AccountCards.jsx`

**Interfaces:**
- Consumes: Task 1 `detail` response and dashboard `useRecords`, `openForm`, `notify`, `month`.
- Produces: `/dashboard/accounts/:id` in the existing shell; Summary is the default tab. Card face/name is an accessible link; card action buttons remain separate. `AccountSummaryCharts` receives `{ account, summary, charts }` and renders two responsive Recharts views plus accessible chart-data tables.

- [ ] **Step 1: Add route and account-card navigation.** Validate a single numeric ID segment; retain `?month` and existing card actions. Invalid/unknown accounts show a clear return path.
- [ ] **Step 2: Build the detail identity and Summary.** Show kind-specific balance/debt/value, selected-month tiles, card metadata, archived status, and only applicable actions.
- [ ] **Step 3: Build the charts.** Use full account-scoped API rows; label inflow/outflow by kind, show ledger-derived month-end values, and provide non-hover data tables.
- [ ] **Step 4: Source-review loading/error/empty states, title, focus, responsive layout, and no nested interactive elements.** Browser testing remains unrun absent authorization.

### Task 4: Transactions, History, and durable UX contract

**Files:**
- Modify: `pixelpopup-frontend/src/features/personal-dashboard/views/AccountDetailView.jsx`
- Modify: `UX-CONTRACT.md`

**Interfaces:**
- Consumes: Task 1 `ledger` and Task 2 account-filtered transactions.
- Produces: Summary/Transactions/History tabs on one route. Transactions reuses account-scoped `RecordList`; History is a read-only 20-row list with selected-month default and an All time option, account-relative direction/type, source/counterparty/reason, date, pagination, and empty/error/retry states.

- [ ] **Step 1: Add both tabs.** Preserve selected account/month when switching; the History request includes account ID, selected month (or no month for All time), and transient page.
- [ ] **Step 2: Render History semantics.** Use account-kind-aware text/icon plus signed amount (debt increase/decrease for cards; value in/out otherwise). Never expose full card numbers.
- [ ] **Step 3: Document the route and distinctions in `UX-CONTRACT.md`.** Include summary chart truth, expected income, posted ledger, pagination, and archived-account behavior.
- [ ] **Step 4: Review changed-file diff and `git diff --check`.** Do not run automated tests/build/browser checks without a new explicit request; report that verification limit.
