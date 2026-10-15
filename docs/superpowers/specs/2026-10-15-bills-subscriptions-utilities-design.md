# Bills, subscriptions and utility consumption

Date: 2026-10-15
Status: Written design approved by the user on 2026-10-15; implementation awaits implementation-plan review and execution-method selection.

## 1. Purpose and approved decisions

Extend the Personal Dashboard's existing Bills area into one place for recurring obligations, their actual payments, and consumption-based predictions. The user wants to see likely bills before receiving them, record electricity or water readings whenever convenient, and understand whether usage will exceed a budget.

Approved in conversation:

- Use PHP only initially. Do not introduce exchange rates or currency conversion.
- Keep this inside Bills, not a second top-level financial module.
- Use Bills due, Subscriptions & utilities, and Forecasts tabs.
- Automatically include existing recurring expense bills, preserving schedules, accounts, transactions and history. Exclude tasks, reminders, income schedules, loan collections, credit-card repayments and financing installments from subscription management.
- Give each recurring service a detail page. Electricity and water support readings, configurable rates, usage progress, predictions and historical comparisons.
- Preserve the current dashboard design and reuse its owned shadcn/Radix components, Tailwind styling, icons, forms, charts and request hooks.
- Estimates never change balances. Actual payments use the existing financial ledger, capacity checks and duplicate protection.
- Support partial payments, actual-versus-predicted comparisons, explicit meter corrections, and separate appliance-planning estimates.

The detailed policies below are proposed for review with this document. No application code, schema or production data changes are part of writing this spec.

## 2. Existing implementation and chosen approach

Relevant existing code:

- `backendv2/finance/models.py`: RecurringSchedule, Deadline, Transaction and Account.
- `backendv2/finance/services/recurrence.py`: generates unique schedule/due-date occurrences.
- `backendv2/finance/services/settlements.py`: bill payment, account locking and expense linking.
- `backendv2/finance/services/summaries.py`: obligations, actual spending and deadline urgency.
- `backendv2/finance/api/views.py`, `serializers.py` and `urls.py`: authenticated finance APIs.
- `pixelpopup-frontend/src/features/personal-dashboard/Dashboard.jsx`: existing Bills route and shell.
- `components/RecordList.jsx`: Bills records, filters, summary tiles and charts.
- `hooks/useDashboardData.js`: authenticated requests, mutations and refresh invalidation.

Alternatives considered:

1. **Extend existing schedules and deadlines with service/cycle metadata, chosen.** One recurring definition and one occurrence per obligation; preserve existing payment history. Add isolated calculation and payment-allocation services rather than another ledger.
2. **Create independent subscription schedules and payments.** Easier isolation initially, but duplicates obligations, reminders and expense accounting. Rejected.

RecurringSchedule remains the recurrence source. Deadline remains the due obligation. Transaction remains actual financial activity. New subscription metadata describes these records rather than competing with them.

Existing one-off bills remain in Bills due and retain their current behavior. Coverage-linked recurring expense schedules may appear as services, but retain their coverage relationship and existing coverage-specific restrictions. Do not create duplicate insurance schedules or convert coverage into a fund contribution.

## 3. User-facing flow

### Bills due

Retain the existing date filters, account-aware payment flow, urgency treatments and direct deadline links. Show actual confirmed amounts separately from estimated utility amounts. A projected amount must never silently populate Deadline.amount or make an unpriced bill payable.

For subscription-backed bills, show amount due, amount paid and remaining balance. Partial payments remain outstanding. Include overdue balances from earlier cycles even while a newer cycle is open.

### Subscriptions & utilities

- Search by service name, provider, category and notes. Filter by fixed/variable, service type and lifecycle status; sort by name, next due date or amount.
- Card/table toggle uses the same paginated data and preserves the chosen view in local storage. Show exact next due dates plus readable relative timing.
- Cards/rows show provider/type, fixed or estimated amount, next bill, status and relevant action: Record reading, Confirm bill, Pay remainder or Open service.
- One Add button opens the appropriate dedicated form. Preserve existing recurring-bill presets; choosing a preset is editable and never claims an official provider tariff.
- Bulk pause, resume and archive show the affected service count and require confirmation. Do not implement bulk payment or destructive bulk deletion.

