# Credit-card Cash Loans Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a credit-card cash-loan calculator and tracker with accurate financing accounting, editable payment allocations, schedules, and existing-dashboard integration.

**Architecture:** Keep calculation, ledger posting, repayment allocation, lifecycle, and read projections isolated in finance services. Reuse existing card-payment movements and account/deadline UI, adding only the persistence necessary for contractual schedules and auditable allocations. Posted account effects and additional credit reservation remain separate.

**Tech Stack:** Existing Django/DRF, Python Decimal, SQLite locally/PostgreSQL in production, React, Tailwind, existing shadcn/Radix controls, and Lucide. No additional dependencies.

**Spec:** `docs/superpowers/specs/2026-10-12-credit-card-cash-loans-design.md` — read completely before execution.

## Global Constraints

- Personal finance dashboard only. No production changes or database operations at this stage.
- Use the existing finance architecture. This specification describes responsibilities and behavior, not a prescribed database schema or field list.
- Backend Decimal calculations are authoritative. Send decimal strings to/from the frontend.
- Preview is read-only; loan proceeds and principal repayment are not income/ordinary expenses.
- Existing card payments are the sole cash deduction and card-debt reduction for repayments. Allocations never create a second movement.
- Default credit reservation is financed principal; the user may select full contractual installments per loan.
- Rates are user-supplied. Annual means explicitly labeled nominal annual divided by 12.
- Preserve existing records, history, migrations, dirty worktree, and tracked local database.
- Local migration execution requires its own approval. No production migration, push, deployment, dependency addition, full build, or broad test suite.
- Implement natively after plan approval, consistent with the user's established preference. The named execution skills are not currently available; if still unavailable, disclose that and follow these checkboxes directly rather than installing anything.
- Targeted backend tests are requested by the supplied brief. Browser automation remains unapproved; source-review UI changes unless the user separately requests visual testing.
- Proposed commit steps include only this feature's edits. Existing mixed changes must not be staged wholesale; use selected hunks or temporary patch/index staging and verify each staged diff. Never stage `backendv2/db.sqlite3`.

## Review Focus

1. A slow preview response arriving after newer edits must not show the wrong amount or enable saving stale terms — pin in Task 6.
2. A forged allocation to another card or a previously consumed payment must fail atomically — pin in Task 4.
3. Tiny amounts, long terms, and final-cent adjustment must never yield negative principal or an incorrect schedule total — pin in Task 1.
4. Backdated borrowing/payment must not corrupt later ledger dates or make future charges appear paid — pin in Tasks 2 and 4.
5. A normal expense/Quick Entry using reserved credit must see and respect the same remaining capacity as the loan page — pin in Tasks 2 and 6.

## File Boundaries and Interfaces

New backend services under `backendv2/finance/services/cash_loans/`:

- `__init__.py`: package only.
- `calculations.py`: pure Decimal quote/schedule/comparison; no ORM writes.
- `ledger.py`: disbursement/posting effects, reservation, idempotent write receipt, and balance helpers.
- `payments.py`: card-payment creation/linking and component allocations.
- `lifecycle.py`: dated amendments, settlement, and cancellation/reversal.
- `projections.py`: loan cards/details, payment candidates, summary aggregation, deadline materialization.

New `backendv2/finance/api/cash_loans.py`: dedicated input validation and private endpoints. Add necessary persistence to `finance/models.py` and an additive migration after `0025_transaction_optional_account`; determine the exact minimal schema from these responsibilities, without restructuring unrelated models.

Frontend files live together under `pixelpopup-frontend/src/features/personal-dashboard/cash-loans/`: `api.js`, `useCashLoanQuote.js`, `CashLoanList.jsx`, `CashLoanForm.jsx`, `CashLoanPreview.jsx`, `CashLoanSchedule.jsx`, `CashLoanPaymentDialog.jsx`, `CashLoanLifecycleDialog.jsx`, `CashLoanDetailView.jsx`.

