# Personal dashboard UX contract

Scope: `/dashboard/*` only. Public PixelPopup, ASTA and portfolio interfaces remain unchanged.

## Product context and sources

Single-owner personal workspace, English (Philippines), Philippine pesos, Asia/Manila calendar dates and due times. Accessibility target: WCAG 2.2 AA.
Domain and permissions source: `docs/superpowers/specs/2026-09-27-personal-finance-dashboard-design.md` (approved September 27, 2026). Existing Django-session-authenticated users share this workspace; staff status is not required. No new payment processor, bank integrations, login or registration flow.

## Visual contract

`DESIGN.md` plus the approved finance spec govern the light/cobalt operational extension. Runtime token owner: `pixelpopup-frontend/src/features/personal-dashboard/styles/theme.css`, scoped to `.personal-dashboard`, including portaled controls. shadcn registry components live under this feature, not public shared UI. Lucide icons, Instrument Sans, readable tabular values. No decorative continuous motion. Dashboard JavaScript and CSS are lazy-loaded.

## Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Select/Listbox | feature ui/select.jsx (shadcn/Radix) | This contract | Authored | Keyboard, open popup |
| Tile choices | feature components/ChoiceTiles.jsx | Approved dashboard refinement | Native labeled radio groups with icons; institution presets + custom input | Arrow/Tab semantics, disabled and invalid states |
| Date | Native typed date/month/time inputs; feature ui/calendar.jsx for calendar overview | This contract | Native inputs, authored calendar | PHT date parsing, keyboard, calendar navigation |
| Form | FormDialog.jsx and formDefinitions.js | Approved spec | Create/edit/settlement/adjustment | Required validation, server mapping, focus, retry |
| Scrollbar | .personal-dashboard in theme.css | Theme | Contained horizontal table scroll | Narrow viewport and computed dimensions |
| Toast | feature components/DashboardToasts.jsx (Radix Toast) | This contract | Dismissible success/info/error; at most three; five-second timeout with focus/hover pause | Accessible announcements, keyboard close, timer |
| CRUD | RecordList + FormDialog + ActionDialogs | Approved spec | Pessimistic mutation, stay in list | Create/edit/delete/confirmation |

## Dataset navigation

Route and summary month persist in the URL. Searches, filters and pagination are intentionally transient: they may contain sensitive financial terms and must not enter browser history or shareable URLs. Search is IME-aware, debounced 300ms, cancellable and clearable. Lists use 20 rows, API maximum 100; summaries cover the whole filtered queryset. Empty, no-result, loading and retryable errors remain explicit. Tables wrap meaningful text and scroll inside their panel on narrow screens; no page-wide horizontal scrolling.

## Flow ledger

| Operation | Pending | Success | Failure recovery | Focus |
|---|---|---|---|---|
| Create/edit | Disable form submit, show Saving | Close dialog, refresh all summaries, status notice | Preserve values; inline server errors | First invalid field; Radix restores trigger |
| Settle bill/task | Disable action; atomic server settlement | Show paid/completed state; refresh balances | Preserve form for retry | Restore trigger |
| Archive/delete | Explicit AlertDialog naming record | Refresh list and totals | Keep confirmation with error | Restore trigger |
| Search | Debounce and abort stale response | Filter records or select global result | Error text without exposing cached private data | Clear restores search input |
| Cancel | Dirty form confirmation | Discard only local draft | Keep editing option | Dialog focus trap |

Account and loan archive retains financial history; settled or linked ledger records cannot be silently deleted. Financial corrections are signed account adjustments with a mandatory reason, not invented income or expenses. Recurring schedules can be stopped without deleting historical settlements.

## Navigation and feedback

Each route sets its own document title. All dashboard HTML and responses are noindex/private. Unauthorized or expired sessions clear finance data and show an access-required screen, not a login/register form. Desktop sidebar becomes a labeled expandable navigation on mobile. Unknown subroutes show a dashboard-specific empty/error page. Dialogs use Radix focus trapping, Escape, accessible title/description, scroll containment; dirty drafts require discard confirmation. Severity includes text and icons, never color alone. Routine alerts do not blink.

## Async, resilience and validation

Writes are pessimistic; no false saved state. Submit is guarded and write request IDs remain stable for retries of monetary actions. Abort stale requests and timeout after 20 seconds. Visibility changes revalidate session and totals. No offline persistence of sensitive drafts; failed mutations preserve in-memory form values. Session expiry unmounts all private data and dialogs. No multi-user optimistic merging is promised in this first single-owner iteration. Domain-critical settlements and movements use atomic database transactions and row locks. Client `noValidate` gives first-invalid focus; Django serializers/domain services enforce actual financial rules. Browser date presentation is native, while values remain ISO/PHT.

## Approved dashboard refinement

