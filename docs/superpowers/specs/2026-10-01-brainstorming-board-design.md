# Brainstorming Board / Idea Inbox — Design Spec

## Purpose and scope

Add a private **Brainstorming** page under the personal dashboard's Planning navigation. It is a calm place to capture ideas, organize them by board and group, prioritize them without treating them as tasks, import structured brainstorms, and carry selected ideas into the existing Tasks & deadlines system. The attached multi-board JSON is the owner's ideas for today and must be imported into the local database once, without replacing existing records. The feature does not call an AI API or change the business dashboard.

Success means the owner can switch between isolated boards, add and manage an idea, paste and preview either supported JSON shape, safely import without duplicates, find ideas on large boards, and create at most one linked task per idea. The idea remains visible after carry-over.

## Recommended architecture

Create a dedicated `brainstorm` Django app with its own models, service layer, private DRF API, and migration. Mount its API under `/api/v1/finance/brainstorm/` so the existing personal-dashboard request/session handling can be reused. Keep React page and feature-specific components under the personal-dashboard feature. Reuse its existing dialog, select, button, toast, loading, and error conventions; add no dependency.

The hierarchy is `BrainstormBoard → BrainstormGroup → BrainstormIdea`. Boards and groups have names, descriptions, slugs, ordering, and timestamps; boards can be deactivated. Ideas have the requested title, description, source text, urgency, status, tags, reference URL, notes, ordering, timestamps, board, group, and normalized fingerprint. An idea has a nullable one-to-one link to the existing `finance.Deadline` task and `carried_over_at`. Group membership must always belong to the idea's board. Keep board names unique case-insensitively and group names unique within a board. Enforce `(board, fingerprint)` uniqueness, including archived ideas, so re-import cannot create duplicates.

The fingerprint is derived from Unicode-normalized, case-folded titles after punctuation is removed and whitespace collapsed. This catches obvious same-board title duplicates only; no semantic/AI duplicate detection. An edit that changes a title updates its fingerprint and rejects a collision. Archive retains the record; Delete requires confirmation and removes only the idea, never a linked task. If a linked task is later deleted, the idea remains, shows that its task link is gone, and may be carried again.

## API and mutation behavior

Authenticated dashboard users may list and manage boards/groups/ideas. Board and idea reads return only the selected board's content, never a mixed-board wall. Ideas support add, edit, urgency/status change, group move, archive, and delete. Board management supports create, rename/edit, and deactivate; group management supports create and rename. Do not silently delete a group containing ideas.

The import API accepts either `{board, groups}` from the brief or `{boards: [...]}` from the supplied file. It validates shape, lengths, choices, URLs, group ownership, and a bounded payload size. The preview endpoint is read-only and returns board/group counts plus created, duplicates skipped, and invalid entries with locations and reasons. Confirmed import uses the same parser and runs atomically, creates missing boards/groups, skips duplicates both against the database and within the upload, and returns the same style of summary. A structurally invalid document fails entirely; individual invalid ideas are reported and skipped. Concurrent imports are protected by unique constraints. Existing boards and ideas are never overwritten by an import. Unknown top-level metadata such as `duplicates_removed` is ignored, not persisted.

A management command accepts the supplied JSON file path and invokes the same import service. Run it once against the local database after the migrations. Re-running it is safe and reports skipped duplicates. Do not ship the user's source JSON as a public frontend asset.

## Carry to existing tasks and undated tasks

The carry modal pre-fills task title and description from the idea. It exposes task priority, optional due date, and optional existing category. Map idea urgency to an initial task priority (`high`, `medium`, `low`, with `someday → low`), but let the owner change it before saving. Priority is stored separately from calculated due-date urgency. Conversion atomically creates a `Deadline(kind="task", status="pending")`, links it to the idea, sets the idea to `carried_over`, and timestamps the action. A retry or second click cannot create another task while the link exists. Carry-over does not delete or mark the idea done; the card shows “Task created” and, if appropriate, the linked task's completion state.

Make `Deadline.due_date` nullable, but allow null only for tasks/reminders; bills, subscriptions, payments, generated recurrence occurrences, and asset installments remain date-based. Existing dated records are unchanged. An undated task is neutral, not due soon or overdue, and is absent from calendar/month-only/overdue summaries. Tasks & deadlines gains an explicit **No date** view so these tasks remain easy to find, edit, and complete. Its list, serializer, urgency calculation, and summary methods must handle null dates safely. Existing task completion works without a date.

## Interaction and visual direction

Use the existing personal dashboard shell, typography, cobalt interaction color, accessible white surfaces, and restrained radius. Design variance: low; motion intensity: low; visual density: medium. Boards appear as tabs near the top with a clear active state and an Add board action. The main workspace is a spacious, very lightly patterned sheet, not strict Kanban columns. Group headings are quiet navigation cues; cards form readable clusters with subtle deterministic offset/rotation variation, restrained elevation, and a small hover/focus lift. Motion is brief and disabled under reduced-motion preferences. Group and board changes should remain quick, with no layout-obscuring animation.

Each card leads with title and short description, then urgency, status, and a few tags. Contextual actions become visible on hover **and keyboard focus**; touch users have an always-reachable action menu. Add idea uses a focused dialog. Import brainstorm uses a large paste area and separate preview and confirm steps. The selected board has compact search, urgency/status/group filters, unconverted-only toggle, and newest/urgency sort. Empty boards show Add idea and Import brainstorm actions. Loading, invalid JSON, import conflicts, and save errors remain actionable without losing entered content.

## Events, safety, and boundaries

Record meaningful Brainstorming changes in the personal Events log using concise safe diffs; a bulk import is one summary event rather than one event per imported card. Audit snapshots exclude source text, notes, reference URLs, and the full pasted JSON. Do not log read-only preview, failed actions, or no-op edits. Preserve current private/session authorization. Keep source text and notes private to the dashboard; validate reference URLs as HTTP(S) only. No public brainstorm route, task system replacement, AI integration, or unrelated dashboard redesign.

## Verification and rollout

Add focused automated coverage for fingerprint collisions, preview immutability, idempotent multi-board import, invalid entries, board isolation, carry idempotency, and undated task list/urgency/completion behavior. Per project instructions, do not run tests or builds unless the owner explicitly requests them. Review code and migrations narrowly. The local database import is an explicitly approved part of this request; apply additive migrations and run the idempotent import command only after checking the exact targets and preserving the existing database.
