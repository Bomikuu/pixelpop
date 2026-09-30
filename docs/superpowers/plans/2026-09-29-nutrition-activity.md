# Nutrition Activity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This task will execute natively in the current session because the user asked to implement now and project instructions disallow subagents for this work.

**Goal:** Log exercise/activity in Nutrition with weight-based burn estimates or manually entered active kcal, and show food, activity, and net distinctly.

**Architecture:** An additive user-owned Django activity model and authenticated endpoints compute and snapshot estimates. Existing day and period summary services incorporate activity while preserving food-only macros and missing-meal gaps. React adds an activity dialog/list and an overlapping progress visualization without changing the self-set calorie target.

**Tech Stack:** Django REST Framework, React 19, Tailwind CSS, existing shadcn-style UI components.

**Spec:** `docs/superpowers/specs/2026-09-29-nutrition-activity-design.md`

## Global Constraints

- All dates use Asia/Manila; future activities are rejected.
- Walking steps represent a specific session, not all-day steps.
- Estimate additional active kcal as `max(MET - 1, 0) × weight_kg × duration_minutes / 60`, rounded to two decimals; use 100 steps/minute only when walking duration is absent.
- Keep the food target fixed and food/macros separate from activity and net; activity-only days do not imply zero food.
- No new UI dependencies, no database migration applied to the user's local database, and no automated tests/builds unless the user asks.

## Review Focus

- Activity-only date: summary keeps food and net null, but reports burn.
- Weight edited later: old estimate and weight snapshot remain unchanged.
- Manual override: editing unrelated fields does not recalculate active kcal.
- Cross-user ID: detail mutation returns 404.
- Prior-day surplus: uses net only when food is logged; copy names the basis.

---

### Task 1: Activity storage and estimation API

**Files:** Modify `backendv2/finance/models.py`, `backendv2/finance/api/urls.py`; create additive migration, `backendv2/finance/services/activity.py`, and `backendv2/finance/api/activity.py`; extend `backendv2/finance/tests/test_nutrition.py` only if testing is explicitly requested.

**Interfaces:** `estimate_active_kcal(activity_type, duration_minutes, steps, weight_kg)` returns `(Decimal kcal, Decimal duration, Decimal met, str method_version)`; activity list/detail serializers return ID, date, type/name, steps, duration, active kcal, source, estimate inputs and timestamps. Endpoints: `/nutrition/activities/` and `/nutrition/activities/<int:pk>/`.

- [x] Add `NutritionActivity` and migration with user ownership and saved estimate metadata.
- [x] Add strict serializer validation and server-side estimation using the latest weight on or before the date.
- [x] Add user-filtered GET/POST and GET/PATCH/DELETE endpoints; keep edits and deletes private.
- [x] Review migration and endpoint code for date bounds, input caps, snapshot stability, and cross-user isolation. Do not execute tests or apply migration.

### Task 2: Day and period arithmetic

**Files:** Modify `backendv2/finance/services/nutrition.py`; extend `backendv2/finance/tests/test_nutrition.py` only if testing is explicitly requested.

**Interfaces:** Existing `nutrition_summary(user, end_date)` and `nutrition_period_summary(user, selected_date, period)` gain per-day `activity_kcal` and nullable `net_calories`, plus period activity/net totals and averages on food-logged days only.

- [x] Aggregate activity by Asia/Manila date without converting missing food to zero.
- [x] Preserve existing food/macronutrient response fields and target comparisons.
- [x] Review activity-only, no-activity, and mixed-date arithmetic in source; do not run tests unless asked.

### Task 3: Activity entry and daily visualization

**Files:** Modify `pixelpopup-frontend/src/features/personal-dashboard/views/NutritionView.jsx`, `components/nutrition/NutritionDay.jsx`, `components/nutrition/CalorieProgress.jsx`; create `components/nutrition/ActivityDialog.jsx` and small activity helper if needed.

**Interfaces:** `ActivityDialog` accepts `activity`, `date`, `weight`, `onSave`, `onClose`; NutritionView loads activities by selected date and handles create/edit/delete; `CalorieProgress` accepts food `calories`, `activityCalories`, and fixed `target`.

- [x] Add activity list, entry dialog with estimate/manual modes and provenance, delete confirmation, and focused save/error states.
- [x] Render labeled food, activity, and net plus overlapping bar with visible food endpoint and reduced-motion behavior.
- [x] Keep macro tiles food-only and adapt prior-day reminder to net when activity exists.
- [x] Inspect source for responsive, focus, empty, and activity-only states; do not use browser automation unless asked.

### Task 4: Week, month, and overall views

**Files:** Modify `pixelpopup-frontend/src/features/personal-dashboard/components/nutrition/NutritionPeriodSummary.jsx`; adjust `NutritionInsights.jsx` only if its prop contract needs it.

**Interfaces:** Consume Task 2's added activity/net fields; food rows and charts remain available, activity/net are separate labeled values.

- [x] Add period activity/net summary values and day/month table/chart affordances while retaining food gaps and macro totals.
- [x] Ensure activity-only dates do not enter food average denominators.
- [x] Review the diff for a11y, source consistency, and scope; no build or automated tests unless asked.
