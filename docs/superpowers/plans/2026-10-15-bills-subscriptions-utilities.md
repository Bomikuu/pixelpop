# Bills, Subscriptions and Utility Consumption Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend Personal Dashboard Bills with recurring service management, daily utility readings, trustworthy forecasts and safe partial payments.

**Architecture:** Keep RecurringSchedule as the recurrence authority, Deadline as the obligation and Transaction as actual spending. Add linked service/cycle/meter/tariff/allocation records, with calculation and orchestration services isolated in a subscription package. Extend the existing dashboard and financial entry points rather than creating another ledger.

**Tech Stack:** Existing Django/DRF, Decimal, SQLite locally/PostgreSQL in production, React 19/Vite, Tailwind 4, owned shadcn/Radix components, Lucide and Recharts. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-15-bills-subscriptions-utilities-design.md` (approved 2026-10-15).

## Global Constraints

- Use PHP only initially. Do not introduce exchange rates or currency conversion.
- Keep this inside Bills, not a second top-level financial module.
- Estimates never change balances. Actual payments use the existing financial ledger, capacity checks and duplicate protection.
- No application code, schema or production data changes are authorized by approval of this plan alone; execution-method confirmation is the next gate.
- Do not run tests, builds, lint/type checks or browser automation without an explicit request. Test steps below authorize writing focused checks during implementation, not executing them. Mark execution-dependent results unverified when permission is absent.
- Local migration application requires separate permission. Production Neon migration, deployment and pushes require a separate explicit request.
- Never stage `backendv2/db.sqlite3`, environment files or credentials. Preserve unrelated work. No unrelated refactoring.
- Preserve existing dashboard styling: DESIGN_VARIANCE 3, MOTION_INTENSITY 2, VISUAL_DENSITY 6. Four primary tiles below overview tabs; records before charts; neutral zero values; icons on save actions.
- Keep variable estimates, confirmed bills, payment-date expenses and normalized planning equivalents separate. Decimal strings at API boundaries; Decimal calculations in Python; PHP ROUND_HALF_UP to two decimal places.
- Preserve specialized task, coverage, loan/card, cash-loan and asset-financing settlement behavior. No additional scheduler, AI service, automatic payments or automatic refunds.
- The named Superpowers execution skills in the header are unavailable in this session's skill catalog. Do not pretend to invoke them or install anything silently. Native execution can follow this approved checklist directly, using available required skills; disclose the fallback.

## Review Focus

### Execution record · 2026-10-15

- [x] Native implementation of schema, calculation/payment services, API/reminder integration and Bills/service UI (Tasks 1–14).
- [x] Focused backend/Node checks authored; not run. PostgreSQL race checks are separate and skipped outside an authorized PostgreSQL test database.
- [x] One independent source review; all six reported material findings corrected.
- [x] Local SQLite target verified, backed up and finance migration 0031 applied after separate user approval.
- [ ] Runtime verification: focused tests, PostgreSQL concurrency and desktop/mobile browser checks require a later request. The granular acceptance assertions below are not marked passed without execution.
- [ ] Production rollout: neither Neon migrations, deployment nor Git push performed.

Implementation/evidence notes: `docs/superpowers/implementation/2026-10-15-bills-subscriptions-utilities.md`. Surface preservation pre-flight and hook disposition: `.impeccable/surfaces/subscriptions.md`.

1. Two tabs submit payment against the same remaining balance: one posting wins, and an exact retry returns its allocation rather than debiting again (Task 7).
2. A subscription is paused after recurrence already generated future deadlines: future excluded periods disappear consistently, but old unpaid debt remains visible (Tasks 3 and 8).
3. A user corrects a reading before an already paid period: usage projections refresh, but the paid amount and finalization snapshot do not change (Tasks 5 and 6).
4. A tiered tariff's unavoidable fees exceed the budget: no negative usage recommendation, division by zero or misleading remaining allowance (Task 4).
5. Browser back/month navigation and a stale edit race with another mutation: filters/drafts remain recoverable, and stale data cannot overwrite newer facts (Tasks 9, 10 and 12).

## Execution and validation conventions

Implement tasks in order. Each task has an independently reviewable deliverable. Tests use Django's existing test settings and test framework; frontend pure helpers use the existing Node test style, without adding a runner. When test execution is authorized, run the backend checks from `backendv2` through `.venv/bin/python manage.py test <named-module> --settings=finance.tests.settings`, substituting only the task's named module. Never turn these into a full-suite/build run.

Each task ends with a source review against its listed assertions. Track tests as written/not run until execution is requested. At native completion, request one independent whole-feature source review if the user approves that execution method; do not claim visual verification without actual authorized browser evidence. Do not dispatch per-task agents under native execution.

Group related task changes into coherent local commits during execution: schema/backfill, calculation engine, payment/lifecycle integration, API/reminders, Bills management UI, utility detail/forms. Do not push or apply migrations automatically. A commit containing the schema must not claim the feature is ready for production before the dependent services/API/UI tasks are complete.

## File and interface map

- Modify `backendv2/finance/models.py` only for new finance models/constraints; preserve existing model layout.
- Create `backendv2/finance/services/subscriptions/`: `__init__.py`, `eligibility.py`, `catalog.py`, `cycles.py`, `lifecycle.py`, `tariffs.py`, `readings.py`, `predictions.py`, `payments.py`, `summaries.py`, `forecasts.py`, `appliances.py`, `notifications.py`, `exports.py`.
- Create `backendv2/finance/api/subscriptions/`: `__init__.py`, `serializers.py`, `views.py`, `urls.py`.
- Modify existing finance `api/urls.py`, `api/views.py`, `api/serializers.py`, `services/recurrence.py`, `services/settlements.py`, `services/summaries.py`, `services/charts.py`, `services/audit.py` and `services/reminder_delivery.py` only at subscription integration points.
- Create focused subscription tests under `backendv2/finance/tests/` as named in tasks. No edits to unrelated legacy tests.
- Create `views/BillsView.jsx` and an initially read-only `views/SubscriptionView.jsx` within `pixelpopup-frontend/src/features/personal-dashboard/`; extend the latter with interactive utility forms in Task 12.
- Create frontend `components/subscriptions/` for management/detail components and `components/subscriptions/forms/` for separate feature forms. Reuse `components/forms/FormModalShell.jsx`, `FormField.jsx`, `SelectableField.jsx`, `AccountBalancePreview.jsx`, `SummaryTiles.jsx`, `Charts.jsx` and existing UI primitives; do not extend the central formDefinition/FormDialog switch.
- Create frontend `subscriptions/api.js`, `subscriptions/model.js`, `subscriptions/model.test.mjs`. Paths below are relative to the personal-dashboard feature unless prefixed with backendv2.
- Modify `Dashboard.jsx`, relevant existing bill/transaction record renderers and existing settlement form only to route subscription details/actions to the new feature. Keep `/dashboard/bills` and generic bill APIs compatible.

### Task 1: Linked schema and reusable fixtures

**Files:** Modify `backendv2/finance/models.py`; create `backendv2/finance/migrations/0031_subscriptions_utilities.py`, `backendv2/finance/tests/subscription_fixtures.py`, `backendv2/finance/tests/test_subscription_models.py`. Confirm the next unused migration number before creating the migration; never overwrite another migration.

**Interfaces:** Add Subscription, SubscriptionPrice, SubscriptionCycle, Meter, MeterReading, MeterEvent, UtilityTariff, SubscriptionPaymentAllocation, UtilityAppliance, PredictionSnapshot and SubscriptionEvent with the fields in spec section 4. Fixtures expose `SubscriptionFixturesMixin.make_service(variable=False, **overrides)` returning `(subscription, schedule, deadline, cycle)` plus `make_cash(balance)` using existing BalanceAdjustment records, not a fake stored balance field. Extend ReminderDelivery additively with `kind` (checklist default/subscription), validated `payload` JSON and a service phase choice; existing delivery rows retain checklist behavior.

- [ ] Write model checks: duplicate schedule profile, deadline cycle, meter/timestamp, payment transaction or request ID raises IntegrityError; historical FK deletion raises ProtectedError; invalid period bounds fail validation.
- [ ] Implement models and migration operations. Reading/rate precision is six decimal places; money is 14,2; reading 20,6 and rate 18,6. Mutable Subscription, SubscriptionCycle, Meter and MeterReading expose integer revision starting at 1. Subscription has validated `planning_assumptions` JSON for explicitly saved scenario presets. Use distinct related names, including `Deadline.subscription_cycle` and `Transaction.subscription_allocation`.
- [ ] Keep historical consumption bounds nullable in pairs; validate start < end when provided. Store cycle exclusion reason/time without changing Deadline status choices. Tariff configuration uses validated JSON with Decimal-string values, not JSON floats.
- [ ] Review migration dependency and constraint names. Do not apply the migration yet. When authorized: `cd backendv2 && .venv/bin/python manage.py test finance.tests.test_subscription_models --settings=finance.tests.settings` must pass only the named module.

### Task 2: Eligibility, profiles and historical backfill

**Files:** Create `services/subscriptions/eligibility.py`, `catalog.py`, `cycles.py`; extend migration 0031 before it is applied; create `tests/test_subscription_backfill.py` (all backend paths).

**Interfaces:** `eligible_schedules(queryset) -> QuerySet`; `ensure_subscription(schedule) -> Subscription`; `ensure_cycle(deadline) -> SubscriptionCycle`; `save_subscription(subscription_id, data, actor, expected_revision=None) -> Subscription`. Consume Task 1 models; create/update ordinary recurrence through existing schedule fields.

- [ ] Write checks: a fixed bill, variable bill and coverage-linked ordinary expense are included; task/reminder/income/card repayment/loan collection/financing are excluded; a legacy paid bill retains the exact Transaction PK/amount/date and gains one allocation; a second ensure call creates no duplicate.
- [ ] Implement eligibility using kind, settlement_kind and actual relationships, never provider/name guessing. Existing inactive schedules become paused metadata without rewriting historical obligations.
- [ ] Backfill profiles/cycle shells and settled-expense allocations using historical migration models and the schema editor's database alias. Preserve existing amounts, due dates and identities. Label an imported fixed price as the current known price effective at migration time, not proof of a price throughout the schedule's past. Do not invent meters, tariff, provider, consumption boundaries or readings.
- [ ] `save_subscription` atomically edits the linked schedule and service metadata; creates an initial effective-dated fixed price where applicable; rejects non-PHP input and stale revision with a recoverable conflict. New eligible schedules created by legacy API callers also receive profiles via the catalog service.
- [ ] Review backfill data provenance, including inconsistent settled records: return/report a review warning, never post an expense or change paid state to repair it. Authorized check command: `manage.py test finance.tests.test_subscription_backfill --settings=finance.tests.settings` via the backend venv.

### Task 3: Cycles, prices and lifecycle

**Files:** Implement `services/subscriptions/cycles.py`, `lifecycle.py`; modify `services/recurrence.py`, schedule serializer integration; create `tests/test_subscription_lifecycle.py`.

**Interfaces:** `set_cycle_period(cycle_id, start, end, billing_date, actor, expected_revision) -> SubscriptionCycle`; `set_price(subscription_id, amount, effective_date, actor, expected_revision) -> SubscriptionPrice`; `change_lifecycle(subscription_id, action, effective_date, actor, next_start=None, request_id=None) -> Subscription`; `change_lifecycle_many(ids, action, effective_date, actor, request_id) -> list[Subscription]`; `visible_obligations(queryset) -> QuerySet` in eligibility.py.

- [ ] Write checks: monthly Jan 31 recurrence clamps correctly; six-month interval works through existing recurrence; future price changes leave confirmed periods unchanged; pause suppresses only unconfirmed/unpaid eligible future periods, preserving an old overdue and partially paid cycle; resume never fills the paused gap.
- [ ] Attach cycle shells while the existing bounded materializer generates recurring deadlines. Fixed prices use the effective version applicable to that cycle. Do not add a second recurrence loop or generate unlimited rows for forecasts.
- [ ] Require explicit consumption-cycle setup for utility projections. Legacy/future unknown boundaries stay unknown. The UI may propose a next period from the previous end and configured cadence, but the user must confirm those dates before they become measured-cycle boundaries. Reject overlapping explicit periods.
- [ ] Lifecycle actions lock consistently, save events, maintain schedule.active, and mark exclusion on already generated future cycles. Bulk changes allow at most 100 explicit IDs, process IDs in ascending order in one transaction, and derive per-service UUID operation keys from the bulk key; one invalid target rolls back all. Archive changes list visibility only; historical service deletion is rejected. Enforce existing coverage restrictions rather than rewriting the coverage subsystem.
- [ ] Review eligible-obligation predicate: include all non-subscription obligations and all non-excluded subscription cycles. Authorized check: `manage.py test finance.tests.test_subscription_lifecycle --settings=finance.tests.settings`.

### Task 4: Exact tariff evaluation and budget inversion

**Files:** Create `services/subscriptions/tariffs.py`, `tests/test_subscription_tariffs.py`; extend `services/subscriptions/catalog.py` for tariff-version persistence.

**Interfaces:** `validate_tariff(config: dict) -> dict`; `calculate_tariff(usage: Decimal, config: dict) -> dict`; `usage_allowance(budget: Decimal, config: dict) -> dict`; catalog's `save_tariff_version(subscription_id, data, actor, expected_revision) -> UtilityTariff`. Configuration keys: `flat_rate`, `tiers` (`up_to`, `rate`), `minimum_usage_charge`, `charges` (`name`, `kind`, `amount`, `base`). Charge kinds fixed/per_unit/percent; percentage base usage/subtotal. Results expose Decimal `usage_charge`, `fee_total`, `total`, itemized `lines`; allowance exposes nullable Decimal `usage_limit` and a reason code.

- [ ] Write assertions: `calculate_tariff(Decimal('35'), flat_11)['total'] == Decimal('385.00')`; flat 11 plus fixed 100 plus 10% subtotal for 100 units totals 1320.00; two bands 0-10 at 5 and remaining at 8 charge 90.00 for 15 units.
- [ ] Add review-focus check: budget 50 with unavoidable fee 100 returns no feasible allowance; missing rate is unknown, not 0; a fully zero tariff reports no finite usage-based limit; reject NaN/Infinity, malformed decimals, overlapping tiers and negative fees.
- [ ] Implement Decimal parsing/limits, explicit line rounding and monotonic tariff evaluation. Minimum charge precedes fixed/per-unit fees; percentages use the named base and do not compound. Distinguish interval usage-only costs from full-cycle charges. Persistence adds immutable effective-dated versions and rejects overlaps; applying a different version to an open cycle requires explicit preview/confirmation and never changes confirmed history.
- [ ] Invert the same tariff function with bounded Decimal search to six-decimal usage precision; never return a usage limit that exceeds the peso budget after rounding. Authorized check: `manage.py test finance.tests.test_subscription_tariffs --settings=finance.tests.settings`.

### Task 5: Timestamped meter readings and explicit meter events

**Files:** Create `services/subscriptions/readings.py`, `tests/test_subscription_readings.py`.

**Interfaces:** `save_meter(subscription_id, data, actor, meter_id=None, expected_revision=None) -> Meter`; `save_reading(meter_id, data, actor, expected_revision=None) -> MeterReading`; `record_meter_event(meter_id, data, actor) -> MeterEvent`; `reading_intervals(meter_id) -> list[dict]`; `cycle_consumption(cycle_id) -> dict`. Interval output: endpoints, elapsed_days, measured/estimated/unknown quantities, provenance and warnings; preserve Decimal values internally. A meter with readings is deactivated through its active end, not deleted.

- [ ] Write checks for 12500 -> 12535 -> 12585 -> 12640 producing 35/50/55; two timestamps on one day work; exact duplicate timestamp conflicts; future timestamp rejects; lower ordinary reading rejects; a configured modulus 1000 with explicit rollover 990 -> 10 yields 20.
- [ ] Validate create/correction against both adjacent readings under a meter lock. Exact retries reuse their operation key; conflicting retries fail. Record correction before/after facts and increment revision. Unknown reset/replacement gaps are never assigned zero usage.
- [ ] Compute actual elapsed time and half-open cycle coverage. Boundary interpolation is off by default, requires the service setting, and returns estimated provenance without generating fake reading rows. Sum compatible meters while exposing missing coverage.
- [ ] Preserve confirmed financial amounts on reading correction; identify affected cycles internally for prediction invalidation while save_reading still returns the saved reading. Authorized check: `manage.py test finance.tests.test_subscription_readings --settings=finance.tests.settings`.

### Task 6: Deterministic predictions, budgets and insight provenance

**Files:** Create `services/subscriptions/predictions.py`, `tests/test_subscription_predictions.py`.

**Interfaces:** `predict_cycle(cycle_id, as_of=None, scenario='normal', usage_multiplier=Decimal('1')) -> dict`; `snapshot_prediction(cycle_id, actor, reason) -> PredictionSnapshot`; `budget_insight(cycle_id, prediction) -> dict`; `confirm_cycle(cycle_id, actual_amount, actor, expected_revision, reported_consumption=None) -> SubscriptionCycle` in cycles.py.

- [ ] Write assertions: 140 units over 14 observed days in a 31-day period projects 310, then 3410.00 at rate 11; advancing today without a fresh reading does not dilute the observed daily average. One reading yields no current-cycle consumption rate.
- [ ] Use the current-cycle average first, otherwise the last three comparable completed cycles weighted by measured days. Unknown target boundaries cannot produce an exact usage projection. Expose model/version, source/as-of, coverage and warning flags. Limited coverage applies below seven days or 25% of the cycle.
- [ ] Implement budget inversion through Task 4, signed overage text, capped progress and non-negative remaining daily allowance as-of the latest reading. Zero/missing budget or elapsed/remaining days never causes division by zero.
- [ ] Derive anomaly warnings only with the required historical baseline and editable threshold initially 25%. Preserve raw comparison values; no invented attribution. Snapshot meaningful mutation inputs with unique input fingerprint; GET prediction stays read-only. Wire snapshot capture into reading/tariff/cycle mutation orchestration once these services exist, preserving the frozen finalization snapshot after corrections.
- [ ] Confirmation saves its prior prediction; explicit amendments retain prior confirmation and require actual >= allocations. Zero actual closes Nothing due without a transaction. Check reading correction after a paid period leaves its amount and finalization snapshot unchanged. Authorized check: `manage.py test finance.tests.test_subscription_predictions --settings=finance.tests.settings`.

### Task 7: Allocation-based partial payments and safe legacy delegation

**Files:** Create `services/subscriptions/payments.py`; modify `services/settlements.py`, `api/serializers.py`; create `tests/test_subscription_payments.py`.

**Interfaces:** `pay_cycle(cycle_id, data, actor) -> SubscriptionPaymentAllocation`; `payment_candidates(cycle_id, params) -> QuerySet`; `cycle_payment_state(cycle_id) -> dict` with Decimal actual/paid/remaining plus derived state.

- [ ] Write checks: actual 1000, payments 400+600 create two expenses and remaining 0; replay of either request creates none; changed payload with the same key rejects; expense link reuses its Transaction without changing account balance; an expense cannot belong to two cycles; insufficient cash/credit fully rolls back.
- [ ] Use lock order workspace -> schedule -> deadline/cycle -> accounts sorted by PK -> candidate expense. Check exact replay before revision/remaining-balance rejection and after waiting for locks. Preserve the request key across network retries; require it on new payment operations.
- [ ] Keep variable bills unpayable until actual confirmation. Fixed payment approval may confirm the applicable full fixed price inside the same operation. Distinguish full bill amount from partial payment amount, reject payment > remaining, and reject zero/future payments.
- [ ] Existing-expense linking consumes the whole eligible ordinary expense, never re-debits/re-categorizes it, and rejects conflicting specialized links. Require confirmation of displayed metadata differences. Audit account/date/amount and operation identity.
- [ ] In `settle_deadline`, perform a nonlocking subscription lookup/delegation before the legacy deadline row lock, so lock order cannot reverse. Keep non-subscription branches unchanged. Generic transaction edit/delete guards include `subscription_allocation`.
- [ ] Add TransactionTestCase concurrency scenarios for an authorized PostgreSQL test database: concurrent 700+700 against 1000 permits one; concurrent exact replay produces one allocation. Do not claim SQLite validates production row locks. Authorized focused command: `manage.py test finance.tests.test_subscription_payments --settings=finance.tests.settings` (PostgreSQL race checks require separate test DB configuration, never Neon production).

### Task 8: Unified finance summaries and obligation visibility

**Files:** Create `services/subscriptions/summaries.py`; modify `services/summaries.py`, `services/charts.py`, `api/views.py`, relevant deadline serialization; create `tests/test_subscription_finance_integration.py`.

**Interfaces:** `subscription_summary(month) -> dict`; `subscription_analytics(subscription_id, start, end) -> dict`. Reuse visible_obligations and cycle_payment_state; expose actual/estimated/unknown fields separately.

- [ ] Write checks: a partial cycle contributes only its remainder to unpaid totals and its actual payments to paid totals; an excluded future cycle appears nowhere in dashboard attention/calendar/Bills, while old debt still appears; a subscription payment appears once in account history and total spending.
- [ ] Apply the shared visibility predicate to ordinary obligation queries in deadline API, overview, charts and calendar. Adjust paid/unpaid aggregation for allocation-backed cycles without changing financing/cash-loan formulas.
- [ ] Return typed summaries for four primary tiles, compact secondary metrics, due-month obligations and payment-date spending. Previous-month badges require a comparable non-zero baseline. Distinguish unknown actuals from numerical zero.
- [ ] Supply previous cycle/year, 3/6/12-month/custom analytics, per-day usage comparisons, price histories and saved prediction errors. Expose rate-versus-usage attribution only when data supports it. Authorized check: `manage.py test finance.tests.test_subscription_finance_integration --settings=finance.tests.settings`.

### Task 9: Private API, strict inputs and revision conflicts

**Files:** Create `api/subscriptions/{__init__,serializers,views,urls}.py`; include URLs from `api/urls.py`; integrate legacy schedule serializer writes; create `tests/test_subscription_api.py`.

**Interfaces:** PrivateMixin + existing finance request contracts. Responses serialize Decimal strings and revision integers. Paths below are relative to `/api/v1/finance/subscriptions/`.

- [ ] Write checks: unauthenticated access denied; non-PHP and unknown fields reject; cross-service cycle/meter IDs reject; stale expected_revision returns 409 with a refresh/review message and leaves data unchanged; GET preview never creates transactions or prediction snapshots.
- [ ] Add root list/create, `<id>/` retrieve/update, `summary/`, `<id>/analytics/`, `<id>/history/`, `<id>/lifecycle/`, `bulk-lifecycle/`, `<id>/prices/`, `<id>/tariffs/`, `<id>/cycles/`, and `<id>/cycles/<cycle_id>/confirm|pay|payment-candidates/` routes. Keep collection routes before integer detail routes. Forecast/appliance routes are wired in Task 10 after their services exist.
- [ ] Add nested meters/readings/meter-events routes with service ownership-of-reference validation; route every mutation through Tasks 2-7 services. Require expected_revision for updates to mutable existing facts and operation keys for financial/lifecycle events.
- [ ] Bound pagination to existing finance limits, forecast horizons to 12 months, history date ranges to valid supported years, and all preview inputs before calculations. Return field errors for recovery; avoid leaking raw database exceptions. Authorized check: `manage.py test finance.tests.test_subscription_api --settings=finance.tests.settings`.

### Task 10: Scenario forecasts and appliance planning

**Files:** Create `services/subscriptions/forecasts.py`, `appliances.py`, `tests/test_subscription_forecasts.py`, `tests/test_subscription_appliances.py`; wire their preview endpoints in API package.

**Interfaces:** `forecast_obligations(start, end, scenario='normal', multiplier=None) -> dict`; `estimate_appliances(subscription_id, cycle_id, drafts=None) -> dict`; `save_appliance(subscription_id, data, actor, appliance_id=None) -> UtilityAppliance`; `save_forecast_assumptions(subscription_id, scenario, multiplier, actor, expected_revision) -> Subscription` in catalog.py. Previews are read-only and return provenance, unknown counts, decimal strings after API serialization. Saved per-service scenario presets never silently replace Normal calculations or actual bills.

- [ ] Write assertions: weekly 1200 normalizes to 5200.00/month but actual due-month forecast enumerates real occurrences; annual prices do not become 12 annual charges; a materialized deadline and its schedule occurrence count once; paid portions are removed from remaining obligations.
- [ ] For unknown future utility boundaries, use labelled historical billed-cost estimates when available, never claim measured consumption. Normal/high/low/custom adjust variable usage only (+20%/-20% initial scenario controls); fixed fees/prices remain unchanged. List unknown costs explicitly.
- [ ] Write appliance assertion: 1000 W * 8 hours * 30 days * quantity 1 yields 240 kWh. Reject hours >24, impossible days, fractional/zero quantity and non-finite watts. Combine estimates without adding readings or spending; allocate/show tiered-cost caveats and charge fixed fees once.
- [ ] Return current/next/3-month/12-month forecast buckets and optional projected available cash, excluding funds/credit capacity and duplicate existing obligations. Wire `forecasts/`, nested appliance collection/detail, tariff/appliance preview and per-service planning-assumptions endpoints only after these services exist. Authorized checks: the two named test modules via manage.py and finance.tests.settings.

### Task 11: Bills management UI and subscription routing

**Files:** Modify frontend `Dashboard.jsx`; create `views/BillsView.jsx`, read-only `views/SubscriptionView.jsx`, `subscriptions/api.js`, `subscriptions/model.js`, `subscriptions/model.test.mjs`, `components/subscriptions/{SubscriptionList,SubscriptionCard,SubscriptionTable,SubscriptionSummary,SubscriptionHeader,BillingHistory,ForecastView}.jsx`, `components/subscriptions/forms/SubscriptionForm.jsx`.

**Interfaces:** `BillsView({dashboard, month, openForm, notify, ...existingActions})`; section query values `due|subscriptions|forecasts`. `subscriptionsApi(dashboard)` wraps existing request/mutate; no new session or fetch client. `SubscriptionList` receives one server results payload regardless of card/table choice.

- [ ] Define Node assertions for query serialization: unknown section falls back to due; restoring view preference accepts only cards/table; changing view preserves category/search/month. Authorized command from frontend: `node --test src/features/personal-dashboard/subscriptions/model.test.mjs`.
- [ ] Route `/dashboard/bills/subscriptions/:id` to a working read-only SubscriptionView with its header and billing history while keeping Bills navigation active; Task 12 adds type-specific interactions. Preserve existing deadline links and the shared header calendar/search/month controls. Do not rebuild or rename the sidebar.
- [ ] Compose existing Bills RecordList for due records, new service list for management and an initial read-only ForecastView displaying real returned forecast buckets. Task 13 adds scenario controls/analytics; do not import components before they exist. Place tabs above overview tiles, records above graphs, and preserve existing add actions on one-off bills.
- [ ] Implement search/filter/sort/pagination and localStorage card/table preference defensively. Fixed/variable/utility cards use relevant actions and explicit estimate badges; no fabricated provider logos. Grouped confirmations cover pause/resume/archive but never bulk payment.
- [ ] SubscriptionForm uses the shared modal/fields and existing account selection/balance previews. Reuse existing bill presets and category records, accept custom provider text, show required markers and inline numeric validation, and retain drafts on error. Fixed subscriptions do not show meter fields.

### Task 12: Service details, utility forms and mutation feedback

**Files:** Extend `views/SubscriptionView.jsx`, `components/subscriptions/{SubscriptionHeader,BillingHistory}.jsx`; create `components/subscriptions/{UtilityOverview,ReadingHistory,ConsumptionProgress,PriceHistory,ApplianceList,SubscriptionSettings}.jsx`; separate forms `MeterReadingForm.jsx`, `MeterEventForm.jsx`, `TariffForm.jsx`, `ConfirmBillForm.jsx`, `SubscriptionPaymentForm.jsx`, `ApplianceForm.jsx`. Adapt existing bill settlement action to open the subscription payment/confirmation form when applicable.

**Interfaces:** `SubscriptionView({subscriptionId, dashboard, month, notify, ...existingActions})`; each form accepts `{record, dashboard, onSaved, onCancel}` with required service/cycle context. Server calculation DTOs supply all money/progress/insight values; JS arithmetic never decides a ledger amount.

- [ ] Implement type-dependent tabs: fixed overview/billing/price/settings; utilities overview/readings/billing/settings; electricity additionally appliances. Header actions sit in one menu. Unknown utility type requests explicit setup rather than inferring a meter/rate.
- [ ] Reading input defaults to Manila now with selectable date/time, decimal-safe format validation and future rejection; show clear duplicate-timestamp and neighboring-reading errors. Meter replacement/reset/rollover is a separate explicit action, not a checkbox that silently changes a negative reading.
- [ ] Render interval consumption/usage-only cost, measured/estimated boundaries, as-of date, stale/limited data, actual-versus-projected amounts, tariff fee breakdown and budget allowance. No missing denominator means no invented progress bar. Use backend preview requests for tariff/appliance drafts and discard stale responses.
- [ ] Separate actual-bill confirmation from variable payment; reuse account tiles, available-balance previews, payment candidates and remaining-balance display. Keep request IDs on retry and disable double-submit. Keep inline field errors plus exact success/error feedback through Smokey; refresh dependent views on success.
- [ ] Add checks in model.test.mjs that stale responses cannot replace newer drafts and date conversion retains explicit +08:00 time. A 409 retains typed values and offers reload/review, never automatic overwrite. Browser Back/month changes preserve query state and use existing dirty-form confirmation.
- [ ] Apply Impeccable/frontend engineering guidance during implementation; run Design Taste's applicable preservation pre-flight as source review. No browser, visual tests or builds unless explicitly authorized; if authorized, one desktop/mobile inspection batch and at most one confirmation batch.

### Task 13: Forecasts and analytics UI

**Files:** Extend `components/subscriptions/ForecastView.jsx`; create `components/subscriptions/{SubscriptionCharts,PredictionAccuracy}.jsx`; extend `subscriptions/api.js` and model.test.mjs only for feature contracts.

**Interfaces:** `ForecastView({dashboard, month, notify})`; `SubscriptionCharts({analytics})`; `PredictionAccuracy({snapshots})`, using Task 8/10 DTOs and existing Recharts/shadcn primitives.

- [ ] Add assertions for rendering models: 0 actual/unknown actual differ; missing/zero comparison baseline yields no percentage; high/low defaults serialize as 1.2/0.8, not inferred currency multipliers.
- [ ] Implement explicit scenario controls and horizons, read-only previews, separate confirmed/estimated/unknown buckets and a visible statement that balances are not changed. Per-service settings offer Save planning assumptions through the Task 10 endpoint; global scenario previews do not persist and cannot silently alter Normal projections.
- [ ] Show per-cycle usage/payment trends, daily-normalized comparisons, rate changes and prediction accuracy below the records. Offer accessible table alternatives and the specified date ranges; never label an interpolated quantity as recorded.
- [ ] Reuse the four-primary/compact-secondary tile pattern and neutral zero styling. Comparison prose names whether it is comparing due-month bills, payment dates or consumption cycles. No new visual system or unnecessary assets/dependencies.

### Task 14: Reminder events, audit, exports and final compatibility review

**Files:** Create `services/subscriptions/notifications.py`, `exports.py`, `tests/test_subscription_reminders_exports.py`; modify `services/reminder_delivery.py`, `api/reminders.py`, `services/audit.py`, subscription API routes and feature export actions. Extend frontend `hooks/useReminders.js`, create `components/subscriptions/SubscriptionAlertsDialog.jsx`, and compose it in Dashboard.jsx without changing the existing checklist dialog. Update the feature's implementation notes and approved surface brief without rewriting global design identity.

**Interfaces:** `subscription_reminder_events(actor, as_of) -> list[dict]` with unique service/cycle/event/threshold-version key, destination URL and message; `export_subscriptions(kind, params) -> HttpResponse` for catalog/cycles/readings/forecasts CSV. Existing production dispatch/delivery infrastructure remains the scheduler.

- [ ] Write checks: repeated dispatch does not repeat the same event/window; existing due reminders are not duplicated; excluded future cycles do not notify; claiming a subscription alert cannot acknowledge an unrelated checklist or older different alert; local production-only push guard remains enforced; a CSV text value starting with =,+,-,@ is neutralized while numeric negative values retain numeric meaning.
- [ ] Integrate configurable reading/budget/expiry/price/cycle-end events with the existing dispatcher, retaining the production guard, signature verification and enrolled-recipient eligibility. Dispatch subscription events even when no daily checklist slot is due. Store a bounded allowlisted message/destination payload in subscription-kind deliveries; hash event identity into slot_key within its 80-character limit. Budget crossings deduplicate per cycle/threshold version; configured cadence windows apply only to explicitly recurring reading/overdue reminders.
- [ ] Pending/claim APIs return the delivery kind plus the appropriate checklist or alert payload. A subscription claim acknowledges only that delivery. A checklist claim may supersede older checklist deliveries only, preserving current checklist behavior without dismissing other event types. useReminders branches by kind; SubscriptionAlertsDialog presents linked actionable records without treating them as checkable/completed tasks. Keep the existing push delivery_id payload and subscription authentication unchanged.
- [ ] SubscriptionEvent records meaningful changes; expose subscription/cycle/reading/allocation fields in the audit allowlist without credentials or raw provider payloads.
- [ ] Add authenticated, filtered CSV exports for catalog, cycles/payments, readings/consumption and forecasts; full backup needs no new table allowlist because it snapshots the whole configured DB. API previews/export calls never mutate balances.
- [ ] Review spec acceptance scenarios 1-15 against completed tasks, including legacy schedule edits, one-off bill settlement, coverage association, loan/card/cash-loan/asset exclusions, partial amounts in all summaries and stale dirty forms. Record unexecuted checks honestly rather than running unrelated suites.
- [ ] If testing is explicitly authorized, run only the new finance.tests.test_subscription_* modules enumerated in this plan and the Node model module. Expected: all selected checks pass; PostgreSQL concurrency and browser checks remain separately identified if not run. Do not run production migrations, deployments, a full build or a full test suite.
- [ ] Ask separately for local migration application once implementation is source-reviewed; if authorized, target the new finance migration on verified local SQLite only. Production rollout waits for a later explicit request. End with a concise feature summary, pending permissions and verification limitations.

## Handoff and self-review

Coverage: schema/history (1-3), tariffs/budgets/meters/prediction (4-6), financial integrity (7-8), APIs/concurrency contracts (9), forecasts/appliances (10), Bills/detail/forms (11-12), charts/scenarios (13), reminders/audit/exports/compatibility (14). Every spec acceptance scenario maps to these tasks; the five Review Focus cases each have an owning check above.

Shared contracts are defined once and consumed by later tasks: eligibility/visibility in Task 2/3; money calculation in Task 4; consumption in Task 5; prediction in Task 6; payment state in Task 7; summaries in Task 8; API serialization in Task 9. Do not create parallel calculations in UI or per-page query shortcuts.

Plan review and execution-method selection are required before application implementation. Recommended method: Native, because schema, recurrence, predictions and payments share tightly coupled invariants and retaining one implementation context reduces conflicting assumptions. No tests are authorized by that method selection alone.