Four primary overview tiles: expected bills in the selected month, paid this month, remaining confirmed balance, and overdue balance. Secondary compact metrics: normalized monthly recurring cost, annual equivalent, estimated utilities, upcoming renewals and unpriced obligations. Identify estimates explicitly. Show previous-month percentage comparisons only when a comparable baseline exists.

Summary tiles belong below their overview tab. Records precede charts. Four primary tiles share the first desktop row; secondary tiles use the established compact layout. Zero values are neutral, not warning-red.

### Service details

Route: `/dashboard/bills/subscriptions/:id`, with Bills remaining active in navigation. Existing `/dashboard/bills` URLs and deadline links continue working. Use query-state for the three Bills tabs, preserving the shell's month/search behavior.

Header: service/provider, lifecycle status, next due date, and one actions menu. Use existing breadcrumb sizing, account selection tiles and modal shells.

- Fixed services: overview, billing/payment history, price history and settings. Include optional plan name and duration/lifetime spending.
- Electricity/water: overview, readings, billing/payment history and settings. Electricity additionally has an Appliances tab.
- Generic variable services: manually confirmed bills and historical estimates without pretending meter data exists.
- Internet: fixed plan/billing behavior; optional metered data uses the generic meter engine with an explicit unit.

Reading forms contain meter, date/time, value and optional note. On save, update the reading history, cycle progress, prediction and budget insight together. Do not add reading controls to unrelated fixed services.

Each form lives in a focused feature file, using shared field/modal primitives. Do not grow the central formDefinition/FormDialog switch into a subscription subsystem.

## 4. Data design

Keep models in the existing finance app and migrations. Isolate services and API/UI orchestration in feature-specific files. Reuse the Record base and PROTECT relationships for financial history.

### Subscription

One-to-one with an eligible RecurringSchedule. Fields: service type (fixed, generic variable, electricity, water, internet or custom metered), provider, plan name, description, lifecycle status, archived flag, optional expiry, default payment method, monthly budget, expected cycle usage and reminder preferences. Currency is fixed to PHP at the API boundary.

Name, category, preferred account, recurrence anchor, frequency and interval remain on the schedule. Subscription APIs edit the schedule atomically instead of copying those fields into a second authority. Synchronize legacy schedule edits through the same service.

Support weekly, monthly, quarterly, semiannual, annual and custom day/week/month/year intervals. Represent semiannual billing through the existing six-month interval, avoiding a second recurrence algorithm. Preserve month-end clamping.

### SubscriptionPrice

Append-only effective-dated fixed prices. Validate non-overlapping effective periods. Existing fixed schedule amounts establish an initial price record without changing transactions. A scheduled increase affects applicable future cycles, not confirmed historical bills.

### SubscriptionCycle

One-to-one with Deadline and linked to Subscription. Store explicit period start/end, billing date, due date, tariff reference, amount source, nullable actual amount, optional provider-reported consumption, finalization timestamp and lifecycle exclusion reason/time.

Use half-open consumption periods `[start, end)` in Asia/Manila; the end boundary is the next period's start. Billing date and payment due date are separate from consumption boundaries. There is exactly one cycle for a service and period, and exactly one cycle for a deadline.

Derived payment state is upcoming/pending/partial/paid/overdue based on actual amount, payment allocations, due date and lifecycle. Persist bill confirmation and lifecycle facts, not duplicate payment totals. Deadline.status stays pending until fully settled, then paid. Cancelled future occurrences are excluded, not falsely marked paid.

### Meter and MeterReading

One service can have multiple meters. Meter stores label, unit, optional rollover modulus, active dates and replacement relationship. Units include kWh and m3; render m3 as m³.

