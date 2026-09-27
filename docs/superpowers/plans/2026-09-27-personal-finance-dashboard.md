# Personal Finance Dashboard — Implementation Plan

Status: awaiting plan approval and execution-method confirmation.

Approved specification: [Personal Expense & Deadline Dashboard](../specs/2026-09-27-personal-finance-dashboard-design.md).

## Execution and boundaries

Recommended execution: implement directly in this task, in the order below. No parallel implementation agents. Use the selected UI skills for the implementation and the bounded finish-review workflow required by Impeccable; do not expand unrelated work.

The first iteration includes all core workflows in the approved spec, including per-tab summaries, monthly bill/deadline summaries, accounts, assets, credit cards, and money lent. It is not a mock dashboard. Transactions start empty, and test fixtures never become production data.

Allowed existing-file changes are restricted to Django app registration/API routing/session-origin configuration and setup documentation; frontend route composition, shadcn configuration, required dependencies/lockfile, development proxy, dashboard-specific hosting rewrites/headers, and private-route SEO handling. Preserve public route behavior, visual language, metadata, and unrelated files. No deployment, production migration, secret changes, or production database mutation.

Use `apply_patch` for handwritten files. Standard dependency installation and migration generation may update their own generated files. Review generated changes before keeping them; shadcn setup must not replace global styles.

## 1. Create the SQL-backed finance domain

Create:

- `backendv2/finance/__init__.py`, `apps.py`, `models.py`, `admin.py`
- `backendv2/finance/migrations/__init__.py` and initial migration
- `backendv2/finance/tests/test_models.py`

Modify only `backendv2/core/settings.py` to register the app at this step.

Implement the approved Category, Account, Transaction, BalanceAdjustment, Asset, LoanReceivable, MoneyMovement, WorkspaceSettings, RecurringSchedule, and Deadline records. Use decimals, validated choices, appropriate protected foreign keys, indexes, and uniqueness constraints. Use a fixed single-workspace settings record, not user tenancy. Preserve created-by metadata without restricting the agreed shared access.

Seed category names only. No financial balances, Metrobank record, assets, loans, or invented transactions. Add Django admin views to inspect/manage the new domain safely. Read-only derived totals must not become editable financial source fields.

Write model/constraint tests first, implement, and run only those tests using a disposable database. Generate and inspect the new app's migration. Do not run migrations against the user's configured database.

## 2. Implement monetary calculations and atomic actions

Create:

- `backendv2/finance/services/balances.py`
- `backendv2/finance/services/settlements.py`
- `backendv2/finance/services/queries.py`
- `backendv2/finance/tests/test_balances.py`
- `backendv2/finance/tests/test_settlements.py`

Use one canonical calculation path for available balances, card debt, loans outstanding, estimated assets/net worth, income/expenses, cash movements, and budgets. Keep expected income and non-cash assets out of available funds. Do not use serialized floats for canonical money; emit decimal strings.

Implement account transfer, new/pre-existing loan recording, loan repayment, card repayment, expense linking, deadline payment/completion, and explicit balance correction services. Validate accounts and settlement types. Lock relevant rows and use database constraints/idempotency to prevent duplicate settlements and overpayments. A failed action must roll back its status and balance effects together.

Separate card purchases from debt payments, loan principal from income/expense totals, and internal transfers from overall cash changes. Protect linked settlements from arbitrary transaction deletion/editing; expose explicit correction behavior that preserves a coherent record rather than orphaning a paid bill.

Write and run targeted tests for decimal arithmetic, dates, expected income, imports, transfers, partial repayment, linking, repeated/concurrent requests, and all approved money rules before continuing.

## 3. Implement deadlines, recurrence, and monthly planning

Create:

- `backendv2/finance/services/recurrence.py`
- `backendv2/finance/services/summaries.py`
- `backendv2/finance/tests/test_recurrence.py`
- `backendv2/finance/tests/test_summaries.py`

Generate pending schedule occurrences through the requested calendar range and at least 90 days ahead. Keep the original recurrence anchor and clamp month-end dates without permanently shifting the anchor. Validate positive custom intervals and bound generation work per request. Preserve completed/paid history on schedule edits or termination.

Build today/upcoming/overdue groups, selected-month bill/deadline summaries, daily/weekly/monthly spending series, monthly income/expense history, category breakdowns, budgets, and factual insights. Incoming loan collections must not appear in outgoing bill amounts.

Share validated filters between record lists and their summaries. Totals cover the complete matching queryset, never only a page of results. Distinguish due-month bill reporting from expense-date spending reporting. Mark unknown bill amounts explicitly and preserve today's live-state metrics when the selected month changes.

Test month ends/leap years, recurrence idempotency, paid history preservation, urgency time boundaries, overdue collections, unpriced items, summary filters/pagination, budget thresholds, and monthly accounting differences.

