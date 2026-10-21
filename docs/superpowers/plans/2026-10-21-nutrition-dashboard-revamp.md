# Nutrition Dashboard Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. These execution skills are not installed in this session; do not install dependencies or skills as a side effect. If Native execution is chosen, follow this checklist directly and report that fallback.

**Goal:** Deliver the approved compact Nutrition dashboard, accurate independent analytics and account-synced meal reuse/weight goals without changing historical records.

**Architecture:** Keep NutritionView as the orchestration boundary and reuse existing meal/activity/setup dialogs and shared primitives. Extract daily presentation and report state into focused Nutrition components; add bounded, owner-scoped backend analytics/library endpoints and an additive migration for presets, weight goals and safe creation retries. Ship the core layout first, then analytics, then reuse features.

**Tech Stack:** Existing React 19, Vite, Tailwind, shadcn/Radix, Recharts, Django/DRF and Decimal; no new runtime dependency.

**Spec:** `docs/superpowers/specs/2026-10-21-nutrition-dashboard-revamp-design.md` (approved by the user on 2026-10-21).

## Native execution record · 2026-10-21

The user approved this plan and selected Native execution. No subagents were
dispatched. Implementation/source review is complete; unchecked runtime commands
below are deliberately **not executed**, not evidence of a failed test.

- [x] Task 1: progress/range/copy/goal/sort helpers and authored Node assertions (`5a12dc2`).
- [x] Task 2: consolidated daily overview, dedicated log panels and editing dialogs (`62d5cf8`).
- [x] Task 3: Decimal-based bounded analytics and authored API assertions (`364cc67`).
- [x] Task 4: independent analytics state, charts and sortable date navigation (`858ee43`).
- [x] Task 5: additive preset/goal/retry schema, owner-scoped APIs and authored tests (`bb975b2`).
- [x] Task 6: reviewed duplicates, historical foods, preset editing and stable draft keys (`d2a79b6`).
- [x] Task 7: coverage calendar, actual-weight goals and recorded-portion suggestions (`62f3397`).
- [x] Task 8: scoped source/design review, Graphify/JEV evidence and durable design notes.
- [x] Follow-up source corrections: sparse charts, last-page recovery, inline errors,
  zero-baseline comparisons, compact status hints and consistent tab-panel semantics.
- [ ] Execute focused tests, build or browser acceptance: not authorized.
- [ ] Apply `finance/0032_nutrition_presets_weight_goal.py` locally: requires approval.
- [ ] Push or deploy: not requested. Production and Neon remain unchanged.

The task-level lists below retain the original acceptance instructions. This
execution record distinguishes implemented source from unrun validation.

## Global Constraints

- Preserve existing records, setup requirements, manual calorie/macro targets, JSON entry, activity estimation, CRUD, validation, audit events and reminders.
- No AI integration, new styling dependency, production deployment or production migration is included.
- Daily date remains in the workspace header; do not duplicate the page title or date controls in content.
- Low layout variance (3/10), restrained state-transition motion (2/10), medium density (5/10); use the existing dashboard identity and shared controls.
- Missing food stays null, logged zero-calorie food stays recorded, activity-only days do not enter food/net averages, and weight plots use actual readings.
- Week, Month and Custom analytics have state independent of the daily selected date. Inclusive ranges are bounded to 366 days and comparisons use the immediately preceding equal-length range.
- All nested records and source lookups are authenticated-owner scoped; no GET, preview, selection or suggestion creates a meal.
- Keep local SQLite changes out of commits. Prepare an additive migration, but do not apply it locally or in production without explicit approval.
- No tests, builds or browser automation are authorized yet. Author the focused tests below, but leave execution unchecked until the user requests it. Commands listed as conditional are instructions for that later approval, not permission to run now.
- Do not push feature commits without a new request. Keep feature changes grouped for review.

## Review Focus

1. An activity-only day must show real burn without implying that the person consumed zero calories (Tasks 1, 3).
2. A late response for an older daily date/report must never replace the newly selected content (Tasks 2, 4).
3. Copying a meal must not retain its source date, ID or future timestamp (Tasks 1, 6).
4. A timed-out successful save retried with the same key must not create another meal, including concurrent retries (Task 5).
5. Empty, one-reading, weight-gain and already-reached goal states must remain useful without fabricated measurements or division by zero (Tasks 1, 7).

