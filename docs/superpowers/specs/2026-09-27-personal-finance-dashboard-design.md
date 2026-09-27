# Personal Expense & Deadline Dashboard

## Approved intent and constraints

Build a private personal command center in the existing React/Vite frontend and Django backend. The primary workflow is: open the dashboard, understand today's responsibilities and available money, then record an expense or complete/pay a deadline.

- Use the existing SQL database configuration: PostgreSQL when configured, SQLite otherwise. Do not replace the database or touch existing records.
- Any authenticated Django user can access the same personal workspace for now. This is deliberately not a multi-tenant application.
- Reuse Django sessions. No frontend login, registration, independent authentication system, or public landing page.
- Use shadcn/ui and Tailwind CSS only for the dashboard interface. Use the existing `lucide-react` icon set for tiles and controls.
- Include real, data-driven charts in the financial summaries, not decorative graphs or fabricated financial records.
- Preserve public pages, visual styles, metadata, structured data, and sitemap behavior.
- Tests, a build, and bounded desktop/mobile visual checks are authorized for this first iteration. Do not fix unrelated findings.

## Architecture

Add a focused Django `finance` app with its own models, migrations, service functions, authenticated DRF endpoints, and admin registrations. It must not reuse PixelPopup's customer `Payment` model for personal expenses.

Compose the frontend through a lazy-loaded `/dashboard/*` route. Put feature implementation in `src/features/personal-dashboard/`, with dashboard-owned shadcn components beneath that directory. Public routes must not import the dashboard entry, chart library, or component modules eagerly.

Use an authenticated session bootstrap before rendering the workspace or requesting financial data. Bootstrap returns only the authenticated user identity and a CSRF token. All financial endpoints independently enforce session authentication. Responses use private/no-store caching. Financial data is not stored in localStorage or shipped in HTML.

### Session integration

The existing production frontend and backend use different hostnames, while Django session cookies use `SameSite=Lax`. A direct cross-site fetch is not a dependable way to reuse those sessions.

Use a same-origin integration rather than weakening cookies: a Vite development proxy and narrow production rewrites for the finance API and existing Django `/admin/` routes. The user signs in through the existing Django admin on the frontend origin; the dashboard then uses that same session. Set the required trusted frontend origins explicitly in Django configuration. Do not invent a new sign-in interface, relax CSRF checks, or permit wildcard origins. Document that a session established on the old backend hostname does not automatically transfer to the frontend hostname.

Production rewrite/configuration changes are part of the proposed implementation scope, not an authorization to deploy or mutate production settings during implementation.

## Data model

All monetary values are decimal pesos with two fractional digits. Do not calculate stored money with binary floating-point values. All records are shared within the single workspace; record the authenticated creator where useful for traceability without adding user-management UI.

- **Category:** unique name, optional monthly budget; seed only category names from the brief, never transactions.
- **Transaction:** expense or income; positive amount, name/source, category, date, payment method, notes, income receipt state (`received` or `expected`), optional recurrence reference, optional linked deadline. Expenses represent recorded spending; income can be received or expected.
- **BalanceAdjustment:** signed amount, effective date, reason, creator, timestamps. The initial starting balance is an adjustment. Manual balance changes create another adjustment rather than rewriting transactions.
- **WorkspaceSettings:** one shared record with monthly budget and timezone `Asia/Manila`; no financial defaults other than zero/unset.
- **RecurringSchedule:** task/bill/subscription/payment/reminder or recurring income; title, optional amount, variable-amount flag, category, notes, anchor date/time, frequency, interval, reminder lead days, active state.
- **Deadline:** task/bill/subscription/payment/reminder; title, optional amount, due date/time, category, notes, reminder lead days, pending/paid/completed status, optional schedule reference, completion timestamp.

Use database uniqueness for generated schedule occurrences and for the deadline-to-expense link. Add indexes for transaction dates and deadline due dates/status. Category deletion must not erase transaction history; reject deletion while a category is referenced or use a documented safe reassignment flow.

## Money rules

