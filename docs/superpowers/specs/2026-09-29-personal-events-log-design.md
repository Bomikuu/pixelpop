# Personal dashboard Events log design

Date: 2026-09-29  
Status: Ready for user review

## Intent and boundaries

Add a standalone, read-only **Events log** to the personal dashboard's Workspace navigation. Its purpose is to answer what changed, when, and through which personal-dashboard area. It is an administrative activity history, not another finance or nutrition report. Changes from every personal-dashboard area may appear, including changes made through a public shared-bill link that affect the owner's records; the business dashboard and its data are excluded.

Logging starts when this feature is deployed. Do not infer or backfill earlier events. Do not log page visits, searches, backups, failed or rolled-back requests, or saves that change nothing. Automatically materialized recurring occurrences are not individual user actions and must not flood the feed; log the user action that configured or settled them instead. The empty state and an introductory note must make the forward-only boundary clear.

## Selected approach

Use an append-only Django audit model and a small audit service called by the existing personal-dashboard write paths. Store a semantic event for each successful user action rather than trying to reconstruct events in React. Frontend-only logging could miss shared-link or non-UI mutations; generic model signals would miss queryset updates and lose the user's action context. The audit write and the domain write must share a database transaction: either both commit or neither does.

Cover ordinary create/update/delete endpoints and custom operations: accounts and balance changes, assets and financing, transactions and transfers, people, loans and giving, categories and settings, tasks and bills, schedules and settlements, benefits/coverage, nutrition profile/weights/meals/activities, and shared-bill creation, editing, participants, payments, reviews, reimbursement, sharing, and archiving. Capture each user-intent action once even when it writes several related rows. Existing idempotent retries must not create a second event. A public shared-link action is labeled as coming from the shared link; do not claim an authenticated identity that the public endpoint did not verify.

## Event contract and privacy

Each event stores its timestamp, action (`added`, `edited`, `deleted`, or a named operation such as `paid` or `settled`), dashboard area, record type and ID where available, preserved human-readable record label, actor/source label, and a structured list of changed fields. For an edit, keep only fields whose normalized values changed, with `old` and `new` values. For an addition or deletion, store a safe summary of the created or removed record so the event remains understandable after deletion. Render dates, amounts, and enumerations as readable values rather than raw JSON.

Build snapshots from an explicit allowlist of displayable fields. Never persist PINs, PIN hashes, share tokens, authentication/CSRF material, full request bodies, or other secrets in audit payloads. Mask account-identifying fields where appropriate. A redacted change may state that a secret was changed without showing either value. Audit entries have no update or delete API. Use the existing authenticated personal-dashboard policy for reading; do not introduce public audit access or change current authorization rules. The existing database backup includes the new audit table automatically.

## API and page behavior

Add a private paginated `GET /api/v1/finance/events/` endpoint, ordered newest first. It accepts a month and optional action/area filters and returns events plus aggregate counts for the same filtered period. Aggregation is server-side so pagination cannot distort charts. The selected month defaults to the current month and follows the dashboard's existing month control. Invalid filters return clear validation errors; loading and fetch failures do not look like an empty log.

Add `/dashboard/events` as a standalone sidebar destination under Workspace. The page uses the personal dashboard's existing shadcn-style controls, Tailwind conventions, typography, borders, and cobalt interaction color. Design read: an operational audit surface with the feed as the primary evidence. Set design variance **low**, motion intensity **low**, and visual density **medium-high**. Use a compact four-part summary (all changes, added, edited, deleted), a stacked action-count chart over time, and an activity-by-area breakdown. These charts count events only; they do not graph money, macros, or imply that one action caused another. Include an accessible data table for chart values.

Below the charts, show a newest-first feed with distinct circular action icons, timestamp, source, record label, and a concise change summary. Expand a row to inspect field-level `old → new` values; expansion changes no data. Deleted records retain their saved label and do not link to a missing detail page. Keep filters, pagination, chart summaries, and the feed coherent when the month changes. On narrow screens, stack summary and charts and keep long field values readable without horizontal page overflow. Empty and error states explain whether no events match filters or the history has not begun yet.

## Verification and release boundary

Review every in-scope write endpoint against a capture checklist, including public shared-bill actions and custom settlements. Inspect add/edit/delete diffs, no-op and idempotent retry handling, rollback behavior, redaction, chronological ordering, filtering, pagination, empty/error states, and keyboard/screen-reader access. Do not run automated tests or a full build unless the user asks, per project instructions. Do not apply the migration to the user's local SQLite database automatically during design or planning.