## File and interface conventions

Frontend feature files remain under `pixelpopup-frontend/src/features/personal-dashboard/`. Backend files remain under `backendv2/finance/`. New modules below are feature-specific, not replacements for shared UI or finance-wide architecture.

Use existing meal shapes (`id`, `date`, `datetime`, `meal_name`, ordered `items`, derived `totals`). Backend amounts are decimal strings. Frontend presentation models may convert validated decimal strings to numbers, but persisted totals remain server-derived.

New library pagination shape: `{count, page, page_size, results}`, default page size 20, maximum 50; query text at most 160 characters. Preset items use the same 1-100 item, 64-KiB payload and numeric limits as meals. Calendar responses contain real meal counts keyed by ISO date, not nutrition-completion judgments.

---

### Task 1: Extract deterministic daily, period and reuse helpers

**Files:**
- Create `pixelpopup-frontend/src/features/personal-dashboard/nutrition/dashboardModel.js`
- Create `pixelpopup-frontend/src/features/personal-dashboard/nutrition/dashboardModel.test.mjs`
- Reuse, do not replace, `pixelpopup-frontend/src/features/personal-dashboard/nutrition/model.js`

**Interfaces:**
- `deriveDailyOverview({summary, profile, basis})` returns primary calories/remaining/percentage/status, food status, three macro rows and nullable previous-day delta. `basis` is `food` or `net`.
- `resolveAnalyticsRange({period, anchor, start, end, today})` returns inclusive `{start, end, previousStart, previousEnd}` or field validation errors. `period` is `week`, `month` or `custom`.
- `copyMealDraft(source, destinationDate, nowIso)` returns `{date, datetime, meal_name, items}` without IDs; use Manila time and cap today's copied time to now. Presets have no source meal time and use the editor's normal date/time default.
- `weightGoalProgress({baseline, latest, target})` returns nullable percentage and actual baseline date; support either weight direction and an equal baseline/goal.
- `sortHistoryRows(rows, key, direction)` returns a copy, uses real date/numeric ordering, and places missing values last.

- [ ] Author Node assertions: unlogged food remains null; a logged zero meal has 0 food; 2000 food minus 250 activity produces 1750 net while food is still above an 1800 target; 99.99% is not labelled reached; fills stay within 0-100%.
- [ ] Author range assertions: week ending `2026-10-21` is `2026-10-15` through `2026-10-21`, comparison `2026-10-08` through `2026-10-14`; October through the 21st compares against September 10-30; leap-day, 366-day maximum, reversed and future-only ranges are handled.
- [ ] Author copy assertions: source ID/date removed, destination date retained, ordered foods unchanged, today's later clock capped, source not mutated. Author goal assertions for zero/one readings, gain/loss, equal baseline/goal and an already-passed goal.
- [ ] Implement helpers without changing the existing parser or nutrition formulas.
- [ ] Conditional verification: `node --test pixelpopup-frontend/src/features/personal-dashboard/nutrition/dashboardModel.test.mjs`; expected all named cases pass. Do not run without approval.
- [ ] Group commit: `refactor(nutrition): extract daily progress and reporting helpers`.

### Task 2: Ship the core daily dashboard with existing APIs

**Files:**
- Modify `pixelpopup-frontend/src/features/personal-dashboard/views/NutritionView.jsx`
- Refactor `pixelpopup-frontend/src/features/personal-dashboard/components/nutrition/NutritionDay.jsx`
- Refactor `pixelpopup-frontend/src/features/personal-dashboard/components/nutrition/NutritionSettings.jsx`
- Create `pixelpopup-frontend/src/features/personal-dashboard/components/nutrition/DailyNutritionOverview.jsx`
- Create `pixelpopup-frontend/src/features/personal-dashboard/components/nutrition/NutritionActivityPanel.jsx`
- Create `pixelpopup-frontend/src/features/personal-dashboard/components/nutrition/NutritionWeightPanel.jsx`
- Create `pixelpopup-frontend/src/features/personal-dashboard/components/nutrition/WeightDialog.jsx`

