# Nutrition activity tracking design

Date: 2026-09-29
Status: Ready for user review

## Intent and boundaries

Extend the private Nutrition tab so Miku can log activity, estimate additional calories burned, or enter that burn manually. Keep the existing self-set daily food target fixed. Show food intake and activity separately, plus a clearly labeled estimated net (`food kcal - active kcal`). For example, 1,800 kcal of food and 250 kcal of activity show 1,550 kcal net while still showing that food reached the 1,800-kcal target. This is tracking, not a prescription or a calculation of total daily energy balance.

The approved step input represents a **specific walking session**, not the phone's all-day step count. No wearable integration, automatic step import, calorie-target changes, workout plans, or financial-ledger entries are in scope. Preserve the dashboard's existing visual system and Nutrition navigation.

## Selected approach and estimation

Store each activity as a dated, user-owned record. Offer two entry modes in one dialog:

1. **Estimate:** choose walking (steps, optional actual duration) or another supported activity (duration). Use the latest weight reading on or before the activity date. Show the calculated burn before save and mark it as estimated.
2. **Enter manually:** choose an activity name and enter *active* calories burned. For an estimated entry, allow replacing the estimate with a manual figure; retain that it was manually overridden.

Use a small, versioned table of activity MET values drawn from the [2024 Adult Compendium of Physical Activities](https://pmc.ncbi.nlm.nih.gov/articles/PMC10818145/): moderate walking (3.8 MET), running, cycling, swimming, and strength training, each with a specific labeled intensity and source code. Walking is the only steps-based preset; the other presets use duration. Custom activities use manual kcal. For walking steps without a supplied duration, approximate duration at 100 steps/minute, explicitly labeled as an assumption; actual duration takes precedence. Estimate **additional active kcal** as `max(MET - 1, 0) × weight_kg × duration_minutes / 60`, rounded to two decimals. Subtracting the resting 1 MET avoids treating energy the body would use at rest as activity burn. The 100-step cadence is a rough heuristic, not an individualized speed measurement ([walking cadence review](https://pubmed.ncbi.nlm.nih.gov/28459099/)). Do not claim device-grade precision. If there is no prior weight reading, disable estimation with a clear prompt to log weight or enter active kcal manually.

Persist the resulting kcal, estimation method/version, MET, assumed or actual duration, and weight used. Later weight edits do not silently rewrite historical activity. Editing an entry recalculates only when estimation inputs change and the entry remains in estimate mode. A manual override remains unchanged until the user edits it.

## Data, API, and validation

Add an additive `NutritionActivity` model and migration in the existing Django finance app, isolated from financial records. Fields cover owner, Asia/Manila local date, activity type/name, optional walking-session steps, optional duration, active burn kcal, source (`estimated` or `manual`), and the snapshot inputs/method needed to explain the estimate. Keep created/updated timestamps. Use the existing authenticated, user-filtered Nutrition API pattern:

- `GET/POST /api/v1/finance/nutrition/activities/?date=YYYY-MM-DD`
- `GET/PATCH/DELETE /api/v1/finance/nutrition/activities/<id>/`

Reject future dates, steps outside 1–100,000 per walking session, duration outside 1–1,440 minutes, active kcal outside 0.01–10,000, unsupported estimate types, and missing required estimate inputs. A guessed activity ID from another user returns not found. Manual mode requires explicit active kcal; estimate mode computes it on the server so the frontend preview cannot become the authoritative value. Return field-level errors without dropping the form draft. Deletion requires confirmation. Activity records are included in existing database backup by virtue of the additive model; do not apply the migration to the user's local database automatically.

## Daily experience

Add an Activity area in the Nutrition day view with Add activity, compact dated activity rows, estimate/manual provenance, and edit/delete actions. Show steps for walking and duration where recorded. An activity-only day must not imply that zero food was eaten; food and net remain unknown until a meal is logged.

Keep the current Calories tile and its warning based on **food intake**, not net. Add visible activity-burn and net values nearby. In the existing progress control, blue food fill reaches the food-intake position and a distinct activity color overlays the rightmost portion corresponding to burn; the food endpoint/target marker remains visible. Labels and accessible text explicitly state food, activity, net, and fixed target, including when food exceeds the track. Color alone never carries meaning. The bar animates only when values change and respects reduced motion. Estimated burn is described as approximate, and the UI notes that a daily target may already reflect usual activity, so net is not a precise deficit.

The existing optional previous-day surplus reminder uses **net** only when both food and activity are known; with no activity logged it uses food as before. Its wording explicitly names net when activity contributed. Macro totals remain food-only. Existing meal entry, JSON import, target setup, and weight recording do not change.

## Weekly, monthly, and overall summaries

Extend the existing summary responses and views with daily and period activity-burn totals and nullable net intake. Preserve existing food totals and the rule that unlogged food days are gaps, not zeroes. Activity-only dates can appear in the activity history but do not become food-logged days or enter average food/net intake denominators. On days with meals and no activity entry, net equals food intake. Add separate activity-burn and net figures to period tiles, charts, tooltips, and tables without replacing existing food or macro data. Keep current-target comparisons labeled as comparisons with today's configured target, including historical views.

## Accessibility, privacy, and verification

Use existing shadcn-style dialogs, controls, icons, toasts, focus-return behavior, loading/error/empty states, and responsive Nutrition composition. Inputs and the progress visualization require explicit labels and keyboard access. Private-route auth, CSRF, and noindex behavior remain unchanged; activities never appear on public pages.

Implementation review should check the estimate formula and rounding, user isolation, future-date and invalid-input handling, manual overrides, activity-only days, and day/period summary arithmetic. Do not run automated tests or a full build unless the user asks, per project instructions. Review the frontend against `PRODUCT.md`, `DESIGN.md`, and `DESIGN_GUIDELINES.md` before completion.
