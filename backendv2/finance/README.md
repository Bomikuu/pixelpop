# Personal finance dashboard

Frontend route: `/dashboard`. All authenticated Django session users access the shared personal workspace. There is no dashboard login or registration UI; sign in through the existing Django admin.

## Local setup

Install existing backend requirements, then apply the additive migration:

```sh
python manage.py migrate
python manage.py runserver
```

Run the frontend normally. Vite proxies `/admin/` and `/api/v1/finance/` to `http://127.0.0.1:8000`. Override `DASHBOARD_BACKEND_ORIGIN` when necessary. Open `/admin/` through the frontend origin to sign in, then `/dashboard`. An existing session created on a different backend hostname is not automatically shared.

## Hosting

The checked-in Vercel rewrites proxy those same paths to the existing backend hostname. Keep the trailing slash on Django endpoints. Configure `DJANGO_CSRF_TRUSTED_ORIGINS` on the backend to the exact frontend origin(s), comma-separated (for example `https://pixelsbymiku.dev`). Keep Secure cookies in production and SameSite=Lax; never solve proxy authentication by disabling CSRF. Add any required frontend hostname to `DJANGO_ALLOWED_HOSTS` if your reverse proxy preserves Host. If the backend hostname changes, update these narrowly scoped rewrites too.

The SQL engine remains the existing Django configuration. No bank credentials or new API keys are required. All values are entered manually. The dashboard is omitted from the sitemap, has a separate private HTML shell, and lazy-loads its shadcn components and charts.

Asset presets now include real estate, vehicles, investments, valuables, business interests and equipment. Apply the new `0004_alter_asset_kind` migration using the same `manage.py migrate` command. It updates the allowed asset choices; existing records are not reclassified. Restart a backend started with `--noreload` so it loads the new chart responses and choices.

Water/electricity presets create variable monthly schedules. Every occurrence starts without an amount; enter the actual amount for that occurrence before settlement. Comparisons cover up to 12 months ending at the selected dashboard month, while current asset/account charts do not invent valuation history.

## Full database backup

Settings → Download full backup calls the admin-only `GET /api/v1/finance/backup/` endpoint. Restart the backend after updating so the new session capability and route load. No migration is needed for this feature. Staff/admin status is required only for this download, not ordinary dashboard access.

- SQLite: downloads a consistent native `.sqlite3` snapshot of every table, including migrations, users, sessions and all site/finance records. Uses SQLite's online backup API, including WAL data, rather than copying a live database file.
- PostgreSQL: downloads a native custom-format `.dump` from `pg_dump`. The matching PostgreSQL client must be installed on the backend server. The export includes the database schema and data, not cluster-wide roles or other databases. Database credentials remain server-side and are not logged or included in the download filename.

Backups are **unencrypted and sensitive**: store them securely, outside source control. Uploaded/media files, source code and environment secrets are not database contents and must be backed up separately. The download does not overwrite or restore anything.

Restore manually into a **new, separate database first**: open a SQLite snapshot as its own database file, or use `pg_restore` against a newly created compatible PostgreSQL database. Keep the existing database intact and verify the restored copy before choosing to switch configuration. Use the matching application/schema version; retain any original backup. Do not copy over an active SQLite database or mix it with stale WAL/SHM files. No restore operation has been run by this implementation.

## Ledger rules

Non-cash accounts can store optional `last_four` (exactly four digits, including leading zeros) and `card_expiry` (`MM/YY`, such as `10/28`). These appear on account cards and account selectors, including bank/debit, e-wallet, credit-card and fund accounts. Bank, e-wallet, and credit-card accounts can also store an optional `card_network` to show the selected Card.js network logo without collecting a number prefix. Cash and fund accounts do not accept a network. No full card number or CVV is collected; existing records remain blank until edited. Apply the additive `0010_account_card_details` and `0015_account_card_network` migrations using `python manage.py migrate`, then restart the backend. This metadata does not change balances, account types or payment eligibility.

Opening balances/corrections, transfers, card payments and loans are separate from income/expenses. Asset valuations and outstanding loans do not increase spendable cash. Card purchases add expenses and debt; repayments reduce bank cash and debt without adding a second expense. Existing loans assume the cash movement is already reflected in the opening balance. Recurring income starts as expected, never automatically received. Ordinary bill settlement either records a linked expense atomically or links an existing one.

## Financed assets

Apply the additive `0011_asset_financing` migration with `python manage.py migrate` before opening financed asset pages. An asset can have one linked financing record, initialized from the lender-confirmed outstanding principal and its as-of date. This does not recreate old payments or deduct the opening principal from cash. The asset detail page at `/dashboard/assets/:id` shows its separate value, principal liability, estimated equity, terms, payments and up to five years of installment deadlines in Bills and Calendar. Stop any existing manual recurring bill for the same loan before adding financing, or both due items will appear.

