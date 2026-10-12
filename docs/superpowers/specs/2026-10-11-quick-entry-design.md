# Quick Expense & Income Entry

Date: 2026-10-11
Status: Approved and implemented natively; source-reviewed, runtime and visual checks not run.

## Purpose and scope

Make recording multiple personal income and expense transactions fast: type or
paste signed lines, review detected categories/accounts and balance projections,
then save together. Reuse the personal dashboard's existing finance records,
components, permission rules, and balance safeguards. Do not change business
dashboard workflows or add dependencies.

The user confirmed that saved transactions without an account count toward
income/spending immediately, exactly once. They do not affect any account balance
until assigned. Unsaved previews never affect reporting or balances.

## Chosen approach

Reuse `finance.Transaction`, making its account foreign key nullable through an
additive migration. A null account means unsettled and displays as “Other Account”;
it is not a real account. Existing records remain unchanged. Do not introduce a
pending transaction model, fake bank account, or reuse expected income status.

Alternatives considered: a fake holding account would pollute balances; a separate
pending model would duplicate reporting and settlement logic.

## Page and interaction

- Add Quick Entry under the personal dashboard's Money navigation group.
- Use the existing compact breadcrumb/header and dashboard theme. No duplicate
  hero/title, basic-entry modal, decorative terminal, or oversized cards.
- Provide Entry and Unsettled tabs. Entry starts with an autofocus multiline
  textarea and a short signed-line example. A date control defaults to today in
  the configured workspace timezone, not the currently selected summary month.
- Debounce parsing as the user types. Reveal the preview after leaving the input;
  keep it visible when correcting rows or returning to the input.
- Each compact row shows its signed amount, circular income/expense icon,
  editable description, existing category/account dropdowns, and remove action.
  Income is green, expense red; signs/icons provide non-color meaning. Colored
  money values keep the project's normal font weight.
- Row text/amount edits and removal update the source textarea. Manual category
  and account choices remain row metadata and do not rewrite descriptive text.
- Show invalid nonempty lines with line-specific messages. Preserve all valid
  drafts; any invalid line blocks the whole save.
- Keep the balance preview visible while reviewing. The bottom action reads
  “Save N transactions” with a save icon and submitting state.
- Use existing Tailwind/shadcn/Radix controls, white inputs, solid input borders,
  keyboard focus, responsive stacked rows, and reduced-motion support.
- Show operation feedback through existing Smokey notifications and inline
  errors. Clear drafts only after confirmed complete success.

## Parsing and stable identity

Accept one explicit signed amount per nonempty line, followed by optional text:
`-5000 rent bpi`, `-1,500.50 groceries`, or `+500 freelance gcash`.
Accept valid thousands grouping and at most two decimal places. Reject zero,
missing signs, malformed separators, excess precision, nonfinite values, and
values outside the existing transaction field's range. Store positive amount plus
expense/income kind. Amount-only entries use “Expense” or “Income” as their name.

Keep reusable parsing/detection logic separate from rendering. Normalize text
case, whitespace, and punctuation for detection, while retaining readable source
text. Use word/phrase boundaries; the longest matching phrase wins. Resolve equal
matches with a fixed documented priority, never iteration accidents.

Keyword arrays map to existing category names, with separate income and expense
rules. An unavailable or unknown category falls back to existing “Other/Others” or
the current null-category “Other” display; do not create categories automatically.

Match existing account names and institutions with a static extensible alias map.
Prefer an exact account name over a bank alias. Multiple matching accounts remain
unassigned with a visible ambiguity hint. Never create unknown accounts. Offer
only eligible accounts; preserve existing fund and credit-card income restrictions.

Each line has a stable local row ID and request UUID. Preserve IDs for unaffected
lines across text edits, insertions, and deletions, and preserve explicit category/
account overrides until the user resets them. Identical lines remain independent
transactions. Once a save is attempted, keep its exact payload and IDs for retry;
Resolve an uncertain save by retrying its frozen payload before allowing those
rows to be resubmitted as changed transactions. A definitively rejected batch may
be corrected with new explicit submission identities, not silent replay.

