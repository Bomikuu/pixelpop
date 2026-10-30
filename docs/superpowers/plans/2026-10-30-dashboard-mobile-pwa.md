# Dashboard Mobile and PWA Implementation Plan

> **For agentic workers:** Implement task by task using native, sequential execution. Repository AGENTS.md takes precedence over generic skill workflows: do not dispatch subagents or run tests, builds, lint, typechecks, browser automation, deployments or migrations without the user's explicit request.

**Goal:** Make the personal and business dashboards comfortable to use on a phone and installable as one private workspace app.

**Architecture:** Keep React, the current dashboard routes, Django session authentication and existing save flows. Share a small mobile navigation layer and one PWA identity between both workspaces. The first release remains online for private data; its service worker provides only a static offline fallback and never caches authenticated responses.

**Tech stack:** React 19, React Router, Tailwind 4, existing Radix controls, Lucide, Vite 7, native Web App Manifest and Service Worker APIs. No new package dependencies in the first release.

**Spec:** The mobile/PWA recommendation approved for planning in this chat, constrained by `PRODUCT.md`, `DESIGN.md`, `DESIGN_GUIDELINES.md` and AGENTS.md. This document records the implementation decisions for that brief.

## Implementation decisions

- One app named **Mico Workspace**, with a Personal / Business switcher.
- Personal bottom navigation: Today, Money, Nutrition, More.
- Business bottom navigation: Today, Clients, Applications, More. Without a leadership plan, omit Today and preserve direct access to Clients and Applications.
- Keep desktop sidebars. On phones, More opens the existing grouped navigation in an accessible drawer.
- Preserve the header Actions flow. On phones it uses a bottom-aligned action sheet; choosing an action navigates before opening the existing form.
- Make primary capture forms fit the phone viewport, with visible Save/Cancel actions.
- Keep existing home content and reporting logic. Promote current daily priorities through layout; do not introduce a new summary API or redefine financial metrics.
- Deliver mobile usability and installation first. Persistent offline records, queued writes and push notifications are later releases.

## Global constraints

- Implementation of Tasks 1–6 was authorized after this plan was written. Builds, tests, deployment, commits and pushes remain pending explicit instructions.
- Preserve all current routes, query parameters, API contracts, CSRF checks, permissions, spending approvals and document export rules.
- Reuse existing white surfaces, Instrument Sans, cobalt interaction tokens and shared controls. Design variance 3/10, motion 1/10, density 5/10.
- Use the existing `lg` breakpoint: mobile navigation below 1024px, desktop sidebars at or above 1024px.
- Mobile controls have at least 44px touch targets, visible focus and accessible labels. Honor reduced motion and safe-area insets.
- Do not cache private API responses, server-rendered dashboard HTML, login pages, downloads, uploaded documents or AI responses in release 1.
- No offline mutation replay or automatic retry of paid AI requests.
- Service-worker updates must never reload an open editor or bypass unsaved-change guards.
- Preserve existing local changes. No commits or pushes during planning. Suggested commit boundaries below apply only when committing is authorized.
- No database migrations or authentication changes are needed for Release 1A or 1B below.

## Current implementation evidence

- `Dashboard.jsx` already owns a Radix mobile drawer, grouped destinations, guarded navigation, a sticky user footer, lazy views and global Actions.
- `BusinessDashboard.jsx` currently expands its grouped navigation inline. Its `go(destination)` function protects dirty client/application documents and retains same-application editor navigation.
- Personal and business API helpers use same-origin credentials and `cache: "no-store"`. Keep these semantics.
- `FormModalShell.jsx` already supports a scrolling body, fixed actions and discard confirmation.
- Smokey renders through a portal with its own bottom positioning. A bottom bar needs an explicit dashboard-only inset; setting a variable only on the dashboard container will not reach that portal.
- No manifest or service-worker registration was found in the frontend entry/public configuration inspected.
- `generate-seo.mjs` emits a private dashboard entry and a generic fallback. `vercel.json` explicitly rewrites personal routes but has no explicit business entry or leadership/client-workflow proxy rules. Release routing must account for this; do not assume installation fixes it.

## Review focus

1. Dirty profile, résumé and client drafts: tab changes, workspace switching and update notices must retain existing protections.
2. Business users without a leadership plan: Clients and Applications remain accessible without forcing plan setup.
3. Phone keyboard, safe areas and dialogs: controls remain reachable; Smokey and bottom navigation do not cover a modal footer.
4. Offline, expired sessions and account switching: private records never become an anonymous cached response or a synthetic success.
5. Multiple tabs and deployments: an update cannot replace a running editor or delete caches belonging to another feature.