- **Available balance:** effective balance adjustments + received income dated today or earlier − recorded expenses dated today or earlier. Future and expected income do not increase available money.
- **Monthly income:** received plus expected income dated within the selected month, with received/expected amounts visibly distinguished.
- **Monthly expenses:** recorded expenses in the selected month. Future expenses are not accepted; future financial commitments belong in deadlines.
- **Remaining this month:** monthly income − monthly expenses − unpaid financial deadlines due within the selected month, including overdue items in that month. Label this as a projection, not spendable cash.
- **Spent today:** expenses on today's date in the workspace timezone.
- **Monthly budget used:** monthly expenses / configured monthly budget. If no budget is set, show a setup prompt rather than a percentage or suggested amount.
- **Suggested daily budget:** max(remaining monthly budget, 0) / days remaining in the month including today. Display an exceeded-budget state when the remainder is negative.
- **Category usage:** monthly category expenses / configured category budget; show textual warnings as well as progress bars.
- **Bills this month:** financial bill/subscription/payment deadlines due in the month, grouped by paid and pending; unknown variable amounts are explicitly excluded from monetary totals and counted as unpriced.
- **Month history:** income, expenses, and income minus expenses per month. Show this separately from the current month's bill-aware projection.
- **Insights:** factual arithmetic only. Compare the current month to the same elapsed period last month; omit comparisons without relevant historical data. Project spending from the observed daily average and label it an estimate.

Backend services own the canonical calculations. Frontend formatting uses Philippine Peso and readable dates. Never display division-by-zero, invented trends, or unknown amounts as zero-valued bills.

## Completion, payments, and recurrence

Completing a non-financial task moves it into a muted completed section and does not create an expense.

Paying a financial deadline is an atomic, idempotent action that marks it paid and creates exactly one linked expense. Require an actual amount for variable bills and capture payment date/method. Repeated requests must not create another expense. If an expense was already recorded, let the user link that existing expense instead of adding a second one. Reopening a paid item must not silently erase its expense; explain and require an explicit correction action.

Recurring schedules support never, weekly, monthly, every three months, yearly, and custom positive intervals in days/weeks/months/years. Preserve the original calendar anchor: a bill on the 31st clamps to the final day of shorter months and returns to the 31st when possible. Materialize upcoming occurrences idempotently on authenticated dashboard/calendar reads, through the visible range and at least the next 90 days. Reads may generate occurrences but must never make payments or mark expected income received.

Editing a recurring schedule affects future uncompleted occurrences only. Paid/completed history remains unchanged. Stopping a schedule prevents future generation and preserves history. Recurring income is generated as expected until explicitly marked received.

Reminder selections drive in-dashboard attention and timing; this iteration does not claim email, push, or background notification delivery.

## Dashboard structure and visual direction

Mode: **Operate**. Extend the project's restrained light-neutral/cobalt interface language rather than the retro recipient-experience styling. This is a personal financial tool, not another marketing page.

Design read: a compact, calm workspace that places today's obligations and trustworthy money figures ahead of analytics. Design variance **2/10**, motion intensity **1/10**, visual density **6/10**. Use Instrument Sans for readable UI, tabular numerals, subtle one-pixel borders, modest control radii, and no gradients or oversized marketing headings. Preserve the existing public design system.

### First viewport

A compact sidebar leads into a header with the date, global search, Add Expense, and Add Task / Bill. A conditional overdue attention strip appears immediately below. Five compact icon tiles show current balance, monthly income, monthly expenses, projected remaining money, and today's spending. A Today panel and upcoming deadlines sit beside the main spending chart on desktop; on mobile today's responsibilities lead the stacked content.

### Charts and summary tiles

- Existing Lucide icons: Wallet, ArrowDownLeft, ArrowUpRight, PiggyBank, CalendarClock, and relevant navigation icons. Icons reinforce visible labels; they are never the only accessible names.
- Spending trend: daily/weekly/monthly switching, peso axis, and tooltip with date, total spent, and expense count. Default to daily spending for the current month.
- Monthly history: grouped income-versus-expense bars with an adjacent accessible table showing income, expenses, and remaining amounts.
- Category breakdown: ranked horizontal bars with peso totals and percentages; no reliance on color-only legends.
- Monthly/category budgets: compact labeled progress indicators, with gentle near-limit and exceeded states.
- Use the shadcn chart wrapper and its chart dependency within the lazy dashboard module. Charts provide readable empty states and equivalent text/table data.