**Shared DTO vocabulary:** Quote requests use string money/rates and `loan_amount`, `rate`, `rate_period` (`monthly`/`annual_nominal`), `interest_method` (`add_on`/`diminishing`), `term_months`, `fee_kind` (`fixed`/`percentage`), `fee_value`, `fee_treatment` (`upfront`/`separate`/`financed`), `monthly_charge`, `loan_date`, `first_payment_date`, `credit_policy` (`principal`/`full_installments`). Creation additionally uses `name`, `card_id`, `receiving_account_id`, `request_id`. These describe API inputs, not a prescribed database schema.

Quote output: `financed_principal`, `net_cash_received`, `processing_fee`, `total_interest`, `total_charges`, `regular_payment`, `final_payment`, `installment_total`, `total_cash_outlay`, `borrowing_cost`, `additional_reservation`, and `schedule` rows (`index`, `due_date`, `principal`, `interest`, `charges`, `payment`, `remaining_principal`). All monetary values are decimal strings at the API boundary.

Payment input: `request_id`, either `movement_id` or `source_account_id` + `amount` + `date`, and `allocations` of installment reference with decimal-string `principal`, `interest`, `fees`. Optional explicitly confirmed `postings` supply actual unposted charges. Return the movement once, all linked allocations, and refreshed loan/account snapshots.

## Task 1: Pure Calculator and Exact Schedule

**Files:** Create `services/cash_loans/{__init__,calculations}.py` and `tests/test_cash_loan_calculations.py` under `backendv2/finance/`.

**Interfaces:** `calculate_loan(terms: dict) -> dict` returns Decimals/date values internally using the DTO vocabulary above. `compare_terms(terms: dict, months: list[int]) -> list[dict]` calculates independent quotes using the same rate/fee basis; `due_date(anchor: date, offset: int) -> date` preserves the original day anchor.

- [ ] Write failing tests with these exact assertions:
  ```python
  q = calculate_loan(add_on_terms(amount="50000", rate="0.79", months=12, fee="350", treatment="separate"))
  assert q["total_interest"] == Decimal("4740.00")
  assert q["installment_total"] == Decimal("54740.00")
  assert q["total_cash_outlay"] == Decimal("55090.00")
  assert q["regular_payment"] == Decimal("4561.67")
  assert q["final_payment"] == Decimal("4561.63")
  assert sum(r["principal"] for r in q["schedule"]) == Decimal("50000.00")
  assert q["schedule"][-1]["remaining_principal"] == Decimal("0.00")
  assert due_date(date(2028, 1, 31), 1) == date(2028, 2, 29)
  assert due_date(date(2028, 1, 31), 2) == date(2028, 3, 31)
  ```
  Define `add_on_terms` only as a test fixture builder producing the shared request keys. Additional named cases assert zero interest totals; diminishing interest equals schedule interest sum; nominal 12% equals monthly 1%; 350 upfront yields 49,650 cash; financed fee yields 50,350 financed principal; monthly 10 charges over 12 rows total 120; and comparison does not mutate input terms. Tiny-principal/long-term cases must either produce nonnegative cent rows with exact totals or a clear validation error, never overflow/NaN or negative amortization.
- [ ] Run failing tests: `cd backendv2` then `.venv/bin/python manage.py test finance.tests.test_cash_loan_calculations --settings=finance.tests.settings`. Expected: missing calculator failure, not unrelated environment failure.
- [ ] Implement pure validation, high-precision Decimal formulas, half-up cents, final-row reconciliation, anchored monthly dates, and comparison. Reject nonfinite/invalid precision/ranges and first due dates preceding release. Do not invent lender rates.
- [ ] Run the same focused module; expected all cases pass without accessing the user's database.
- [ ] Commit only calculator and its tests: `feat(finance): calculate credit-card cash loan schedules`.

## Task 2: Persistence, Disbursement, and Reservation-aware Balances

**Files:** Modify `backendv2/finance/models.py`, `services/balances.py`, `services/account_detail.py`, `api/serializers.py`; create additive migration `finance/migrations/0026_credit_card_cash_loans.py`, `services/cash_loans/ledger.py`, `tests/test_cash_loan_ledger.py`. Check the actual migration head before assigning `0026`.