Each task includes manual acceptance checks for its related conditions. These are checks for the user or a separately authorized validation pass, not permission to run automation.

## Release 1A: Mobile navigation and capture

### Task 1: Shared mobile navigation and personal integration

**Files**
- Create `pixelpopup-frontend/src/features/workspace-mobile/WorkspaceBottomNav.jsx`.
- Create `pixelpopup-frontend/src/features/workspace-mobile/WorkspaceSwitcher.jsx`.
- Modify `pixelpopup-frontend/src/features/personal-dashboard/Dashboard.jsx`.
- Modify `pixelpopup-frontend/src/features/personal-dashboard/styles/theme.css`.

**Interfaces**
- `WorkspaceBottomNav({ items, currentPath, onNavigate, onMore, moreOpen })`: items contain `{ key, label, href, Icon, active }`; `onNavigate(href)` delegates to the owner’s guarded navigation. More is a button, destinations are links with `aria-current`.
- `WorkspaceSwitcher({ workspace, onSwitch })`: workspace is `personal` or `business`; `onSwitch(workspace)` delegates to existing navigation/discard handling. It never writes session state.

- [x] Add four mobile destinations: Today → `/dashboard`, Money → `/dashboard/transactions`, Nutrition → `/dashboard/nutrition`, More → the current drawer.
- [x] Define Money’s active routes from the existing finance destinations, including account/asset detail routes. Other secondary pages activate More. Keep month/filter query parameters and existing route selection behavior.
- [x] Reuse the personal drawer for More, including its profile footer and focus restoration. Hide the redundant mobile menu trigger once the bottom bar is present; keep the workspace switcher and header Actions available.
- [x] Reserve a 64px bar plus `env(safe-area-inset-bottom)` in the content layout. Use a scoped `--workspace-mobile-nav-height` token, zero on desktop.
- [x] Keep the existing Today priorities ahead of metrics on phones. Retain the reporting-period selector and its current meaning.
- [ ] Manually check root, finance details, nutrition and a More destination at 360px and 430px; confirm profile discard protection, browser Back and desktop sidebar behavior.

**Suggested commit:** `feat(dashboard): add personal mobile navigation`

### Task 2: Business navigation and guarded workspace switching

**Files**
- Modify `pixelpopup-frontend/src/features/business-dashboard/BusinessDashboard.jsx`.
- Reuse the two components from Task 1 and existing Radix dialog primitives.

- [x] Replace the inline expanding mobile navigation with an accessible drawer containing the existing destination groups and signed-in footer.
- [x] Add Today → `/business`, Clients → `/business/clients`, Applications → `/business/applications`, and More. Hide Today when `bootstrap.plan` is absent; do not redirect existing client/application routes into setup.
- [x] Match nested client/project routes to Clients and application/profile/AI/follow-up routes to Applications. Other business pages activate More.
- [x] Route every new control through `go` or its existing guarded equivalent. Preserve same-application résumé editor navigation. Workspace switching must also honor the dirty-document check.
- [x] Suppress underlying mobile navigation in the expanded résumé editor and retain the editor’s full-viewport modal behavior.
- [ ] Manually check a no-plan account, a client project draft, a résumé draft, browser Back and drawer focus restoration. Confirm all desktop destination groups remain available.

**Suggested commit:** `feat(business): add mobile navigation and workspace switching`

### Task 3: Phone forms, Actions and notification positioning

**Files**
- Modify `pixelpopup-frontend/src/features/personal-dashboard/components/forms/FormModalShell.jsx`.
- Modify the Actions dialog in `pixelpopup-frontend/src/features/personal-dashboard/Dashboard.jsx`.
- Modify `pixelpopup-frontend/src/ui/mascot/StationaryCatMascot.jsx` and `stationaryCatMascot.css`.
- Modify the dashboard wrappers `pixelpopup-frontend/src/features/personal-dashboard/components/DashboardCompanion.jsx` and `pixelpopup-frontend/src/features/business-dashboard/components/BusinessCompanion.jsx`.

**Interfaces**
- Extend `StationaryCatMascot` with optional `mobileBottomInset = "0px"`; apply the value on its portal root. Dashboard wrappers pass the mobile navigation inset; public/ASTA companions retain their defaults.

