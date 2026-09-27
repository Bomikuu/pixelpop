# Personal Expense & Deadline Dashboard

## Approved intent and constraints

Build a private personal command center in the existing React/Vite frontend and Django backend. The primary workflow is: open the dashboard, understand today's responsibilities and available money, then record an expense or complete/pay a deadline.

- Use the existing SQL database configuration: PostgreSQL when configured, SQLite otherwise. Do not replace the database or touch existing records.
- Any authenticated Django user can access the same personal workspace for now. This is deliberately not a multi-tenant application.
- Reuse Django sessions. No frontend login, registration, independent authentication system, or public landing page.
- Use shadcn/ui and Tailwind CSS only for the dashboard interface. Use the existing `lucide-react` icon set for tiles and controls.
- Include real, data-driven charts in the financial summaries, not decorative graphs or fabricated financial records.
- Track manually valued assets (such as house/car), available account balances (such as Metrobank/cash), credit-card debt, and money lent to people. These are manual records, not bank connections.
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
- **Account:** name, type (cash/bank/e-wallet/credit card), optional institution, optional credit limit, active state. Metrobank is a user-entered bank account, not a seeded balance. Credit-card accounts track debt rather than available cash. Store no banking credentials or full card numbers.
- **Transaction:** expense or income; positive amount, name/source, account, category, date, payment method, notes, income receipt state (`received` or `expected`), optional recurrence reference, optional linked deadline. Expenses represent recorded spending; income can be received or expected.
- **BalanceAdjustment:** account, signed amount, effective date, reason, creator, timestamps. Initial cash/bank balances and initial credit-card debt are separate opening adjustments. Manual balance/debt changes create another adjustment rather than rewriting transactions.
- **Asset:** name, type (house/car/other), manually estimated current value, valuation date, optional notes, active state. Asset valuation does not create income or available cash.
- **LoanReceivable:** person/name, principal lent, lent date, optional due date, notes, associated account, and opening-versus-new-loan state. Outstanding principal is calculated from recorded repayments, not an independently editable total. No interest calculations are assumed.
- **MoneyMovement:** positive amount, date, kind (account transfer/loan disbursement/loan repayment/credit-card payment), source/destination account as appropriate, optional loan/deadline reference, notes, and idempotency key. These balance movements are distinct from income/expense transactions.
- **WorkspaceSettings:** one shared record with monthly budget and timezone `Asia/Manila`; no financial defaults other than zero/unset.
- **RecurringSchedule:** task/bill/subscription/payment/reminder or recurring income; title, optional amount, variable-amount flag, account/credit-card reference where applicable, settlement kind, category, notes, anchor date/time, frequency, interval, reminder lead days, active state. Generated records inherit the applicable account and settlement semantics.
- **Deadline:** task/bill/subscription/payment/reminder; title, optional amount, due date/time, category, notes, reminder lead days, pending/paid/completed status, optional schedule/credit-card/loan reference, settlement kind (ordinary expense/credit-card payment/loan collection), completion timestamp.

Use database uniqueness for generated schedule occurrences and for linked expense/movement settlements. Add indexes for transaction dates and deadline due dates/status. Category deletion must not erase transaction history; reject deletion while a category is referenced or use a documented safe reassignment flow. Accounts with financial history and people with loan history are archived rather than silently deleting related records.

## Money rules