**Interfaces:**
- `DailyNutritionOverview({summary, profile, basis, onBasisChange})` consumes Task 1's overview model.
- `NutritionDay({date, meals, onAdd, onEdit, onDelete, onDuplicate, onSavePreset, onOpenLibrary})` becomes the dedicated meals section; keep optional reuse callbacks hidden until Task 6 wires them.
- `NutritionActivityPanel({date, activities, totalKcal, onAdd, onEdit, onDelete})` preserves activity data and provenance.
- `NutritionWeightPanel({date, weights, baseline, targetWeight, onLog})` shows actual as-of-date weight, delta and compact trend.
- `NutritionSettings({profile, open, onClose, onSaveProfile, restoreFocus})` is the target-editing dialog; goal field is enabled only after Task 5 extends profile persistence.
- `WeightDialog({date, reading, onSave, onDelete, onClose, restoreFocus})` preserves optional notes and existing delete confirmation.

- [ ] Move the current baseline and weight forms into the two dialogs using shared Dialog/Input/Label/Button components. Preserve required numeric validation, dirty/error/save behavior, and add save icons.
- [ ] Render the toolbar, one overview, meals-left/activity-and-weight-right tracking grid, then existing analytics. Stack the tracking panels on mobile. Keep Setup's mandatory first-run behavior intact.
- [ ] Retain the existing Add entry dropdown and give meals/activity/weight contextual actions. Keep food quantities/macros in expandable meal bodies; no hidden action button may toggle the parent disclosure unintentionally.
- [ ] Keep the abort/date guards already present in NutritionView; preserve drafts on failed saves, return focus to the originating action and refresh affected values after successful writes.
- [ ] Prepare manual acceptance cases for slow date changes, setup, JSON/manual meals, activity CRUD, target edits, weight notes/deletion, long food names and keyboard-only dialogs. No browser run yet.
- [ ] Group commit: `feat(nutrition): consolidate daily overview and contextual tracking`.

### Task 3: Add bounded analytics without breaking legacy summary routes

**Files:**
- Create `backendv2/finance/services/nutrition_analytics.py`
- Create `backendv2/finance/api/nutrition_analytics.py`
- Modify `backendv2/finance/api/urls.py`
- Create `backendv2/finance/tests/test_nutrition_analytics.py`
- Keep `backendv2/finance/services/nutrition.py` legacy response contracts intact.

**Interfaces:**
- `nutrition_analytics(user, start: date, end: date) -> dict` returns `{range, previous_range, current, previous, differences, days, weights}`.
- `current`/`previous` contain `logged_days`, `meal_count`, nullable nutrient `totals`, `average_calories`, `average_protein`, `average_carbs`, `average_fat`, `activity_kcal`, nullable `net_calories` and `average_net_calories`.
- `days` reuse existing `{date, logged, totals, activity_kcal, net_calories}` and add `meal_count`, `activity_count`; `weights` are actual readings inside the requested current range.
- Each comparable `differences[field]` is `{absolute, percentage}`; percentage is null without a positive previous value. ISO bounds accompany both periods.
- GET `/api/v1/finance/nutrition/analytics/?start=YYYY-MM-DD&end=YYYY-MM-DD` validates inclusive range, caps end to today in Manila, rejects invalid/future-only/>366-day requests, and uses PrivateMixin.

- [ ] Author Django tests with 100 and 300 food kcal on two dates plus 50 burn on one: food average `200.00`, net sum `350.00`, net average `175.00`. Add a third activity-only date with 80 burn: activity total becomes `130.00`, food/net averages do not change.
- [ ] Author tests for a zero-calorie meal, empty/current/previous ranges, exact equal-duration boundaries, leap-day, numeric strings, ownership isolation and invalid requests. Confirm changing profile targets leaves meal values unchanged.
- [ ] Implement range aggregation using Decimal and batched ORM queries. Do not use floats or fill unlogged meal days with zero; do not reinterpret zero activity as proof that no physical activity occurred.
- [ ] Add only the new route; retain existing summary/period-summary behavior and permissions.
- [ ] Conditional verification from `backendv2`: `.venv/bin/python manage.py test finance.tests.test_nutrition_analytics`; expected named cases pass. Not authorized to run yet.
- [ ] Group commit: `feat(nutrition): add accurate bounded analytics and period comparisons`.

