# Nutrition dashboard revamp

Status: proposed design for review; not implemented.

## Intent and boundaries

Make daily food intake, remaining calories, macros and meals immediately understandable without scrolling past infrequently used forms. Detailed analytics should be available without displacing daily work.

The approved direction is the existing Personal Workspace design, not a new visual identity. Reuse its Tailwind styling, Instrument Sans typography, white surfaces, cobalt actions, Lucide icons, numeric fields, shadcn/Radix dialogs and tabs, and Recharts wrappers. Keep header breadcrumbs and selected-date navigation; do not add another oversized page title or another date control in the content.

The user confirmed that reusable meal presets and optional target weight must persist in Django and work across devices. Preserve existing records, setup requirements, manual calorie/macro targets, JSON entry, activity estimation, CRUD, validation, audit events and reminders. No AI integration, new styling dependency, production deployment or production migration is included.

Design read: a compact daily tracking workspace for one person, within the existing dashboard. Operate mode; low layout variance (3/10), restrained state-transition motion (2/10), medium density (5/10). Code-first refinement of existing components; generated mockups are not needed to establish a different visual style.

## Current implementation and reuse

- `views/NutritionView.jsx` fetches profile, daily meals, activities and summary, owns CRUD dialogs and refreshes after saves.
- `components/nutrition/NutritionDay.jsx` combines summary tiles, calorie progress, activity and meals in a single panel.
- `NutritionSettings.jsx` permanently displays baseline and weight forms together.
- `NutritionPeriodSummary.jsx` combines period tabs, tiles, a table and charts; the week uses the daily summary date.
- `NutritionInsights.jsx` adds a separate weight chart and table.
- `MealDialog.jsx`, `ActivityDialog.jsx`, `NutritionSetup.jsx`, existing numeric validation and `nutrition/model.js` remain the entry foundations.
- `Dashboard.jsx` owns `nutritionDate` and renders `NutritionDateControls`; preserve other modules that use those controls.
- Backend `finance/api/nutrition.py`, `nutrition_serializers.py`, `services/nutrition.py` and nutrition models already provide user-scoped records and Decimal totals.

Split orchestration and presentation into focused Nutrition components. Do not rewrite shared form primitives or unrelated dashboard modules.

## Daily layout

1. A compact toolbar with target summary, Edit targets and the existing Add entry dropdown. Daily date remains in the workspace header.
2. One full-width Daily nutrition overview, not separate calorie/macro cards.
3. A desktop two-column tracking area: meals about two thirds; activity and weight stacked in the remaining third. Stack meals, activity and weight on narrow screens.
4. Nutrition analytics underneath, with Overview / Trends / History tabs and its own reporting controls.

### Overview

- Food calories are the default primary value. Show consumed, daily target, remaining or over-target amount and completion percentage.
- An explicit Food / Net switch changes the primary calorie display. Net is food minus logged active burn, not estimated total energy expenditure. Retain food-target status in net mode so activity does not hide a food-target crossing.
- Protein, carbohydrate and fat each show consumed grams, manual target, percentage and a slim progress indicator inside the same overview.
- Status text accompanies color: below target, approaching (90% to below 100%), target reached (100%), above target. Percentages must not round an incomplete target to a misleading completed state.
- Clamp visual fills to their track; keep actual values above 100% and negative net values visible. Explain when logged activity exceeds logged food rather than rendering a negative-width bar.
- With no meals, show a no-food-logged state, not a confirmed zero-calorie day. A genuinely logged zero-calorie meal remains a recorded entry.
- Compare with yesterday only when both days have meals. Show a numerical delta and the basis (food or net); no invented baseline or divide-by-zero percentage.
- Preserve existing surplus-reminder behavior as secondary information, without changing the user's daily target.

### Targets and weight dialogs

Edit targets opens the shared dialog shell with height and calorie, protein, carbohydrate and fat targets. Add optional target weight here. Preserve numeric validation and inline errors; buttons include icons. A successful save refreshes overview and analytics without changing stored meals, activities or weights.

Continue to label historical target references as comparisons with current targets. This work does not introduce historical target versions or retroactively recalculate saved food quantities.

Log weight opens a separate compact dialog for the selected date, weight and optional notes. Preserve updating/deleting that date's existing reading and deletion confirmation. Weight is still optional after initial setup.

### Meals