- **Available balance:** sum of cash/bank/e-wallet account balances. Each balance is its effective adjustments + received income − cash-paid expenses + incoming money movements − outgoing money movements through today. Credit-card purchases increase debt, not immediate cash spending. Future and expected income, house/car values, unused credit limits, and unpaid loans do not increase available money.
- **Credit-card debt:** opening debt/adjustments + recorded card purchases − recorded card payments through today. A card payment reduces the paying account balance and card debt, but is not a second expense. Card purchases remain expenses on the purchase date.
- **Money lent:** sum of outstanding loan principal. Recording a new disbursement reduces the chosen account's available balance but is not a spending-category expense; collecting principal increases that account's balance but is not monthly income. Importing a loan that existed before the opening account balance does not subtract its principal again. Require the user to distinguish an existing loan from a new disbursement.
- **Tracked net worth:** available account balances + manually valued non-cash assets + outstanding loan receivables − credit-card debt. Label this as tracked/estimated net worth; it is not spendable money or a claim to capture unrecorded liabilities. Show valuation dates for assets.
- **Monthly income:** received plus expected income dated within the selected month, with received/expected amounts visibly distinguished.
- **Monthly expenses:** recorded expenses in the selected month. Future expenses are not accepted; future financial commitments belong in deadlines.
- **Remaining this month:** monthly income − monthly expenses − unpaid ordinary-expense bills due within the selected month, including overdue items in that month. Credit-card settlements are excluded from this income/expense projection to avoid counting card purchases twice; show upcoming card payments separately as cash obligations. Label this as a projection, not spendable cash. Expected loan collections are shown separately, not classified as income or negative bills.
- **Spent today:** expenses on today's date in the workspace timezone.
- **Monthly budget used:** monthly expenses / configured monthly budget. If no budget is set, show a setup prompt rather than a percentage or suggested amount.
- **Suggested daily budget:** max(remaining monthly budget, 0) / days remaining in the month including today. Display an exceeded-budget state when the remainder is negative.
- **Category usage:** monthly category expenses / configured category budget; show textual warnings as well as progress bars.
- **Bills this month:** outgoing financial bill/subscription/payment deadlines due in the month, grouped by paid and pending; incoming loan collections are excluded. Unknown variable amounts are explicitly excluded from monetary totals and counted as unpriced.
- **Month history:** income, expenses, and income minus expenses per month. Show this separately from the current month's bill-aware projection.
- **Insights:** factual arithmetic only. Compare the current month to the same elapsed period last month; omit comparisons without relevant historical data. Project spending from the observed daily average and label it an estimate.

Backend services own the canonical calculations. Frontend formatting uses Philippine Peso and readable dates. Never display division-by-zero, invented trends, or unknown amounts as zero-valued bills.

Transfers between available-money accounts do not change the overall available balance. Asset estimates are not automatically synchronized with transactions. Loan repayments cannot exceed outstanding principal, and card payments cannot exceed recorded card debt; validate and apply them atomically. Existing financial records must not be rewritten to force an account to match a manually entered balance.

## Completion, payments, and recurrence

Completing a non-financial task moves it into a muted completed section and does not create an expense.

Paying an ordinary financial deadline is an atomic, idempotent action that marks it paid and creates exactly one linked expense. Require an actual amount for variable bills and capture payment date/method/account. Repeated requests must not create another expense. If an expense was already recorded, let the user link that existing expense instead of adding a second one. Credit-card payment deadlines instead link one card-payment money movement, and loan collection deadlines link repayments; neither creates an expense or income transaction. Partial loan repayments preserve the outstanding remainder and keep its collection deadline pending until fully repaid. Reopening a settled item must not silently erase its expense/movement; explain and require an explicit correction action.

Recurring schedules support never, weekly, monthly, every three months, yearly, and custom positive intervals in days/weeks/months/years. Preserve the original calendar anchor: a bill on the 31st clamps to the final day of shorter months and returns to the 31st when possible. Materialize upcoming occurrences idempotently on authenticated dashboard/calendar reads, through the visible range and at least the next 90 days. Reads may generate occurrences but must never make payments or mark expected income received.

Editing a recurring schedule affects future uncompleted occurrences only. Paid/completed history remains unchanged. Stopping a schedule prevents future generation and preserves history. Recurring income is generated as expected until explicitly marked received.

Reminder selections drive in-dashboard attention and timing; this iteration does not claim email, push, or background notification delivery.

## Dashboard structure and visual direction

Mode: **Operate**. Extend the project's restrained light-neutral/cobalt interface language rather than the retro recipient-experience styling. This is a personal financial tool, not another marketing page.

Design read: a compact, calm workspace that places today's obligations and trustworthy money figures ahead of analytics. Design variance **2/10**, motion intensity **1/10**, visual density **6/10**. Use Instrument Sans for readable UI, tabular numerals, subtle one-pixel borders, modest control radii, and no gradients or oversized marketing headings. Preserve the existing public design system.

### First viewport

A compact sidebar leads into a header with the date, global search, Add Expense, and Add Task / Bill. A conditional overdue attention strip appears immediately below. Five compact icon tiles show current balance, monthly income, monthly expenses, projected remaining money, and today's spending. A Today panel and upcoming deadlines sit beside the main spending chart on desktop; on mobile today's responsibilities lead the stacked content.

### Charts and summary tiles