### Navigation and panels

Use compact navigation matching the brief: Dashboard; Transactions, Income, Expenses; Tasks & Deadlines, Bills, Calendar; Spending, Monthly Reports; Settings. Every navigation item opens a relevant working view, not a placeholder or dead link. Reuse the same filtered transaction/deadline components across views.

The dashboard includes Today at a Glance counts/next deadline, today's open and completed items, upcoming groups (today/tomorrow/this week/later), monthly calendar with date drill-down, recent transactions, category spending, budget usage, bills summary, subscriptions, month history, and calculated insights. Financial income dates are visible on the calendar with received/expected labels. Overdue items remain in a distinct attention group instead of disappearing from upcoming views.

### Complete overview and monthly planning

Dashboard is the summary of the entire workspace, not just an expense analytics page. Alongside the financial tiles and charts, show concise summaries of income, expenses, budgets, tasks, deadlines, bills, subscriptions, and recent activity, with links into their detailed tabs. Keep today's responsibilities prominent rather than requiring the user to scan every panel.

Provide a month selector defaulting to the current month. For the selected month, show a combined deadlines-and-bills overview: total items, pending/completed tasks, total priced bills, paid amount, unpaid amount, overdue count, unpriced bills, and the next outstanding due item. List bills and deadlines grouped by month when showing multiple months, with a compact summary for each group. Recurring occurrences must appear in the appropriate month automatically.

Include a monthly bills chart comparing paid and unpaid amounts, alongside deadline completion counts. Monetary bill summaries group by due month, not payment month; spending charts continue to group by the actual expense date. Explicitly label unknown variable amounts instead of placing them in a zero-value chart segment. Avoid duplicating a bill as an extra task in combined item counts.

Current balance, today's spending, and today's responsibilities remain anchored to today and clearly labeled when another month is selected. The overdue attention strip continues to show all outstanding overdue items, even outside the selected month. Month-based panels and drill-downs use the selected month consistently.

### Summary in every tab

Every tab starts with a compact contextual summary before its detailed list, chart, or controls. Reuse the dashboard's Lucide icon tiles, typography, and calculation services. Use these summaries:

| Tab | Summary |
| --- | --- |
| Transactions | Received income, expenses, net movement, and matching transaction count |
| Income | Received, expected, total income, and next expected receipt |
| Expenses | Total spent, today's spending, largest category, and expense count |
| Tasks & Deadlines | Due today, pending, completed, overdue, and next deadline |
| Bills | Monthly priced total, paid, unpaid, overdue, unpriced count, and next bill |
| Calendar | Items in the displayed month, due today, completed/paid, and upcoming bill amount |
| Spending | Period spending, daily average, highest-spending category, and budget usage when applicable |
| Monthly Reports | Month income, expenses, net remaining, bills paid/unpaid, and task completion |
| Settings | Current balance, configured monthly budget, category-budget count, and active recurring schedules |

Financial period summaries must follow the tab's active month, date range, search, and category filters, and summarize the entire matching dataset rather than the current pagination page. Explicitly label today-only or workspace-wide metrics so they are not mistaken for filtered totals. Settings summarizes configuration and current state rather than implying that its values belong to a historical month. Mutations refresh affected summaries and charts together; empty results show truthful zero counts or unset states.

## Forms and interactions

- **Expense dialog:** amount, name, category, date defaulting to today, payment method, optional notes. Provide edit/delete, confirmation before delete, fast repeat entry, inline validation, and preserved values on failure.
- **Task/Bill dialog:** type, title, optional amount, variable-amount option, due date/time, repeat settings, category, notes, reminder timing, status. Financial paid status uses the payment flow rather than bypassing ledger linkage.
- **Income dialog:** amount, name/source, date, category, received/expected state, recurring settings, notes. Marking expected income received requires a received date and updates the original record rather than duplicating it.
- **Settings:** set monthly and optional category budgets; create custom categories; set starting balance or record a separate balance adjustment with a reason.
- **Transaction view:** date/name/category/amount/payment method/notes/actions, search and category filters, today/this week/this month/custom date range. Use pagination and mobile-friendly rows with details rather than squeezing seven columns onto phones.
- **Global search:** search expenses, income, deadlines, notes, and categories within the authenticated workspace. Debounce input, bound results, and open the appropriate detail/view when selected.
- **Calendar:** accessible month navigation and selectable days with item indicators; show all items for the selected day. Keyboard access and clear selected/today states are required.
- **Recurring details:** show schedule terms, upcoming occurrences, previous linked payments, and subscription totals. Optional notes are supported throughout.

