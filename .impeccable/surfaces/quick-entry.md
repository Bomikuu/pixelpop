# Quick Entry — standalone mobile entry and dashboard popup

Mode: Operate. Audience: the existing single-user personal finance workspace.
Primary job: record signed multiline transactions, review accounts/categories,
then commit once. Existing dashboard style and financial safeguards are fixed.

## Direction contract

THESIS: A compact mobile composer outside the dashboard shell, with the same
entry form in the dashboard-home popup. Saved-record review and settlement belong
in the dashboard's Quick Entry transactions tab, not the standalone entry page.
OWN-WORLD: Existing white fields, slate type, cobalt controls, semantic money
colors, compact solid borders, shared dashboard tokens and Radix primitives.
STORY: Type signed lines; review detection and balance consequences; save or
assign an account later without duplicating the transaction.
FIRST VIEWPORT: Compact back/Unsettled controls, title and transaction date,
autofocus auto-growing composer with live count, editable transaction cards,
then exact projections. The desktop summary supports the two-column card grid;
mobile stacks cards and summary. No dashboard sidebar or portfolio mascot on
the standalone route. Unsettled shortcut leads back into the dashboard.
FORM: User-specified input → review → balance → save; no concept seed
required for this precise extension. Visual variance 3/10, motion 2/10, density 7/10.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Verification boundary: the initial standalone/popup layout received an authorized
desktop/390px visual check with unsaved drafts. The latest composer/card and
dashboard-settlement refinement received source review only; no new browser
testing, builds or test suites were initiated under the current project rules.

## Implementation review

Reused the dashboard's Button, Input, Textarea, Select, date control, Dialog,
AlertDialog and settlement panel. The standalone route loads only session,
accounts and categories; the popup reuses dashboard data and Smokey feedback.
Both presentations use QuickEntryForm and the existing parser, draft orchestration,
exact projections and atomic save/retry flow. Typing updates parsing immediately;
blur reveals cards that remain visible on refocus. Card overrides preserve manual
account/category selections and support per-entry dates. Running previews follow
the displayed order and use only a real starting balance or credit limit for
segmented indicators; no baseline means no indicator. No design tokens,
fonts, dependencies, raster assets, or existing visual worlds were changed.

The finish review was performed inline, not through a subagent. Latest visual
disposition: recapture needed; the earlier visual pass does not verify the new
card layout. Physical mobile keyboard and Safari behavior remain unverified.
The income-only negative-account blocker is corrected: only outflows enforce
capacity blocking, matching the existing backend policy.

Saved records use server-paginated All / Unsettled / Settled dashboard filters.
Audit source `quick_entry` tracks new saves and settlement of legacy unsettled
records, without a schema migration or balance mutation during previews.
Historical settled entries without provenance cannot be classified reliably and
are excluded with an explicit list note. Both the reminder and legacy dashboard
Quick Entry route now stay within the dashboard settlement workflow.
Applicable source pre-flight checks: existing theme/shape/accent preserved,
accessible labels and non-color indicators present, mobile stacking explicit,
loading/empty/error/retry states included, low motion retained. Marketing-only
hero, imagery, logo-wall and editorial-composition checks are not applicable.
