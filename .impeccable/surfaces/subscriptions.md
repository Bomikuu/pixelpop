# Bills, subscriptions & utilities

## Direction

- Mode: Operate. Audience: the private personal-dashboard owner tracking recurring services and household utilities in PHP.
- Design read: extend the existing calm white/slate/cobalt dashboard, not a new visual world. DESIGN_VARIANCE 3, MOTION_INTENSITY 2, VISUAL_DENSITY 6.
- Preserve Instrument Sans, Lucide, owned shadcn/Radix tabs, selects, chart containers, table primitives, account choice tiles, FormField and FormModalShell.
- Navigation: Bills due / Subscriptions & utilities / Forecasts. The service page stays under Bills; no new sidebar item.
- Four primary summary tiles sit below their tab. Records precede charts. Fixed services do not expose meter controls; metered utilities expose readings and electricity exposes appliance planning.
- Purposeful motion only: existing summary-pattern hover and reduced-motion-safe consumption progress. No new raster assets, dependencies, global theme changes or invented provider logos.

## Data and interaction truth

- Actual payments are ledger expenses. Predictions, tariff previews, appliance estimates and forecast scenarios never debit accounts.
- Unknown amounts and missing baselines stay unknown. Partial-cycle rates can produce explicitly limited projections without claiming a known whole-cycle consumption total.
- New service creation, readings, lifecycle changes and payments retain operation keys for retries. Financial writes recheck account capacity and cycle revision under locks.
- Forms retain drafts and inline errors; conflicting drafts offer copy + refresh, not automatic overwrite. Opening a form freezes its revision even during background refresh.
- Native date/time inputs retain the existing platform-owned picker convention; stored consumption boundaries are date-only and half-open, reading instants use Asia/Manila.
- Service alerts use the existing production scheduler and a separate linked alert dialog, not checklist completion.

## Source review and evidence boundary

- One independent source review identified PostgreSQL nullable-join locking, concurrent expense edits, stale fixed-price approval, scheduled-price overwrite, pause boundaries and partial-cycle prediction issues. All six were corrected in source.
- Applicable Design Taste preservation pre-flight: incumbent theme, typography, component owners, responsive stacking, contained tables, loading/empty/error controls and reduced-motion policy retained. Marketing-only requirements do not apply to this dashboard extension.
- Badge gray-on-color hook finding: resolved by keeping neutral badges on white and using dark matching hues for semantic colored badges. No detector suppressions added; no unrelated font changes made.
- Local migration 0031 completed after explicit approval on 2026-10-15. Backup: `/tmp/pixelpop-before-subscriptions-mmfplw9g/db.sqlite3`.
- Focused checks authored, not executed. No tests, build, lint, typecheck, browser automation or screenshots were run. Rendering, keyboard/focus, narrow viewport, screen-reader behavior and PostgreSQL concurrency remain unverified at runtime.
- Production/Neon, deployments, scheduler configuration and remote Git branches were not changed.
