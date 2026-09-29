# Personal dashboard surface direction

Mode: Operate. Approved source: 2026-09-27-personal-finance-dashboard-design.md.
Design read: a calm personal command center that makes today's obligations and spendable money legible before inviting entry.
Design variance 2/10, motion intensity 2/10, visual density 6/10. Existing cobalt/light operational palette, Instrument Sans and Lucide; dashboard-owned shadcn controls, not a public-site redesign. Hover feedback is restrained color/border response rather than continuous motion.

## Mechanism
One recorded expense or settled bill updates ledger, account balance, summary tiles and charts together. Bank cash, card debt, assets and receivables stay explicitly distinct.

## First viewport
Left navigation, private workspace identity, summary month, fast expense/deadline actions, all-month overdue attention, readable financial summary and next deadlines. No marketing hero or decorative illustration.

## Layout and material
White working panels on a muted light canvas, restrained borders and compact controls. Variable-width analytical sections, tabular money, contained table scroll on phones; navigation collapses above content.

## Signature interaction
Paying a bill uses a focused account/amount/date dialog or links a prior expense; the settled row then changes state and all financial summaries refresh without double spending. Dirty drafts and failure states remain recoverable.

## States and accessibility
Truthful empty records, explicit loading/error/retry, text-and-icon urgency, keyboard focus, Radix dialogs/selects, native date inputs, chart data tables, reduced motion. Session denial never exposes finance data.

## Boundaries and proof
No fabricated balances; synthetic test records only in a disposable database. No public SEO changes beyond private-route exclusion. Verify calculations, CSRF, CRUD, charts, desktop and narrow viewport. Do not deploy or migrate the personal database as part of implementation.

## Approved refinement — September 27, 2026

Form choices with three or more actual options use Radix dropdowns with icons/logos; one or two retain native radio tiles. Table period/category filters remain Radix dropdowns and dated tables default to the summary month. Entry names pair with type icons or person initials. Institution presets preserve the existing free-text field with an Other entry; authentic marks are locally served and credited in `public/dashboard-banks/README.md`. Credit-card accounts use labeled manual-ledger card displays, never fabricated card numbers.

The desktop sidebar collapses to labeled icon navigation; only this non-sensitive preference persists locally. Keep the existing expandable mobile navigation. Summary tiles receive hover color/border feedback without implying a click action.

Every applicable list supplies a server-generated chart over the full matching dataset before pagination. Income, expenses and bills support two-month comparisons across up to 12 months, anchored independently from record-list date filters. Accounts/assets/receivables show current recorded breakdowns, not invented historical valuations.

Water and electricity presets create monthly variable-amount schedules. Each occurrence starts unpriced; Enter amount edits only that bill occurrence. Payment remains the existing atomic settlement flow.

This refinement was source-reviewed and formatted only. No additional build, test suite or browser run was authorized; earlier first-iteration results do not verify the refinement.

The overview welcomes Miku with the existing pixel portrait and owns global quick-add actions. Other tabs retain their own add action with a plus icon, without duplicate header actions. Form modals use 75% desktop viewport width with contained scrolling and unchanged mobile bounds. Desktop Smokey Sr. provides locally selected context-aware messages, pauses during dialogs and respects reduced motion. The supplied Metrobank mark replaces the wordmark in institution choices and account displays.

Notifications use dismissible dashboard-owned Radix toasts, not inline success banners. Inline failures and persistent overdue attention remain. Successful mutations trigger immediate Smokey responses without waiting for random idle speech; failed actions do not. No new dependency or external service is introduced.

The overview uses Summary, Planning, Insights and Recent transactions tabs, with summary tiles inside Summary rather than above the tab bar. Table markers are colored circles with semantic utility/type icons or person initials, including analytical tables; empty states include decorative icons. Smokey stays fixed during scrolling and pauses active walks, without changing public mascot behavior.

Settings adds an admin-only native full-database download, including unrelated site tables and user/session data. SQLite uses online snapshots; PostgreSQL requires server-side pg_dump. The download is read-only and unencrypted, with a clear storage warning; restoring remains manual into a separate database. Media, source and environment files are outside this database backup. No backup/restore runtime test was authorized or performed.

View calendar on the overview opens a wide month-grid dialog with due bill/task names directly on date tiles, type/status icons, urgency styling, month navigation and a Today action. Three entries per tile plus More preserves compactness without hiding the day's complete list. Settled entries are read-only; pending entries use the existing form. The separate Calendar route is preserved. Month navigation is independent of summary month. Dashboard speech bubbles no longer relocate Smokey on activation; public mascot positioning remains unchanged. This addition was source-reviewed and formatted only, not browser-tested.