**Interfaces:** `create_cash_loan(data: dict, actor) -> loan`; `post_charges(loan_id: int, data: dict, actor) -> posting`; `loan_account_effect(account_id: int, as_of: date) -> Decimal`; `additional_credit_reservation(card_id: int, as_of: date) -> Decimal`; `available_credit(account, as_of=None) -> Decimal | None`. All write services lock stable account order and reuse the calculator.

- [ ] Write failing ledger tests asserting: 100,000 card limit/zero debt + 50,000 principal/350 upfront gives bank +49,650, card debt 50,000, income 0, expense 350, available credit 50,000. Full-reservation quote at 0.79%/12 gives credit 45,260 before separate fee payment, while debt remains 50,000. Financed fee adds only 350 principal and one 350 expense. Separate fee remains projected until explicitly paid. Existing purchase and card-payment balance assertions remain unchanged.
- [ ] Add tests asserting identical UUID retries create one loan/release; changed payload under reused UUID fails; rejected capacity leaves no release/expense/deadline; archived/noncash receiver and future release fail; backdated release has no effect before release and correct effect afterward; posting interest moves reservation to debt without double credit usage.
- [ ] Run `.venv/bin/python manage.py test finance.tests.test_cash_loan_ledger --settings=finance.tests.settings` from `backendv2`; expected missing persistence/services failures.
- [ ] Add minimal persistent agreement/schedule-version/posted-effect/allocation/write-receipt records and relationships. Reuse Record metadata, protected financial references, Decimal constraints, request receipts, and audit conventions. Keep projected schedules independent from posted effects. Generate the additive migration only; do not apply to the local DB yet.
- [ ] Implement ledger effects. Linked borrowing-cost Transaction rows feed expense reports but are excluded from duplicate account effects; the loan posting owns their effect exactly once. Bank/card account history merges posting entries, while ordinary MoneyMovement effects remain unchanged. Add `available_credit` and `additional_reservation` to account responses, preserving `balance` semantics. Capacity uses the same backend helper for all charges, including Quick Entry.
- [ ] Run targeted ledger tests plus `finance.tests.test_account_detail` and `finance.tests.test_finance` using the test settings; inspect failures only within affected accounting paths.
- [ ] Commit only the task-specific hunks and migration: `feat(finance): post cash-loan financing and credit reservations`.

## Task 3: Private API, Read Projections, and Audit History

**Files:** Create `backendv2/finance/api/cash_loans.py`, `services/cash_loans/projections.py`, `tests/test_cash_loan_api.py`; modify `finance/api/urls.py`, `finance/services/audit.py` only where new record labels/snapshots require registration.

**Interfaces:** `loan_detail(loan_id: int, month: str | None) -> dict`; `loan_cards(card_id: int) -> list[dict]`; `payment_candidates(card_id: int) -> list[dict]`; `loan_financial_summary(as_of: date) -> dict`. Detail returns quote, remaining actual components, schedule status, allocations/transactions, next due, status, and version.

- [ ] Write failing private-API tests: unauthenticated calls cannot read/write; quote/compare perform zero financial writes; invalid enums/rates/dates return field errors; card-filtered lists exclude other cards; stale financial-edit version returns a conflict; retries log one semantic audit event.
- [ ] Run `.venv/bin/python manage.py test finance.tests.test_cash_loan_api --settings=finance.tests.settings`; expected routes missing.
- [ ] Add endpoints under `/api/v1/finance/cash-loans/`: `quote/` POST, `compare/` POST, collection GET/POST, detail GET/PATCH, `<id>/payment-candidates/` GET. GET remains private/no-store; PATCH changes descriptive metadata only. Quote accepts incomplete client drafts as field errors without writes. Paginate list/history and use select-related/prefetch for allocations. Reuse session permissions/CSRF, existing error and Decimal serialization patterns without introducing circular imports.
- [ ] Implement projected statuses from remaining actual obligations, not dates alone; paid counts exclude partial rows. Transactions distinguish posting/payment/allocation and aggregate each real movement only once.
- [ ] Run focused API tests; expected all pass and responses use decimal strings.
- [ ] Commit task-specific files/hunks: `feat(finance): expose private cash-loan tracker API`.

## Task 4: Explicit New/Existing Payment Allocations