## 4. Expose authenticated finance APIs

Create `backendv2/finance/api/{__init__,serializers,views,urls}.py` and `backendv2/finance/tests/test_api.py`. Include the namespace from `backendv2/core/urls.py`.

Endpoint groups:

- `session/`: authenticated identity + CSRF bootstrap only
- `overview/`, `reports/`, `calendar/`, `search/`: validated aggregates and bounded search
- `accounts/`, `assets/`, `loans/`, `categories/`, `transactions/`, `deadlines/`, `schedules/`: CRUD and paginated lists
- Domain actions: account transfer/adjustment/card payment, loan repayment, deadline settlement/completion, expected-income receipt
- `settings/`: shared budgets/settings

Use existing Django SessionAuthentication and authenticated permissions on every endpoint. Do not add login routes or Basic-auth UI. Validate server-side dates, amounts, references, enums, search lengths, page sizes, and recurrence ranges. Finance responses carry no-store/private cache headers. Prevent sensitive response bodies from appearing in error logs.

Test anonymous and authenticated non-staff access, expired sessions, CSRF enforcement with `enforce_csrf_checks`, invalid payloads, methods, filtered aggregates, action idempotency, and same-workspace visibility. Test API behavior against the supported SQLite development database; do not claim PostgreSQL concurrency verification without running an isolated PostgreSQL test environment.

## 5. Integrate sessions without changing public behavior

Modify:

- `pixelpopup-frontend/vite.config.js`
- `pixelpopup-frontend/vercel.json`
- `backendv2/core/settings.py`
- Relevant frontend/backend `.env.example` files and README setup notes

Add a development proxy for the finance API and existing `/admin/` paths. Add narrowly ordered hosting rewrites before the existing catch-all, plus `X-Robots-Tag: noindex, nofollow` for dashboard routes. Use the verified existing backend deployment origin, never a guessed service address.

Keep session cookie HttpOnly/Secure/SameSite rules and CSRF checks. Configure trusted frontend origins explicitly, without wildcard policy. Document that the user must establish their Django admin session on the same frontend origin as the dashboard. Keep the access-denied page free of login/register forms.

Validate the proxy with disposable local sessions. Production hosting cookie-forwarding/redirect behavior remains a deployment check; do not declare it verified from local Vite behavior alone.

## 6. Install dashboard-scoped shadcn/ui

Create dashboard-local `components.json` destinations through frontend configuration, a JavaScript import alias configuration, and `src/features/personal-dashboard/{ui,lib,styles}`. Update required frontend package dependencies and lockfile.

Use the official shadcn registry components compatible with React 19/Tailwind 4 and the project's JavaScript conventions. Install only primitives actually used: button, card, input, label, textarea, select, dialog/confirmation dialog, tabs, table, badge, progress, tooltip, calendar, and chart. Keep existing `lucide-react`; do not install a second icon family. Add Recharts and exact primitive/helper dependencies required by the selected registry source.

The official `aliases.ui` setting supports a custom component directory. Point it at the dashboard feature, not the public shared UI folders. Point any generated stylesheet at the feature's own file. Do not run an unreviewed global `init` that replaces `src/index.css` or changes existing Tailwind integration.

Scope runtime CSS variables and base selectors to `.personal-dashboard`, including the destination for dialog/popover portals. Keep global Tailwind compiler configuration unchanged where possible; component utility names must not override public styles. Bound chart containers' heights and provide accessible tooltip/table equivalents.

