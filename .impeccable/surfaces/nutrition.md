# Nutrition — daily tracking, independent analytics and reviewed meal reuse

Target: `pixelpopup-frontend/src/features/personal-dashboard/views/NutritionView.jsx`
Related: `pixelpopup-frontend/src/features/personal-dashboard/components/nutrition/`
and `pixelpopup-frontend/src/features/personal-dashboard/nutrition/`.

Mode: Operate. Audience: the existing personal workspace owner.

THESIS: Daily intake and its remaining targets first, meals next; deeper reporting
and infrequent editing must not displace the daily log.
OWN-WORLD: Existing dashboard white surfaces, Instrument Sans, cobalt actions,
solid borders, compact radius, Lucide and shared shadcn/Radix/Recharts primitives.
STORY: Choose the daily date, review food or net, log/edit entries, then inspect
independently selected reporting dates. Reuse always opens a reviewed draft.
FIRST VIEWPORT: One Nutrition tools button inside Daily overview opens a modal of titled,
described action cards, then closes before the chosen destination opens. Keep the
Food/Net switch separate as a display mode. Four original-style calorie/macro summary tiles
with per-tile progress and remaining/over amounts, followed by a
meal-first split with activity and weight in the side column. Stack on mobile.
FORM: Existing dashboard identity is intentional. Variance 3/10, motion 2/10,
density 5/10. Contextual disclosures and dialogs, not another nested card system.
FINISH: Source-reviewed; rendered recapture and runtime verification still needed.

## Preserved contracts

- Existing routes, first-run setup, manual/JSON meals, active-burn formula, numeric
  inputs, ownership, audit history and reminders remain in place.
- Food is default; Net means food minus logged active burn. Food warnings remain
  visible in Net mode. Missing food is null, not a zero-intake day.
- Date controls remain in the workspace header. Daily date changes do not reset
  reporting state; stale responses cannot replace a newly selected report/day.
- Four main report metrics, smaller secondary row, distinct Overview/Trends/History.
  Reporting is inclusive, at most 366 days, with equal elapsed comparison bounds.
- Weight points are actual readings; no synthetic daily measurements. One reading
  is a compact number, not an oversized empty chart. Goals support either direction.
- The enlarged calendar uses green for logged food at/below the current calorie
  target, red above it, and no fill for unlogged dates. A legend names each state;
  the selected date has a separate outline. Compare food only, not net burn.
- Historical foods, copied meals and presets retain quantities. Selection never
  saves. Presets/goal weight are Django-owned and available across devices.
- Stable per-draft meal request keys and payload signatures handle uncertain saves;
  deleted saves retain replay tombstones. No retry automatically becomes a new save.
- Destructive actions and unsaved dialog changes require confirmation. Food-library
  results are paginated, stale-safe and recover after deleting the last page item.

## Review evidence and limits

No new theme, dependency or raster asset. No image provenance is applicable.
One gray-on-blue meal-total contrast finding was fixed with blue-950 text.
No design ignores/suppressions were added. The scoped Impeccable source detector
returned no findings; that is not rendered visual verification.

Graphify's implementation extraction covered 20 Nutrition component files,
154 nodes, 382 edges and 16 communities. A bounded query traced meal-editor reuse,
independent reporting and weight-progress consumers. Its output was truncated to
the query budget; it is not an exhaustive dependency audit or a backend graph.
Temporary artifacts are in `/tmp/pixelpop-nutrition-implemented/graphify-out/`.

JEV scored a sanitized interaction-state contract 2.97/3 (confidence 0.97;
445 input / 17 output tokens). This judges documented coverage only—not code
correctness, visual quality or a successful runtime. No personal health records
or credentials were sent.

Applicable source pre-flight: existing typography/tokens preserved, semantic
status text, clamped progress, reduced-motion support, mobile stacking, local
overflow, loading/empty/error/retry paths, shared keyboard/focus primitives and
explicit save gates. Marketing hero, logo-wall and imagery checks do not apply.

Tests were authored, not executed. No build, browser automation, deployment,
push or database migration was run. `0032_nutrition_presets_weight_goal.py` is an
additive migration that needs approval/application before using the new backend.
Keep the existing dirty SQLite database local and out of commits.

## Pending manual acceptance

Check setup; manual/JSON entries and dates; activity CRUD; target edits; weight
notes/delete; long food names; library search/pages; reviewed copying to a past
date; preset edit/delete; uncertain retry/conflict; range/date independence; sparse
food/weight records; calendar keyboard navigation; narrow/short dialogs and
reduced-motion progress. Do not claim these passed without a requested run.
