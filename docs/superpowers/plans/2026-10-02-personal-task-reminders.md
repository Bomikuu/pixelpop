# Personal Task Reminders Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the personal dashboard an important-task checklist with daily auto-completion, configurable popups, and production Web Push while the dashboard tab is closed.

**Architecture:** Finance `Deadline` occurrences remain the task records. A focused reminder service seeds the seven daily schedules, computes checklist state from tasks/EOD/meals/expenses, and calculates due notification slots. A signed QStash callback creates idempotent delivery rows every 30 minutes; Web Push plus a dashboard service worker chooses in-app popup versus system notification.

**Tech Stack:** Django 5/DRF, React 19/Vite, Tailwind, existing dashboard shadcn-style primitives, QStash Python SDK, pywebpush, browser Push/Service Worker APIs.

**Spec:** `docs/superpowers/specs/2026-10-02-personal-task-reminders-design.md`

## Global Constraints

- Private personal dashboard only; production notification delivery only; Manila time.
- QStash invokes one protected endpoint every 30 minutes. Defaults: 09:00 start, 00:00 end, one-hour Strict interval.
- Seven daily reminders; EOD/meal/expense completion derives from logged records, while the other four are manual. Calorie progress is food intake versus saved target; one meal completes the reminder.
- Completed checklist rows remain visible and crossed out. Start and end popups show the full list; Strict repeats only for incomplete lists within the time window.
- Reuse existing dashboard UI conventions; low design variance, low motion, medium density, keyboard/focus/reduced-motion support.
- Preserve the existing uncommitted EOD import edits and local SQLite data. Do not run tests or builds unless the user explicitly requests them; write focused tests but leave execution to the user.
- Commit only files belonging to each task. Never commit credentials or the local database.

## File map

- `backendv2/finance/models.py`, `api/serializers.py`, migrations `0023_personal_reminders.py` and `0024_reminder_delivery.py`: importance, settings, subscription and delivery persistence.
- `backendv2/finance/services/recurrence.py`, `services/reminders.py`: schedule inheritance, seed/checklist/auto-completion/due-slot logic.
- `backendv2/finance/api/reminders.py`, `api/urls.py`, `api/views.py`: authenticated reminder API, signed dispatch, task reopen action.
- `backendv2/finance/tests/test_reminders.py`: focused model, API, timing, security, and idempotency tests (written, not run).
- `backendv2/requirements.txt`, `backendv2/README.md`: push/signature dependencies and production setup instructions.
- `pixelpopup-frontend/src/features/personal-dashboard/components/forms/modules/{TaskForm,ScheduleForm}.js`, `components/forms/formSubmission.js`: Important form field and boolean conversion.
- `pixelpopup-frontend/src/features/personal-dashboard/components/reminders/{ReminderSettings,ReminderChecklistDialog}.jsx`, `hooks/useReminders.js`, `Dashboard.jsx`, `public/dashboard-reminders-sw.js`: Settings, popup, push registration/routing.

## Review Focus

1. A daily task is logged in one EOD group and deleted while another group still has that date: EOD must remain complete; Task 2 test covers this.
2. A meal is moved between dates or the final meal is deleted: completion and calorie totals must change for both dates; Task 2 test covers this.
3. Midnight recap and a late QStash retry: previous-day recap must have one delivery, never today's morning checklist; Task 3 test covers this.
4. QStash signature missing/invalid or request sent outside production: dispatch must send nothing; Task 3 test covers this.
5. Browser permission denied, stale endpoint, or multiple dashboard tabs: tasks remain usable and at most one visible popup is shown per delivery; Task 4 manual acceptance checks cover this (the frontend has no test runner).

---

### Task 1: Persist important recurring tasks and reminder settings

**Files:** Modify `backendv2/finance/models.py`, `backendv2/finance/api/serializers.py`, `backendv2/finance/services/recurrence.py`, `backendv2/finance/api/views.py`, `pixelpopup-frontend/src/features/personal-dashboard/components/forms/modules/TaskForm.js`, `pixelpopup-frontend/src/features/personal-dashboard/components/forms/modules/ScheduleForm.js`, `pixelpopup-frontend/src/features/personal-dashboard/components/forms/formSubmission.js`; create `backendv2/finance/migrations/0023_personal_reminders.py`, `backendv2/finance/tests/test_reminders.py`.

