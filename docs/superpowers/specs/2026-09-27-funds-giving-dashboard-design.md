# Funds, giving, and dashboard refinements

Date: 2026-09-27
Status: Chat design approved; written specification awaiting user review.

## Intent and scope

Extend Miku's existing personal Django-backed dashboard to track manually funded benefits and investments, distinguish money given from money lent to people, add Pets to bill categories, and reduce the size of Next deadlines cards.

The user is a freelancer. Contributions happen whenever they choose: there is no payroll deduction, mandatory contribution schedule, automated investment return, or bank integration. Track current recorded value, contributions, withdrawals, and their history.

Use the existing Django database and finance ledger, dashboard-only shadcn/Tailwind components, Lucide icons, toast notifications, and Smokey reactions. Preserve public pages, authentication, existing records, calendar behavior, and backup behavior. Do not add dependencies or run migrations against the user's database during implementation.

## Architecture choice

Extend the existing Account, BalanceAdjustment, and MoneyMovement ledger. This keeps a single source of truth for cash transfers and net worth. A parallel benefits ledger would duplicate balances; tracking everything only as Assets would not provide contribution and withdrawal history. Neither alternative is selected.

### Funds and benefits

- Add Account kind `fund` and a fund subtype: `pag_ibig`, `mp2`, `investment`, or `other`. Preserve existing account kinds and defaults.
- Add a dashboard Money navigation entry, **Benefits & investments**, separate from spendable Accounts & cards. A fund has a user-defined name and an opening recorded value entered through the existing opening balance adjustment workflow.
- Opening value represents money already held; it does not deduct cash again. Show it separately from subsequent contributions in history and summaries.
- Add MoneyMovement kinds `fund_contribution` and `fund_withdrawal`.
- Contribution moves a positive amount from an active cash, bank, or e-wallet account into an active fund. Withdrawal moves a positive amount from an active fund into an active cash, bank, or e-wallet account.
- Both actions use the existing atomic movement service, stable account locking, request identifiers, decimal validation, and actual movement dates today or earlier. Reusing a request identifier with different financial input is rejected.
- A withdrawal cannot exceed the fund's recorded value on its movement date. Record value corrections as explicit dated BalanceAdjustment entries with a reason; do not silently overwrite balances or produce a negative recorded fund value.
- Current value is opening value plus contributions minus withdrawals plus signed value corrections. It is a manually recorded value, not a provider-verified balance or calculated yield.
- Contribution and withdrawal totals exclude opening balances and value corrections. History identifies all four entry types and their dates; transfers show their cash account counterpart.
- Funds cannot be selected for ordinary expenses, income, bills, loans, card payments, or cash-to-cash transfers. Enforce this on the API, not only in dropdowns. Replace affected `kind != credit_card` cash checks with the explicit cash/bank/e-wallet kinds.
- Keep account kinds/subtypes stable once financial history exists; changing a label must not reinterpret historic entries. Use the existing archive/history/correction patterns rather than deleting linked ledger records.

### Financial summaries

- Available money includes only cash, bank, and e-wallet balances.
- Show recorded funds value separately and include it exactly once in net worth alongside existing assets and loan receivables, less card debt. Archived funds retain their recorded balances, matching existing account behavior.
- Contributions and withdrawals are internal movements: they do not count as ordinary income, expenses, spending, or budget consumption.
- The funds page shows current total value, selected-month contributions, selected-month withdrawals, and a monthly contribution/withdrawal comparison chart using actual recorded movements. Corrections are visible in history, not portrayed as contributions or returns.
- Existing investment Asset records remain unchanged. Explain that the same holding must not also remain an active Asset when recorded as a fund. No automatic conversion or deduplication of existing holdings is included.

### Giving and lending to people