Record each actual payment from an active cash, bank or e-wallet account. Cash is deducted once in full; only the lender-posted interest and fees become expense transactions. Regular and extra principal reduce the tracked liability, while an advance for future installments is a separate credit until applied. The payment split must equal cash plus any previously recorded advance credit used. Overpayments are therefore explicit extra principal or advance credit, never an automatic reduction of contractual monthly dues. Changing lender-confirmed rate/due terms takes effect from the chosen future date without rewriting paid installments; forecasts are estimates, not a lender statement. Earlier payment history can be entered before the confirmed balance date without affecting today's principal or account balance.

Financing installments must be paid from the asset page, not through ordinary bill settlement. Linked payments and interest expenses are read-only through ordinary record forms, and an asset with remaining financing principal cannot be archived. The migration adds tables and links only; existing asset valuations, bills and account balances are not reclassified.

## Benefits, investments, and giving

Apply the additive `0005_funds_recipients_pets` migration from `backendv2`, using your normal backend environment:

```sh
python manage.py migrate finance
```

Then restart the backend. This implementation does not run that command or change your existing records.

- **Benefits & investments:** create a Pag-IBIG, MP2, investment, or other fund with its already-held opening value. Contribute manually from cash/bank/e-wallet whenever you choose; withdraw back into a cash account. These are internal transfers, not income or expenses. Current recorded values count in net worth but not available money. Corrections require a date and reason and remain visible in history. No payroll deductions, automatic returns, or provider balances are assumed.
- **Avoid duplicate holdings:** do not keep the same investment as both an active Asset and a fund. Existing Assets are not automatically converted or archived.
- **People & money:** one navigation entry with Overview, Giving, and Loans views. Support/gifts are recipient-tagged expenses, separate from repayable loans. Use the same person name for giving and lending to see selected-month giving alongside lifetime lent/repaid/outstanding totals. Each person's history has its own page, with monthly charts and Giving, Loans, and Repayments sections. Existing untagged expenses are not guessed or reclassified. Old `/dashboard/loans` links redirect to the Loans view. Person-history URLs use an opaque, normalized-name identifier; no new contacts table or migration is required.
- **Pets:** the shared category is added only if missing, for bills and expenses.

Full database backups include all these records automatically. Withdrawals/corrections cannot make a fund's recorded value negative, including later dates affected by a backdated entry.

## Isolated tests

```sh
python manage.py test finance --settings=finance.tests.settings --noinput
```

Tests use a temporary in-memory SQL database by default. `FINANCE_TEST_SQLITE` is solely for a disposable browser-test database; do not point it at personal data.

## Shared bills

`shared-bills/` stores group contribution breakdowns separately from spending.
Exactly one participant is Me; blank amounts split the remaining total in integer
cents, with any spare cent allocated in participant order. Existing giving recipients,
loan names, and shared-bill names are available through `people-options/?q=`.

Only an explicit `record_ledger: true` payment affects the owner's accounts.
Normal owner payments create an expense for that payment only; other people's
merchant payments never create owner spending or income. An initial full-bill owner
payment creates one personal-share expense and one loan/disbursement per other
participant. Collections use loan repayments, never income. Linked expenses and
advances are read-only, and advance collections must be recorded through the shared
bill action to keep the two histories aligned. Normal personal contributions can
use an active cash, bank, e-wallet, or credit-card account; full advances and loan
collections require cash, bank, or e-wallet accounts. Payment and bill creation accept a UUID `request_id` for
safe retries. Archive rather than delete. `POST shared-bills/{id}/participants/`
adds a person before or after payments: explicit contributions stay fixed, while
blank contributions split the remainder in cents. Existing payments are never
rewritten. Contributions, including fixed contributions and the owner's share,
remain editable through private `PATCH shared-bills/{id}/`. An overpaid participant can receive
reimbursement through another participant's `paid_to_id` payment.

Existing bills created before contribution rules were stored require the owner's
explicit `confirm_resplit_legacy: true` consent, either when adding a person or
generating a PIN. Consent fixes the owner's current contribution and treats the
others as an equal remainder split; no historical allocation rules are guessed.
Event edits and late joins preserve a snapshot of ledger shares when a payment
has already been recorded in the owner's ledger. They do not automatically
reassign private receivables or rewrite expenses. Owner-only
`POST shared-bills/{id}/ledger-allocation/` with `{}` accepts the new allocation.
Publicly confirmed but unreviewed payments are excluded from ledger calculations.
An already-recorded full advance is redistributed on this explicit acceptance through signed, dated
`SharedBillDebtAdjustment` records, not changes to original loan principals,
cash movements, or expenses. Actual repayments remain the only repayment totals.
New people may have zero-original-principal, read-only shared advances whose
recoverable amount comes from these adjustments. A ledger reimbursement cannot
be dated before that participant's most recent contribution reallocation.

`POST shared-bills/{id}/share/` creates or rotates a bearer link lasting 30 days.
`POST shared-bills/{id}/revoke-share/` revokes it; archiving also revokes access.
`GET shared-bills/share/{token}/`
returns a strict breakdown whitelist, with no account, ledger, private category,
or private database IDs. Responses are no-store and noindex; the endpoint is
rate-limited. Anyone holding the link can read its participant names
and payment amounts; only share it with the intended group.

