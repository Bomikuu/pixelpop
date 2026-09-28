# Per-account detail pages

Status: proposed for written-spec review. The user approved a single page per account with Summary, Transactions, and History tabs, including charts in Summary.

## Purpose and boundaries

The single-owner dashboard needs a place to inspect one bank, e-wallet, cash, credit-card, or fund account without mixing its entries with every other account. Each existing account card opens `/dashboard/accounts/:id`; fund cards use the same route. The account list, forms, money-movement rules, and existing dashboard month selector remain authoritative. This adds no bank integration, new monetary operation, database schema change, dependency, or public route.

Source: current user request and confirmation; `UX-CONTRACT.md` (private dashboard, signed corrections, month-in-URL, 20-row lists), `backendv2/finance/services/balances.py` (balance semantics), and the existing `AccountViewSet.history` action.

## Page structure and visual direction

Mode: Operate. Design read: one account's current position and the entries behind it should be legible at a glance without turning the page into another generic dashboard. Preserve the dashboard's light/cobalt, Instrument Sans, Lucide, Card.js card face, compact panels, and account-kind semantics. Design variance 2/10, motion intensity 1/10, visual density 6/10. No new theme tokens, illustrations, or decorative animation.

A Back to accounts link precedes a concise account identity area: the existing card face, name, institution/type, last four digits only where saved, active/archived status, and current balance or debt. Keep existing actions such as Edit, Correct balance, Record card payment, Contribute, and Withdraw available only where they already apply. Do not make the whole card a link containing action buttons; give the card face/name a semantic navigation link and keep actions separate.

Below the identity area, Summary, Transactions, and History are tabs on the same route. The selected dashboard month persists in `?month=YYYY-MM`. Summary is the default tab; switching tabs does not erase the account or month. Loading, unknown account, archived account, empty activity, and retryable error states are explicit. Each route sets an account-specific document title and remains private/noindex through the dashboard shell.

## Summary

Show account-kind-specific figures, not one misleading set of labels:

- Cash, bank, and e-wallet: available balance now; selected-month received income, expenses, transfers in, transfers out, and resulting net account change. Future expected income is separate from posted money.
- Credit card: outstanding debt now; credit limit and utilization when a limit exists; selected-month charges and repayments. An expense increases debt; a repayment decreases it. Never label card debt as available cash.
- Fund: current manually recorded value; selected-month contributions and withdrawals. Neither is ordinary income/expense or spendable cash.

Two account-scoped charts use the existing chart primitives and accessible data-table fallback: monthly inflow/outflow (using account-kind labels) and month-end ledger-derived balance/debt/value across the latest 12 months ending at the selected month. Historical values are reconstructed from recorded dated entries, not bank/provider snapshots; label them accordingly. There are no invented amounts. Archived accounts keep their historical charts and recorded balance.

## Transactions and History

Transactions is a paginated list of only this account's income and expense records, with selected-month default, search and the existing transaction type controls. Expected income is visibly marked and does not count as received balance. Existing edit/delete restrictions on linked financial rows remain unchanged. A transaction's account association comes from its recorded account, not a name match.

History is the paginated full posted ledger for this account: received income, expenses, transfers, loan disbursements/collections, card payments, fund contributions/withdrawals, signed balance corrections including opening balance, and actual asset-financing cash payments. Each row shows date, source/type, counterparty or reason where relevant, and the effect on *this account*. For credit cards, label increases/decreases as debt changes; for other accounts, as value in/out. Expected income appears in Transactions but not the posted ledger. Asset-financing fee transactions and the full cash payment must not be counted twice. All rows are read-only in History; existing canonical forms own corrections. Preserve stable date/ID ordering and 20-row server pagination so older history is reachable instead of stopping at the current modal's latest 100. Do not silently alter the modal contract.

## Data flow and implementation ownership

Extend the authenticated `AccountViewSet` with read-only account-scoped detail/summary and paginated ledger actions. Reuse `account_balance(account, as_of)` and the existing Account, Transaction, MoneyMovement, BalanceAdjustment, and AssetFinancingPayment models. Apply the account ID at the queryset/server boundary and never return other accounts' activity. Monthly summary and charts aggregate over full matching data before pagination. Add an account filter to the existing transaction list in a narrowly scoped way; retain its current general-list behavior.

In React, add an `AccountDetailView` under the dashboard feature, route it through the existing `/dashboard/*` shell, and link existing account/fund cards to it while preserving their action controls. Reuse dashboard `useRecords`, `SummaryTiles`, charts, tabs, table/empty/error patterns, `AccountCardFace`, and existing form/toast actions. Avoid duplicate money calculations in the browser.

## Interaction and recovery

All mutations continue through canonical dialogs and refresh dashboard data afterward; this page introduces no direct ledger write. The Back link retains the selected month. Summary charts and list counts reflect the selected account only. Transient search/filter/page state follows `UX-CONTRACT.md` and stays out of the URL; account ID and month remain shareable within the authenticated workspace. A failed account/ledger request keeps a retry path without displaying stale data for a different account. Account switching, tab switching, and mutation refresh must not show a previous account's details under the new name. Keyboard focus, tab semantics, button labels, narrow-screen scrolling, and accessible chart data tables follow existing dashboard primitives.

## Verification boundary

Review account-kind math and signed ledger directions against `account_balance`, especially credit-card payments, funds, expected income, financing payments, and backdated corrections. Verify route/back navigation, month changes, 20-row pagination, empty/archived/invalid accounts, and desktop/narrow layouts. Per `AGENTS.md`, do not run tests, builds, lint, type checks, or browser automation unless the user explicitly requests them; code/source review and a scoped diff check are allowed. Do not apply migrations or alter the personal database.

## Out of scope

No bank sync, running-balance snapshots from external providers, exports, new card-number fields, new account categories, public sharing, or redesign of the global dashboard navigation.
