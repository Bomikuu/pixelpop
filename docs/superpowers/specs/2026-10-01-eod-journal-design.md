# End of Day Journal Design

## Intent and scope

Add a private **EOD** page under the personal dashboard's Planning group. It is a date-based work recap, not a time log: one saved entry represents one calendar day, and no future day may be created or imported. The page should make past work easy to scan by month and produce copyable Slack and bullet-list recaps. It must fit the existing personal dashboard rather than introduce a new design system.

The supplied document is a feature brief, not an instruction to import its example data. Its October 2026 examples may be future-dated relative to implementation time and must not bypass date validation. No separate reference image was attached; use the document's layout description and the existing Brainstorming card treatment as visual evidence.

## Chosen structure

Use a small dedicated Django `end_of_day` app, mounted under the authenticated personal-finance API, rather than adding journal records to finance models. This keeps non-financial writing separate while reusing the existing session authentication, no-store responses, dashboard request hook, modal shell, buttons, toasts, and audit-event infrastructure. A finance-model implementation would involve fewer initial files but would couple this journal to ledger code; browser-only storage would not meet the project's durable database and backup expectations.

The first release has no sharing, AI generation, scheduled reminder, time-block logging, or delete action. It supports manual create/edit, single or bulk JSON import, browsing, selection, and copying.

## Data contract

`EndOfDayEntry` has an ID, a unique `date`, `type` (`workday`, `day_off`, `vacation`, `holiday`), `title`, `summary`, `items` (ordered list of strings), optional custom `slack_message`, optional custom `bullet_list` (ordered list of strings), and created/updated timestamps. A non-working day's `summary` is its optional note; title defaults to the type label when omitted. Workdays require a title and summary. Keep dates as `DateField`, without a time of day.

The database unique constraint enforces one entry per date across this personal workspace. All reads and writes require the same authenticated personal-dashboard session used by Brainstorming. The frontend and backend compare calendar dates in `Asia/Manila` without changing the project's global UTC timezone. Creation, editing, and import reject a date later than the current Manila date. Editing may change an entry's date only if the replacement date is not occupied or future-dated.

For a workday, use custom Slack and bullet text when supplied. Otherwise derive both deterministically from the saved `items`; if there are no items, use `summary` as the single bullet. The generated Slack format begins with an `EOD - <weekday, month day, year>` heading followed by bullet lines. These derived outputs are returned for copying but are not silently written into the custom fields, so editing items updates the fallback while intentionally authored copy remains unchanged. Non-working days display their status and optional note, without fabricated workday outputs.

Record add/edit/import events in the existing personal Events log and add EOD to its area filter. Audit snapshots include the date, type, and title, but not full private journal prose or raw pasted JSON. The existing database backup includes the new table once migrated.

## API and import behavior

Add authenticated endpoints under `/api/v1/finance/eod/`:

- `GET entries/?month=YYYY-MM`: return only saved entries for that month, oldest to newest, plus the current Manila date needed to cap navigation. Reject malformed or future months.
- `POST entries/`: create a single entry; return a clear duplicate-date error rather than overwriting.
- `PATCH entries/<id>/`: edit an entry with the same validation, including a possible date change.
- `POST import/preview/`: accept either the single-entry JSON object or `{ "month": "YYYY-MM", "entries": [...] }`; return create/skip/error counts and per-date findings without writing.
- `POST import/`: validate again and atomically create eligible records; never overwrite a saved date. Existing dates are skipped and reported. Duplicate dates inside the payload, malformed entries, month/date mismatches, and future dates are errors that prevent the commit, so a failed import cannot partially save a batch.

The import accepts the field names and shapes in the supplied examples. The optional top-level `month` must match every entry when present. Enforce reasonable lengths and list sizes in the serializer, show field-specific errors, and never trust the preview as authorization for commit; recheck duplicates and future dates in the transaction. If another write creates a date after preview, the commit skips it instead of replacing it. The response lists created and skipped dates, not private content.

## Page interaction and layout

The dashboard sidebar gains **EOD** under Planning, with its own `/dashboard/eod` route and a short breadcrumb description. The page initially shows the current month. Previous-month navigation and a month picker allow any past month; next-month navigation stops at the current Manila month. The left/main area shows **saved dates only**, not blank cards for every elapsed day. A prominent Add entry action opens the existing form modal with a date picker limited to today or earlier, making an unsaved day available without cluttering the collage. Empty months explain that nothing is recorded and offer Add entry.

The month board uses a deterministic, left-starting collage: responsive CSS grid with varied stable spans/heights based on date/content, not random layout or a rigid seven-column calendar. Each card represents one date and shows its day number, weekday, title or short preview, item count where relevant, and a subtle text status for non-working days. Cards are selectable buttons with visible focus and selected state. Their order stays chronological; unlike Brainstorming, they are **not draggable**, because dragging would imply changing the date. Card hover uses the same brief wiggle behavior as Brainstorming, disabled for reduced motion, with an EOD-specific cluster of small X marks rather than Brainstorming's diagonal hatch.

The right-side detail panel shows the selected full date and status. Workdays show title, summary, optional items/raw notes, Slack-ready text with Copy, and bullet-list text with Copy. Non-working days show their label and optional note. If no card is selected, the panel gives a concise selection prompt. On mobile, the detail panel follows the collage in document order; selecting a card scrolls/focuses the detail heading so the result is discoverable. The selection defaults to today's entry when present, otherwise the most recent saved entry in the month. Changing months resets selection to an entry in that month or the empty prompt.

One compact Add menu may expose **Add entry** and **Import JSON**, following the Brainstorming menu pattern without duplicate primary actions. The entry modal reuses the project's `FormModalShell`, common fields, and existing date and type controls. Type uses the established icon-bearing custom dropdown because it has four options; workday-only fields hide for non-working days. The import modal accepts pasted JSON, previews create/skip/error results, and disables Import until the preview is valid. A successful create/edit/import refreshes the month and uses the dashboard toast; changing an entry's date to another month follows that month and selects the saved entry. Failed copy or save produces clear feedback. The EOD route hides the dashboard's generic summary-month control because it owns month navigation inside the page.

## Visual direction and constraints

Mode is **Operate**: calm, mostly white, restrained cobalt interaction, neutral borders, and practical density. This is an extension of the personal dashboard, not a replacement visual world. Design variance is moderate (5/10) only in the collage spans; motion intensity is low (3/10), limited to the requested one-shot hover and state transitions; visual density is medium (5/10) so a month can be scanned without oversized cards. Use Tailwind for layout, spacing, colors, responsive states, and interaction styling. A tiny feature-local CSS rule is acceptable for the inherited wiggle and X-cluster texture if Tailwind alone would obscure the intent. Avoid heavy shadows, loud gradients, and rounded-everything styling.

All controls are keyboard reachable with visible focus. Status is conveyed by text as well as tone. Decorative patterns are hidden from assistive technology and never block card content. Cards have predictable reading order even when their visual spans vary. Loading, empty, error, saving, copy-success, and copy-failure states are explicit. No new frontend dependency is needed.

## Verification boundary

Project instructions prohibit running tests, builds, linting, and browser automation unless the owner explicitly requests them. Implementation may add focused automated test cases for uniqueness, Manila-day validation, import preview/commit, and output fallback, but will not run them without authorization. Narrow syntax checks and `git diff --check` are permitted; the owner can perform runtime testing later.
