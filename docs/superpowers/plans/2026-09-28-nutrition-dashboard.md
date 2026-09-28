# Nutrition Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a private meal-based Nutrition tab with manual/JSON entry, self-set calorie target, sparse weight logging, and truthful daily insights.

**Architecture:** Four new user-owned Django models and isolated `/api/v1/finance/nutrition/` endpoints supply one dashboard view. The frontend reuses the authenticated dashboard request function, existing UI controls, and Recharts; meal totals are derived from items on the server, while a pure frontend parser previews JSON before submission.

**Tech Stack:** Django, Django REST Framework, SQLite/PostgreSQL-compatible migrations, React 19, Vite, Tailwind, Lucide, Recharts, Node's built-in test runner.

**Spec:** `docs/superpowers/specs/2026-09-28-nutrition-dashboard-design.md`

## Global Constraints

- Nutrition records have a required owner and never enter shared finance totals, finance search, or public pages.
- Dates follow `Asia/Manila`; weight entries are optional and sparse; missing intake is not zero.
- Current self-set target is labeled as current, including on historical days; do not calculate BMI or prescribe calories.
- JSON limit: 64 KiB; at most 100 items; names at most 160 characters; units at most 24; total mismatch threshold: more than 0.01.
- Preserve the existing dashboard visual system and add no UI dependency. Read `PRODUCT.md`, `DESIGN.md`, and `DESIGN_GUIDELINES.md` before UI edits.
- Run focused tests only; do not run a build or migrate the user's personal database.
- The worktree contains unrelated changes. Before each commit, inspect staged files and stage only this task's hunks; if clean separation is unsafe, leave the task uncommitted and report that rather than include someone else's changes.

## Review Focus

- A second user's guessed meal ID returns 404 and cannot mutate the first user's data (Task 3 test).
- A JSON payload with a valid first food and invalid second food leaves no partial meal (Task 3 test).
- A day with no meals is `null`/unlogged, not 0 kcal or an average denominator (Task 4 test).
- A pasted total off by more than 0.01 is called out before save; the server still derives its own totals (Tasks 3 and 5 tests).
- An optional weight date with no reading does not generate a zero point or interpolation (Task 4 test).

---

### Task 1: Owned nutrition models and migration

**Files:**
- Modify: `backendv2/finance/models.py`
- Create: `backendv2/finance/migrations/0012_nutrition.py` (depends on existing `0011_asset_financing`)
- Create: `backendv2/finance/tests/test_nutrition.py`

**Interfaces:** Produces `NutritionProfile(user, height_cm, daily_target_kcal)`, `WeightEntry(user, date, weight_kg, note)`, `Meal(user, date, meal_name, created_at, updated_at)`, and `MealItem(meal, position, name, amount, unit, calories, protein, carbs, fat)`; `Meal.items` is ordered by `position`. Profile and weight have unique `(user)` and `(user, date)` constraints respectively. Numeric food fields use decimal precision sufficient for two decimal places, with amount permitting three.

- [ ] **Step 1: Write failing model tests.** In `NutritionModelTests`, assert that the same user/date cannot have two weight rows and that a meal's items are returned in position order; assert owner FKs are non-nullable.
- [ ] **Step 2: Run the focused red test.** From `backendv2`, run `python3 manage.py test finance.tests.test_nutrition.NutritionModelTests -v 2`; expect missing models.
- [ ] **Step 3: Add the four models and additive migration.** Do not subclass the finance `Record` base because its owner is nullable. Use `DecimalField`, `MinValueValidator`, and database uniqueness; `MealItem` deletes with its meal.
- [ ] **Step 4: Rerun the Task 1 test command.** Expect pass in Django's disposable test database; do not run `migrate` against `backendv2/db.sqlite3`.
- [ ] **Step 5: Commit only clean Task 1 changes**, if they can be staged without existing user edits: `feat: add private nutrition models`.

### Task 2: Profile and sparse weight API

**Files:**
- Create: `backendv2/finance/api/nutrition_serializers.py`
- Create: `backendv2/finance/api/nutrition.py`
- Modify: `backendv2/finance/api/urls.py`
- Modify: `backendv2/finance/tests/test_nutrition.py`