Reading stores meter, timezone-aware recorded_at, non-negative Decimal value, optional note and idempotency key. Require unique `(meter, recorded_at)`; allow distinct times on the same day. Reject future readings. Same timestamp is a conflict with an explicit Edit existing reading action, not an automatic overwrite.

Record reset/replacement/rollover as explicit meter events. Keep pre-event and post-event values and event time. Do not infer a reset from a negative difference. A replacement meter starts its own baseline; consumption across an unmeasured gap is unknown.

Corrections retain an audit of old and new values. Validate both adjacent intervals before accepting a corrected or backdated reading. Existing confirmed bills remain actual financial facts after reading corrections.

### UtilityTariff

Versioned, effective-dated configuration: currency PHP, unit, flat rate or validated tier table, optional minimum usage charge, and explicit additional charges. Charges can be fixed, per-unit or percentage, with a named calculation base. Store author/update timestamps.

A cycle references its selected tariff version. Applying a different tariff to an open cycle requires an explicit preview/save. Editing a tariff creates a version; it never rewrites a historical version. If a provider reprices a whole cycle, select that version for the cycle. Automatic mid-cycle tariff proration is outside this implementation; do not interpolate a rate change silently.

### SubscriptionPaymentAllocation

One allocation links one entire ordinary expense Transaction to one cycle, with unique transaction and request identifier constraints. Amount/account/date come from that transaction. A cycle can have many allocations for partial payments. Do not split one expense across multiple subscriptions in this implementation.

For legacy settled bills, retain Transaction.deadline and add an allocation pointing to that same transaction. New subscription payments use allocation links without requiring multiple transactions to occupy the legacy one-to-one deadline field. Never recreate a migrated payment.

### UtilityAppliance

Electricity service, name, watts, hours/day, days/cycle, quantity and active flag. Decimal inputs support fractional watts/hours; quantity is a positive integer. Hours must be 0-24 and days must not exceed the selected billing cycle's length.

### PredictionSnapshot and SubscriptionEvent

Snapshot: cycle, as-of time, model/version, calculation input fingerprint, projected usage/amount, data coverage, confidence label and scenario. Capture on meaningful input changes and immediately before bill confirmation. Identical input fingerprints reuse the existing result; do not create a row on every GET.

Event: lifecycle, price and configuration changes with effective date and before/after values. Reuse the finance audit log for user-visible event logging. A separate deduplicated reminder-event record may reuse the existing delivery infrastructure; it is not another notification scheduler.

## 5. Calculation contract

All backend monetary and consumption arithmetic uses Decimal. Return money and measured quantities as decimal strings. Reject non-finite values and malformed amounts. PHP payments have at most two decimal places; readings/rates support up to six. Round money with explicit ROUND_HALF_UP and consistent line-item rounding. Frontend previews must use decimal-safe helpers, never binary floating-point for ledger decisions.

### Measured consumption and time

For consecutive ordinary readings: `consumption = latest - previous`. Elapsed days are elapsed Manila-local time between readings divided by 24 hours, not the count of date labels.

Rollover consumption uses the explicitly configured modulus and recorded rollover event. Reset events sum the measured pre-reset and post-reset segments. Unmeasured gaps do not become zero consumption.

For multiple meters, sum only compatible units. Expose per-meter coverage. Missing baselines on one meter make total coverage partial rather than pretending the entire service was measured.

When readings bracket but do not land on a cycle boundary, a service-level Estimate boundary readings setting enables linear interpolation. It is off by default. Interpolation is labelled as an estimate and never saved as a measured reading. Distinguish exact cycle usage, boundary-estimated cycle usage, and usage observed only since the first available reading. A single reading provides a baseline, not a consumption rate.

### Tariffs and fees

Flat usage charge: `usage * rate`. Tiered charge sums the incremental consumption in each ordered band; reject gaps, overlaps, descending boundaries and negative prices. The final band is open-ended.

Apply minimum usage charge to the usage component first, then fixed/per-unit fees. Percentage fees state whether their base is the usage charge or the subtotal before percentage fees; percentage fees do not compound by default. Show the breakdown. A missing rate is unknown, not zero, and disables monetary predictions while keeping usage visible.