- [x] Below `sm`, make the existing shared form shell fill the dynamic viewport, with one scrolling field region, fixed header/actions and safe-area padding. Preserve desktop sizing, validation focus, busy dismissal prevention and discard confirmation.
- [x] Render personal Actions as a bottom-aligned sheet on phones using the current action groups. Preserve close-before-navigation/form opening and focus handoff. Do not create new action endpoints.
- [x] Offset dashboard Smokey and its notification viewport above the bottom bar. During a modal or keyboard interaction, keep feedback reachable without covering focused fields or fixed actions; do not drop queued errors or notifications.
- [ ] Manually check expense, meal, activity and requirement-decision forms with the keyboard open, long content and validation errors. Check nested dialogs, draft cancellation and success/error feedback.

**Suggested commit:** `feat(workspace): improve mobile forms and action sheets`

## Release 1B: Installable PWA, online private data

### Task 4: One manifest and route-scoped installation controls

**Files**
- Create `pixelpopup-frontend/public/workspace.webmanifest`.
- Create `pixelpopup-frontend/public/workspace-icons/icon-192.png`, `icon-512.png`, `maskable-512.png`, and `apple-touch-icon-180.png`, using the existing brand artwork.
- Create `pixelpopup-frontend/src/features/workspace-pwa/useWorkspacePwa.js`.
- Create `pixelpopup-frontend/src/features/workspace-pwa/WorkspacePwaControls.jsx`.
- Modify both dashboard entry components and `pixelpopup-frontend/index.html`.

**Interfaces**
- `useWorkspacePwa()` returns `{ canInstall, installed, updateAvailable, install, error }` and owns deduplicated registration/install listeners. Both dashboard mounts share one registration; effects clean up under Strict Mode.
- `WorkspacePwaControls()` renders installation guidance/status in the mobile More drawer. It never opens a prompt automatically or reloads the page.

- [x] Set manifest `id: "/workspace"`, `name: "Mico Workspace"`, `short_name: "Workspace"`, `start_url: "/dashboard"`, `scope: "/"`, `display: "standalone"`, and existing dashboard background/theme colors. Add Personal and Business manifest shortcuts.
- [x] Attach the same manifest and theme metadata while a dashboard is active; restore prior document metadata on exit. Do not market the public portfolio as the installed app. Treat root scope as launch/navigation scope, not authentication isolation.
- [x] Add `viewport-fit=cover` without disabling zoom. Supply the Apple touch icon on dashboard routes.
- [x] Show Install only when a supported install event is available. For other supported devices, show concise platform guidance; hide it in standalone mode. A cancelled install remains a normal state.
- [x] Register `/workspace-sw.js` in production only. A registration failure leaves both dashboards usable and offers a plain inline status.
- [ ] Manually check both entry routes share one app identity, installation opens the existing signed-in flow, keyboard navigation works and public routes retain their metadata. Device installation checks require an authorized HTTPS deployment.

**Suggested commit:** `feat(pwa): add shared workspace installation`

### Task 5: Static offline fallback and safe update lifecycle

**Files**
- Create `pixelpopup-frontend/src/features/workspace-pwa/workspace-sw.template.js`.
- Create `pixelpopup-frontend/build/workspacePwaPlugin.js`.
- Create `pixelpopup-frontend/public/workspace-offline.html`.
- Modify `pixelpopup-frontend/vite.config.js` and the PWA hook/controls from Task 4.

**Interfaces**
- `workspacePwaPlugin()` is a local Vite build plugin using existing Vite/Node APIs. It emits root `workspace-sw.js` with a release identifier derived from emitted application code. It adds no runtime/package dependency.

- [x] Cache only the static offline document and workspace icons in a release-specific `pixelpopup-workspace-static-*` cache. Do not precache the portfolio, dashboard HTML, API data or application JavaScript in this release.
- [x] For same-origin document navigations matching `/dashboard` or `/business` at a path boundary, attempt the network. On a network failure, return the cached offline document with a clear explanation and Retry. Do not replace real HTTP responses such as 401/403/404/500.
- [x] Pass through all other requests, including `/api/`, `/admin/`, public routes, non-GET requests, downloads and cross-origin traffic. Never return cached HTML to an API call.
- [x] Preserve the default waiting-worker lifecycle: no `skipWaiting`, forced reload or automatic activation over an active session. Show “Update available. Save your changes and close workspace windows to update.” Do not claim an update has applied while another window still holds it open.
- [x] Remove only obsolete caches bearing this feature’s exact prefix, after safe activation. Leave unrelated caches untouched.
- [ ] Manually check offline deep-link launch after a prior online visit, first visit without a cache, API failure, login expiry, two open workspace windows and an unsaved résumé during an update.