- A dedicated Meals section shows the selected date, meal count and total food calories. Use Today's meals only for today.
- Each entry shows its name, time, calories and protein; expansion exposes foods, serving quantities and all nutrition values.
- Retain editing and deletion. Put less frequent actions in an accessible entry menu: Duplicate and Save as preset.
- Duplicate, Copy from another date and Use preset open an editable MealDialog draft. Never save just by selecting an entry.
- A meal-library dialog supports searching historical meals and food names, inspecting the source date, choosing a meal or individual food items, and choosing a saved preset.
- Copying preserves source quantities and nutrition values but not source IDs or creation timestamps. The destination is the selected daily date. Resolve the meal time explicitly in the draft and retain existing future-date/time restrictions and Manila timezone rules.
- Add meal remains contextual. Empty states are short and actionable.

### Activity and weight side sections

Activity shows total logged active burn, the individual sessions and contextual Add activity. Retain edit/delete controls and manual-versus-estimated labels. Do not change the burn formula, assumed pace or weight lookup.

Weight shows the latest actual reading on or before the selected day, its date, change from the previous actual reading and Log weight. Show a compact sparkline only with at least two readings; one reading gets a value, not a large empty chart. Historical dates must not display later measurements as if already known.

An optional goal line uses the user's stored target weight. Goal progress supports either gaining or losing weight, handles an equal starting/goal value, and never invents a missing measurement or target date. Connecting measured points is a visual trend only; tooltips identify actual measurement dates.

## Analytics and calculation contract

Daily navigation and analytics use separate state. Initialize the reporting anchor from the current daily date once; later changes to the report do not change the log, and changing the log does not silently reset the selected report.

Reporting choices are Week, Month and Custom. Week means seven days ending on the report anchor. A completed month uses its full calendar month; the current month is reported through today. Custom uses explicit inclusive start/end dates. Reject reversed or future-only ranges and bound a request to at most 366 days to avoid unbounded daily payloads. Retain the existing overall summary API for compatibility, though the new selector follows the requested three choices.

Each comparison uses the immediately preceding range of the same elapsed length. Return and display both exact ranges: this is an equal-duration comparison, not a claim that every month has equal days. Current-month comparisons use elapsed days, not a full previous month against a partial current month.

Backend arithmetic remains Decimal. For each day return:

- `date`, explicit meal-logged status and meal count;
- food calories and grams, nullable when no meal exists;
- activity calories, zero when no session exists, plus session count;
- net calories only when the date has food records;
- actual weight readings separately, without calendar interpolation.

Totals include all recorded food and all activity within the range. Food and macro averages divide by food-logged days only. Average net and net totals continue to use food-logged days, subtracting activity on those dates only; clearly label this basis. Activity totals include activity-only dates. A period without food has null food averages/net, not a zero-intake average. Each comparison includes logged-day counts so sparse logging is visible. Percentage differences are null without a positive previous baseline; show absolute differences where meaningful.

### Overview tab

Use four primary summary values (food total, activity total, food daily average, net daily average), with a smaller secondary row for average macros and logged days. This follows the existing four-column summary pattern without repeating the daily overview. Show numerical previous-period differences when meaningful. Include one daily calorie chart and a compact data-driven insight summary.

### Trends tab

Show focused calorie, macro, activity and weight charts using shared chart containers. Include current target reference lines, legends and interactive tooltips. Food and activity remain separate series; food above target is explicitly marked. Calorie tooltips contain food, burn, net and remaining/over amounts, while unlogged food stays missing rather than zero. Weight plots actual measurements with a goal reference only when configured.

### History tab and calendar

Provide a sortable table for date, food, activity, net, protein, carbohydrate and fat, with explicit no-food states. Selecting a row opens its daily log through the existing date setter without changing analytics filters. Keep a deliberate date-navigation action usable by keyboard.

A compact calendar dialog marks days with meal records and can open their daily log. Marking a date as logged means records exist, not that a health goal was met or the day is complete. Keep unlogged and future dates distinct; no future logging.

## Account-synced data and API additions

Use an additive migration; do not rewrite existing nutrition rows.

- Add nullable positive `target_weight_kg` to NutritionProfile.
- Add user-owned MealPreset and ordered MealPresetItem records. Item fields use the same typed quantities, units, Decimal nutrition values and validators as meal items. A preset is an editable snapshot, not a live link to its source meal.
- Preset deletion or editing must not alter historical meals. All reads/writes are scoped to the authenticated owner, including nested items and source lookups.
- Protect new creation/reuse saves from accidental retry duplication with a per-user request key and request-signature check; retain compatibility for existing clients that do not send a key. An intentional duplicate is a distinct save with a new key.

