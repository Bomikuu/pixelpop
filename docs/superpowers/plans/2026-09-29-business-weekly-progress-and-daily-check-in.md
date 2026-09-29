# Business Weekly Progress and Daily Check-In Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. In this workspace, use native execution unless the user explicitly requests subagents.

**Goal:** Show accurate Weekly actions progress and a celebratory completion state, and persist a five-prompt daily EOD check-in for the team member marked “This is me.”

**Architecture:** Keep action progress as a pure derivation of existing `WeeklyAction` rows. Add one self marker to `TeamMember` and a plan-scoped `DailyCheckIn` model/API; reuse one frontend check-in component on This Week and the self member page, with paginated member history.

**Tech Stack:** Django 5.2, Django REST Framework, SQLite-compatible migrations, React 19, Tailwind CSS, existing shadcn/Radix controls and Lucide icons.

**Spec:** `docs/superpowers/specs/2026-09-29-business-weekly-progress-and-daily-check-in-design.md`

## Global Constraints

- Private Django session/CSRF access; all member and check-in records remain scoped to the authenticated active plan.
- Asia/Manila defines each daily date; no future check-in, scheduled reminder, automatic answer inference, sample history, or performance score.
- Stable answer values: `done`, `not_done`, `not_applicable`, and empty/unanswered. Prompts: PR review, documentation, EOD update, one personal contact, planned tasks.
- One self-marked member per plan; changing the marker never silently moves dated history.
- One check-in per plan/member/date; repeat Save updates the same day. No exposed deletion in this iteration.
- Preserve the light/cobalt Business design (variance 2/10, motion 1/10, density 7/10), keyboard focus, non-color status labels, and reduced-motion behavior.
- Create additive migrations, but do not apply them to the user's database automatically. Do not run tests, lint, build, or browser automation without explicit user authorization. Static source/diff review is permitted.
- Preserve all unrelated dirty and untracked files. Do not stage or commit them as part of this work.

## Review Focus

1. At Manila midnight, a new unsaved day appears and yesterday remains in history: pin date validation in Task 2's backend test source and rollover handling in Task 5's static review.
2. Two saves for one member/date cannot create two rows: pin the idempotent `PUT` behavior in Task 2's backend test source.
3. Reassigning “This is me” keeps old check-ins with the original member: pin in Task 2's backend test source and Task 4's confirmation copy.
4. A carried action or an empty week never creates a false 100% celebration: pin in Task 3's pure-function test source.
5. All five answers marked Not applicable produce a neutral state; one unanswered answer prevents completion: pin in Task 5's pure-function test source.

---

### Task 1: One explicit self member per plan

**Files:**
- Modify: `backendv2/leadership/models/team.py`
- Modify: `backendv2/leadership/api/serializers.py`
- Modify: `backendv2/leadership/api/views.py`
- Create: `backendv2/leadership/migrations/0002_teammember_is_self.py`
- Create: `backendv2/leadership/tests/test_daily_check_in.py`

**Interfaces:**
- Produces: `TeamMember.is_self: bool`, conditional unique constraint on `plan` where `is_self=True`, read-only serializer field, `POST /api/v1/leadership/team-members/{id}/mark-self/` returning the updated member.
- Consumes: `current_plan(request)` and plan-scoped `TeamMemberViewSet` behavior from `backendv2/leadership/api/base.py`.

- [ ] Add backend test cases for same-plan selection, repeated selection, switching the marker, cross-plan member ID returning 404, and unauthenticated access being denied. Author the tests; do not execute them under current project instruction.
- [ ] Add `is_self` and its partial unique constraint; make the field API read-only except through the explicit mark-self action.
- [ ] Replace the generated `TeamMemberViewSet` in `api/views.py` with an equivalent plan-scoped class. Its `mark_self` action locks the current plan row, clears any previous marker, marks the requested member, and returns its serializer data in one transaction.
- [ ] Add migration `0002_teammember_is_self.py` manually as an additive migration; do not run `migrate`.
- [ ] Review only these files and their diff for authorization, constraint, and migration/model agreement. Keep the surrounding dirty worktree untouched; commit only isolated task files if safe.

### Task 2: Durable daily check-in API

**Files:**
- Create: `backendv2/leadership/models/daily.py`
- Modify: `backendv2/leadership/models/__init__.py`
- Modify: `backendv2/leadership/api/serializers.py`
- Modify: `backendv2/leadership/api/views.py`
- Modify: `backendv2/leadership/api/urls.py`
- Create: `backendv2/leadership/migrations/0003_dailycheckin.py`
- Modify: `backendv2/leadership/tests/test_daily_check_in.py`

**Interfaces:**
- Produces: `DailyCheckIn(plan, member, date, pr_review, documentation, eod_update, contact, tasks, created_at, updated_at)`; each answer is an empty string or one of the three stable values above. Unique `(plan, member, date)`; member deletion uses `PROTECT`.
- Produces: paginated `GET /api/v1/leadership/daily-check-ins/?member=<id>[&date=YYYY-MM-DD]`, ordered newest first; idempotent `PUT /api/v1/leadership/daily-check-ins/day/` with member, date, and five answer keys, returning the saved row.
- Consumes: `local_today()` from `leadership.services.calendar`; Task 1's plan/member scoping.