**Interfaces:** `RecurringSchedule.important: bool`, `RecurringSchedule.system_key: str | None`, `Deadline.important: bool`, and `WorkspaceSettings.reminder_strict_mode`, `reminder_interval_hours`, `reminder_start_time`, `reminder_end_time`. `materialize()` copies `important` into new occurrences. `ensure_daily_reminders(user) -> list[RecurringSchedule]` lives in `services/reminders.py` (created in Task 2) and uses stable system keys.

- [ ] Add nullable/blank `system_key` with a unique `(created_by, system_key)` constraint only when a nonempty key exists; add importance and settings fields with the approved defaults in migration 0023.
- [ ] Expose and validate these fields through task, schedule, and settings serializers. Limit interval to 1–24 hours. Restrict `important` to task/reminder kinds; keep bills unchanged.
- [ ] Make recurrence copy importance and keep pending future occurrence importance in sync when its schedule is edited.
- [ ] Add a two-choice Important control to task/schedule forms, convert its string value to JSON boolean, and preserve it through the recurring-task submission path.
- [ ] Add named backend test cases for defaults, flag inheritance, duplicate system-key protection, and invalid interval; review the frontend recurring-task payload mapping manually. Do not execute tests per project instruction.
- [ ] Review only this task's diff for schema compatibility and commit these files as `feat: persist important task reminders`.

### Task 2: Compute and mutate the daily checklist

**Files:** Create `backendv2/finance/services/reminders.py`, `backendv2/finance/api/reminders.py`; modify `backendv2/finance/api/urls.py`, `backendv2/finance/api/views.py`, `backendv2/finance/tests/test_reminders.py`.

**Interfaces:** `ensure_daily_reminders(user) -> list[RecurringSchedule]`; `checklist_for(user, day: date) -> dict` returns `date`, `items[]` (`deadline_id`, `title`, `completed`, `important`, `source`, `due_date`, `action_url`, optional `calories`/`target_kcal`), and `all_complete`; `sync_automatic_tasks(user, day: date) -> None` recomputes three system task occurrences from EOD entries across all groups, `Meal` rows for that user/date, and expense `Transaction` rows for that date/user; `POST reminders/items/<id>/toggle/` toggles manual task occurrences only.

- [ ] Seed seven schedules idempotently for the authenticated user and materialize the selected date; do not overwrite a user-edited title or disabled schedule on repeat calls.
- [ ] Build checklist selection for today's, overdue, and undated important tasks, with future tasks excluded; retain completed rows. Mark auto tasks complete/pending from source records at checklist read and dispatch rather than adding hooks to the dirty EOD files.
- [ ] Aggregate food calories from meal items, show the saved `NutritionProfile.daily_target_kcal`, and keep activity burn separate. Use presence of a meal, not target attainment, to complete the calories task.
- [ ] Expose authenticated `GET reminders/checklist/` and manual toggle endpoint; use existing task settlement for completion and a task-only reopen path for uncheck, disallowing manual toggles of three auto tasks.
- [ ] Add named tests for initial seed, group overlap/delete, backdated and moved meals, expense correction/delete, due/overdue/undated selection, manual toggle, and cross-user access. Do not execute them.
- [ ] Review only this task's diff and commit as `feat: add personal reminder checklist`.

### Task 3: Deliver production notifications safely

**Files:** Modify `backendv2/finance/models.py`, `backendv2/finance/api/reminders.py`, `backendv2/finance/api/urls.py`, `backendv2/finance/tests/test_reminders.py`, `backendv2/requirements.txt`, `backendv2/README.md`; create `backendv2/finance/migrations/0024_reminder_delivery.py`, `backendv2/finance/services/reminder_delivery.py`.

**Interfaces:** `due_slots(settings, now: datetime) -> list[tuple[date, str, str]]` returns delivery date, phase (`start`, `strict`, `recap`), and stable slot key. `dispatch_due(now: datetime) -> int` creates unique deliveries and sends generic Web Push payloads. `GET reminders/status/` returns `enabled`, `push_configured`, `vapid_public_key`, and subscription state; `POST/DELETE reminders/subscriptions/` register/unregister the current user's subscription; `POST reminders/deliveries/<id>/claim/` atomically marks one own delivery shown and returns it only to the first claimant. `POST reminders/dispatch/` accepts only valid QStash signatures in production.