`POST shared-bills/{id}/pin/` generates an eight-digit edit PIN. Only this private
response contains its plaintext; the database stores a password hash, and normal
private/public responses only expose `has_edit_pin`. Rotation/revocation of the
share link and archiving clear the PIN. The owner must distribute it separately.

Public `POST shared-bills/share/{token}/unlock/` accepts `{pin}` and returns a
signed `management_token`. The shared page retains this credential in the current
tab's session storage, never the plaintext PIN. Protected actions accept that token
or a PIN and revalidate the current link and PIN fingerprint under lock. PIN/link
rotation, revocation, archive and link expiry invalidate authorization. Lock management
removes this tab's credential; closing the tab removes session storage.
Public `participants/` accepts `{management_token, name, amount, request_id}`;
public `pay/` accepts `{payer_id, paid_to_id, kind, amount, date, request_id}`.
Provider payments without a receiver and contributions to the configured receiver
need no PIN. Refunds and legacy participant-to-participant reimbursements require
management authorization. The shared page exposes Reimburse only
after management unlock; the ordinary Report payment form has no reimbursement
selector. Participant IDs are local
ordinals from the public breakdown, never private database IDs. Payment IDs are
stable public UUIDs so a newly inserted report cannot shift a review target.
Every mutation rechecks the active link; protected mutations also check the PIN
or signed management credential. Unlocking does not bypass subsequent checks.
There is no public people directory or account picker. Reports are pending and
reserve payment capacity but do not count as paid or touch the owner's ledger.
Public `approve/` and `reject/` accept `{management_token, payment_id}` (or `pin`) for a report from that
link's event. PIN approval confirms only event totals; it never changes private
accounts, expenses, loans or repayments. These confirmed reports remain in the
owner's dashboard until a separate ledger review is completed.
Owner `POST shared-bills/{id}/payments/{payment_id}/approve/` accepts optional
`record_ledger`, `account`, `payment_method`, and `ledger_date`, revalidates pending
reports and confirms the original report once. Already publicly confirmed reports
can be reviewed here without counting the event payment twice. A separate ledger
recording date can be chosen on or after the reported date, while the original
event payment date stays unchanged. Repeated completed approvals are no-ops.
`reject/` accepts an empty object and
rejects pending reports without deleting history. Confirmed payments cannot be
rejected. Private `pay/` remains available for immediate owner-confirmed payments.

Public writes are limited to five requests/minute per client IP and link. Five
bad PIN checks lock that IP/link for 30 minutes. Production multi-worker setups
must use a shared Django cache (for example Redis), and configure trusted proxy
IP handling correctly, so rate limits and lockout are shared across workers.
PINs belong in POST bodies, never links, logs, browser storage, or analytics.

### Receiver, overpayments and voluntary settlement

Private Edit event accepts `receiver_id`, a participant in this event. The header
names this receiver with initials. A receiver stays fixed after non-rejected
receiver contributions/refunds exist. Existing unsettled provider advances retain
their old reimbursement workflow rather than being silently converted into collected funds.
New `kind: contribution` payments credit only the payer, not the receiver's personal
contribution. They can exceed the payer's share and the event total. Confirmed
legacy provider payments remain in history and continue to count toward coverage.
Pending reports never count as paid. The payment dialog displays net paid, remaining
share, excess owed and the selected participant's history.

`kind: refund` returns excess from the designated receiver to `paid_to_id` and
reduces that contributor's net paid amount and the event's confirmed funds.
Refunds must not exceed unwaived confirmed excess or reduce event funds below
the total; pending refunds reserve this capacity. Public refunds require management
authorization and report confirmation. Received contributions are not owner income.
Owner expense recording remains explicit and limited to their unrecorded agreed
contribution; overpayment/refund private cash adjustments are reviewed separately.

Private `POST shared-bills/{id}/close/` and authorized public `close/` accept a
UUID `request_id`. Confirmed funds must cover the total and pending reports must
be reviewed first. Management explicitly agrees that volunteers cover unpaid
individual shares and overpayers waive their remaining excess. `SharedBillClosure`
keeps a dated snapshot; no historical payment, expense, account or receivable is
rewritten. UI rows distinguish personal payments from volunteer coverage and show
waived excess. New confirmed payments, contribution changes or new participants
reopen the event while preserving earlier agreements. The action uses an explicit
confirmation and a celebratory toast. Apply additive migration `0009_shared_bill_receiver`
after `0008_shared_bill_ledger_review` before using these features.

Private event editing accepts title, total, date, category and existing participants'
fixed/automatic contribution amounts. Total is kept after non-rejected payments
exist; the event date cannot follow an existing payment. Previous payment and
expense records stay intact. Ledger-allocation acceptance changes only receivable
allocation, not historical expenses or cash. Any separate spending correction
remains an owner task.

Apply additive migration `0008_shared_bill_ledger_review` before using these endpoints. This
implementation does not execute migrations or alter the local database itself.