### Task 4: Deliver independent analytics tabs and charts

**Files:**
- Refactor `pixelpopup-frontend/src/features/personal-dashboard/components/nutrition/NutritionInsights.jsx`
- Refactor `pixelpopup-frontend/src/features/personal-dashboard/components/nutrition/NutritionPeriodSummary.jsx`
- Create `pixelpopup-frontend/src/features/personal-dashboard/components/nutrition/NutritionCharts.jsx`
- Create `pixelpopup-frontend/src/features/personal-dashboard/components/nutrition/NutritionHistoryTable.jsx`
- Modify `pixelpopup-frontend/src/features/personal-dashboard/views/NutritionView.jsx`
- Modify only Nutrition's invocation in `pixelpopup-frontend/src/features/personal-dashboard/Dashboard.jsx` to pass `onDateChange={setNutritionDate}`.

**Interfaces:**
- `NutritionInsights({initialDate, profile, request, refreshKey, onOpenDay})` owns report `{period, anchor, customStart, customEnd}`, active tab and abortable analytics requests; initialize once from initialDate, not on every daily-date change.
- `NutritionPeriodSummary({data, profile})` renders four primary metrics, smaller secondary macro/logged-day values, comparisons and one calorie chart.
- `NutritionCharts({kind, days, weights, profile})` supports `calories`, `macros`, `activity`, `weight`; use current-target references and actual date values.
- `NutritionHistoryTable({rows, onOpenDay})` owns sort state and provides an explicit date action per row.

- [ ] Build Overview/Trends/History tabs with the existing tab design. Put Week/Month/Custom and report date/range controls in that section, not the workspace header.
- [ ] Wire Task 1 ranges to Task 3 analytics; include explicit current and comparison date labels and logged-day counts. Handle report errors/retry separately from daily tracking.
- [ ] Render separate food/activity series and a current food-target line; never connect missing food values. Tooltips show food, burn, net and remaining/over values. Weight points use date/time axes and actual dates; do not fabricate daily weights.
- [ ] Add sorting and date navigation in History; invoking onOpenDay changes the daily date only. History/Trends must not duplicate all Overview summaries.
- [ ] Prepare manual checks for range changes leaving daily date unchanged, daily changes leaving report bounds unchanged, report request races, empty/one-reading charts, legend/tooltips and mobile overflow.
- [ ] Group commit: `feat(nutrition): organize analytics into overview trends and history`.

### Task 5: Persist presets, target weight and safe save retries

**Files:**
- Modify `backendv2/finance/models.py`
- Create `backendv2/finance/migrations/0032_nutrition_presets_weight_goal.py` (recheck migration numbering before execution).
- Create `backendv2/finance/services/nutrition_library.py`
- Create `backendv2/finance/api/nutrition_library.py`
- Create `backendv2/finance/api/nutrition_library_serializers.py`
- Modify `backendv2/finance/api/nutrition_serializers.py`, `backendv2/finance/api/nutrition.py`, `backendv2/finance/api/urls.py`, `backendv2/finance/services/nutrition.py`, `backendv2/finance/services/audit.py`
- Create `backendv2/finance/tests/test_nutrition_library.py`