**Suggested commit:** `feat(pwa): add offline fallback and safe updates`

### Task 6: Hosting integration and release acceptance

**Files**
- Modify `pixelpopup-frontend/scripts/generate-seo.mjs` and `pixelpopup-frontend/vercel.json` only for the workspace entry/assets required here.
- Update the dashboard/mobile section of `DESIGN.md` after implementation.

- [x] Emit `/business/index.html` using the existing private dashboard-entry pattern, without embedding account data. Add explicit `/business` and nested-route rewrites ahead of the generic fallback.
- [x] Make the manifest, offline document, icons and generated worker reachable as real files, never as SPA fallback HTML. Serve the worker with revalidation (`Cache-Control: no-cache`) so a stable worker URL can update.
- [x] Apply private `no-store`/`noindex` behavior to business HTML as with personal HTML. Preserve the existing personal route protections.
- [ ] Verify the deployment’s leadership/client-workflow API routing against the existing backend origin. If this Vercel configuration is authoritative, add matching proxy rules following the finance/job-application pattern; preserve existing authentication and query handling. Do not substitute a different backend host.
- [ ] Record manual release acceptance: both signed-in dashboards, deep links after restart, standalone installation, no-plan business access, phone keyboard/safe areas, offline fallback, logout and an update with dirty drafts.
- [x] Keep production build/deployment/device-browser validation pending until explicitly requested. Static inspection alone must not be reported as verified installability or offline behavior.

**Suggested commit:** `fix(pwa): configure private workspace hosting`

## Later releases, separately scoped

### Release 2: Mobile content and selective offline resilience

- Improve transaction, client and application list presentation on phones using existing records and actions; keep desktop layouts and URL filters.
- Add contextual business shortcuts for existing client/application forms and follow-up actions. Route to the owning page before opening its form; do not introduce a parallel save flow.
- Add local draft recovery only after defining per-user keys, expiry, logout cleanup, shared-device behavior and whether the user opts in. Keep recovery separate from a successful server save.
- Add a small selected read-only snapshot with a last-synced timestamp. Revalidate the user before exposing private snapshots after launch; never show the previous account’s data.
- Queue low-risk expense/meal capture only after each endpoint supports stable operation IDs, duplicate protection, expired-session handling, conflict resolution and a visible pending/failed/cancel state. Require that API review before promising automatic sync.
- Keep transfers, bill payments, destructive actions, uploads, AI calls and document approval/export online-only.
- Draft a separate implementation plan before changing persistent private storage or backend write contracts.

### Release 3: Optional push reminders

- Plan server-side subscription ownership, subscribe/unsubscribe endpoints and dispatch using the existing reminders system.
- Request permission only after an explicit reminder opt-in. Use feature detection; retain email/in-app reminders where push is unavailable.
- Start with bills/tasks and application follow-ups. Add quiet hours, timezone-aware schedules, deduplication and privacy-conscious notification text.
- Account switching and logout must remove the old user’s subscription association. Notifications must deep-link to an authenticated destination without carrying private record details in URLs.
- This phase may need migrations and additional dependencies; neither is authorized by this planning request.

## Implementation status — 2026-10-30

Tasks 1–6 are implemented in source. Runtime acceptance remains pending: no build, test suite, lint, typecheck, browser automation or deployment was run. Source review and whitespace checks are the verification completed so far.

The mobile Business switcher and manifest shortcut open Clients so a user without a leadership plan can enter the workspace. Today remains available inside business navigation when a plan exists. Smokey defers queued feedback during phone dialogs rather than overlaying focused fields; notifications are retained and resume afterward.

Leadership/client-workflow proxy rules and the private business HTML entry are configured against the existing backend origin. Their deployed behavior has not been verified. Vercel serves existing static files before rewrites, so PWA assets use filesystem resolution rather than self-rewrites.

## Completion boundary and handoff

The first implementation should deliver Tasks 1–6 only. It must retain all current desktop workflows, be installable on supported devices, show an honest offline screen and preserve drafts during updates. It does not promise offline private records or background writes.

Recommended execution: native and sequential in this chat, with a reviewable change after each task. Re-read the directly affected source before implementation because the workspace already contains unrelated local edits. Runtime validation and deployment remain separate user-authorized steps.

## Platform references

- [MDN: Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)
- [MDN: Offline and background operation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation)
- [Vercel: Static routing configuration](https://vercel.com/docs/project-configuration/vercel-json)
- [WebKit: Web Push for Home Screen apps](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
