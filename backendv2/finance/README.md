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

Opening balances/corrections, transfers, card payments and loans are separate from income/expenses. Asset valuations and outstanding loans do not increase spendable cash. Card purchases add expenses and debt; repayments reduce bank cash and debt without adding a second expense. Existing loans assume the cash movement is already reflected in the opening balance. Recurring income starts as expected, never automatically received. Ordinary bill settlement either records a linked expense atomically or links an existing one.

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
rewritten. After an owner's expense has been recorded, that contribution is fixed
to prevent reallocating historical spending. An overpaid participant can receive
reimbursement through another participant's `paid_to_id` payment.

Existing bills created before contribution rules were stored require the owner's
explicit `confirm_resplit_legacy: true` consent, either when adding a person or
generating a PIN. Consent fixes the owner's current contribution and treats the
others as an equal remainder split; no historical allocation rules are guessed.
An already-recorded full advance is redistributed through signed, dated
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

Public `POST shared-bills/share/{token}/unlock/` accepts `{pin}`. Public
`participants/` accepts `{pin, name, amount, request_id}`; public `pay/` accepts
`{pin, payer_id, paid_to_id, amount, date, request_id}`. IDs are local participant
ordinals from the public breakdown, never private database IDs. Every mutation
rechecks the active link and PIN; unlocking does not bypass subsequent checks.
There is no public people directory or account picker. Reports are pending and
reserve payment capacity but do not count as paid or touch the owner's ledger.
Owner `POST shared-bills/{id}/payments/{payment_id}/approve/` accepts optional
`record_ledger`, `account`, and `payment_method`, revalidates the current split,
and confirms the original report once. `reject/` accepts an empty object and
rejects pending reports without deleting history. Confirmed payments cannot be
rejected. Private `pay/` remains available for immediate owner-confirmed payments.

Public writes are limited to five requests/minute per client IP and link. Five
bad PIN checks lock that IP/link for 30 minutes. Production multi-worker setups
must use a shared Django cache (for example Redis), and configure trusted proxy
IP handling correctly, so rate limits and lockout are shared across workers.
PINs belong in POST bodies, never links, logs, browser storage, or analytics.

Apply additive migration `0007_shared_bill_editing` before using these endpoints. This
implementation does not execute migrations or alter the local database itself.