- [ ] Add `ReminderPushSubscription` (user, endpoint unique, p256dh, auth) and `ReminderDelivery` (user, checklist date, phase, slot key unique, acknowledged_at, sent_at) models and migration; `acknowledged_at` is set by the atomic claim before the popup appears.
- [ ] Implement due-slot calculation for a window crossing midnight: 09:00 start, 10:00–23:00 strict hourly when incomplete, 00:00 previous-day recap; custom times/intervals use the next 30-minute check and never backfill a flood of missed strict slots.
- [ ] Verify `Upstash-Signature` with `qstash.Receiver` using both signing keys and the configured exact destination URL over the raw request body; reject missing config, invalid signatures, and non-production calls before dispatch.
- [ ] Send via `pywebpush.webpush` using server-side VAPID private key, a generic notification payload, and per-subscription error isolation. Delete permanently expired subscriptions; retain retryable failures. Add authenticated subscription/status/claim APIs.
- [ ] Document VAPID public/private/subject, QStash current/next signing keys, exact production callback URL, and one `*/30 * * * *` schedule. Add dependencies to requirements, without creating a QStash account or inserting credentials.
- [ ] Add named tests for due slots/midnight, retries/idempotency, invalid signature, prod guard, unauthorized subscription/claim, and stale push endpoint. Do not execute them.
- [ ] Review only this task's diff and commit as `feat: deliver personal reminder notifications`.

### Task 4: Show the checklist in the dashboard and enable browser push

**Files:** Create `pixelpopup-frontend/src/features/personal-dashboard/components/reminders/ReminderSettings.jsx`, `pixelpopup-frontend/src/features/personal-dashboard/components/reminders/ReminderChecklistDialog.jsx`, `pixelpopup-frontend/src/features/personal-dashboard/hooks/useReminders.js`, `pixelpopup-frontend/public/dashboard-reminders-sw.js`; modify `pixelpopup-frontend/src/features/personal-dashboard/Dashboard.jsx`.

**Interfaces:** `useReminders({ request, mutate, ready, refresh })` provides checklist, pending delivery, push state, `toggle(id)`, `claim(id)`, `saveSettings(values)`, and `enablePush()/disablePush()`. Components receive data/actions via props; no new global state container.

- [ ] Mount reminder hook only for authenticated personal dashboard sessions. Fetch on load/focus and at a modest interval; only the focused tab may attempt the atomic claim before showing a pending popup. The service worker sends a push message to that focused tab or displays an OS notification when no dashboard tab is focused. Keep a direct way to reopen today's checklist.
- [ ] Build accessible checklist dialog using existing `Dialog`, `Button`, `Progress`, icons, and Tailwind conventions. Show completed rows crossed out, action links, calorie `current / target kcal` progress, a recap heading, and clear empty/error states.
- [ ] Add Settings controls for Strict Mode, interval, start/end times, production-only push permission/status, and explicit Enable/Disable notification actions. Never call `Notification.requestPermission()` without a user click; explain browser/iOS limits.
- [ ] Implement service worker `push`/`notificationclick`: message a visible dashboard client, otherwise show a generic notification; opening the notification focuses or navigates to `/dashboard` and its checklist. Local builds do not register the worker or deliver notifications.
- [ ] Review keyboard focus, reduced motion, narrow viewport, permission denied, stale subscription, multiple visible tabs, and no-target calorie data. Do not run Playwright, tests, builds, or lint unless requested.
- [ ] Review only this task's diff and commit as `feat: add personal reminder popup and settings`.

## User-run acceptance checks

After deployment and configuration, verify one daily checklist per day, manual and automatic completion, calorie progress, normal/strict/recap timing, visible-tab modal, closed-tab system notification, denied permission fallback, midnight date attribution, and no duplicate notification after QStash retries. Do not claim production push is live until keys, subscription, schedule, and a real delivery are confirmed.