- Existing Lucide icons: Wallet, ArrowDownLeft, ArrowUpRight, PiggyBank, CalendarClock, House, Car, Landmark, CreditCard, Users, and relevant navigation icons. Icons reinforce visible labels; they are never the only accessible names.
- Spending trend: daily/weekly/monthly switching, peso axis, and tooltip with date, total spent, and expense count. Default to daily spending for the current month.
- Monthly history: grouped income-versus-expense bars with an adjacent accessible table showing income, expenses, and remaining amounts.
- Category breakdown: ranked horizontal bars with peso totals and percentages; no reliance on color-only legends.
- Monthly/category budgets: compact labeled progress indicators, with gentle near-limit and exceeded states.
- Financial position: compact tiles for available money, estimated asset value, card debt, money owed to you, and tracked net worth. A labeled account-balance comparison chart complements the tiles; keep debt visually separate from cash and non-cash assets.
- Use the shadcn chart wrapper and its chart dependency within the lazy dashboard module. Charts provide readable empty states and equivalent text/table data.

### Navigation and panels

Use compact navigation matching the brief and approved additions: Dashboard; Accounts, Assets, Money Lent, Transactions, Income, Expenses; Tasks & Deadlines, Bills, Calendar; Spending, Monthly Reports; Settings. Credit cards live within Accounts, with debt clearly separated from available account balances. Every navigation item opens a relevant working view, not a placeholder or dead link. Reuse the same filtered transaction/deadline components across views.

The dashboard includes Today at a Glance counts/next deadline, today's open and completed items, upcoming groups (today/tomorrow/this week/later), monthly calendar with date drill-down, recent transactions, category spending, budget usage, bills summary, subscriptions, month history, and calculated insights. Financial income dates are visible on the calendar with received/expected labels. Overdue items remain in a distinct attention group instead of disappearing from upcoming views.

### Complete overview and monthly planning

Dashboard is the summary of the entire workspace, not just an expense analytics page. Alongside the financial tiles and charts, show concise summaries of accounts, assets, credit-card debt, money lent, income, expenses, budgets, tasks, deadlines, bills, subscriptions, and recent activity, with links into their detailed tabs. Show Metrobank's current balance when that account has been created. Keep today's responsibilities prominent rather than requiring the user to scan every panel.

Provide a month selector defaulting to the current month. For the selected month, show a combined deadlines-and-bills overview: total items, pending/completed tasks, total priced bills, paid amount, unpaid amount, overdue count, unpriced bills, and the next outstanding due item. List bills and deadlines grouped by month when showing multiple months, with a compact summary for each group. Recurring occurrences must appear in the appropriate month automatically.

Include a monthly bills chart comparing paid and unpaid amounts, alongside deadline completion counts. Monetary bill summaries group by due month, not payment month; spending charts continue to group by the actual expense date. Explicitly label unknown variable amounts instead of placing them in a zero-value chart segment. Avoid duplicating a bill as an extra task in combined item counts.

Current balance, today's spending, and today's responsibilities remain anchored to today and clearly labeled when another month is selected. The overdue attention strip continues to show all outstanding overdue items, even outside the selected month. Month-based panels and drill-downs use the selected month consistently.

### Summary in every tab

Every tab starts with a compact contextual summary before its detailed list, chart, or controls. Reuse the dashboard's Lucide icon tiles, typography, and calculation services. Use these summaries:

| Tab | Summary |
| --- | --- |
| Accounts | Available cash/bank/e-wallet balances, credit-card debt, account count, and credit utilization where a limit is set |
| Assets | Estimated total value, house/car/other subtotals, asset count, and valuation dates |
| Money Lent | Outstanding principal, total lent, total repaid, people count, overdue principal, and next collection date |
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

Account balances, asset valuations, and outstanding loans are live-state summaries with explicit as-of dates, not historical-month values inferred from current records. Month reports show loan/card cash movements separately from income and expenses. Outstanding loans without a due date are labeled unscheduled, never overdue.

The Transactions tab includes both income/expense entries and explicitly labeled balance movements. Its received-income and expense totals exclude transfers, card settlements, and principal loan movements. Show net cash movement separately from income-minus-expenses; transfers between available-money accounts cancel out in the workspace cash total.

### Urgency and over-budget styling

Deadline rows and calendar details have distinct urgency styles with a visible label, icon, and subtle border/background treatment: neutral upcoming, amber due soon (within three calendar days), stronger amber due today, red overdue, and muted paid/completed. Include the actual due date/time and elapsed overdue duration; never rely on color alone. An item with a due time is overdue after that instant; a date-only item becomes overdue the next day in `Asia/Manila`. Paid/completed status overrides urgency styling.