**Interfaces:** `GET/PATCH nutrition/profile/` returns/updates nullable `height_cm` and `daily_target_kcal`; `GET nutrition/weights/?end=YYYY-MM-DD` returns readings through the requested date, newest first; `PUT/DELETE nutrition/weights/<YYYY-MM-DD>/` upserts/deletes that user's reading with `weight_kg` and optional `note`. All views use the existing `PrivateMixin` session auth, CSRF, and no-store response headers.

- [ ] **Step 1: Write failing API tests.** `NutritionProfileWeightApiTests` checks anonymous denial, nonstaff access, null target, positive values, same-date upsert rather than duplicate, another user's readings absent, and deletion scoped to owner.
- [ ] **Step 2: Run** `python3 manage.py test finance.tests.test_nutrition.NutritionProfileWeightApiTests -v 2` from `backendv2`; expect missing routes.
- [ ] **Step 3: Implement serializers, views, and routes** with owner taken from `request.user`, never a client field. Return 404 for missing or other-user weight dates.
- [ ] **Step 4: Rerun the Task 2 test command.** Expect pass.
- [ ] **Step 5: Commit only clean Task 2 changes**, if separable: `feat: add private nutrition profile and weight API`.

### Task 3: Atomic meal API and canonical totals

**Files:**
- Modify: `backendv2/finance/api/nutrition_serializers.py`
- Modify: `backendv2/finance/api/nutrition.py`
- Modify: `backendv2/finance/api/urls.py`
- Modify: `backendv2/finance/tests/test_nutrition.py`

**Interfaces:** `GET/POST nutrition/meals/?date=YYYY-MM-DD` lists/creates whole meals; `GET/PATCH/DELETE nutrition/meals/<int:pk>/` reads/replaces/deletes an owned meal. Write shape is `{date, meal_name, items:[{name,amount,unit,calories,protein,carbs,fat}], totals?}`. Read shape adds `id` and derived `totals` (`calories`, `protein`, `carbs`, `fat`), each decimal serialized as a string. Pasted `totals`, if present, are informational and never stored.

- [ ] **Step 1: Write failing meal tests.** `NutritionMealApiTests` checks two meals on one day, item ordering, canonical sum despite a forged `totals`, date/name/item edit, deletion, foreign-ID 404, >100 items, >160-character names, invalid negative/nonfinite numbers, and all-or-nothing validation when item 2 is invalid.
- [ ] **Step 2: Run** `python3 manage.py test finance.tests.test_nutrition.NutritionMealApiTests -v 2` from `backendv2`; expect missing routes.
- [ ] **Step 3: Implement nested meal validation and atomic save.** Validate the 64 KiB JSON request size, decimal limits and required names; replace item rows inside `transaction.atomic()` on PATCH. Scope `get_object` and list by `request.user`; serialize totals by summing item values, never from client `totals`.
- [ ] **Step 4: Rerun the Task 3 test command.** Expect pass.
- [ ] **Step 5: Commit only clean Task 3 changes**, if separable: `feat: add private meal CRUD`.

### Task 4: Truthful seven-day summary API

**Files:**
- Create: `backendv2/finance/services/nutrition.py`
- Modify: `backendv2/finance/api/nutrition.py`
- Modify: `backendv2/finance/api/urls.py`
- Modify: `backendv2/finance/tests/test_nutrition.py`

**Interfaces:** `nutrition_summary(user, end_date: date) -> dict`; `GET nutrition/summary/?date=YYYY-MM-DD` returns `date`, `day_totals`, `logged_days`, `average_calories`, `days` (seven `{date, logged, totals}` rows ending on the date), and `weights` (the latest ten real readings through the date). `day_totals` and an unlogged day's `totals` are `null`, not zero; an empty average is `null`. Values are decimal strings.

- [ ] **Step 1: Write failing summary tests.** `NutritionSummaryApiTests` checks one logged day among seven, correct 7-day average denominator, multiple meals aggregated on one day, day-with-no-meals null semantics, no fabricated weight point, Manila date boundary, and another user's meals/weights excluded.
- [ ] **Step 2: Run** `python3 manage.py test finance.tests.test_nutrition.NutritionSummaryApiTests -v 2` from `backendv2`; expect missing summary route.
- [ ] **Step 3: Implement `nutrition_summary` and the authenticated endpoint.** Build the seven local dates explicitly and aggregate only matching user-owned meals; fetch real weight rows through `end_date` without filling gaps.
- [ ] **Step 4: Rerun the Task 4 test command.** Expect pass.
- [ ] **Step 5: Commit only clean Task 4 changes**, if separable: `feat: summarize private nutrition records`.

