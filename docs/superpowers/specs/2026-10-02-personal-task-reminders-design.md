# Personal task reminders — design

## Purpose and constraints

The personal dashboard should help Miku notice and complete important daily tasks without removing completed items from view. It must work while the dashboard is open and, after browser permission is granted, when it is closed. This is a private, single-user workflow today. Reminder delivery is required in production only; local development need not send notifications. The existing Django finance tasks, personal Settings, EOD entries, nutrition meals, and expense transactions remain the source of truth. Preserve unrelated in-progress changes, including the local SQLite database.

## Chosen approach

Use one QStash free-tier schedule to call a signed Django dispatch endpoint every 30 minutes. Django decides what is due in `Asia/Manila`, persists a unique delivery record, and sends Web Push to the user's registered browser subscriptions. A frontend service worker routes pushes to a visible dashboard tab as an in-app checklist popup; otherwise it displays a system notification that opens the dashboard checklist. The dashboard also checks for pending reminders on load/focus and periodically, so in-app reminders still work when notification permission is denied. No continuous worker or Vercel paid cron is required. Delivery can be up to 30 minutes later than a custom start/end time; default 09:00 and 00:00 fall on check boundaries.

Alternatives considered: Vercel Hobby cron cannot deliver hourly Strict Mode because it supports only daily runs; upgrading to Pro would add cost. A browser-only timer would not notify while the dashboard is closed. QStash plus Web Push is the smallest production-capable fit for the agreed behavior.

## Task and checklist behavior

- Seed seven idempotently identifiable, active daily recurring task schedules: EOD; applied for a job; made a new app; made a PR; reviewed a PR; tracked calories; recorded expenses. Existing data must never be duplicated or replaced on repeat setup. These appear in the regular task list as well as the reminder checklist.
- Add an `important` flag to individual tasks and recurring task schedules. Each generated occurrence inherits the flag. The task form exposes it. Other important tasks enter the checklist when due today, overdue, or undated; future-dated tasks wait until due. Completed items remain listed with a strikethrough and clear completed label.
- Daily checklist items are scoped to the Manila calendar day. A new occurrence starts unchecked each day. Completing a recurring task affects only that day's occurrence.
- EOD is complete when at least one EOD entry exists for that date, in any EOD group. Calories is complete after at least one meal is logged for that date; activities alone do not complete it. Expenses is complete after at least one expense transaction is recorded for that date. Adding, editing, importing, or deleting relevant records recomputes the corresponding daily task state, including backdated records. These three tasks cannot be manually checked off in the reminder UI; their action links open the relevant logging page.
- Job applications, new app, PR creation, and PR review remain manual checkboxes. A manually completed item can be unchecked for the same date. Other important tasks use their existing task completion action.
- The calories row also shows current food calories against the saved daily calorie target and a compact progress bar (for example, `1,240 / 1,800 kcal`). It still counts as complete after one meal, even below target. Activity calories do not reduce this displayed food-intake number. If a target is absent, show the logged calories and a link to set a target.

## Reminder timing

- Personal Settings exposes notification permission/subscription status, a Strict Mode toggle, an interval in hours (default one hour), and start/end time controls (default 09:00/00:00). The window may cross midnight. Midnight recap belongs to the day just ended.
- Normal Mode delivers the full checklist once at the start time and a full recap once at the end time, even when everything is complete.
- Strict Mode additionally delivers a reminder at interval boundaries inside the configured window only while at least one item is incomplete. It stops intermediate reminders when all items are complete. The end recap still delivers regardless of completion.
- Delivery rows are uniquely keyed by user, relevant calendar date, phase, and interval slot; retries or duplicate QStash calls cannot create repeated reminders. A dismissed popup does not complete tasks. The dashboard may show an undismissed reminder after reopening, but not duplicate an already acknowledged popup.
- If the user opens the dashboard after a scheduled check, the current checklist is accessible without waiting for another push. Notification click navigates to that checklist.

## Components and API boundaries

- Django: extend finance settings/task/schedule persistence and serializers; add a focused reminder service for seeding, date-scoped checklist aggregation, auto-completion, due-slot calculation, and dispatch; store Web Push subscriptions and delivery/acknowledgement records. Keep this logic out of the large dashboard view component.
- Frontend: reuse existing personal-dashboard dialog, button, form, icon, and toast patterns. Add a small reminder checklist popup and Settings controls; wire the task form's Important control and action links. Use a feature-scoped hook for pending reminders and a production-only service worker for push. The visual read is a compact, calm checklist within the existing white/slate/cobalt dashboard language: design variance low, motion intensity low, density medium. Completion must be legible without relying on color or animation.
- Security: QStash requests must pass signature verification against configured signing keys and expected destination. Push registration and acknowledgement require the authenticated user. Store only endpoint and browser subscription keys, not message secrets. VAPID private key remains server-side. Expired push subscriptions are removed when delivery fails permanently. No public endpoint exposes task content.
- Configuration: document required production variables for QStash signing and VAPID keys, plus the one QStash 30-minute schedule. Do not commit secrets. If those variables are missing, preserve normal task functionality and show a clear not-configured state in Settings rather than pretending notifications work.

## Error and compatibility behavior

Permission denied or unsupported Web Push does not block manual tasks or in-app popups while the dashboard is open. An expired subscription can be re-enabled in Settings. Scheduler delivery failures are retry-safe; individual failed push subscriptions do not prevent other subscriptions or the in-app pending reminder record. Production-only dispatch is guarded server-side, not just by frontend build mode. A closed dashboard tab is the primary background-delivery target; delivery after the entire browser process is quit is browser/OS-dependent and cannot be guaranteed. Platform restrictions, notably iOS requiring an installed Home Screen web app, are explained briefly in Settings.

## Acceptance and verification

Manually verify daily seeding is idempotent; Important appears on task forms and generated occurrences; checklist selection handles due, overdue, undated, and future tasks; manual check/uncheck; EOD/meal/expense auto-completion and reversal; calorie progress; start, strict, and recap timing across midnight; duplicate dispatch attempts; permission allowed/denied; visible-tab popup versus closed-tab notification; and keyboard/reduced-motion behavior. Per project instructions, do not run tests or builds unless the user explicitly requests them.

## Out of scope

No email/SMS fallback, mobile-native app, multi-user reminder ownership redesign, business-dashboard reminders, or local-development notification delivery. Do not alter unrelated EOD import work or personal database contents.
