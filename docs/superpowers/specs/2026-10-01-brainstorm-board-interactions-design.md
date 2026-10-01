# Brainstorm Board Interactions Design

## Intent and scope

Make the existing personal-dashboard Brainstorming board feel like an arrangeable idea wall without losing its practical controls. The owner wants a distinct card pattern and brief hover wiggle, clustered dots on the board, a fullscreen mode, draggable cards that can both change groups and reorder within a group, and one dropdown for Add board, Add group, Add idea, and Import JSON.

This is an enhancement to the existing private Brainstorming flow. Keep board/group/idea editing, filters, import, carry-to-task, archival, pagination, and existing dashboard styling. Do not change unrelated dashboard pages, introduce a drag dependency, or modify the local SQLite data file.

## UI contract

- The primary header action becomes one **Add** button with a Radix/shadcn-style dropdown. Its actions are Board, Group, Idea, and Import JSON. Group and Idea are disabled with explanatory text when there is no active board. Remove the duplicate Add board, Add group, and Add idea buttons elsewhere on this view; board Edit and Deactivate/Reactivate remain separate.
- The board surface uses several subtle clustered-dot SVG motifs, not an all-over regular dot grid. The motifs are decorative, do not block pointer events, and sit behind content. Idea cards receive a different, restrained top-right diagonal-mark pattern. Their hover response is a single short wiggle that settles immediately; it stops during dragging and is disabled by `prefers-reduced-motion`. Keep card text and controls legible and maintain focus/hover states.
- A labeled fullscreen toggle expands the board header, controls, groups, and cards. Use the Fullscreen API when available, with an in-app fixed overlay fallback. The control changes to Exit fullscreen, Escape exits, scrolling remains usable, and focus returns to the toggle. The selected board and filters do not reset.
- Add **Manual** to the sort control and make it the initial board sort. Preserve Newest and Urgency. Dragging is enabled only for an active board in Manual sort with no search or filters, because hidden cards make placement ambiguous. Show a concise reason and a way to return to Manual/Clear filters when drag is unavailable. Existing group selection remains a non-drag move control. Keyboard/touch users also get Move earlier and Move later actions on each card in Manual sort.
- Drag begins from a visible handle, not the whole card, so buttons and selects remain usable. A drop before or after another card sets the position; dropping on a group area appends to that group. Highlight the active drop target. A no-op or canceled drag does not issue a request. On failure, restore the server-backed arrangement and show the existing error feedback.

## Persistence and data flow

The existing `BrainstormIdea.sort_order` integer is the persisted rank; no migration is needed. The current list API ignores that rank, so it will accept `sort=manual` and order by idea rank, then stable creation/id fallbacks. The client still renders each returned idea under its group. Ordering by idea rank before pagination avoids letting one large group consume the entire first page. Existing `newest` and `urgency` sorts are unchanged.

Add authenticated `POST /api/v1/finance/brainstorm/ideas/<id>/move/` with body:

```json
{
  "group": 12,
  "before_id": 34
}
```

`before_id` is optional; `after_id` may be used instead; omitting both appends to the destination group. Reject requests with both anchors, an invalid destination/anchor, a different board, or an inactive board. A same-position move is idempotent. Within one transaction, lock the relevant records, remove the idea from its old group list, insert it in the destination list, and normalize `sort_order` for affected groups. Return the moved idea and log one moved/edited audit event for that idea; rank shifts of neighboring cards are incidental, not separate user actions.

The frontend sends one move request per completed drop and refreshes the board after success. This handles groups with more ideas than the currently paginated 50-card view: anchor IDs refer to server-side positions, and an empty-area drop appends to the full destination group. While a move is in flight, disable repeated drags for that card and show a busy state. Keep the currently selected board, filters, page, and fullscreen state.

## Component boundaries

- Keep `BrainstormView.jsx` responsible for board selection, filters, paging, and mutations.
- Move card rendering/pattern and drag handle behavior into a focused `IdeaCard` component; use a small board/drop-zone component for group targets if needed.
- Add a feature-local decorative pattern component and feature-local CSS only for clustered dots, hatch marks, and the one-shot wiggle; use Tailwind for ordinary layout and state styling.
- Add one action-menu component built from existing Radix primitives. No new package is required.
- Keep backend move validation and ranking in a small Brainstorm service, with a thin API view and URL route.

## Failure and accessibility behavior

Dragging is optional input, never the only way to move an idea. Group selection already supports cross-group moves; Move earlier/later controls support ordering without dragging. All controls have visible labels or accessible names and keyboard focus. Drop states have a non-color cue. Reduced-motion users get the same affordances without wiggle. Fullscreen exit remains reachable by button and Escape. Server rejection or network failure leaves the card in its original position and explains the problem.

## Verification boundary

Project instructions prohibit tests, builds, linting, and browser automation unless the owner explicitly requests them. Implementation will use focused source review, syntax/import checks, and `git diff --check`; runtime testing stays with the owner unless they later authorize it.
