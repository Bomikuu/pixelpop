# Credit-card cash loans — approved design specification

Date: 2026-10-12
Status: Written specification approved by the user; implementation plan awaiting review.
Scope: Personal finance dashboard only. No production changes or database operations at this stage.

## Purpose and confirmed decisions

Track credit-card cash installment loans from disbursement to final repayment, using user-supplied contractual rates and fees. Make the monthly installment, actual cash received, borrowing cost, and remaining obligations easy to understand.

The user approved:

- A dedicated Cash Loans tracker inside each existing credit-card account page.
- Creation with a compact form and live preview; loan details with Overview, Payment Schedule, and Transactions tabs.
- Explicit allocation of one card payment across purchases and individual loan installments. Previously recorded card payments can also be allocated; allocation must never deduct cash again.
- A configurable credit-reservation rule per loan: financed principal by default, or the full contractual installment total when the lender requires it.
- Integration with existing account balances, deadlines, calendar, payment history, and financial summaries.
- Principal and proceeds are financing, not spending or earned income. Only borrowing interest and fees are expenses.

Use the existing finance architecture. This specification describes responsibilities and behavior, not a prescribed database schema or field list. Do not repurpose a loan receivable as borrowing: existing receivables represent money other people owe the user.

## Approach

Recommended: dedicated cash-loan services with persistent contractual schedules and payment allocations, integrated into the existing account ledger. Reuse MoneyMovement card payments, Decimal validation, account locking, capacity checks, deadlines, audit events, form primitives, account choice tiles, and transaction/history presentation.

Rejected alternatives:

- Generic recurring bills: cannot safely distinguish disbursement, principal, interest, credit reservations, and partial allocations.
- Calculator-only or independently maintained balances: would leave actual cash and card debt disconnected or counted twice.

Implementation will require additive persistence for loan agreements, schedule history, postings, and allocations. Determine the smallest safe schema during implementation planning. Preserve existing records and migrations; obtaining permission to apply a local migration is a separate step. Never apply production migrations without explicit authorization.

## Accounting invariants

### Disbursement and fees

- Saving a new released loan atomically records the financing liability and actual net cash received in the selected active cash/bank/e-wallet account. Neither is a salary/income transaction.
- Before saving, show both account effects explicitly. Loan release dates must be today or earlier; projected installment dates may be future dates.
- Deducted-upfront fee: borrower owes the original principal, cash received is principal minus the fee, and the fee is one borrowing expense. Its expense presentation must not deduct the fee from cash or charge the card a second time.
- Separately paid fee: excluded from installment financing. Show it as a separate obligation until actually posted/paid. The user selects how it is paid; any account effect occurs once through the normal expense/payment ledger.
- Financed fee: included once in financed principal and once in borrowing-cost reporting, without a duplicate card charge. Net cash received remains the original borrowed amount. The preview explicitly states that the selected rate applies to the financed amount including the fee.
- Percentage processing fees use the original borrowed amount as the stated base; fixed fees use the entered currency amount. Reject upfront fees that leave no positive cash proceeds.
- Optional monthly charges are distinct recurring borrowing costs, included in installments but not automatically capitalized or charged interest.
- The initial release flow does not silently import a pre-existing loan whose proceeds or liability are already included in opening balances. Such an import mode is outside this iteration.

### Debt versus available credit

- Actual card debt and credit reservation are separate concepts. Loan principal contributes once to card debt; cash-loan principal must not also be added again to net-worth debt totals.
- Future unposted interest and charges remain projected obligations, not current expense transactions or posted debt.
- Principal-reservation policy: principal already included in card debt consumes credit; do not add a second principal reservation.
- Full-installment-reservation policy: reserve the additional unposted contractual interest/charges as well. Do not report that extra reservation as posted debt or expense.
- When a reserved charge posts, move it from unposted reservation to posted debt without increasing total credit usage twice. Payments restore credit through actual ledger effects, with the reservation reconciled to the remaining contract.
- Effective available credit and capacity checks use posted card debt plus any additional reservation. Account selectors, account details, and account lists must agree on the same backend result.
- Capacity checks reject new loan obligations/charges that exceed configured credit and cash payments that overdraw their source account. Never subtract reservations twice in the frontend.

### Payments and allocation