Use the same tariff function for interval energy/water cost, cycle estimates, projections and budget inversion. Interval cost in the reading table is usage-only unless explicitly labelled otherwise; do not charge a monthly service fee on every reading.

### Projection and provenance

Current-cycle model: `observed consumption / observed days * total cycle days`. Base observed days on the readings that actually exist, not on today when the latest reading is old. Show the as-of timestamp and stale-reading warning.

If the cycle has no usable reading interval, use consumption/day from the last three completed comparable cycles, weighted by their measured durations. If neither source exists, show insufficient data. Do not combine appliance estimates with meter readings.

Label models as Current-cycle estimate, Historical estimate or Limited data. A current-cycle estimate has limited coverage until at least seven measured days and 25% of the cycle are represented. These are transparent UI coverage rules, not statistical confidence guarantees.

`projected bill = tariff(projected cycle usage)`. `current estimated bill = tariff(estimated usage so far)`, showing full cycle fixed fees separately. Keep measured, estimated, projected and provider-confirmed amounts distinguishable everywhere.

Store the prediction at confirmation and compare it with actual: signed amount difference, absolute error, and absolute error / actual * 100. For an actual amount of zero, percentage error is unavailable. Show rolling historical errors; do not claim adaptive machine learning or silently calibrate away consumption. Future prediction strategies can implement the same input/output interface.

### Budget and progress

- Budget variance: projected bill minus configured budget; percentage uses the budget, and is unavailable for a missing or zero budget.
- Budgeted usage: invert the monotonic tariff function, including minimums, fixed fees, tiers and percentage fees. If unavoidable fees exceed budget, show that no usage target can meet it.
- Remaining allowance: budgeted usage minus usage to the latest reading. Keep the signed overage in text; cap the displayed progress fill at 100%.
- Suggested daily allowance: non-negative remaining usage allowance divided by days from the latest reading to cycle end. Label this as-of the latest reading; stale readings cannot support an unqualified target starting today.
- If already over budget, show the excess and zero remaining budget allowance, not negative recommended consumption. If there is no time remaining, show cycle ended rather than divide by zero.
- Progress compares usage with configured expected usage or budgeted usage, never with the lifetime meter value. If neither exists, show recorded usage without an invented progress denominator.

### Anomalies and comparisons

Compare consumption/day, not raw consumption across unequal intervals. Proposed initial warning threshold is 25% above the previous comparable daily baseline, user-editable. Require three completed comparable cycles or three earlier non-overlapping reading intervals of at least 24 hours each. Exclude reset gaps and incomplete unknown segments. Show baseline, observation and threshold; otherwise report insufficient history without an anomaly warning.

Support previous cycle, same period last year, 3/6/12 months and custom ranges. Distinguish due-month obligations, payment-date cash spending and consumption-cycle analytics. Attribute changes to usage versus rates only when comparable tariff/usage data exists; otherwise say the cause cannot yet be separated.

### Appliances

Daily kWh: `watts * hours_per_day * quantity / 1000`. Cycle kWh multiplies that by configured use days. Show usage-only appliance cost at the cycle's tariff; for tiered tariffs show the combined planning tariff calculation and allocation caveat, not an invented universal unit rate. Fixed service charges appear once in the combined service estimate. Appliance totals never update meter readings, confirmed bills or transactions.

## 6. Confirmation, payments and balance safety

Utility amount confirmation is separate from payment. The form shows the preserved prediction, actual billed amount, consumption period, due date and optional provider-reported usage. Default payment amount is remaining confirmed balance, not a prediction.

Fixed services do not require an extra confirmation modal before every payment. Their payment form displays the applicable fixed price as the proposed full bill amount; explicit payment approval confirms and freezes that amount in the same atomic operation if no actual bill was already confirmed. Keep the full bill amount distinct from the amount being paid when recording a partial payment. Variable utilities always require a separately entered actual amount before payment.