Receipt/document attachments are explicitly deferred; they are optional in the supplied brief and require a separate private-upload/storage policy. No bank integration, accounting features, multi-user administration, AI, or notification service is added.

## API boundaries

Use a versioned `/api/v1/finance/` namespace with session bootstrap, dashboard summaries/chart series, transactions CRUD, categories CRUD, deadlines CRUD/payment/completion actions, recurring schedules CRUD, settings/budget updates, balance adjustments, calendar, and bounded search. Dates and enum fields are validated server-side. Mutation requests carry Django's CSRF token and same-origin credentials.

Summary responses include selected-period aggregates for each tab and monthly grouped bill/deadline aggregates for the overview. List filters and summary filters share the same validated rules; pagination must not alter totals. Returning the next deadline uses the same pending-item definition as the detailed lists.

Validate amounts, dates, recurrence intervals, category references, and linked-expense ownership within this shared workspace. Use transactions and unique constraints for payment and occurrence generation. Paginate record lists. Expose actionable validation errors without SQL traces or session details.

## Security, SEO, and isolation

Show a neutral loading state until authentication is checked. On unauthenticated bootstrap or any later `401/403`, clear financial state and render exactly:

> This page is not accessible.
> You need to be logged in to view your personal dashboard.

Network/server errors show a distinct retry state, never an authenticated-looking empty dashboard. Do not fall back to demo data. Recheck/refresh on returning to the workspace so a stale session is not treated as verified indefinitely; backend authorization remains the security boundary.

Scope shadcn tokens and CSS to the dashboard root, including dialog portals. Do not add a global shadcn reset or replace the existing Tailwind import/theme. Install the components' required packages only; do not globally mount their UI or charts. Exclude unrelated global decorative overlays/mascot from dashboard routes while preserving them on existing routes.

Mark `/dashboard` and its subroutes `noindex, nofollow` with route-specific metadata and hosting response headers. Keep them out of the public sitemap and public SEO fallback generation. Do not modify public titles, descriptions, structured data, or robots policy globally. Private data never appears in static SEO HTML.

## Validation and acceptance

Run targeted finance tests covering unauthenticated denial, authenticated shared-workspace access, CSRF enforcement, decimal arithmetic, expected-income exclusion, balance adjustments, summary formulas, budget boundaries, unknown bill amounts, payment idempotency, linking an existing expense, recurrence anchor/clamping, and concurrent occurrence generation.

Also cover month-grouped bill/deadline summaries, due-month versus payment-month accounting, filtered totals across pagination, and summary refresh after create/edit/delete/pay/complete actions. Check that every tab has its contextual summary and that historical-month selection does not relabel today's live metrics.

Run migration consistency checks, a frontend production build, and targeted lint for touched frontend files. Check dashboard and public-route build separation. Do not run or repair unrelated broad suites.

Use a temporary database/test account and synthetic records for browser checks; do not alter the user's personal records. Verify expense/income creation, editing/deletion, bill payment/completion, recurrence, filters/search, calendar, failed requests, and session loss. Inspect desktop and mobile in one batched visual pass, fix material findings together, and allow at most one confirmation pass.

Verify public portfolio/ASTA metadata and appearance are unchanged and their routes do not request dashboard modules. Confirm the dashboard's scoped component styling does not escape through portals or remain active after navigation.

Acceptance: the authenticated user can manage the brief's core finance and deadline workflows with SQL persistence, accurate chart/tile summaries, no pre-auth data exposure, and no public-site SEO/style regression. Ship with migration/setup instructions and any remaining limitations stated plainly. Implementation does not authorize deployment, production migrations, or production data changes.
