# People directory for Giving & Loans

## Goal

People can be saved before any money is recorded. Giving and loan records select the same saved person, so their history remains together even if their name or relationship changes. The People & money page uses one action for a financial record and a separate action to add a person.

## Chosen approach

Add a private `Person` model and link giving transactions and loans to it. A name-only directory would preserve the current matching problem when a name changes; a frontend-only list could not persist independent people. Existing records are backfilled into the directory, without deleting or changing amounts, account balances, or repayment history.

## Data and migration

- `Person`: stable opaque key, name (required, trimmed, case-insensitively unique), relationship (required), optional notes, and timestamps. Relationship choices: Mother, Father, Parent, Sibling, Partner, Child, Friend, Colleague, Other. `Other` may carry a short custom label. Do not collect phone, email, or address without a demonstrated need.
- Add nullable `contact` foreign keys to `LoanReceivable` and `Transaction`. For transactions, the link is populated only for recipient-tagged giving expenses. Existing `person` and `recipient` text fields remain for compatibility while the relationship moves to the foreign key.
- An additive data migration creates one person per distinct, case-insensitively matched existing giving recipient or loan person, links their records, and preserves their old salted-name key for existing person-history URLs. A newly created person receives a stable opaque key that does not change on rename. If legacy spellings differ only by case or surrounding whitespace, merge them; do not guess that different names are the same person.
- Records with no person remain ordinary transactions. Independent people appear in the People list and have a zero-valued summary and an empty history state.

## API behavior

- Add authenticated, private people list/create/detail/update endpoints. Validate the name and uniqueness; preserve the stable key on update. No delete action in this iteration, avoiding accidental loss of linked history.
- Giving and loan create/edit accept a saved person identifier. Keep read fields needed by existing lists, but use the linked person for grouping, filters, and person history. Reject an unknown identifier with a field error. Existing shared-bill participants are a different concept and are unchanged.
- Renaming a person updates the current display name for linked giving and loan records (including their compatibility text fields) without changing financial values. Relationship and notes edits do not affect money records.
- Refresh People data after a person or record is saved. Empty, loading, and failure states should remain explicit.

## Frontend interaction

- On People & money, replace the separate top-level “Add loan” and “Add giving” buttons with one “Add record” button and a menu with Giving and Loan. Add a distinct “Add person” button beside it. Keep the same pattern on a person's history page, with that person preselected when adding a record.
- The Add person form asks for name and relationship, plus optional notes. Relationship uses the existing custom selection control and a free-text label only when Other is chosen. Saved people can have their details edited from their history page.
- Giving and loan forms select from saved people, with an inline “Add person” path so a missing contact does not dead-end the form. Newly created people become immediately selectable. Existing independent people appear in the overview with zero totals until records are added.
- Keep the established compact, light dashboard visual language: one primary action at a time, clear labels, visible focus, keyboard-operable menus and dialogs, and no decorative motion. Responsive actions may wrap on narrow screens.

## Scope and verification

This change touches only the finance people model, additive migration, serializers/API/query grouping, and the People/Giving/Loan frontend flow. It does not change shared bills, repayments, financial calculations, authentication rules, or unrelated dashboard pages. Review the targeted diff and migration logic; run no tests or build unless the user requests them, per project instructions. Manual checks should cover independent creation, selecting a person for giving and a loan, old history URLs, rename behavior, and duplicate-name feedback.