Sources checked for this plan: [Vite integration](https://ui.shadcn.com/docs/installation/vite), [custom installation paths](https://ui.shadcn.com/docs/components-json), and [shadcn charts with Recharts](https://ui.shadcn.com/docs/components/base/chart).

## 7. Build the authenticated shell and shared interaction layer

Create:

- `pixelpopup-frontend/src/pages/PersonalDashboardPage.jsx` (thin route composition)
- `pixelpopup-frontend/src/features/personal-dashboard/api.js`
- `pixelpopup-frontend/src/features/personal-dashboard/lib/{format,urgency}.js`
- `pixelpopup-frontend/src/features/personal-dashboard/hooks/useDashboardData.js`
- `pixelpopup-frontend/src/features/personal-dashboard/components/{DashboardShell,SummaryTiles,PeriodControls,EmptyState,ErrorState}.jsx`

Modify `pixelpopup-frontend/src/App.jsx` for one lazy `/dashboard/*` entry and to keep global decorative overlays off dashboard routes without altering other routes.

Bootstrap authentication first and fetch finance data only after success. Clear data and close private overlays on subsequent `401/403`; abort stale requests on navigation. Distinguish denied, network-error/retry, loading, and genuinely empty states. Revalidate when returning to the workspace. Preserve form values on recoverable failures and disable duplicate mutation submissions.

Provide compact desktop navigation and an accessible mobile alternative, selected-month controls, searchable records, and shared summaries. Follow the approved light-neutral/cobalt design, Instrument Sans, modest radii, and Lucide icons; no marketing motion or decorative mascot.

## 8. Implement all working views and forms

Create feature components/views with focused ownership:

- `views/OverviewView.jsx`: all-domain summary, Today, urgent attention, monthly bills/deadlines, next obligations, financial position, budget/insight previews, recent activity
- `views/TransactionsView.jsx`: shared income/expense/movement list and filtered totals; reuse for Income and Expenses tabs
- `views/DeadlinesView.jsx`: working tasks/bills lists, monthly groups, completion/payment flows, subscription/payment history
- `views/CalendarView.jsx`: selectable month/day and scheduled items with urgency
- `views/AccountsView.jsx`: balances/cards, payment/transfer/adjustment actions, history
- `views/AssetsView.jsx`: manual valuations and dates
- `views/LoansView.jsx`: people, existing/new loans, outstanding balances and repayment history
- `views/InsightsView.jsx`: spending/monthly-report charts and their accessible tables
- `views/SettingsView.jsx`: budgets, categories, shared settings summaries
- `components/forms/`: expense, income, task/bill, account, asset, loan, repayment/settlement, budget/category dialogs
- `components/Charts.jsx`: spending, monthly income/expense, category spending, monthly bill status, account balances

Every tab includes its contextual summary and truthful empty state. Every control performs its named action; no dead navigation or placeholder success. Display live-state summaries with as-of dates rather than fabricating historical asset/balance values.

Implement accessible urgency labels and localized styling for upcoming/due-soon/today/overdue/settled items, plus normal/near-limit/at-limit/over-budget budget states. Chart and progress colors never replace text. Distinguish incoming collections from outgoing obligations throughout.

Refresh impacted summaries/charts/lists together after mutations. Preserve active filters and dates. Confirm deletes, archive records with protected history, and keep corrections explicit.

## 9. Protect private-route SEO and public isolation

Use dashboard-only metadata with cleanup on route exit. Keep private routes out of public sitemap/content generation. Inspect the existing SEO generation flow; change it only if needed to generate private `noindex` route shells without public financial content. Preserve public metadata and JSON-LD exactly.

Verify lazy chunk boundaries: navigating directly to a public route must not fetch dashboard, chart, or dashboard primitive modules. Shared packages already used by public pages may remain shared; the goal is no new eager dashboard dependency path. Scoped stylesheet selectors must remain inert on public routes even after the dashboard has been visited.

## 10. Run first-iteration validation

Backend:

1. Run `manage.py test finance` with a disposable database and safe local test settings.
2. Run Django checks and `makemigrations --check --dry-run` for migration consistency; never migrate the configured personal/production database automatically.
3. Report any unsupported PostgreSQL concurrency scenario plainly; do not provision external infrastructure without permission.

Frontend:

1. Run targeted ESLint for added/modified frontend implementation files.
2. Run `npm run build`. Use the existing checked-in SEO article snapshot/local test feed during verification to avoid unrelated external service dependencies.
3. Inspect build output/import graph for lazy dashboard/chart separation and no private sitemap entries.

Browser checks against disposable local data:

1. Denied before login; authenticated session bootstrap; no records before auth; safe handling of session loss.
2. Accounts/opening balances, received/expected income, expenses, custom categories, edit/delete, budgets, and filters.
3. Deadline/variable bill settlement, existing-expense linkage, recurring items, calendar drill-down, and urgency.
4. Assets, existing/new loans, partial/full repayments, internal transfers, card purchases/payments, and refreshed summaries.
5. Global search, every tab's summary, historical month selection, network failures, dialog focus/keyboard flow, and mobile navigation.
6. Public portfolio/ASTA routes retain their appearance/metadata and do not request dashboard modules.

Capture desktop/mobile together in one visual round, batch material fixes, then make at most one confirmation round. Use the required independent finish review with the request, approved spec, screenshots, implementation paths, and remaining findings. It may not mutate unrelated code or trigger an open-ended polish loop.

## 11. Document and hand off

Update narrowly scoped setup instructions: required migration, same-origin admin login, trusted origins, dashboard path, manual financial setup, and no bank synchronization. Update only the relevant product/design surface context; preserve portfolio/ASTA tokens and public guidance.

Report completed workflows, exact validation results, migration instructions, and known limitations. Distinguish local verification from unperformed production deployment checks. Do not claim receipt uploads, background notifications, bank syncing, or untested PostgreSQL concurrency.

Implementation is complete only when all approved working views, domain summaries, authentication safeguards, scoped UI, and authorized first-iteration validation are delivered. A plan/spec alone is not the finished dashboard.