### Task 5: JSON preview and frontend calculation helpers

**Files:**
- Create: `pixelpopup-frontend/src/features/personal-dashboard/nutrition/model.js`
- Create: `pixelpopup-frontend/src/features/personal-dashboard/nutrition/model.test.mjs`

**Interfaces:** `parseMealJson(text: string)` returns `{meal_name, items, calculatedTotals, suppliedTotals, mismatches}` or throws a field-readable error. `calculateTotals(items)` returns numeric calories/protein/carbs/fat rounded to two decimals; `mismatches` lists nutrients whose supplied total differs by more than 0.01. The chosen date stays outside the JSON.

- [ ] **Step 1: Write failing Node tests.** Assert the supplied example imports as one meal with three items, calculated totals reflect item sums, a >0.01 mismatch is reported, `0.01` rounding difference is accepted, malformed/oversized JSON and invalid second item fail without a partial result.
- [ ] **Step 2: Run** `node --test src/features/personal-dashboard/nutrition/model.test.mjs` from `pixelpopup-frontend`; expect a missing module.
- [ ] **Step 3: Implement the two pure helpers.** Enforce the same size/count/name/unit/numeric rules as the API; compare totals in integer hundredths to avoid floating-point threshold errors; do not accept the pasted totals as truth.
- [ ] **Step 4: Rerun the Task 5 test command.** Expect pass.
- [ ] **Step 5: Commit the two new files:** `feat: preview meal JSON safely`.

### Task 6: Integrated Nutrition dashboard view

**Files:**
- Create: `pixelpopup-frontend/src/features/personal-dashboard/views/NutritionView.jsx`
- Create: `pixelpopup-frontend/src/features/personal-dashboard/components/nutrition/MealDialog.jsx`
- Modify: `pixelpopup-frontend/src/features/personal-dashboard/Dashboard.jsx`
- Modify: `pixelpopup-frontend/src/features/personal-dashboard/styles/theme.css` only if existing Tailwind utilities cannot express a required chart/layout detail

**Interfaces:** `NutritionView({request})` calls the Task 2–4 endpoints with the dashboard's authenticated `request`; it manages its own nutrition refresh after writes, without refreshing finance totals. `MealDialog({open, meal, date, onClose, onSave})` supports manual items and JSON preview. The route is `/dashboard/nutrition`, shown under a Wellbeing navigation group; hide the irrelevant finance month/search controls on that route while preserving the shared header and login gate.

- [ ] **Step 1: Read the three design documents and inspect existing dashboard dialog/chart patterns.** Record a one-line design read and explicit variance/motion/density before editing. Preserve the light/cobalt operational style.
- [ ] **Step 2: Add the route and minimal view shell.** Confirm the Nutrition tab renders behind authentication with a selected local date, loading/error/retry, and no finance month control.
- [ ] **Step 3: Add meal cards and the manual/JSON dialog.** Show live totals, mismatch preview with explicit confirmation, item details, editing, and delete confirmation. Keep the draft on API failure and refetch nutrition-only data on success.
- [ ] **Step 4: Add target/profile, dated weight entry, seven-day calorie/macro chart, sparse weight chart, coverage and logged-day average.** Show gaps for unlogged days and avoid medical or judgmental language; stack content on narrow screens.
- [ ] **Step 5: Verify the integrated route without a build.** Run Task 5 Node tests and all `finance.tests.test_nutrition` Django tests. If local dev servers are already available, perform one browser smoke pass for manual and JSON entry, date navigation, responsive layout, and keyboard focus; otherwise source-review those flows and report that browser coverage was unavailable.
- [ ] **Step 6: Review the exact diff and commit only separable task-owned hunks**, if safe: `feat: add nutrition dashboard`; do not stage pre-existing dashboard edits wholesale.