**Interfaces:**
- Add optional positive `NutritionProfile.target_weight_kg` and expose it through the existing profile serializer, not a separate settings store.
- Add `MealPreset(user, meal_name, created_at, updated_at)` and ordered `MealPresetItem(preset, position, name, amount, unit, calories, protein, carbs, fat)` using existing meal numeric validators and uniqueness of `(preset, position)`.
- Add `NutritionMealSave(user, request_id, signature, meal, created_at)`: UUID request key unique per user; nullable meal FK uses SET_NULL so deletion leaves a replay tombstone. No public ledger endpoint.
- `save_meal_once(user, request_id, signature, create_fn)` reserves/locks the key inside an atomic transaction; same key/signature returns the existing meal, mismatched payload or deleted result gives 409, and failures roll back reservation and meal together. Existing unkeyed clients keep normal behavior.
- History and foods GETs return the pagination contract above. Preset CRUD returns meal-compatible `{id, meal_name, items, totals}` without date/time. Calendar GET returns `{month, days: [{date, meal_count}]}` containing recorded dates only.
- Extend the existing daily summary with nullable `weight_baseline` (earliest actual reading on/before the selected date), leaving its existing keys unchanged.

- [ ] Author API/model tests: owner-only preset CRUD, item order and nutrition precision, independent preset snapshots, positive/null goal validation, historical meal invariance and safe field-limited audits.
- [ ] Author retry tests: replay same key/body returns the same meal and one added audit; changed body/key collision gives 409; deleted result cannot be recreated by replay; transaction failure leaves no partial meal/items/save record. Add a TransactionTestCase for simultaneous same-key requests on a backend that supports row locking; explicitly skip unsupported locking assertions on SQLite.
- [ ] Implement additive models/migration and typed preset serializers; reuse existing item validation and server-derived totals. Do not rename/move the existing finance models or erase meal rows.
- [ ] Register the five library/calendar routes from the spec and the preset detail route. Validate search/pagination/month inputs, scope every queryset to the owner, and preserve daily meal GET behavior.
- [ ] Add preset/profile goal audit fields and area mapping without exposing request keys or arbitrary request dictionaries. Make early/late weight baseline lookups respect the selected date.
- [ ] Conditional verification from `backendv2`: `.venv/bin/python manage.py test finance.tests.test_nutrition_library finance.tests.test_nutrition`; expected library and existing nutrition cases pass. Do not run or apply migration until authorized.
- [ ] Group commit: `feat(nutrition): persist meal presets weight goals and safe create retries`.

### Task 6: Connect duplicate, copy, food search and preset editing

**Files:**
- Modify `pixelpopup-frontend/src/features/personal-dashboard/components/nutrition/MealDialog.jsx`
- Create `pixelpopup-frontend/src/features/personal-dashboard/components/nutrition/MealLibraryDialog.jsx`
- Create `pixelpopup-frontend/src/features/personal-dashboard/components/nutrition/MealPresetDialog.jsx`
- Modify `pixelpopup-frontend/src/features/personal-dashboard/components/nutrition/NutritionDay.jsx` and `pixelpopup-frontend/src/features/personal-dashboard/views/NutritionView.jsx`

**Interfaces:**
- Extend MealDialog with optional `initialMealDraft` separate from `meal`: an edit has `meal.id`; a copy/new draft never does. Preserve manual/JSON modes and existing future-datetime normalization.
- `MealLibraryDialog({date, request, onChooseMeal, onChooseFoods, onClose, restoreFocus})` has Historical meals / Foods / Saved meals, paginated search and source labels; selection never posts a meal.
- `MealPresetDialog({preset, initialMeal, onSave, onDelete, onClose, restoreFocus})` edits a snapshot with existing item fields/parser and explicit Save/Delete controls.

- [ ] Wire Duplicate to Task 1 copyMealDraft and the selected date, then open a new MealDialog. Copy from another date and Use preset follow the same path.
- [ ] Build owner-scoped search/reuse dialogs with stale-response cancellation, pagination and contextual empty/error states. Keep source date and serving visible; do not deduplicate distinct foods by name alone.
- [ ] Wire Save as preset and preset edit/delete through their explicit form actions. Reuse individual foods by prepopulating an editable new meal, not auto-saving or silently changing their quantities.
- [ ] Generate one creation request ID per new draft; keep it stable across retries and return HTTP 409 conflicts visibly. Do not silently generate a fresh key after an uncertain network outcome. Existing meal edits stay PATCH requests.
- [ ] Prepare manual checks: selecting/cancelling does not save, copying to a past date respects that date, JSON changes still validate, retry preserves fields, preset edits do not alter old meals and delete confirmations return focus.
- [ ] Group commit: `feat(nutrition): add reviewed meal duplication and reusable meal library`.