Payment sequence, within one database transaction:

1. Resolve a unique operation key and verify an exact retry before writing.
2. Lock using the existing workspace/account ordering, plus subscription/cycle/expense rows where applicable; use a consistent order across all subscription entry points.
3. Verify the bill is confirmed, the period is payable, the amount is positive and no more than the remaining balance.
4. For a new expense, require an eligible account, preview balance/available credit, and apply the existing capacity validation at the payment date. On failure roll back the expense and allocation together.
5. For an existing expense, lock it, verify ordinary expense eligibility, reject any existing bill/subscription/coverage conflict or incompatible financing/cash-loan/shared-bill link, and allocate its full value. Preserve its account, amount, date, category and notes; show metadata mismatches for explicit confirmation. Do not debit that account again.
6. Add exactly one allocation and recompute cycle remainder. Keep partial obligations pending; mark fully paid obligations paid.
7. Record audit details with the operation key and refresh affected views.

The existing deadline-settle endpoint delegates subscription-backed deadlines to this service. Plain one-off bills and specialized loan/card/asset/cash-loan payment behavior remain unchanged. Dashboard cards, calendar actions and reminders must reach the same service, not bypass it.

Allocated expense amounts/account/date cannot be silently edited or deleted through generic transaction forms. Corrections use explicit financial correction flows; unlink/reassignment is not an ordinary metadata edit. Confirmed actual bills can be amended explicitly with an audit trail only when the new actual amount is at least the allocated total. Preserve the original confirmation snapshot and prediction. A lower amount requiring a refund must not erase payments; block and direct to an explicit correction workflow rather than inventing refund accounting.

A genuinely zero actual bill is closed as Nothing due with no zero-value expense. Do not permit zero payments. Existing positive-money validation remains for expenses.

## 7. Lifecycle and recurrence

- Active: materialize eligible upcoming occurrences through the existing bounded recurrence horizon; longer forecasts enumerate virtual occurrences without creating ledger activity.
- Paused: exclude unconfirmed, wholly unpaid future periods starting on/after the effective pause boundary. Current/older confirmed or partially paid bills remain due. Save a lifecycle event.
- Resume: require an explicit next cycle start/renewal date. Do not silently backfill bills for the paused interval.
- Cancelled/expired: stop future periods at the effective boundary while retaining earlier obligations, payments and history. Do not prorate the current cycle automatically.
- Archive: hide the service from the default management list without changing what is owed.
- Delete: only a service with no cycles, readings, payments or audit-bearing history may be removed after confirmation. Otherwise offer archive/cancel. No destructive cascade.

Future Deadline rows may already exist because recurrence pre-generates 90 days. Mark excluded subscription cycles explicitly and apply one shared eligible-obligation filter to Bills, dashboard attention, calendar, reminders, summaries and forecasts. Do not delete those rows or mislabel them as paid.

Fixed prices and actual cycle amounts remain distinct: changes affect future unconfirmed periods; past/current confirmed bills do not change automatically. Editing an existing period boundary after readings/payment confirmation requires explicit validation and must not overlap another cycle.

## 8. Forecasts, analytics and reminders

Forecasts show selected/current month, next month, next 3 months and next 12 months. Place obligations in buckets by due date and avoid counting both a schedule occurrence and its generated Deadline.

For a materialized cycle use its actual remaining balance, otherwise its projected amount, otherwise its fixed scheduled amount. Unknown variable costs remain unknown and contribute an explicit unpriced count, not a fabricated zero. Paid portions are excluded from future obligations but retained in payment-date spending.

Show normalized recurring equivalents separately from due-date forecasts. Normalize weekly schedules by 52/12, month intervals by their actual interval, yearly intervals by 12, and custom day intervals by 365.2425/12; label these annualized planning equivalents. Enumerate real recurrence dates for actual month/annual forecasts.