- Add an optional `recipient` string to expense transactions. Giving/support remains an expense, counted once in spending; it is not a bill or loan. Income cannot carry a giving recipient.
- Provide a **People & giving** page with **Add giving** and **Add loan** actions. Add giving asks for recipient, amount, paying account, date, optional category, and notes; its transaction name can default to "Support / gift" without making the recipient a bill title.
- Mother, Father, and other names are recipient values, not hardcoded bill names. Reuse the existing expense and loan forms/services; giving has no deadline, repayment, or recurrence requirement.
- Keep LoanReceivable.person and existing loans unchanged. Group recipient-tagged expenses and loans by trimmed, case-insensitive names for summaries; preserve readable display names. This first iteration does not introduce a contacts registry, fuzzy name matching, or bulk record renaming.
- For each person, distinguish selected-period **Given** from lifetime **Lent**, **Repaid**, and **Outstanding** principal. A gift never raises loan receivables; a loan disbursement never becomes a gift expense. Repayments reduce only their linked loan.
- Show monthly giving comparisons and recipient-specific giving/loan history, with circular icons or initials. Date-based giving tables default to this month and retain the existing filter dropdowns. Loan outstanding totals remain clearly labeled lifetime, not silently filtered to this month.
- Recipient-tagged expenses remain accessible/editable in Expenses and Transactions; existing expenses with no recipient are not retroactively classified. Existing Money lent navigation remains available.

## Local UI refinements

### Next deadlines

Use compact cards: remove the current tall minimum height, reduce padding and internal gaps, and return the circular identity marker to approximately 36–40 px. Preserve date groups, faded reddish backgrounds, urgency badges, due date/time, optional amount, whole-card click-to-edit/context, keyboard focus, and hover feedback. Do not change which outstanding deadlines are selected or their ordering.

### Pets category

Add Pets with an additive, idempotent category data migration; do not modify an already-applied seed migration. It is available in Bills and Expenses through the shared categories. Use an existing Lucide pet icon in custom category dropdowns and record identity markers. Preserve user-created categories and budgets.

### Shared interaction contract

New forms reuse the canonical FormDialog and custom icon dropdowns; fewer than three choices may retain tiles. Keep existing desktop modal sizing, mobile scrolling, validation, focus restoration, pending-submit protection, toast outcomes, empty-state icons, and Smokey success reactions. New pages stay inside the private dashboard bundle and do not affect SEO/public routes.

## API, migration, and safety boundaries

Use additive schema migrations for fund metadata, movement choices, recipient, and Pets. Existing financial records receive empty recipient/fund metadata and retain their original semantics. Expose new fields through strict serializers and the existing authenticated finance API. Add narrowly scoped fund/people summaries or list filters where existing endpoints cannot express them, without changing existing response keys' meanings; extend overview with a separately named funds total.

Server validation rejects invalid account pairings, nonpositive movement amounts, unsupported subtypes, future actual movements, and invalid recipient use. Atomic writes prevent one-sided fund transfers. Failed saves do not update displayed balances; show field errors or the existing error toast. Full database backups automatically include these new database fields and records without a separate export format.

Do not execute production/local database migrations, restore a backup, rewrite existing ledger entries, or infer historic gifts/contributions from names. Document the migration command for the user after implementation.

## Acceptance and verification

1. A fund opened with an existing value does not subtract cash; a new contribution reduces cash and increases fund value by the same amount without changing spending or net worth.
2. A withdrawal performs the reverse; value corrections change recorded net worth, not contribution or expense totals. Opening/correction/movement history stays distinguishable.
3. Funds are unavailable for ordinary spending and lending both in forms and API validation. Duplicate successful movement requests do not create duplicate transfers.
4. Giving to Mother/Father/another person is separately reportable; lending to the same name remains a receivable with separate repayment/outstanding totals.
5. Monthly charts and filters use the existing selected-month conventions. Current value/lifetime loan totals are explicitly labeled.
6. Pets appears in bill/expense categories with an icon; existing records/categories are retained.
7. Deadline cards are visibly smaller while remaining fully clickable, keyboard accessible, and urgency styled.

Follow project instructions: source review only by default; no tests, builds, lint, or browser automation without an explicit user request. Recommend focused financial API checks and one visual check after implementation, but do not run them automatically.

## Not included

Payroll deductions, automatic recurring contributions, financial advice or eligibility calculations, investment pricing feeds, projected returns, contribution limits, tax calculations, multi-currency support, new authorization rules, automatic Asset-to-fund migration, and contacts management are outside this request.