## Exact projections and reporting

Use integer minor units for frontend calculations and Django Decimal on the
backend; never sum currency with floating-point arithmetic. Show draft expense,
income, net change, and current/projected balances for affected accounts.

Cash/bank/ewallet projections add income and subtract expense. Credit cards show
debt and available credit separately, never as positive cash. Overall cash
projection includes actual cash accounts only. Show unassigned draft totals in a
separate area; do not add them to actual account projections.

Keep negative projections visible with an insufficient-balance message rather
than clamping to zero. Assigned payments that exceed account balance or available
credit cannot save. Local predictions are informational; the server decides using
current data and existing date-sensitive capacity rules.

Saved null-account entries appear in transaction reports and ordinary income/
expense summaries once, using the transaction date. They do not enter account
history until assigned. Label them as unsettled in affected transaction displays.
Keep expected-income reporting unchanged and separate. Settlement changes only
the original record's account/payment metadata, not its income/expense totals.

## Batch save and reconciliation API

Add authenticated finance actions for atomic quick-entry save and atomic bulk
settlement, plus an unsettled filter/summary independent of the monthly filter.
Keep existing API routes and ordinary form behavior intact.

Batch save accepts each row's request UUID, kind, decimal amount, name, date,
category, and optional account. Derive a suitable payment method from the chosen
account; null-account entries use “other”. Quick entries are recorded transactions,
not expected receipts, and cannot be future-dated.

Validate every row first; lock affected account rows in deterministic order;
persist inside one database transaction; then enforce the existing account
capacity checks against the resulting ledger and affected dates. Any invalid row
or capacity error rolls back the entire batch. Return row-addressable errors.

Identical UUID/payload retries return original records without another ledger
write or audit event. Conflicting UUID payloads fail explicitly. Handle concurrent
identical submissions through database uniqueness plus safe conflict recovery;
never return a partial batch as success. Refresh dashboard data after success.

Settlement selects existing unsettled records and eligible accounts, individually
or in bulk. Lock records and accounts deterministically, verify each record remains
unsettled, and apply assignments in one atomic transaction. Never create a new
transaction. Identical settlement retries are harmless; conflicting assignments
fail rather than overwriting another completed settlement. Preserve linked-record
restrictions and existing permissions. Audit actual new records and assignments
through existing event-log utilities, without duplicate events on retry.

Review directly affected serializers, CRUD methods, audit labels, tables, and
backup handling for null-account safety; do not refactor unrelated finance flows.
Ordinary forms still require an account to post a payment. Editing an unsettled
record must not accidentally settle it; explicit account assignment uses the same
capacity safeguards as reconciliation.

## Unsettled view and reminder

Show saved unresolved entries with their count, expenses, income, and net total,
across all dates. Allow individual account assignment and selected-row bulk
settlement using existing dropdowns. Retain selections/errors on failure.

The dashboard shows a compact, nonblocking reminder linking to this view, with
“Settle now” and “Remind tomorrow”. Snooze locally for the current signed-in user
until the next day; label it honestly. Remove the reminder when no entries remain.
Do not create recurring task popups or push notifications for this feature.

## Validation and exclusions

Review changed source and the relevant diff. Per project instructions, do not run
tests, builds, linting, or browser automation unless the user explicitly requests
them. Suggested later checks: formatted decimals; invalid/zero lines; identical
lines; retained manual overrides; ambiguous accounts; no preview writes; atomic
rollback; response-loss retries; concurrent settlement; and unchanged totals after
settlement.

No deployment, production migrations, account/category auto-creation, AI parsing,
new dependencies, unrelated cleanup, or retrospective unsettled conversion.
Applying the additive migration locally requires a separately stated execution
step; existing personal data must be preserved.