**Files:** Create `backendv2/finance/services/cash_loans/payments.py`, `finance/tests/test_cash_loan_payments.py`; modify dedicated loan API, `services/settlements.py` and `api/views.py` only for dependent movement/deadline safety.

**Interfaces:** `allocate_payment(data: dict, actor) -> dict`; `reverse_allocation(allocation_id: int, request_id: str, actor) -> dict`. The service can allocate one movement across multiple loans on the same card. Explicit optional posting is committed with allocations in one transaction.

- [ ] Write failing tests: new 1,000 card payment reduces bank/card by 1,000 once; linking that movement does not change balances; component sums must match allocation; total allocations ≤ movement amount; principal reduces by only the principal component; partial row remains unpaid; leftover movement amount remains usable for purchases/other loans.
- [ ] Add tests: cross-card allocation, consumed movement, unknown installment, future/pre-release payment, and unposted-interest allocation without explicit posting each fail with no partial writes. Repeat UUID produces one movement/allocation; mismatched retry rejects. Two competing allocations cannot consume the same remaining amount. Separate loans share one payment but retain separate progress. Reversing allocation reopens progress without changing the original bank deduction. Rejected modification/deletion of a linked payment preserves allocations and history.
- [ ] Run `.venv/bin/python manage.py test finance.tests.test_cash_loan_payments --settings=finance.tests.settings`; expected missing allocation action.
- [ ] Implement allocation validation under stable locks and immutable request receipts, rechecking after waits. Reuse `move_money` once for new payments. Existing-payment allocations create no movement. Suggest posted fees/interest first but accept a validated user-edited breakdown. Never infer allocations from generic card payments.
- [ ] Expose `<id>/payments/` POST and an allocation reversal action with explicit confirmation. Update progress/reminder status in the same commit. Reject card-payment amount/date/card edits inconsistent with existing allocations rather than silently remapping them.
- [ ] Run payment tests and affected existing card-payment tests; expected exact balances and component totals.
- [ ] Commit only affected hunks: `feat(finance): allocate card payments to cash-loan installments`.

## Task 5: Amendments, Early Settlement, and Safe Cancellation

**Files:** Create `backendv2/finance/services/cash_loans/lifecycle.py`, `finance/tests/test_cash_loan_lifecycle.py`; modify dedicated API/projections.

**Interfaces:** `preview_settlement(loan_id: int, data: dict) -> dict`; `settle_cash_loan(loan_id: int, data: dict, actor) -> loan`; `amend_cash_loan(loan_id: int, data: dict, actor) -> loan`; `cancel_cash_loan(loan_id: int, data: dict, actor) -> loan`.

- [ ] Write failing tests: extra principal alone does not waive contracted interest; inconsistent lender settlement breakdown rejects; preview writes nothing; fully paid requires all remaining components cleared; settled loan preserves original schedule/actual history and has zero remaining reservation; same request retry does not duplicate payment.
- [ ] Add tests: amendment cannot overwrite paid installments; cancellation fails if reversing proceeds would overdraw the receiver and leaves the loan active; successful explicit cancellation reconciles bank/debt/reservation and preserves evidence. An accrued fee cannot disappear by changing the loan name or switching policy.
- [ ] Run `.venv/bin/python manage.py test finance.tests.test_cash_loan_lifecycle --settings=finance.tests.settings`; expected missing lifecycle actions.
- [ ] Implement dated future-only schedule versions with explicit principal/interest/fee adjustments; lender-provided settlement amount plus rebate/fee breakdown must reconcile. Atomic settlement uses Task 4 payment allocations plus explicit waivers. Cancellation requires explicit reconciling financial effects, never hard-delete or debt hiding.
- [ ] Expose `<id>/settlement-preview/`, `<id>/settle/`, `<id>/amend/`, `<id>/cancel/` POST actions with request IDs and version checks.
- [ ] Run focused lifecycle tests; expected original history unchanged and new financial effects exact.
- [ ] Commit affected files/hunks: `feat(finance): reconcile cash-loan amendments and settlement`.

## Task 6: Account Tab, Creation Preview, and Shared Credit Selection