Budget indicators distinguish normal usage, approaching limit (80% to below 100%), at limit (100%), and over budget (above 100%). Show the excess peso amount and a labeled warning when over budget. Keep warnings localized to the affected item/category rather than turning the whole dashboard red. Credit utilization and loan collection warnings use their own labels; they are not mislabeled as spending-budget overruns.

## Forms and interactions

- **Expense dialog:** amount, name, category, date defaulting to today, paying account, payment method, optional notes. Credit-card purchases select the corresponding card account. Provide edit/delete, confirmation before delete, fast repeat entry, inline validation, and preserved values on failure.
- **Task/Bill dialog:** type, title, optional amount, variable-amount option, due date/time, repeat settings, category, notes, reminder timing, status. Financial paid status uses the payment flow rather than bypassing ledger linkage.
- **Income dialog:** amount, name/source, date, destination available-money account, category, received/expected state, recurring settings, notes. Marking expected income received requires a received date and updates the original record rather than duplicating it.
- **Accounts:** add cash/bank/e-wallet accounts with an opening balance and date; add credit cards with opening debt and optional limit. Show balances and history, record explicit balance corrections, transfer between available-money accounts, and record card payments from a selected account. No login credentials, account syncing, or invented Metrobank balance.
- **Assets:** add/edit house, car, or other assets with estimated value, valuation date, and notes. Display current value and an explicit estimated-value label; updating valuation does not create a transaction.
- **Money Lent:** group loans by person, show original principal, repayments, outstanding amount, due date/urgency, and notes. Add a newly disbursed or pre-existing loan, record partial/full repayments, and show payment history. A due collection can appear in Today/Upcoming/Calendar without being presented as a bill you owe.
- **Settings:** set monthly and optional category budgets; create custom categories; set starting balance or record a separate balance adjustment with a reason.
- **Transaction view:** date/name/category/amount/payment method/notes/actions, search and category filters, today/this week/this month/custom date range. Use pagination and mobile-friendly rows with details rather than squeezing seven columns onto phones.
- **Global search:** search expenses, income, deadlines, accounts, assets, people/loans, notes, and categories within the authenticated workspace. Debounce input, bound results, and open the appropriate detail/view when selected.
- **Calendar:** accessible month navigation and selectable days with item indicators; show all items for the selected day. Keyboard access and clear selected/today states are required.
- **Recurring details:** show schedule terms, upcoming occurrences, previous linked payments, and subscription totals. Optional notes are supported throughout.

Receipt/document attachments are explicitly deferred; they are optional in the supplied brief and require a separate private-upload/storage policy. No bank integration, accounting features, multi-user administration, AI, or notification service is added.

## API boundaries

Use a versioned `/api/v1/finance/` namespace with session bootstrap, dashboard summaries/chart series, accounts/assets/loans CRUD, account transfers/card payments/loan repayments, transactions CRUD, categories CRUD, deadlines CRUD/payment/completion actions, recurring schedules CRUD, settings/budget updates, balance adjustments, calendar, and bounded search. Dates and enum fields are validated server-side. Mutation requests carry Django's CSRF token and same-origin credentials.

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

Test account aggregation, exclusion of assets/credit limits/receivables from available cash, manual valuation updates, card purchase/payment separation, loan disbursements and partial/full repayments, opening-loan imports without duplicate cash deductions, overpayment prevention, transfer neutrality, tracked net worth, and urgency/budget boundary styles. Check that the dashboard and new tabs summarize the same underlying records.

Run migration consistency checks, a frontend production build, and targeted lint for touched frontend files. Check dashboard and public-route build separation. Do not run or repair unrelated broad suites.

Use a temporary database/test account and synthetic records for browser checks; do not alter the user's personal records. Verify expense/income creation, editing/deletion, bill payment/completion, recurrence, filters/search, calendar, failed requests, and session loss. Inspect desktop and mobile in one batched visual pass, fix material findings together, and allow at most one confirmation pass.

Verify public portfolio/ASTA metadata and appearance are unchanged and their routes do not request dashboard modules. Confirm the dashboard's scoped component styling does not escape through portals or remain active after navigation.

Acceptance: the authenticated user can manage the brief's core finance and deadline workflows plus the approved assets/accounts/cards/money-lent additions with SQL persistence, accurate chart/tile summaries, distinct urgency styles, no pre-auth data exposure, and no public-site SEO/style regression. Ship with migration/setup instructions and any remaining limitations stated plainly. Implementation does not authorize deployment, production migrations, or production data changes.
