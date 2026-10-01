# Brainstorm Board Interactions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the personal Brainstorming board visually distinct, fullscreen-capable, and persistently rearrangeable within and across groups.

**Architecture:** Keep the existing Brainstorming API and view, add one atomic move endpoint using the existing `sort_order` column, and extract card/board/action-menu UI into focused feature components. Use Radix primitives already installed and native drag events; keep group-select and keyboard move actions as alternatives.

**Tech Stack:** Django 5, DRF, React 19, Vite, Tailwind CSS, Radix UI, Lucide.

**Spec:** `docs/superpowers/specs/2026-10-01-brainstorm-board-interactions-design.md`

## Global Constraints

- No new dependency, migration, unrelated dashboard change, or SQLite data-file commit.
- Preserve newest/urgency filters, idea editing, import, archive, carry-to-task, pagination, and private auth.
- Run no tests, builds, broad lint, or browser automation unless the owner requests them; targeted syntax/import review and `git diff --check` are allowed.

## Review Focus

1. Moving before/after a card in the same group preserves order after refresh.
2. Moving to an empty group or appending to a group with unseen paginated cards lands at the true end.
3. An inactive board, other-board target, or conflicting anchors returns validation without changing ranks.
4. A canceled drag, filtered view, or non-manual sort never writes.
5. Fullscreen exits with Escape and restores focus; reduced-motion users see no wiggle.

---

### Task 1: Atomic persisted idea move

**Files:**
- Modify: `backendv2/brainstorm/api/urls.py`
- Modify: `backendv2/brainstorm/api/views.py`
- Create: `backendv2/brainstorm/services/move.py`
- Modify: `backendv2/brainstorm/tests/test_brainstorm.py`

**Interfaces:** `move_idea(idea_id, group_id, before_id=None, after_id=None, actor=None) -> BrainstormIdea` validates one board and active state, computes affected old/destination group lists, normalizes their `sort_order` atomically, and logs the moved idea. `POST ideas/<id>/move/` accepts `group` plus at most one anchor and returns `IdeaSerializer`.

- [ ] Add focused tests for all five move/rank failure modes above; leave execution deferred by project instruction.
- [ ] Implement the service and thin API route/view.
- [ ] Add `sort=manual` to the list API, ordered by idea rank then stable creation/id fallback, without changing newest/urgency.
- [ ] Review the service/view diff and run `git diff --check`.

### Task 2: One action menu and board fullscreen shell

**Files:**
- Create: `pixelpopup-frontend/src/features/personal-dashboard/components/brainstorm/BrainstormActionMenu.jsx`
- Create: `pixelpopup-frontend/src/features/personal-dashboard/components/brainstorm/BrainstormBoardShell.jsx`
- Modify: `pixelpopup-frontend/src/features/personal-dashboard/views/BrainstormView.jsx`

**Interfaces:** `BrainstormActionMenu({ activeBoard, onAction })` dispatches `board|group|idea|import`. `BrainstormBoardShell({ children, boardName })` owns fullscreen entry/exit, fallback fixed mode, Escape/focus cleanup, and clustered-dot decorative layer.

- [ ] Replace duplicate add buttons with one accessible Add menu; disable Group/Idea without an active board.
- [ ] Wrap the board controls and content in the fullscreen shell, keeping board/filter state and scroll.
- [ ] Inspect keyboard and mobile structure, then run targeted syntax/import review and `git diff --check`.

### Task 3: Card decoration and drag interaction

**Files:**
- Create: `pixelpopup-frontend/src/features/personal-dashboard/components/brainstorm/IdeaCard.jsx`
- Create: `pixelpopup-frontend/src/features/personal-dashboard/components/brainstorm/BrainstormPatterns.jsx`
- Modify: `pixelpopup-frontend/src/features/personal-dashboard/views/BrainstormView.jsx`
- Modify: `pixelpopup-frontend/src/features/personal-dashboard/components/brainstorm/BrainstormBoardShell.jsx`

**Interfaces:** `IdeaCard` receives existing edit/patch/carry/delete callbacks plus drag callbacks and earlier/later controls. `BrainstormView` sends one `POST ideas/<id>/move/` on completed drop and refreshes server data; the card/group drop targets indicate before/after/append. Manual is the initial sort; drag is gated on active board, Manual sort, and no active filters.

- [ ] Add diagonal card pattern, one-shot hover wiggle, drag handle, and reduced-motion/stable-control states.
- [ ] Wire native desktop drag/drop and keyboard/touch alternatives through the same move endpoint.
- [ ] Preserve no-op/cancel behavior, error feedback, paging, and existing group-select move action.
- [ ] Run targeted syntax/import review and `git diff --check`; leave runtime tests/builds to owner.