**Files:** Create `pixelpopup-frontend/src/features/personal-dashboard/cash-loans/{api.js,useCashLoanQuote.js,CashLoanList.jsx,CashLoanForm.jsx,CashLoanPreview.jsx,CashLoanSchedule.jsx}`. Modify `views/AccountDetailView.jsx`, `components/AccountBalancePreview.jsx`, `components/quick-entry/QuickEntrySelect.jsx`, `quick-entry/money.js`, and `views/AccountsView.jsx` only where credit availability is shown.

**Interfaces:** `cashLoanApi(request)` wraps Task 3 routes. `useCashLoanQuote({request, terms, enabled})` returns `{quote, errors, loading, current}` and cancels/discards obsolete requests. `CashLoanList({card, request, version, month, onCreated, notify})`; `CashLoanForm({card, accounts, request, onSaved, onClose})`; `CashLoanSchedule({rows, onSelect})`.

- [ ] Read current product/design docs and required UI skills/references before editing. Inherit existing Operate styling; use FormModalShell, FormField/SelectableField, account choice tiles, Tabs, SummaryTiles, Button, and existing currency/date formatting. No duplicated modal or global style change.
- [ ] Implement new account tab/list and Add Cash Loan action. Compact cards show monthly payment, remaining principal, paid/total progress, status, and next due; empty/error/loading states have icons and actionable copy.
- [ ] Implement conditional fee fields, direct term entry/presets, nominal-annual label, reservation choices, desktop form-left/preview-right and mobile stack. Show prominent regular/final payment, net proceeds, costs, ledger effects, schedule popup, and optional term comparison. Quote is debounced; Save requires quote input fingerprint to match current terms. Keep a single stable request ID and frozen payload after uncertain saves; edited payload must explicitly abandon the old request before creating a new ID.
- [ ] Change only availability/projection calculations to consume backend `available_credit`/`additional_reservation`; preserve posted `balance` and fallback behavior for accounts with no loans. Ensure Quick Entry projected credit applies pending changes to effective credit, not just limit minus posted debt. Use precise minor units for new financial previews.
- [ ] Add backend tests in Task 2's module pinning normal expense and Quick Entry rejection when posted debt 50,000 + extra reservation 4,740 leaves only 45,260 capacity. Source-review frontend delayed-response/discard logic: a quote for 50,000 cannot enable Save after input changes to 60,000; compare selection updates terms and invalidates the old quote. No browser automation unless separately approved.
- [ ] Run only the affected targeted backend modules; source-review imports, shared-component props, keyboard labels, dialog scroll/focus behavior, and mobile classes. No build/lint/typecheck.
- [ ] Commit selected feature hunks: `feat(dashboard): add cash-loan calculator and account tab`.

## Task 7: Dedicated Loan Details and Repayment Dialogs

**Files:** Create `cash-loans/{CashLoanDetailView.jsx,CashLoanPaymentDialog.jsx,CashLoanLifecycleDialog.jsx}`; modify `pixelpopup-frontend/src/features/personal-dashboard/Dashboard.jsx`, account-detail tab links, and feature API wrapper.

**Interfaces:** Details route `/dashboard/accounts/:accountId/cash-loans/:loanId`; `CashLoanDetailView({accountId, loanId, dashboard, month, notify})`; `CashLoanPaymentDialog({loan, installment, accounts, request, onSaved, onClose})`; `CashLoanLifecycleDialog({loan, kind, request, onSaved, onClose})`.

- [ ] Add route recognition before ordinary account detail, preserving account navigation and month query. Details must verify the loan belongs to the URL account; invalid combinations show an actionable not-found state.
- [ ] Implement Overview / Payment Schedule / Transactions using shared tabs, four primary tiles below Overview tabs, secondary compact facts, normal-weight red outflow values, and neutral zero metrics. Detail inspection uses a popup; row click does not mutate paid state.
- [ ] Reuse existing ledger row presentation and financial formatting. Show real movements once; allocations link to those movements rather than appearing as additional cash transactions. Keep transaction filters scoped to this loan/account.
- [ ] Implement payment mode selection (new or existing), amount/component breakdown, partial remaining due, unallocated movement capacity, and explicit posting confirmation. Use account choice tiles/current balance previews and shared form modal. After save refresh loan, account, dashboard, and candidate balances; preserve draft/error/uncertain-retry safeguards.
- [ ] Add amendment/settlement/cancellation dialogs with explicit lender figures and confirmation of actual effects. Follow Task 5 restrictions, preserve paid history, and show blockers inline.
- [ ] Source-review all action routes, cross-account validation, field errors, total reconciliation, keyboard/focus behavior, icon-bearing save buttons, and modal width/scroll constraints. Defer visual testing pending user authorization.
- [ ] Commit selected feature hunks: `feat(dashboard): track cash-loan details and repayments`.