Form selectable fields use SelectableField: three or more actual options use canonical Radix dropdowns with icons/logos; one or two options retain canonical icon-tile radio groups. Nullable None counts as an option. Table period/category filters remain Radix dropdowns, with dated tables defaulting to the selected summary month. Entry names receive a type icon or person initials without replacing readable labels. Search keeps one app-owned clear button; browser-native duplicate search cancellation is suppressed. Dates and months remain native inputs. The institution field remains free text in Django; bank presets and Other are just entry affordances, never an external bank connection. Existing institution strings remain editable. Local logo sources are recorded in `pixelpopup-frontend/public/dashboard-banks/README.md`.

Overview-only quick-add actions avoid duplicating each tab's own add button. Form dialogs occupy 75% of desktop viewport width; confirmations remain compact. The overview greets Miku with the existing pixel portrait. Desktop Smokey Sr. reuses the public mascot engine with locally selected dashboard responses and no external messaging service. Successful creates, edits, deletes, archives, completions and monetary actions trigger immediate contextual speech after dialogs close; failed mutations never trigger success reactions. Dialogs suppress interaction and reduced-motion preferences remain respected. Toasts replace transient notification banners; persistent urgency banners and inline form errors remain.

Desktop navigation may collapse to accessible icon links. Only the non-sensitive collapse preference is stored locally; mobile navigation remains independently expandable. Manual credit-card displays retain edit/history/correction/archive actions and explicit debt/limit/utilization labels without storing or inventing card numbers.

List charts aggregate before pagination. A separate `chart_month` anchors comparisons independently of list date bounds; search/category/type still apply. Asset/account/receivable charts describe current values rather than historical changes. Variable utility schedules generate unpriced occurrences; entering an amount edits one occurrence, and payment uses the existing settlement operation.

Latest-refinement verification is limited to source review and formatter parsing, per the no-automatic-testing instruction. Earlier first-iteration test results are not evidence for these changes.

## Overview, markers and full backup refinement

Only the overview groups longer content into Summary, Planning, Money and Insights tabs; primary financial tiles remain visible above them. Canonical Radix tabs keep keyboard navigation. Circular colored row markers identify common utilities (electricity, water, internet), types and people across record and analytical tables. EmptyState includes a decorative icon.

Dashboard Smokey does not reposition in response to scrolling and pauses any active walk during scrolling. Resize collision handling, dragging, contextual reactions and public-route behavior are unchanged.

Settings offers a full native database download via `GET /api/v1/finance/backup/`. The endpoint and session-provided UI capability require Django staff/admin permission because backups include unrelated tables, user password hashes and sessions. Other authenticated users retain existing dashboard access. Exports are read-only, private/no-store, temporarily stored with restricted file permissions and deleted when the response closes. SQLite uses its online backup API; PostgreSQL requires server-side `pg_dump`. No restoration, migrations or database changes are performed. Uploaded files and environment/source files require separate backups. Native restore guidance is in `backendv2/finance/README.md`.

Verification remains source review/formatter parsing only; no runtime backup or restore was exercised.

The overview's View calendar action opens a canonical Radix dialog at 75% desktop width. Month navigation is local to that dialog and does not change the dashboard summary month. An additive `calendar/?view=month` response exposes the month's existing due items; default day responses and the separate Calendar route remain unchanged. Date tiles show up to three named bill/task entries with a More action for the full day's list. Paid/completed entries remain read-only; pending entries and Add task/bill close the calendar before opening the existing form, with focus returning to the overview calendar trigger. No Google Calendar integration or new scheduling model is introduced.

Dashboard Smokey keeps his position during speech/activation, placing the bubble above or below him instead of relocating the sprite. Public speech positioning remains unchanged. Dashboard modal/alert-dialog states suppress the mascot, including during calendar-to-form transitions.

## Funds and recipient-based giving

Domain source: `docs/superpowers/specs/2026-09-27-funds-giving-dashboard-design.md`; the user approved implementation on September 27, 2026.

Benefits & investments reuses Account/BalanceAdjustment/MoneyMovement through canonical forms, cards, histories and charts. Fund value is manually recorded and included once in net worth, never available cash. Contributions/withdrawals transfer between a fund and cash/bank/e-wallet; no ordinary income/expense is generated. Opening balances and reasoned corrections remain separate in history. Backend account-pairing, idempotency and dated nonnegative fund validation own these invariants.

People & money merges the former People & giving and Money lent navigation entries into Overview, Giving, and Loans views. It uses optional expense recipients, with trimmed case-insensitive matching to existing loan person names. Gifts/support count once as expenses; lending remains a separate receivable. Giving totals follow the selected month; loan totals are labeled lifetime/current outstanding. Each person has a dedicated history page with a back link, prefilled add actions, separate summary totals, monthly giving/lending/repayment comparisons, and Overview/Giving/Loans/Repayments tabs. Giving and repayment tables default to the selected month and retain All time filters; loans show lifetime records. History links use opaque normalized-name identifiers, not recipient names in browser URLs. The legacy Money lent route redirects to the merged Loans view. No automatic classification or contacts registry is introduced.

