# People Directory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Save people independently and use one person identity across Giving, Loans, and person history.

**Architecture:** Add a private `Person` record with a stable key and link it to existing giving transactions and loans through nullable foreign keys. Migrate existing typed names into contacts, keep legacy text fields in sync for compatibility, and expose contact CRUD without deletion. Reuse the dashboard form and menu patterns for one financial-record action plus Add person.

**Tech Stack:** Django 5, Django REST Framework, SQLite-compatible additive migrations, React 19, Tailwind CSS, existing Radix menus/dialogs.

**Spec:** `docs/superpowers/specs/2026-09-28-people-directory-design.md`

## Global Constraints

- Preserve all financial amounts, balances, repayment history, and existing person-history URLs.
- Person relationships are Mother, Father, Parent, Sibling, Partner, Child, Friend, Colleague, and Other; only Other allows a short custom label. Notes are optional; phone, email, and address are out of scope.
- Leave shared-bill participants and unrelated dashboard surfaces unchanged.
- Keep the dashboard's compact light visual language, keyboard access, focus states, and responsive action layout.
- Do not run tests, builds, lint, type checks, or browser automation unless the user explicitly requests them, per project instructions. Test code may be added for later execution.
- Preserve unrelated dirty worktree files; stage and commit only files belonging to each task if committing.

## Review Focus

- Names differing only by case or outer whitespace resolve to one contact without merging genuinely different names (Task 1).
- A legacy person-history key still opens the same person after migration and after renaming (Tasks 1–2).
- An unknown contact ID is rejected without creating a money record (Task 2).
- An existing independent person returns zero totals and an empty history, not a 404 (Task 2).
- Creating a person inline in an unsaved Giving or Loan form retains entered amount, account, and date (Task 3).

---

### Task 1: Independent person model and additive migration

**Files:**
- Modify: `backendv2/finance/models.py`
- Create: `backendv2/finance/migrations/0016_people_directory.py` (adjust number to the actual latest migration at execution time)
- Create: `backendv2/finance/tests/test_people_directory.py`

**Interfaces:**
- Produces: `Person(key, name, relationship, custom_relationship, notes, created_by)` with case-insensitively unique trimmed name and immutable key; nullable `LoanReceivable.contact` and `Transaction.contact` foreign keys to `Person`.
- Consumes: legacy `finance.services.people.person_key(name)` algorithm; freeze its equivalent in the migration rather than importing mutable runtime code.

- [ ] Add focused model/migration tests for a zero-history person, case/space duplicate validation, distinct-name preservation, and backfilling existing giving/loan records with their old route keys.
- [ ] Add `Person` and nullable `contact` fields; use `PROTECT` for linked contacts and a database uniqueness constraint on normalized name.
- [ ] Add an additive data migration that normalizes existing nonempty `Transaction.recipient` and `LoanReceivable.person`, creates contacts, links records, and stores the old salted key. Do not rewrite money fields.
- [ ] Review the migration for idempotent lookup, existing data preservation, and reversibility of schema operations. Do not run tests without user authorization.
- [ ] Commit only this task's files if implementation commits are requested.

### Task 2: Contact API and linked financial records

**Files:**
- Modify: `backendv2/finance/api/serializers.py`
- Modify: `backendv2/finance/api/views.py`
- Modify: `backendv2/finance/api/urls.py`
- Modify: `backendv2/finance/services/people.py`
- Modify: `backendv2/finance/tests/test_people_directory.py`

**Interfaces:**
- Produces: private `GET/POST /api/v1/finance/contacts/` and `GET/PATCH /api/v1/finance/contacts/<id>/`; `PersonSerializer` returning `id`, `key`, `name`, `relationship`, `custom_relationship`, `notes`.
- Produces: `TransactionSerializer` and `LoanSerializer` accept `contact` ID and return linked contact identity while retaining existing name fields; `people_summary(month, selected_key=None)` includes independent contacts.
- Consumes: Task 1 models and their stable key.