Scenarios: Normal uses the selected deterministic prediction; High/Low multiply variable usage by a visible, editable percentage (initially +20%/-20%); Custom lets the user set usage assumptions. Fixed fees and fixed subscriptions do not change with usage. Scenario previews are read-only until explicitly saved as planning assumptions.

Display confirmed and estimated obligations separately. Any Available after upcoming bills figure is explicitly a projection of eligible cash/bank/e-wallet balances, not an updated account balance. Exclude credit limits from cash available and avoid subtracting subscription bills twice from existing dashboard obligation totals.

Reuse the existing production reminder infrastructure. Add optional events for renewal/due/overdue, requested reading cadence, stale reading, expiry, configured price-increase threshold, budget crossing and cycle-ended-without-actual-bill. Existing due reminders are not duplicated. Deduplicate by service/cycle/event/threshold version and existing delivery window. Do not add another scheduler, AI service or external integration.

Exports: authenticated CSV for subscriptions, cycles/payments, readings/consumption and forecasts; neutralize spreadsheet formula prefixes in text cells and export decimal/date values without presentation formatting. Full database backup already includes new finance tables. General-purpose JSON import is not required for this feature.

## 9. API and implementation boundaries

New authenticated endpoints live below `/api/v1/finance/subscriptions/`:

- list/create and detail/update;
- summary, forecasts and export;
- lifecycle action with effective boundary;
- prices and tariffs;
- cycles, confirm/amend actual bill, pay and eligible-expense candidates;
- meters, readings, reading corrections and meter events;
- appliances and read-only estimate previews;
- history/analytics.

Use existing session/CSRF authentication, PrivateMixin, pagination, strict serializer fields and field-level validation. No public links or new authorization roles. Paginate reading/payment histories and bound forecast ranges. State-changing GETs must never post money, generate snapshots or send notifications; existing safe obligation materialization remains idempotent.

Calculations live in `finance/services/subscriptions/` modules for eligibility, lifecycle/recurrence, tariffs, readings, predictions, payments, summaries/forecasts and appliances. API serializers/views live in a focused `finance/api/subscriptions/` package. Keep tariff inversion and reading calculations independent of Django/UI where practical.

Frontend orchestration lives in a Bills view plus feature-scoped subscription components/forms and detail view. Reuse existing request/refresh hooks, confirmation patterns, summary tiles, chart primitives, account selectors, modal shell, copy/export controls and Smokey feedback. Do not introduce dependencies by default.

All successful mutations invalidate detail, service list, cycle summary and affected finance overview. Failed requests retain user input and show inline errors. Prevent double-submit; retain operation IDs across uncertain network retries. Use a revision or updated_at precondition for edits to cycle configuration, rates and readings so stale forms cannot overwrite newer changes.

## 10. Migration and compatibility

Use additive migrations only. Preserve all existing records and identifiers. One-to-one constraints prevent duplicate service profiles and cycle attachments.

Backfill eligible recurring expense schedules with a service profile. Fixed/variable comes from existing schedule flags; do not guess a provider, utility unit, meter, reading, budget, tariff or historical consumption from a name. Suggest Electricity/Water setup in the UI when useful, but require explicit configuration.

Backfill existing eligible deadlines as cycle shells with unknown consumption boundaries when those boundaries were never stored. Keep their known due dates and amounts. For each legacy settled expense, attach an allocation to that same transaction. Never infer a paid date from migration time. Report inconsistent legacy records for review rather than changing their financial status.

Existing inactive schedules map to paused metadata without retroactively deleting/suppressing obligations. Only an explicit lifecycle action applies a future exclusion boundary. Do not reactivate cancelled/paused services during ordinary reads.

Continue supporting legacy schedule/deadline API callers. Prevent schedule changes from bypassing subscription lifecycle, price history or paid-cycle restrictions once a schedule has a service profile. Avoid recursive delegation between legacy and subscription services.

Local migration application requires separate permission. Production Neon migration, deployment and pushes require a separate explicit request; prior deployment approvals do not apply to this feature.

## 11. Design direction and interaction states