- [ ] Add backend test cases for create-then-update of one day, invalid answer, foreign-plan member, future Manila date, today/earlier date, unauthenticated request, member/date filtering, and old history staying with its member after the self marker switches. Author only; do not run.
- [ ] Add the model and exported name, with explicit field choices and uniqueness. Add serializer validation for member plan membership, supported answers, and `date <= local_today()`.
- [ ] Add a plan-scoped viewset: validate query filters; use an atomic `update_or_create` for the collection `day` PUT; expose list/retrieve and day PUT while disabling POST and DELETE. Return a field-level error rather than a server error on invalid data or duplicate races.
- [ ] Register the API route and add migration `0003_dailycheckin.py` depending on `0002`; do not apply it to the user's database.
- [ ] Perform a static model/serializer/view/migration contract review. Commit only isolated task files if safe.

### Task 3: Weekly actions progress and completion treatment

**Files:**
- Create: `pixelpopup-frontend/src/features/business-dashboard/lib/weeklyProgress.js`
- Create: `pixelpopup-frontend/src/features/business-dashboard/lib/weeklyProgress.test.js`
- Modify: `pixelpopup-frontend/src/features/business-dashboard/components/Records.jsx`

**Interfaces:**
- Produces: `weeklyActionProgress(records, week)` returning `{ total, completed, percent, complete }` from non-moved actions in the selected week. `complete` is false when `total` is zero.
- Consumes: existing `Records` loading/reload after add, delete, toggle, save, and carry; `filterWeek` supplied by This Week and Roadmap.

- [ ] Author `node:test` cases for zero actions, mixed status, all completed, reopened, and moved-source exclusion. Do not run the test command under current project instruction.
- [ ] Implement the pure helper; keep `filterWeek` semantics tied to `current_week`, and do not let search text change the progress denominator.
- [ ] In the Weekly actions `Records` panel, show `completed / total`, a labeled progress bar, and a compact green icon/copy container only when `complete`. For zero actions show “No actions to track.” Keep celebration motion subtle and disabled under reduced motion.
- [ ] Statically review the update path after save/carry/delete and the accessibility labels. Commit only isolated task files if safe.

### Task 4: Mark and display the self member

**Files:**
- Modify: `pixelpopup-frontend/src/features/business-dashboard/components/Records.jsx`
- Modify: `pixelpopup-frontend/src/features/business-dashboard/views/MemberDetailView.jsx`
- Modify: `pixelpopup-frontend/src/features/business-dashboard/BusinessDashboard.jsx`

**Interfaces:**
- Consumes: Task 1 `is_self` field and `mark-self` endpoint.
- Produces: self badge in Team Development and member detail, `Mark as me` action on a non-self member, and a `notify` callback to the member detail page for save/error feedback.

- [ ] Show “You” alongside the marked member in the team list and detail header; never infer it from the display name.
- [ ] Add `Mark as me` in member detail with explicit confirmation that changing the marker leaves previous dated check-ins with their original member; call the endpoint and reload the member/self state.
- [ ] Add recoverable inline error and loading/disabled state while marking. Pass the existing dashboard toast callback without creating a second notification system.
- [ ] Statically review keyboard access, two-member switching, and absence of a marked member. Commit only isolated task files if safe.

### Task 5: Today panel, completion state, and dated history

**Files:**
- Create: `pixelpopup-frontend/src/features/business-dashboard/lib/dailyCheckIn.js`
- Create: `pixelpopup-frontend/src/features/business-dashboard/lib/dailyCheckIn.test.js`
- Create: `pixelpopup-frontend/src/features/business-dashboard/components/DailyCheckIn.jsx`
- Modify: `pixelpopup-frontend/src/features/business-dashboard/views/BusinessViews.jsx`
- Modify: `pixelpopup-frontend/src/features/business-dashboard/views/MemberDetailView.jsx`

**Interfaces:**
- Produces: `dailyCheckInSummary(answers)` returning `{ done, applicable, complete, neutral }`; five prompt definitions and Manila date formatting in the same pure module.
- Produces: `DailyCheckIn({ member, csrf, notify, showHistory = false })`, which owns a selected date (today by default), renders a paginated newest-first history when requested, and lets a history row select its date for editing.
- Consumes: Task 2 `daily-check-ins` list/day API; Task 4 `is_self` marker. With no `member` prop, the component fetches the marked member once for This Week; `MemberDetailView` passes its already loaded marked member.

- [ ] Author `node:test` cases for all Done, mixed Done/Not applicable, one unanswered, explicit Not done, all Not applicable, and a Manila date rollover. Do not run them under current project instruction.
- [ ] Implement the pure status/date helpers. An empty or all-Not-applicable day is never green; a completed saved day is green and an incomplete saved day is softly red, with textual status in both.
- [ ] Build the shared panel with five accessible three-choice controls, date, count, Save button/icon, disabled saving state, inline error, success toast, and preserved draft on failure. `PUT` must update an existing day; a 60-second clock check refreshes the view at Manila midnight without overwriting unsaved answers silently.
- [ ] Place the panel after Weekly actions on This Week. If the 12-week window is inactive, keep the EOD panel available beneath the no-active-week explanation. With no self member, show a direct Team Development link instead of a phantom check-in.
- [ ] On the self member page, show the same today panel and paginated dated history with green/red containers, counts, and an edit path for past days. Other member pages show neither the owner's panel nor another member's self history by accident.
- [ ] Perform one static pass over responsive layout, keyboard/focus states, error/empty states, status wording, and reduced-motion classes. Do not run a build, tests, lint, or browser automation unless the user separately authorizes them. Commit only isolated task files if safe.

## Handoff

Implementation is not authorized by this plan alone. After plan review, execute natively unless the user explicitly requests subagents. Before code edits, read `PRODUCT.md`, `DESIGN.md`, `DESIGN_GUIDELINES.md`, the approved spec, and Impeccable's craft floor; state the Operate design read and 2/1/7 dials. Preserve existing behavior outside the named files and report any unrun verification honestly.
