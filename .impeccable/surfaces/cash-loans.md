# Cash Loans — personal dashboard extension

## Scope and direction contract

- Mode: Operate. Audience: the private dashboard owner reviewing actual lender terms and repayments.
- Thesis: distinguish projected repayment obligations from posted debt and actual cash movements; do not count borrowed money as income or principal as spending.
- Own-world: preserve the existing white/slate/cobalt dashboard, Instrument Sans, shared account tiles, Radix tabs, FormField and FormModalShell. This is an extension, not a replacement visual world. No new rasters or global tokens.
- Story: select a credit card, preview a lender offer, review exact account effects, save, then explicitly post/allocate payments. The signature interaction is a read-only, debounced calculation whose stale response cannot enable Save.
- First viewport: the account Cash Loans tab contains compact progress cards and one Add action. Details have Overview / Payment schedule / Transactions tabs; four primary metrics belong inside Overview. Creation uses form-left/estimate-right on desktop and a stacked mobile layout.
- Form: established account/detail and form conventions are binding. No new aesthetic seed was chosen; the impeccable launcher is unavailable in this environment and the approved plan explicitly inherits the incumbent system.
- Motion: low; progress transitions respect reduced motion. Density: medium/compact. Design variance: low.
- Finish: record the finish review and its evidence boundary in this surface brief. Preserve the incumbent root DESIGN.md and .impeccable/design.json; this ordinary dashboard extension does not regenerate either. No raster assets were added.

## Incumbent implementation preserved

- The dashboard-owned theme (`styles/theme.css`) keeps Instrument Sans intentionally, with white surfaces, slate text, neutral borders and cobalt actions. The recipient-facing retro guidance does not replace this existing dashboard treatment.
- `CashLoanList` and `CashLoanDetailView` reuse shared Button, Panel, SummaryTiles and Radix tabs/dialogs. Creation and lifecycle actions reuse FormField, account choice tiles and FormModalShell's bounded scroll body, fixed save footer and discard confirmation.
- Loan Overview contains exactly four primary metrics: Remaining principal, Regular installment, Projected interest left and Remaining obligations. The account Cash Loans tab stays a compact list; the existing dashboard Overview retains its four-primary-metric hierarchy, with loan figures added as supporting metrics.
- Monetary metrics retain neutral zero values. New colored amount text uses normal weight; loan transaction amounts explicitly override the shared MoneyFlowAmount weight. Existing shared metric styling remains authoritative.
- Source defines a desktop form/estimate split and stacked small-screen layout, a bounded horizontally scrollable schedule, wrapping tabs and reduced-motion-safe progress transitions. These are implementation facts, not a claim of verified rendering.

## Behavioral evidence

- New monetary projections use exact minor units; backend Decimal quotes remain authoritative.
- Shared modal bounds/scrolling and icon-bearing save controls are reused. An uncertain save freezes its request ID/payload; retries cannot create a second movement.
- `CashLoanAccountEffects` previews posted debt, available credit after reservations and receiving balance during creation, and card effects during posting, amendment, repayment and settlement/cancellation. Shared AccountBalancePreview shows payer effects; estimates use loaded balances and the server rechecks the submitted action.
- Existing-payment allocations do not deduct cash again. Allocation reversal is separate from reversing the actual card payment.
- Persisted schedules show contractual principal balance and payment status separately; installment clicks inspect context, never mutate paid status.
- Loan deadlines route to loan details. Linked statements and installments do not duplicate projected monthly obligations.
- Zero metrics remain neutral; colored amounts use normal weight. Effective card utilization includes unposted cost reservations.

## Validation and limitations

- Focused backend accounting/API tests: 90 passed on 2026-10-12 using isolated test settings.
- Independent source review: account-effect previews, separate schedule principal/status and effective utilization corrected; reviewer disposition `ship` for these three fixes at source-review scope only.
- Migrations 0026–0027 were applied to local SQLite only after approval and a backup. This does not establish deployment or migration of any remote database.
- No browser automation, screenshots, build, lint, or typecheck were requested or run. Responsive rendering, actual focus behavior, contrast and modal overflow remain unverified visually.
- Preserve existing DESIGN.md and design sidecar. Instrument Sans is intentional, not a new font decision.