Benefits & investments extends the same operational world with fund cards, manual contribution/withdrawal forms, current-value summaries and month comparisons. Funds are not spendable cash; opening value and corrections are not contributions or estimated returns. People & giving adds recipient expense history alongside separate lifetime loan totals, without treating family support as a bill. Existing canonical form/select/toast/history patterns remain the owners; Smokey supplies local action-specific responses. Pets gains a shared paw icon. Next deadlines reduces padding and marker scale without losing whole-card editing or rose urgency treatment.

Approved People navigation refinement: merge People & giving and Money lent into **People & money**, using Overview, Giving, and Loans views. Move a person's history from inline content to `/dashboard/people/:personKey`, retaining a visible back link, prefilled canonical add actions, separate month/lifetime summaries, monthly comparisons, and filtered Giving/Loans/Repayments sections. Person keys are opaque identifiers rather than names in browser URLs; legacy Money lent routes redirect to the Loans view. Financial records and their accounting semantics remain unchanged.

The funds/giving extension was source-reviewed and formatted only. Runtime validation and application of its additive migration remain with the user.

## Dashboard page pattern — September 29, 2026

For future dashboard pages with tabs, place summary tiles immediately below the tabs inside the Overview or Summary panel. Do not repeat those tiles above the tab bar or in unrelated tabs. On desktop, the first row reserves four equal columns for the four highest-priority measures, in a consistent reading order. If more measures remain, show them in a separate, more compact row; omit that row when there are no remaining measures. Reflow to two columns on narrow screens rather than forcing four cramped tiles.

Zero-valued money flows use neutral text and no up/down trend arrow or spoken flow direction. Keep the tile's category icon so the measure remains identifiable; use semantic color and direction only for nonzero flows. Summary tiles stay informational, with restrained hover feedback rather than implying they are clickable.

When an overview contains a month-to-month chart and a peer breakdown chart, show them as equal-width columns on wide screens and stack them at narrower widths. Preserve each page's actual breakdown labels and data instead of inventing a generic chart.

## Direction contract — Shared bills

THESIS: A group bill is a contribution breakdown, not Miku's expense total. Agreed shares and actual payments remain distinct.

OWN-WORLD: Extend the existing light/cobalt dashboard, Instrument Sans, Lucide and canonical shadcn controls. Compact borders, circular initials and readable tabular amounts; no new visual identity.

STORY: Choose known people, fix contributions or split the remainder equally, record who paid whom, and optionally record only Miku's expense. Share a revocable event-named breakdown without account details. Anyone holding the link may report payments; an owner-generated PIN enables late joins and event-only payment review. Private ledger changes remain an explicit dashboard decision for Miku. Event metadata and fixed/automatic shares stay editable after payment without rewriting historical spending.

FIRST VIEWPORT: Shared bills joins People & money. Compact thumbnails show total, personal contribution and participant circles. Private and public event headers share a bordered container and neutral receipt icon. Private Edit event and Editing PIN sit beside Archive bill; PIN content opens directly with no extra regeneration confirmation. The public page places hoverable Total bill, Paid to provider, Bill still unpaid and People tiles above Contribution breakdown. Detail puts a contribution pie beside a participant table, with hover amounts/percentages, separate payment history and protected-focus entry dialogs. Miku's private row stands out through the pixel portrait, blue highlight and You badge. Phones stack the same content. Add person and payment actions belong inside Contribution breakdown. Public Report payment needs no PIN; Add person and Review reports appear after Unlock management, with equal button heights and a neutral outline unlock control. PIN entry stays a compact eight-box dialog. The dashboard exposes both pending event reports and PIN-confirmed reports awaiting private ledger review.

FORM: User-approved breakdown and pie chart, extending the existing operational surface; no concept roll required. Mode Operate privately, Read with report submission and PIN-scoped management publicly. Variance 2/10, motion 1/10, density 6/10. Payment confirmation is the signature interaction. PIN approval refreshes only the event; private ledger review never counts that event payment twice. Late joins preserve fixed shares and earlier payments, with updated contributions previewed and overpayments labeled To receive. Changed shares retain previous ledger allocations until an explicit owner confirmation; historical expenses and cash stay unchanged. Generated PINs use masked fields, reveal/copy actions and in-memory lifetime. Regeneration is explicit, with the old-PIN invalidation consequence visible in the modal but no second confirmation. Public report statuses distinguish pending, confirmed and rejected; owner review reuses the canonical protected-focus payment form and may select a separate ledger recording date.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance. Source review only: project instructions prohibit automatic runtime tests and browser checks. No shipping raster or new design tokens are needed; preserve DESIGN.md. Database migration is additive and not applied automatically.