- [ ] Add API tests for authentication, create/update, duplicate name, unknown contact ID, contact rename preserving the old key, legacy text-only writes, independent zero totals, and linked history grouping.
- [ ] Add private contact viewset and router entry under `contacts/`; omit DELETE in this iteration.
- [ ] On giving/loan writes, validate the contact ID and keep compatibility name fields synchronized. For legacy name-only writes, resolve or create a contact by normalized name. Keep `Transaction.contact` empty for ordinary income/expense records without a recipient.
- [ ] Group people totals/history by contact, not mutable display name. Keep the existing `people/?person_key=` contract and its pagination shape; include contacts with no money records.
- [ ] Review API diff, permission behavior, and money-side-effect boundaries. Do not run tests without user authorization.
- [ ] Commit only this task's files if implementation commits are requested.

### Task 3: Person selection and creation in forms

**Files:**
- Modify: `pixelpopup-frontend/src/features/personal-dashboard/hooks/useDashboardData.js`
- Modify: `pixelpopup-frontend/src/features/personal-dashboard/components/forms/formDefinitions.js`
- Modify: `pixelpopup-frontend/src/features/personal-dashboard/components/forms/FormDialog.jsx`
- Create: `pixelpopup-frontend/src/features/personal-dashboard/components/forms/PersonFields.jsx`
- Modify: `pixelpopup-frontend/src/features/personal-dashboard/Dashboard.jsx` (only form-opening orchestration)

**Interfaces:**
- Produces: `data.contacts` loaded from `contacts/?page_size=100`; `formDefinition("person", record)` with name, relationship, conditional custom relationship, and notes; `sources.contacts` for existing selectable fields; `PersonFields({ values, onChange, errors, disabled })` for normal and inline entry.
- Consumes: Task 2 contact endpoints and the existing `dashboard.mutate(path, body, method)` refresh behavior.

- [ ] Define manual checks for normal Add person, inline person creation without losing a Giving/Loan draft, selection after creation, duplicate error feedback, edit-person prefill, and keyboard focus restoration. Add focused frontend test code only if the existing harness already covers FormDialog.
- [ ] Load contacts into dashboard data, with a pagination-safe fetch if there are more than 100 contacts.
- [ ] Add person form fields using the existing selection component; only Other reveals custom relationship. Replace free-text Giving/Loan person inputs and optional giving recipient on generic Expense with contact selection.
- [ ] Add an inline, non-nested person-creation panel within Giving/Loan forms. Save via contact API, keep the current financial draft in memory, refresh contacts, and select the new contact.
- [ ] Keep form validation, submit loading state, errors, and focus behavior consistent with the existing dialog. Do not run automated validation without user authorization.
- [ ] Commit only this task's files if implementation commits are requested.

### Task 4: People actions and history UI

**Files:**
- Modify: `pixelpopup-frontend/src/features/personal-dashboard/views/PeopleView.jsx`
- Modify: `pixelpopup-frontend/src/features/personal-dashboard/views/PersonHistoryView.jsx`
- Modify: `pixelpopup-frontend/src/features/personal-dashboard/components/RecordIdentity.jsx` only if it must display relationship metadata for contacts.

**Interfaces:**
- Consumes: Task 3 `openForm("person", record)`, `openForm("giving", { contact: id })`, and `openForm("loan", { contact: id })`; Task 2 People summary rows carry stable `key`, `id`, `name`, and relationship.
- Produces: one “Add record” menu with Giving and Loan; separate “Add person” action; independent people rows and editable person details.

- [ ] Define manual checks for the action menu on desktop/mobile, keyboard operation, zero-value person row, person-page edit, preselected person in a new record, and existing deep links.
- [ ] Replace the two top-level financial buttons with one Radix dropdown menu and Add person. Reuse the same menu on history, preselecting the current contact.
- [ ] Show name and relationship in person rows/history without changing financial column meanings. Provide an empty-history state and an Edit person action on the history page.
- [ ] Review the targeted diff for alignment, semantic buttons, focus, and mobile wrapping. Do not run browser automation or builds without user authorization.
- [ ] Commit only this task's files if implementation commits are requested.

## Handoff

After implementation, report modified files, migration command the user should run in their normal backend environment, and manual verification points. Do not push or alter unrelated worktree changes.