### Task 7: Add calendar, weight goals and bounded suggestions

**Files:**
- Create `pixelpopup-frontend/src/features/personal-dashboard/components/nutrition/NutritionCalendarDialog.jsx`
- Create `pixelpopup-frontend/src/features/personal-dashboard/components/nutrition/NutritionSuggestions.jsx`
- Create `pixelpopup-frontend/src/features/personal-dashboard/nutrition/suggestions.js` and `suggestions.test.mjs`
- Modify NutritionView, NutritionDay, NutritionSettings, NutritionWeightPanel, NutritionCharts and NutritionHistoryTable in the paths already listed above.

**Interfaces:**
- `NutritionCalendarDialog({date, request, onOpenDay, onClose, restoreFocus})` consumes month coverage and disables future date selection.
- `rankMealSuggestions({totals, targets, candidates, limit = 3})` returns unchanged candidate portions, totals and gaps, sorted by normalized calorie/macro difference with stable ID/name tie-breaking. Evaluate only positive remaining targets; if no food is logged or food is already at/over target, return an empty result. Do not infer partial portions or new meals.
- Candidates come from saved presets and a bounded recent-food library response. Suggestions are labelled possible options, not a prescription or evidence that targets will be reached.

- [ ] Add the optional target-weight field to the targets dialog, use the real baseline/latest reading for goal progress and show the goal reference only when configured. Equal baseline/goal produces a stable reached/not-reached message without division by zero.
- [ ] Add a compact calendar action; mark logged days using meal counts, not achievement colors. Opening a day updates the daily date and leaves analytics unchanged.
- [ ] Author suggestion assertions: no-data/at-target/over-target returns no suggestion; candidates are never mutated; repeated names with distinct source IDs remain distinct; upper limits and tie-breaking are stable; result macros/calories equal the existing recorded portions.
- [ ] Display top daily calorie-contributing meals and macro gap/excess values with optional expansion. Suggestion selection opens the same reviewed meal draft from Task 6.
- [ ] Conditional verification: `node --test pixelpopup-frontend/src/features/personal-dashboard/nutrition/dashboardModel.test.mjs pixelpopup-frontend/src/features/personal-dashboard/nutrition/suggestions.test.mjs`; only after testing approval.
- [ ] Group commit: `feat(nutrition): add coverage calendar goals and recorded-food insights`.

### Task 8: Integrate and perform the permitted final review

**Files:**
- Modify `DESIGN.md` only to document the final Nutrition composition and persistence/calculation constraints.
- Create `.impeccable/surfaces/nutrition.md` with the concrete NutritionView target, related Nutrition components, Operate mode and the approved existing-world design contract.
- Review only the Nutrition source/tests/migration and the single Dashboard callback change.

- [ ] Check spec coverage against Tasks 1-7: setup/JSON/manual entries, all CRUD, numerical states, actual weights, owner scoping, presets, calendar, report independence, suggestions and retry handling are all reachable.
- [ ] Use Graphify's scoped local graph to review the changed Nutrition dependencies; do not rescan the whole repository or upload personal records. Use JEV only on sanitized UI-state descriptions, not real nutrition data, and describe any score as model judgment rather than verification.
- [ ] Perform source review for stale fetches, focus restoration, overflow classes, chart missing-value handling and API bounds. Keep actual tests/browser/build steps unchecked unless the user authorizes them.
- [ ] If testing is authorized, run only the focused commands recorded in owning tasks. If browser review is separately authorized, inspect desktop and mobile in one bounded pass plus at most one confirmation pass; no default full build or project-wide test suite.
- [ ] Record the migration filename and approval requirement. Do not apply it to local SQLite or Neon automatically, and do not stage `backendv2/db.sqlite3`.
- [ ] Group commit: `docs(nutrition): record redesigned tracking and reporting conventions`.

## Execution handoff

The spec and plan were approved and executed **natively**. Source changes are grouped in local feature commits. Tests, browser review, migration application, push and deployment remain separate, explicitly authorized steps.