## Task 8: Dashboard Obligations, Calendar, and Financial Summaries

**Files:** Modify `backendv2/finance/services/cash_loans/projections.py`, `services/summaries.py`, `services/account_detail.py`, `api/serializers.py`, `api/views.py`, `services/settlements.py`; modify frontend `views/OverviewView.jsx`, `views/CalendarView.jsx`, `components/CalendarDialog.jsx`, and `Dashboard.jsx` only for loan links/payment routing. Create `finance/tests/test_cash_loan_integration.py`.

**Interfaces:** `materialize_cash_loan_deadlines(loan_id: int) -> None` reconciles unique installment deadlines without ledger postings. `loan_financial_summary(as_of: date) -> dict` adds remaining principal, projected interest/payments, monthly scheduled obligations, actual repayments, and borrowing expenses without adding cash-loan debt twice.

- [ ] Write failing tests: repeat materialization produces one deadline per current installment; future due dates create no income/expenses; partial allocation updates remaining due; full allocation/settlement removes urgency; calendar and overview link the same obligation to loan details; generic deadline settlement cannot bypass allocation; consolidated statement and linked installments count projected cash obligations only once.
- [ ] Add summary assertions: 50,000 debt/+49,650 bank with 350 upfront changes net worth by -350, not -50,350; interest/fees alone enter expense reports; actual payments and projected repayments are separate; cancelled schedules do not remain upcoming. Compare existing nonloan dashboard/calendar assertions unchanged.
- [ ] Run `.venv/bin/python manage.py test finance.tests.test_cash_loan_integration --settings=finance.tests.settings`; expected missing loan obligations/summary fields.
- [ ] Materialize unique deadlines from approved schedule versions, reuse existing reminder-days/urgency, and attach loan detail/payment context. Unpaid future installments remain obligations only. Reuse existing card statement identity where linked; do not synthesize or guess statements.
- [ ] Update account/dashboard summaries and ledger charts to distinguish financing cash from earned income, actual cash outflow from ordinary spending, and projected interest from posted debt. Route deadline actions to the loan payment dialog/details, not generic task completion or expense creation.
- [ ] Run the cash-loan modules and directly affected account/reminder/finance modules with test settings. Expected exact totals, stable pre-existing behavior, and no user-database writes. Do not run a full repository suite/build.
- [ ] Commit selected integration hunks: `feat(finance): integrate cash loans with summaries and deadlines`.

## Completion Gate

- [ ] Self-review all spec requirements against the eight tasks, including optional term comparison, recurring charges, early settlement, linked payments, credit restoration, audit, and lifecycle safety. Report remaining limitations honestly.
- [ ] Ask permission to apply the additive local migration; only after approval run the explicit migration command. Never apply production migrations or commit the local database.
- [ ] Perform one scoped independent source review if a reviewer is authorized by the selected execution workflow; no broad cleanup or new browser/test scope. Fix only material cash-loan/accounting findings.
- [ ] Record the inherited Cash Loans surface behavior in `.impeccable/surfaces/cash-loans.md`; preserve global design tokens. Summarize targeted test results, source-only UI validation, migration status, and feature commits. No push/deploy.

## Plan Self-review

The calculator/fee/schedule requirements map to Task 1; persistence and reservations to Task 2; reads/auth/audit to Task 3; partial/existing/multi-loan payments to Task 4; adjustments/settlement/cancellation to Task 5; creation/comparison/selectors to Task 6; detail/payment UI to Task 7; calendar/reminders/reporting to Task 8. All five Review Focus cases have owning checks. No requirement depends on a fabricated bank rate, date-only payment completion, duplicate movement, or unrelated refactor.