- A new card payment uses the existing source-account-to-card movement. Show its cash deduction, card debt reduction, and installment allocation in one confirmation preview.
- Linking an existing payment only adds allocation metadata and loan progress. It creates no new payment movement and changes neither bank balance nor card balance again.
- One payment may allocate to several loans/installments and leave an unallocated amount for purchases. Show total, allocated, and available-to-allocate amounts.
- Aggregate allocations cannot exceed the payment amount, including concurrent requests. Require matching card, compatible dates, and allocations no greater than the selected installment's outstanding obligation.
- Show an editable principal/interest/fee allocation breakdown. Suggested partial allocation covers outstanding posted fees and interest first, then principal; the user can explicitly correct it to match the lender's breakdown. Component totals must equal the allocated payment.
- An allocation cannot pay an unposted borrowing charge silently. Offer an explicit posting step/confirmation for the corresponding actual interest or fee, with a preview of its ledger effect. The release principal must never be posted again as an installment purchase.
- Generic card payments remain valid and visible. Until explicitly allocated, they do not mark a cash-loan installment paid. Surface unallocated payments that could be linked rather than guessing which loan they paid.
- Remaining principal changes only through allocated principal repayments or explicit audited lender adjustments. Payment-date passage never counts as repayment.
- Cancel/delete/edit actions affecting linked card payments must not leave dangling allocations. Require reversing allocations in the same controlled action or reject the incompatible change with an actionable message.

### Atomicity and history

- Saving a loan, posting a charge, paying, allocating, reversing, or settling uses atomic operations, stable account/loan locking, and persistent idempotency keys. Retry the same request without creating duplicate obligations or transactions.
- Validate the entire operation before commit; a preview is read-only and never mutates accounts, deadlines, or transactions.
- Preserve contractual schedule versions and actual payment history. Editing a name or notes cannot recalculate money. After financial posting, term changes require a dated, auditable adjustment that affects only unpaid future obligations.
- Released loans cannot be cancelled simply by hiding their debt. A cancellation requires explicit reconciliation/reversal of actual cash and liability effects, with capacity checks. Keep historical records rather than deleting their financial evidence.

## Calculation contract

Backend Decimal calculations are authoritative. Send decimal strings to/from the frontend. Use a read-only calculation endpoint for preview and comparison rather than duplicating financial formulas in JavaScript floating-point arithmetic.

- Borrowed principal must be positive; rates/fees nonnegative; term a positive whole number of months, not restricted to preset examples. Reject nonfinite inputs, unsupported precision, invalid dates, and calculations that cannot fit the ledger's supported monetary range.
- Support monthly rates and explicitly labeled **nominal annual rates divided by 12**. Do not silently treat an effective annual rate as nominal. Guidance tells users with effective or otherwise nonstandard terms to use the lender's actual monthly rate.
- Add-on: contractual interest = financed principal × monthly rate × term. Allocate principal and interest across installments with cent rounding and final-installment adjustments.
- Diminishing balance: standard monthly amortization using the outstanding financed principal and periodic rate. Each row calculates interest on the prior outstanding principal and reduces principal by the repayment component.
- Zero-rate loans divide principal across the term without dividing by zero.
- Use high-precision Decimal intermediates and explicit half-up cent rounding for posted schedule amounts. Adjust the final row so principal components exactly total financed principal and final principal reaches zero. Keep totals equal to the actual rounded schedule, not a separately rounded conflicting formula.
- Show regular installment and any different final installment. Distinguish net cash received, financed principal, installment repayments, processing fee, recurring charges, total interest, total cash outlay, and borrowing cost.
- Anchor due dates to the original first-payment day, clamp to each month's final day, and restore the anchor in later months. January 31 becomes February's last day and then March 31, not March 28.
- First payment cannot precede release. Calculations reflect user inputs; no bank rate defaults or claims that a calculation is the bank's official quotation.

Reference acceptance example: original principal 50,000, monthly add-on 0.79%, 12 months, separately paid fee 350. Interest 4,740; installments total 54,740; total cash outlay 55,090. Regular installment 4,561.67, with the final installment adjusted for exact cent totals.

## Loan lifecycle and settlement

- Statuses: active, overdue, fully paid, and cancelled after proper reconciliation. Fully paid requires all actual remaining contractual obligations to be paid or explicitly waived/adjusted, not just a zero principal balance.
- Installments: pending, partially paid, paid, or overdue. Preserve recorded actual dates and linked payment references. Remaining payment and remaining principal are visibly distinct.
- Additional payments allocate against the contract; they do not automatically reduce future interest, re-amortize, or shorten the term.
- Early-settlement preview compares remaining scheduled payments to lender-provided settlement terms. Enter actual settlement amount with principal, fees, interest, and rebate/adjustment breakdown; totals must reconcile.
- Settlement commits the actual payment and explicit lender adjustment/waiver together. Preserve original schedule/history, reconcile credit reservations, and close future reminders. No fictional automatic interest rebate.
- Multiple loans on one card remain independently calculated and allocated. Show combined monthly obligations without merging their histories.

## Interface and flow

Inherit PRODUCT.md, DESIGN.md, DESIGN_GUIDELINES.md, and the existing personal-dashboard UI. Operate mode; restrained white/slate/cobalt palette, Instrument Sans, Lucide icons, shared Tailwind/shadcn form controls and tabs. No new visual identity or UI dependency.

### Credit-card account