Mode: Operate. Extend the established dashboard, not its portfolio/retro visual language. Preserve white surfaces, slate text, cobalt controls, Instrument Sans, existing radii, Lucide icons and shadcn/Radix semantics. Dials: DESIGN_VARIANCE 3, MOTION_INTENSITY 2, VISUAL_DENSITY 6.

Mobile layouts stack summaries, lists and charts, use touch-friendly actions and preserve readable meter values. Desktop overview charts may use equal columns below records. Draw progress using existing components; warning color always accompanies a numeric overage and explicit status text. Missing baselines use the existing white tooltip with black text rather than long tile paragraphs.

Required states: no services, existing generic utility awaiting setup, no meters/readings/rate/budget, stale reading, invalid chronology, tariff configuration error, unconfirmed bill, partially paid, overdue, fully paid, paused/cancelled/archived, pending request, stale-edit conflict and retryable network failure. Each state has an icon, useful explanation and a relevant next action. No invented historical values or animated fake loading progress.

## 12. Acceptance and validation plan

Acceptance scenarios, to be implemented as focused checks when testing is authorized:

1. Existing recurring bills appear once with original amounts, dates, accounts and payments; excluded financial schedules remain outside subscription management.
2. Card/table switching retains filters and view preference. Every service opens the correct dedicated page.
3. Readings 12,500 -> 12,535 -> 12,585 -> 12,640 show interval usage 35, 50 and 55 kWh. At PHP 11/kWh usage-only interval costs are PHP 385, 550 and 605. No cycle fee is repeated on each row.
4. One reading, zero elapsed time, missing rate, unknown boundary or incompatible units never create false consumption or divide-by-zero results.
5. Same-day readings at different times are allowed; duplicate timestamps require correction. Negative deltas require a validated explicit meter event. Backdated corrections validate both neighbors.
6. Flat/tiered/minimum/fee tariffs and budget inversion agree, including a budget below unavoidable fees. Rate changes preserve historical versions and paid amounts.
7. Unequal-length cycles compare per-day usage. No-history anomaly insights remain unavailable rather than invented. Stale data is labelled with its as-of date.
8. Confirming a bill preserves the prior prediction. A zero actual bill creates no zero-value expense. Corrections never lower the actual below paid amounts.
9. Full/partial payments, existing-expense links, duplicate retries and concurrent settlement requests post each expense once. Insufficient balance/credit rolls back everything.
10. The dashboard, calendar, reminder and generic transaction endpoints cannot bypass allocation safety or edit allocated financial history silently.
11. Pause/cancel/resume preserve past debt and paid history, suppress only eligible future obligations, and never backfill a paused gap without explicit action.
12. Monthly/yearly forecasts normalize frequencies correctly, enumerate actual due dates, exclude paid portions, distinguish unknown costs and never mutate balances.
13. Appliance planning does not add consumption or expense records. Multiple meters expose incomplete coverage honestly.
14. Export, finance audit entries and database backup include the appropriate source data without leaking credentials or other modules' records.
15. Existing one-off bills, tasks, coverage, loans, credit cards and financed assets retain their established settlement behavior.

Per project instructions, do not run tests, builds, lint/type checks or browser automation without an explicit request. A later implementation plan may name focused checks, but that is not permission to execute them. Review the changed source and document any unverified behavior. No dependencies, production changes or unrelated refactors are authorized by this spec.

## 13. Scope boundaries

Included: fixed/variable service management, price history, electricity/water/generic metering, multiple meters, explicit meter events, flat/tiered tariffs, fees, budgets, deterministic projections with saved accuracy comparisons, appliance planning, partial payments, CSV exports, configurable reminder integration and scenario forecasts.

Not included: FX, official tariff scraping, AI/ML services, OCR/smart-meter integration, automatic bill payment, public sharing, splitting one transaction between services, automatic mid-cycle rate proration, or automatic refunds. These exclusions do not prevent manual actual-bill confirmation or later extension.

Next gate: user reviews this written design. After approval, write the implementation plan and agree its execution method before changing application code.
