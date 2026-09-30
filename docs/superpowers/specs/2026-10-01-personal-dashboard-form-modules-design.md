# Personal dashboard form modules and consistent modals — design spec

## Purpose

Make the personal dashboard's forms easier to locate, debug, and extend. The current `formDefinitions.js` (590 lines) contains definitions for unrelated record types, while `FormDialog.jsx` (733 lines) mixes rendering, account checks, one-off sections, payload mapping, recurrence, save feedback, and discard handling. The new Brainstorming dialogs also diverge from the established modal width, field controls, and discard behavior.

The owner wants **one file per actual form**, not merely one file per broad domain. This is an organization and consistency refactor: no new user-facing workflow, backend endpoint, database field, or business rule is authorized by this spec.

## Existing behavior to retain

- Preserve all current create/edit routes, labels, defaults, conditional fields, field ordering, validation, account-balance checks, recurrence behavior, request IDs, payloads, success notifications, inline person creation, institution selection, account-card preview, and premium schedule behavior.
- Keep the current personal-dashboard modal language: `personal-dashboard` theme, white surface, `max-h-[90dvh]`, roughly 75% desktop width, responsive field grid, existing `Input`, `Textarea`, `SelectableField`, `Button`, and the shared Radix dialog primitives.
- Keep Save icon, pending and error states, cancel behavior, dirty-form discard confirmation, focus restoration, keyboard operation, and the mobile single-column layout.
- Keep the local Brainstorming API calls and board/idea state unchanged. Only its form presentation and component ownership change.

## Module boundary

`FormDialog.jsx` stays as a small compatibility entry point used by the rest of the dashboard. It owns only dialog state, submit orchestration, and the selected form module. `formDefinitions.js` remains a thin compatibility dispatcher instead of retaining all definitions. Existing callers do not change.

Each actual finance form gets a dedicated module in `components/forms/modules/`: `PersonForm`, `GivingForm`, `FundForm`, `CoverageForm`, `FundContributionForm`, `FundWithdrawalForm`, `ExpenseForm`, `IncomeForm`, `TaskForm`, `BillForm`, `AccountForm`, `AssetForm`, `LoanForm`, `MovementForm`, `SettlementForm`, `AdjustmentForm`, `BudgetForm`, `CategoryForm`, `ScheduleForm`, and `PremiumScheduleForm`. Task/reminder can share `TaskForm`; bill/subscription/payment can share `BillForm`, because those options are variations within one existing form, not separate flows. The module registry selects by `entity` plus the existing record/kind. Each module owns its field definition and any form-specific validation or payload adjustment. Simple modules should remain small data definitions; special UI belongs alongside its owning module, not in a long conditional inside the host.

Shared behavior lives in a small set of focused files, not duplicated in modules:

- `formFields.js`: existing field constructors, common date/amount/category/account/repeat/reminder definitions and choice helpers.
- `FormField.jsx`: one field renderer using the existing `Input`, `Textarea`, `SelectableField`, account preview, labels, hints, and inline errors. It does not decide business rules.
- `FormModalShell.jsx`: the existing dialog dimensions, title/description, footer, Save button, cancel/discard handling, focus return, and responsive grid frame.
- `formSubmission.js`: the generic field-to-body conversion and HTTP method/path selection. Recurrence conversion and request-ID handling may be small named helpers here or in `scheduleSubmission.js`; only modules that use recurrence opt into it.
- Existing `PersonFields`, `AccountCardFace`, `AccountBalancePreview`, and `SelectableField` remain canonical. Do not replace or duplicate them.

The form-module contract is `definition(record)` plus optional `validate(context)`, `prepareSubmission(context)`, and an explicitly named extra-section component when a form truly needs one. The host runs shared validation, then the module-specific validation/adjustment, then one mutation/toast path. Modules must not call APIs directly. This keeps business rules near their form while preserving one place for generic error and pending behavior.

## Brainstorming dialogs

Move the handwritten form JSX out of `BrainstormView.jsx` into feature-local files under `components/brainstorm/forms/`: `BoardForm`, `GroupForm`, `IdeaForm`, `CarryForm`, and `ImportForm`. Each form uses `FormModalShell` and `FormField`/`SelectableField`; none defines a competing `Choice` or custom input/textarea renderer. Preserve the form's current fields, JSON preview/confirm flow, server errors with the pasted JSON and draft intact, and carry-to-task's optional date. Delete idea and deactivate board use the existing confirmation-dialog primitive with clear action labels; they do not masquerade as regular save forms.

The Brainstorming page continues to own board selection, filters, paging, list loading, and mutations. It passes the chosen record and callbacks to the focused form component. Remove the page-local `Choice` helper: form selections use `SelectableField`, while compact card/filter controls use the existing dashboard select primitive directly.

## Interaction and appearance

Operate mode: match the existing personal-dashboard visual system. Design variance **low**, motion intensity **low**, visual density **medium**. The refactor should make Brainstorming's modal indistinguishable from sibling dashboard forms in width, control height, spacing, button treatment, icon use, error presentation, and dismissal behavior. No new color system, decoration, dependency, or global CSS is needed.

## Migration strategy and safety

1. Extract shared shell and field rendering from the working `FormDialog` without changing its external props.
2. Move finance forms one by one to their individual modules, keeping the dispatcher and payload contracts stable. Consolidate only code that was already shared; avoid creating a generic form framework for hypothetical future fields.
3. Move Brainstorming's board/group/idea/carry/import forms to focused files and adopt the extracted shared controls and shell.
4. Review every existing form's field list and submit path against the pre-refactor code. Check modal width, mobile reflow, errors, dirty-close, and focus behavior by source inspection. Project instructions prohibit running tests or builds unless the owner explicitly requests them; no browser automation or full build is implied by this spec.

Do not modify `backendv2/db.sqlite3` or backend models/API during this refactor. Preserve its existing local changes. Do not touch unrelated dashboards or page styling.
