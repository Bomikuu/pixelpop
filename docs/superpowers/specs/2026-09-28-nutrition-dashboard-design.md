# Nutrition dashboard design

Date: 2026-09-28
Status: Ready for user review

## Intent and boundaries

Add a private Nutrition tab to the existing personal dashboard so a signed-in person can record a whole meal, see the day's calories and macros, and compare logged intake with a calorie target they set themselves. A meal can be entered manually or pasted in the agreed JSON shape. Weight is an optional dated log, not a daily obligation. Height is a single editable profile value.

This is descriptive tracking, not a prescribed diet or medical recommendation. Do not infer calorie needs, BMI, or a weight goal from height and weight. Do not fold Nutrition into the shared finance ledger, public pages, finance search, or financial summaries. Preserve the dashboard's existing light/cobalt operational design, controls, icons, and responsive behavior; add no UI dependency.

## Selected approach

Use normalized meal and meal-item records owned by a required Django user foreign key. Keep an owned Nutrition profile and sparse weight records alongside them. This is preferable to storing only a JSON blob: individual foods remain editable and their numbers can be summed and charted reliably. Nutrition can live in the existing Django finance app for the established authenticated API and frontend proxy, but its endpoints and queries are isolated from shared finance records.

## Data and ownership

- `NutritionProfile`: one per user; nullable height in centimeters and nullable positive daily calorie target in kcal. A missing target is displayed as "Set a target," not zero. Comparisons use the current target, labeled as such even when viewing a past day; target history and historical target lines are out of scope.
- `WeightEntry`: user, local date, positive weight in kilograms, optional note. At most one entry per user/date; entering weight for the same date edits that reading. No reading is required on any day.
- `Meal`: user, local date, free-text meal name, timestamps. There is no fixed Breakfast/Lunch/Dinner schedule and no limit of two meals per day.
- `MealItem`: parent meal, order, name, positive amount, unit, and nonnegative calories/protein/carbs/fat. Values are decimal numbers. A meal must contain at least one item. Meal and daily totals are derived from items so there is one source of truth.
- Dates use the dashboard's Asia/Manila local-day convention. A meal's chosen date is stored separately because the agreed JSON contains no date.

Every list, detail, create, update, delete, profile, weight, import, and summary operation uses the authenticated user as its owner filter. A guessed ID belonging to another user behaves as not found. No Nutrition endpoint is public or admin-only.

## Input and API behavior

Add authenticated Nutrition endpoints under the existing `/api/v1/finance/` prefix for profile, dated weights, meals, and a date-range summary. Follow the dashboard's session authentication and CSRF pattern. The frontend sends one meal with its items, rather than creating each food as an independent top-level entry.

The paste mode accepts the user's JSON shape: `meal_name`, `items[]` with `name`, `amount`, `unit`, `calories`, `protein`, `carbs`, `fat`, and optional `totals` with those four nutrients. The selected form date supplies the meal date. Validate parse errors, shape, empty names/items, invalid or negative numbers, nonpositive amounts, JSON over 64 KiB, more than 100 items, names over 160 characters, and units over 24 characters. Reject invalid input without saving any part of the meal. Parse into a preview before save. Calculate canonical totals from items; when a supplied total differs by more than 0.01 from the item sum, show the difference in the preview and save the calculated totals only after the user confirms. Manual entry uses the same validation and save path. Editing a meal can change its name, date, and items. Deletion requires confirmation.

API responses include the canonical meal totals and item details. JSON copying/export and bulk import are out of scope for this iteration.

## Dashboard experience

Add a **Nutrition** navigation entry and `/dashboard/nutrition` view, visually integrated with the existing dashboard. The main view defaults to today's local date and lets the user change days. Its first view shows calories eaten versus the self-set target (remaining or over target), protein/carbs/fat totals, and meal cards for that date. Cards show the meal name, item count, totals, and an expandable item breakdown with edit/delete actions. One Add meal dialog has Manual and Paste JSON modes, a chosen date, live calculated totals, a JSON preview/error state, and keyboard-accessible controls. Empty days invite adding a meal without implying failure.

A compact profile/settings area edits height and target. Weight can be logged for any selected date and browsed as dated readings. A seven-day trend ending on the selected date shows daily calories, the number of logged days, average calories over **logged days only**, macro breakdown, and a weight trend only at actual measurement dates. Unlogged dates are shown as gaps/no entry, never as zero intake or missed targets. No chart invents intermediate weight readings. Insight copy is factual and nonjudgmental; for example, "4 of 7 days logged" rather than a streak penalty. On narrow screens, cards/charts stack and the entry dialog remains usable without horizontal overflow.

## Error, privacy, and accessibility states

Use the dashboard's existing loading, empty, error/retry, dialog, toast, and focus patterns. Keep an unsaved draft visible after a failed save. Clear field-level validation helps correct JSON or manual entries. Deletion success updates the day and trend summaries. The Nutrition route stays behind the dashboard's existing login gate and retains private-route noindex handling. Nutrition data does not appear in public shared-bill pages or finance-only lists/search. Existing admin database backups will include Nutrition records because they back up the database; no new export destination is introduced.

## Verification and release

Run focused Django tests for per-user isolation (including guessed IDs), meal CRUD, atomic invalid imports, canonical totals, sparse weight dates, and logged-day-only averages. Run focused frontend tests for manual/JSON meal entry, mismatch preview, day navigation, empty states, and summary rendering where the project test setup supports them. Do **not** run a full build, per the user's instruction. Review the resulting UI against `PRODUCT.md`, `DESIGN.md`, and `DESIGN_GUIDELINES.md` and the existing dashboard; do not introduce a new visual style. Create an additive migration, but do not apply it to the user's personal database automatically.
