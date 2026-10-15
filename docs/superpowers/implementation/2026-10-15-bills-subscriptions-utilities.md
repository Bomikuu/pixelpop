# Subscriptions & utilities implementation

## Entry points

- `/dashboard/bills`: existing Bills due records, plus Subscriptions & utilities and Forecasts tabs.
- `/dashboard/bills?section=subscriptions`: searchable/filterable service catalog, cards/table preference, page-scoped bulk lifecycle actions and CSV export.
- `/dashboard/bills/subscriptions/:id`: selected bill, readings/meters, actual confirmation, partial/new/existing-expense payments, billing history, fixed prices, utility rates, appliance planning, comparisons and settings.
- `/api/v1/finance/subscriptions/`: private service API. Nested IDs are checked against the service.

## Implementation boundaries

RecurringSchedule remains recurrence authority; Deadline remains the obligation; Transaction remains actual spending. Migration 0031 creates linked subscription, cycle, tariff, meter, reading/event, allocation, appliance, prediction and service-event records. Historical backfill reuses existing expenses rather than posting another charge. No provider, meter readings, rates or consumption periods are invented.

Money uses backend Decimal arithmetic; reading/rate precision is six places. Flat/tiered charges, minima and fixed/per-unit/percentage fees share one evaluator and budget inversion. Projections use observation timestamps, with explicit coverage/source warnings. Unknown/reset/replacement gaps are not zero. Confirmation freezes its preceding prediction; later corrections do not rewrite paid bills.

Payment/lifecycle writes lock the workspace first. Payments then lock schedule, deadline/cycle, account and candidate expense. Exact financial replay precedes stale-revision rejection. Generic expense edits recheck allocations after locking, and linked payment history cannot be deleted. Fixed-price changes invalidate cycle revisions; archived services retain financial obligations. Known started periods survive a mid-cycle pause.

Legacy subscription-backed deadline actions route to the service page. The delegated payment endpoint requires an operation key and expected cycle revision; variable bills must be confirmed first. Direct legacy schedule edits are safely rejected with a Bills destination rather than silently bypassing price/lifecycle history. One-off bill and specialized card/loan/asset settlement branches remain separate.

Service-specific reading, budget, expiry, price and cycle-end alerts reuse production reminder dispatch. Claiming a service alert does not dismiss a checklist. CSV exports neutralize formula-like text and retain Decimal values. Full database backup continues to cover all database tables.

## Validation record

- Native implementation and one independent source review completed. Review findings and dispositions are recorded in `.impeccable/surfaces/subscriptions.md`.
- Authored backend checks: models, backfill, lifecycle, tariffs, readings, predictions, payments, finance integration, API scoping, forecasts, appliances, reminder claims/exports and PostgreSQL-only payment races.
- Authored Node checks: URL defaults/filter retention, explicit Manila datetime, scenario defaults and unknown/zero baselines.
- No test execution, builds, lint/typechecks or browser validation were authorized or run. Authored checks are not evidence of passing behavior. Full acceptance coverage and real PostgreSQL race/visual checks remain rollout prerequisites.
- Approved local target verified as SQLite at `/home/micxsz/projects/pixelpop/backendv2/db.sqlite3`. Migration command targeted finance 0031 and completed successfully.
- Consistent pre-migration backup: `/tmp/pixelpop-before-subscriptions-mmfplw9g/db.sqlite3`. Keep this backup until local behavior has been verified.
- The user's existing database modifications were retained. The SQLite file is never staged or pushed. No production migration/deployment/push occurred.

## Manual handoff

1. Open Bills, confirm the imported recurring services, and set utility types explicitly.
2. For a utility, add its actual meter and tariff, choose a bill, then set actual consumption boundaries and the applicable rate.
3. Record at least two readings at different timestamps. Confirm the provider's actual bill separately before payment.
4. Review account capacity, then make a partial payment or explicitly link an existing eligible expense. Linking does not debit again.
5. Review Forecasts as planning only; unknown costs and other spending are not included in its available-cash projection.

Production rollout is not part of this implementation. Request focused runtime checks before deployment, then separately authorize production migration and push.