Preserve the existing profile, setup, meals, weights, activities and summary routes. Add feature-specific endpoints under the existing nutrition namespace:

- `analytics/?start=...&end=...`: bounded daily rows, totals, average macros, equal-period comparison and actual weights.
- `meals/history/?q=...&page=...&page_size=...`: bounded, paginated historical meal search with their items. Preserve existing `meals/?date=...` behavior.
- `foods/?q=...&page=...&page_size=...`: searchable previously logged foods; retain the source meal/serving and do not merge different recipes merely because their names match.
- `presets/` and `presets/<id>/`: validated CRUD using the same item calculation rules.
- `calendar/?month=YYYY-MM`: compact month coverage with meal counts for date selection.

Derive meal totals on the server, never trust pasted totals. Preserve existing audit logging for nutrition writes and add presets to the same personal event-log conventions. Suggestions use the library responses and do not need an AI provider or a new persisted prediction model.

## Insights and reuse suggestions

Compute the largest calorie-contributing logged meals, macro shortfalls/excesses and equal-period changes from actual data. Do not label unlogged days as skipped meals or confirmed low intake.

Provide an extensible deterministic suggestion adapter over saved meals and recent foods. Rank portion-preserving candidates against remaining food calories and macro targets; present their amounts and tradeoffs, not claims that all targets can be satisfied. Above-target or incomplete days should not manufacture a recommendation. Selection opens an editable draft and saves only through the existing save action. No AI, invented meals, restrictive daily targets or automatic meal creation.

## States, safety and accessibility

- Distinguish initial loading, background refresh, empty data, permission failure, fetch error, saving and save success.
- Abort or ignore stale daily/period/library requests. An older response must not overwrite a newer selected date or reporting range.
- Keep previous data visibly marked during refresh, never show one date's meals as another date's current result.
- Preserve unsaved drafts after network failure, prevent double submissions, show field errors inline and restore focus after dialogs close.
- Shared dialog scrolling, visible close controls, keyboard navigation, accessible names and focus handling remain mandatory.
- Use status text with color; respect reduced motion. Do not animate continuously behind nutrition values.
- Avoid unnecessary nested cards and decorative patterns. Keep meal/activity entry layouts related, but visually separate their sections.
- Empty and one-reading charts stay compact. Long names, many food items and large values wrap or scroll locally without page overflow.

## Delivery sequence and verification boundary

1. Core dashboard: consolidated overview, target/weight dialogs, meal-first split layout and contextual actions, retaining existing entry workflows.
2. Analytics: independent reporting state, bounded backend summaries, Overview/Trends/History, accurate comparisons and chart/tooltips.
3. Reuse and quality of life: additive preset/goal persistence, duplicate/copy/library flows, calendar, insights and deterministic suggestions.

No tests, builds, browser automation, deployments or migrations run automatically under the repository's current instructions. Prepare focused validation cases; run them only when the user requests testing. Applying the new migration locally requires a separate explicit approval; production remains unchanged.

Validation cases to prepare include missing food versus a logged zero meal, activity-only days, negative net, targets exceeded, no comparison baseline, partial current months, leap-year/month boundaries, stale responses, JSON datetime copying, preset snapshot independence, ownership isolation, idempotent save retries, and zero/one/multiple actual weight readings.

## Tool-assisted design evidence

Graphify ran a local code-only extraction over the Nutrition component directory: 114 nodes and 233 edges. The scoped graph shows the settings/weight form boundary and the period-summary reuse of weekly data; backend contracts above were separately checked against source. Graph integrity diagnostics found no missing/dangling endpoints, self-loops or duplicate-edge collapse in the exported graph. This is not a whole-repository graph.

Graph artifacts are temporary at `/tmp/pixelpop-nutrition-design/graphify-out/`; they contain code relationships, not database records. Structural extraction used no external model tokens.

JEV evaluated a sanitized description of UI states with `jev-1.13.0`: 2.99 on an explicitly defined 0-3 completeness scale, confidence 0.99; usage 610 input and 17 output tokens. This is a model judgment, not an independent usability test, rendered screenshot review, nutrition advice or correctness guarantee. No real health values or records were submitted.

Impeccable supplies the existing-world, compact-layout and progressive-disclosure constraints. Feature code and rendered design remain unimplemented pending this written spec's review.