- Add Cash Loans to the existing account tabs. Show compact interactive cards with loan name, monthly amount, remaining principal, actual paid/total installment progress, status, and next payment countdown.
- Add Cash Loan is available only for active credit-card accounts. Preselect the current card, while supporting explicit selection of another active card where appropriate.
- Keep card purchases, loan principal, posted borrowing charges, and additional credit reservation understandable in the account summary/ledger. Monthly obligations are projections, not purchase spending.

### Creation

- Existing form modal conventions; compact two-column desktop layout with inputs left and live preview right, stacked on mobile.
- Reuse money inputs, inline required-field/error indicators, icon-bearing buttons, custom dropdowns, and account choice tiles showing current balance/credit and potential new balance.
- Provide direct numeric term entry with optional presets. Group small related controls on the same row. Show conditional fee controls only where relevant.
- Make monthly payment the dominant number. Include net cash received, loan costs, first/final due dates, and an explicit ledger-impact preview before Create Cash Loan.
- View Schedule opens the full projected table without saving. Compare Terms is optional; compare chosen terms under the same entered rate/fees, highlight lowest monthly payment and lowest borrowing cost, and allow applying a term to the form.
- Draft preview errors remain inline and never crash the page. Saving/error/uncertain-retry states preserve inputs and prevent duplicate submissions.

### Loan details

- Dedicated route with parent account breadcrumb and Overview / Payment Schedule / Transactions tabs, reusing existing dashboard tabs.
- Overview has four primary summary tiles below tabs; additional facts are compact secondary content. Show rate/method, actual versus projected balances, payoff estimate, fees, and progress. Zero metrics follow the existing neutral styling rule.
- Schedule shows installment count, due date, principal, interest, charges, total, remaining principal, and actual payment status. Highlight the next unpaid item; detail inspection uses a popup, not an oversized expanded row.
- Transactions reuses ledger presentation and clearly labels financing inflow, charge posting, card payment, allocation, and adjustment. Linking one movement to several allocations must not duplicate its monetary total in summaries.
- Record Payment supports either a new payment or selection of a compatible existing movement. Account balance and insufficient-funds feedback remain visible. Show partial-payment status rather than pretending it is fully settled.
- Early Settlement is an explicit action with lender-provided figures and a confirmation showing all account effects.

### Dashboard, reminders, and calendar

- Reuse existing deadline presentation and calendar rather than building a second reminder system. Each scheduled installment has a unique identity and links to its loan/payment flow.
- Clicking a cash-loan deadline opens details/payment confirmation; it cannot mark a payment complete on card click.
- Partially paid installments show remaining amount; completed/cancelled obligations leave the actionable list. Separate card-statement reminders can link the same installment without creating duplicate charges or counting the same projected obligation twice.
- Preserve existing relative countdowns, urgency styling, accessibility, reduced-motion behavior, and responsive layouts. No extra notification channels.

## Integration boundaries

Backend integration areas: finance cash-loan calculations and write services; existing balance/capacity and financial-position services; account detail ledger; finance API serializers/actions; summary queries; deadlines/calendar; audit history. Keep loan processes isolated rather than growing one monolithic form or service.

Frontend integration areas: credit-card account detail tabs; cash-loan view/forms/dialogs; existing account selectors and shared summary/ledger components; dashboard routing and obligation presentation. Reuse components while preserving existing unrelated transaction, asset-financing, and money-lent behavior.

All actions retain existing private-dashboard authentication/permissions. No public loan links, bank integrations, automated lender payments, production deployment, or unrelated refactoring.

## Verification and delivery

The supplied brief explicitly requests automated calculation tests. Add focused tests for add-on/diminishing/zero interest, nominal annual conversion, fee treatments, recurring charges, month-end/leap dates, and exact final rounding.

Add focused ledger tests for financing-not-income, principal-not-expense, both reservation rules, new/existing payment allocations, partial payments, concurrent/retried writes, insufficient funds/credit, multiple loans, reversals, lender adjustments, early settlement, and no duplicate deadline/statement accounting. Include regression assertions for ordinary purchases and card payments in the affected paths.

No full build, broad test suite, deployment, or browser automation is authorized by this design approval. The implementation plan will state targeted verification commands; local migration execution requires its own approval. Preserve the currently dirty worktree and tracked local database. Commit only task-specific documents when required by the planning workflow; do not commit other existing changes or push.

## Specification review

- Scope matches the supplied Cash2Go brief and the user's two accounting choices.
- Current debt, future obligations, credit reservation, and cash movements are explicitly separated.
- Allocation and fee reporting cannot produce duplicate cash deductions or debt/expense totals.
- The existing receivable and asset-financing flows are preserved, not misused as cash loans.
- New persistence remains an implementation decision rather than a prescribed schema.
- Default partial allocation, nominal annual conversion, and fee-financing basis are explicitly disclosed for review, not left implicit.