Pets uses a Lucide paw icon in the shared category controls and identity markers. Next deadlines retains whole-card editing, urgency, date grouping, focus and faded red hover styling in a smaller footprint. No public tokens, routes or permissions change. No test/build/browser checks or database migrations were run for this extension.

## Shared bills

Direction source: the Shared bills contract in `docs/superpowers/specs/personal-dashboard-surface.md`. This extension adds the private People & money view at `/dashboard/people?view=shared`, detail at `/dashboard/people/shared/:id`, and the narrowly scoped public route `/shared-bills/:token`. It retains the existing light/cobalt, Instrument Sans, Lucide and canonical dashboard controls; no new visual world, design tokens or shipping raster is introduced.

Create a breakdown with 2–50 participants, including Miku exactly once. The person picker reuses names from giving recipients, loans and previous shared bills, with search and an explicit add-new-person action. Fixed contributions are reserved first; blank amounts split the remainder in integer cents, with spare cents assigned in participant order. The preview and server calculation must agree. The contribution donut describes agreed shares, not proof of payment; its adjacent table supplies readable names, amounts, percentages and text/icon payment statuses. Payment history separately records who paid whom, with merchant payments distinguished from reimbursements. On phones, the donut and table stack and tables scroll within their panels.

The group total never becomes Miku's personal expense merely by creating a breakdown. Only an explicit Record my payment in my ledger confirmation affects accounts. A normal personal payment records only that payment as an expense and may use an active cash, bank, e-wallet or credit-card account. An initial full-bill advance records Miku's share as one expense and the other shares as linked loans/disbursements; full advances require cash, bank or e-wallet. Collections of tracked advances must use this shared bill's payment action and a cash, bank or e-wallet receiving account, becoming loan repayments rather than income. Other people's payments remain breakdown-only. Linked expenses and advances remain protected from ordinary editing/deletion or a separate repayment flow.

Private operations include create, read, add participants, record payments, review public reports, share/revoke, PIN generation/replacement and archive/restore. New people may join after payment: fixed contributions remain fixed, automatic shares recalculate, earlier confirmed payments remain unchanged and overpayment becomes a reimbursement balance. Once Miku's expense is recorded, that contribution is fixed to preserve the personal ledger. Older bills require explicit one-time owner consent to retain Miku's contribution and treat other shares as automatic. Tracked advances use dated, non-cash debt adjustments rather than rewriting original cash movements or pretending reassignment is repayment. There is no hard-delete operation. Archive preserves financial history, blocks new payments and revokes the share link and PIN; restore requires a new link. The list defaults to the selected summary month and active bills, with explicit All time and Archived bills filters. Compact bill thumbnails separate Group total from Your contribution and show participant initials. Forms retain pending guards, stable retry identifiers, recoverable server errors, Radix focus containment and dirty-draft confirmation; successful confirmed payments refresh both breakdown and personal ledger.

Public sharing is a bearer link valid for 30 days, with rotation, explicit revocation and archive revocation. Anyone holding it can read this event's names, contributions and recorded payments only; account details, ledger references, private categories/notes and private database IDs are excluded. The event name is the page/browser title. Add person and Record payment/reimbursement require an owner-generated eight-digit PIN, hashed server-side, checked on each mutation, and kept only in memory on the public page. Generated owner PINs are masked with accessible reveal/copy controls and are unavailable after leaving the page. Replacing a PIN requires confirmation and invalidates the old PIN; link rotation/revocation clears it. Public requests omit cookies. Public participants choose who paid, whether payment went to the provider or an overpaid person, amount and date. Reports are pending and do not change confirmed balances, charts or private ledger until owner review. Rejected reports remain visibly marked and uncounted. Public names are entered locally; global private contacts are never exposed. PIN attempts and mutations are rate-limited, with failed-attempt lockout; production multi-worker lockout requires a shared cache. Responses are no-store; response headers and page metadata prohibit indexing and referrer leakage. Expired, revoked or archived links show an unavailable state with recovery guidance.

Evidence is limited to source review and frontend formatting of the Shared bills views/components, public page, route integration, API/service, README and additive `0006_shared_bills` / `0007_shared_bill_editing` migrations. No tests, builds, browser checks, detector commands or database migrations were run for this extension; this documentation does not certify rendered behavior. Existing `DESIGN.md` and `.impeccable/design.json` remain unchanged.

## Verification

Backend: `manage.py test finance --settings=finance.tests.settings --noinput` using disposable SQLite. Frontend: targeted ESLint, production build, desktop/narrow browser interactions, charts, form validation, select popup, auth denial, no-result/empty state and reduced-motion. The premium project audit is repository-wide: unrelated legacy findings are recorded, not remediated by this feature. Scope-specific findings must be resolved. Synthetic fixture records belong only to the temporary test database, never production.
