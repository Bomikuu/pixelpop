# Personal Dashboard Form Modules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give each personal-dashboard form its own file and make Brainstorming forms use the same modal shell and field controls as existing dashboard forms.

**Architecture:** Keep the existing `FormDialog` props and `formDefinition(entity, record)` export stable while extracting pure submission rules, shared presentation, and one module per actual form. Migrate modules incrementally through a registry with a fallback to the existing definitions until each group is moved. Brainstorming retains its API/state flow but delegates each form to a feature-local component built on the shared shell and controls.

**Tech Stack:** React 19, Vite, Tailwind CSS, existing Radix/shadcn-style controls and Lucide; no new dependency or backend change.

**Spec:** `docs/superpowers/specs/2026-10-01-personal-dashboard-form-modules-design.md`

## Global Constraints

- Preserve every existing form's labels, defaults, field order, conditions, validation, endpoint, HTTP method, body, recurrence, request IDs, toast, account checks, and focus/discard behavior.
- Keep the existing `personal-dashboard` modal surface, white background, `max-h-[90dvh]`, `lg:w-[75vw] lg:max-w-[75vw]`, responsive grid, Save icon, and `Input`, `Textarea`, `SelectableField`, `Button`, and Radix primitives.
- One actual form per module file; task/reminder and bill/subscription/payment remain variations within their respective existing flows. Fund and coverage, expense and income, task and bill, schedule and premium schedule have separate files.
- No finance API, Django model, database, public route, business-dashboard, or dependency change. Preserve the already-modified `backendv2/db.sqlite3`; never stage or commit it.
- Project instructions prohibit running tests, builds, broad linting, or browser automation unless the owner explicitly requests them. Test steps below create regression coverage but verification commands stay **deferred**. Use source comparison and `git diff --check` for each batch.

## Review Focus

1. An edited expense still PATCHes its record without a new `request_id`, while a new expense POST includes one; pin in Task 1's submission test.
2. A repeating task without a due date still receives the current inline validation and never emits a schedule payload; pin in Task 4's planning test.
3. An account selection with insufficient balance still blocks saving and shows the projection; pin the selection rule in Task 1's pure test and inspect the field state in Task 2.
4. Closing a changed form still offers discard confirmation and returns focus to its opener; inspect Task 2's shell and include the modal checklist in Task 6.
5. Invalid Brainstorming JSON keeps the pasted text and error visible in the same 75%-width modal; inspect Task 6's import form and preserve its current API behavior.

---

### Task 1: Extract pure submission and account rules

**Files:**
- Create: `pixelpopup-frontend/src/features/personal-dashboard/components/forms/formSubmission.js`
- Create: `pixelpopup-frontend/src/features/personal-dashboard/components/forms/accountFlow.js`
- Create: `pixelpopup-frontend/src/features/personal-dashboard/components/forms/formSubmission.test.mjs`
- Create: `pixelpopup-frontend/src/features/personal-dashboard/components/forms/accountFlow.test.mjs`
- Modify: `pixelpopup-frontend/src/features/personal-dashboard/components/forms/FormDialog.jsx`

**Interfaces:** `buildSubmission({ entity, record, definition, fields, values, requestId }) -> { path, method, body, notification }` contains the current generic field serialization, path/method resolution, request-ID rule, repeat-to-schedule conversion, and current toast context. `accountFlow(entity, field, values, record) -> "in" | "out" | "cardPayment" | null` and `accountState({ entity, field, values, record, accounts, amount, project }) -> { direction, selected, existingAmount, blocked, previewVisible }` move current account rules without changing them; `project` receives the existing `accountProjection` function from the UI host so the rule stays independently testable. `FormDialog` retains all current props.

- [ ] Write pure tests asserting new versus edited expense request IDs/methods, variable-amount bill payload, repeating task schedule payload, unchanged account-flow directions, and insufficient available balance via an injected projection result. Do not run yet.
- [ ] Move the corresponding existing code verbatim into named pure functions, keeping the same field-to-body conversion and schedule keys; change `FormDialog` to call them.
- [ ] Compare the old and new payload paths for expense, income, task, bill, fund movement, settlement, adjustment, and premium schedule; run only `git diff --check`.
- [ ] Commit this slice with explicit paths, excluding `backendv2/db.sqlite3`.

### Task 2: Extract the canonical modal shell and field renderer

**Files:**
- Create: `pixelpopup-frontend/src/features/personal-dashboard/components/forms/FormModalShell.jsx`
- Create: `pixelpopup-frontend/src/features/personal-dashboard/components/forms/FormField.jsx`
- Create: `pixelpopup-frontend/src/features/personal-dashboard/components/forms/InlinePersonCreator.jsx`
- Create: `pixelpopup-frontend/src/features/personal-dashboard/components/forms/AccountFormPreview.jsx`
- Modify: `pixelpopup-frontend/src/features/personal-dashboard/components/forms/FormDialog.jsx`

**Interfaces:** `FormModalShell({ title, description, busy, dirty, saveLabel, onSubmit, onCancel, onCloseAutoFocus, children })` owns the existing dialog/alert-dialog surface and footer. `FormField({ field, value, values, options, error, disabled, onChange, accountPreview, children })` owns labels, `SelectableField`/`Input`/`Textarea`, hints, and errors. `InlinePersonCreator` keeps the current inline contact creation callback contract; `AccountFormPreview` keeps the current account-card preview. The host still calculates visible fields and source options.

- [ ] Extract shell markup, Save icon, 75%-width desktop sizing, dirty-close confirmation, and focus return without changing their behavior.
- [ ] Extract the single field renderer and its current width rules, selection tiles/dropdowns, institution path, and account preview; place inline-person and account-preview special sections in their focused files.
- [ ] Inspect keyboard, disabled, error, mobile column, account projection, and discard behavior against the pre-extraction source; run only `git diff --check`.
- [ ] Commit only shared presentation and host changes.

### Task 3: Establish the one-file-per-form registry and migrate money/people forms

**Files:**
- Create: `pixelpopup-frontend/src/features/personal-dashboard/components/forms/formFields.js`
- Create under `pixelpopup-frontend/src/features/personal-dashboard/components/forms/modules/`: `PersonForm.js`, `GivingForm.js`, `ExpenseForm.js`, `IncomeForm.js`, `LoanForm.js`, `MovementForm.js`, `SettlementForm.js`, `FundContributionForm.js`, `FundWithdrawalForm.js`
- Modify: `pixelpopup-frontend/src/features/personal-dashboard/components/forms/formDefinitions.js`
- Modify: `pixelpopup-frontend/src/features/personal-dashboard/components/forms/FormDialog.jsx`

**Interfaces:** Every module exports `definition(record) -> { title, endpoint, fields, method? }` and optional `validate({ values, record }) -> fieldErrors` / `prepareSubmission({ body, values, record }) -> body`. `formDefinition(entity, record)` stays exported and delegates migrated entities to a registry; unmigrated entities continue through the old branches. `formFields.js` exports the existing shared field constructors/presets without changing their values.

- [ ] Move common field definitions to `formFields.js`, then move each listed form's exact definition to its own file.
- [ ] Route only the migrated entities through the registry; keep the remaining `formDefinitions.js` branches functional until Tasks 4–5.
- [ ] Move only their existing entity-specific validation/body changes from the host to the owning form module; compare each field list and payload path with the old source.
- [ ] Run only `git diff --check`, then commit this independently usable slice.

### Task 4: Migrate task, bill, and recurring schedule forms

**Files:**
- Create under `pixelpopup-frontend/src/features/personal-dashboard/components/forms/modules/`: `TaskForm.js`, `BillForm.js`, `ScheduleForm.js`, `PremiumScheduleForm.js`
- Create: `pixelpopup-frontend/src/features/personal-dashboard/components/forms/RecurringBillPreset.jsx`
- Create: `pixelpopup-frontend/src/features/personal-dashboard/components/forms/planningForms.test.mjs`
- Modify: `pixelpopup-frontend/src/features/personal-dashboard/components/forms/formDefinitions.js`
- Modify: `pixelpopup-frontend/src/features/personal-dashboard/components/forms/FormDialog.jsx`

**Interfaces:** The registry selects `TaskForm` for `deadline` with `task|reminder`, `BillForm` for `bill|subscription|payment`, `PremiumScheduleForm` for `schedule` linked to a coverage, and `ScheduleForm` otherwise. The recurring-bill preset remains an optional top section owned by `BillForm`, using the existing `SelectableField` and `utilityPresets`.

- [ ] Write pure tests for optional undated tasks, required bill dates, due-time/recurrence date validation, variable bill defaults, and the unchanged premium schedule fields. Do not run yet.
- [ ] Move each planning definition and its form-specific validation/payload adjustment into the owning module; extract the preset UI into `RecurringBillPreset.jsx`.
- [ ] Confirm the task/bill mode selection still follows `record.kind` and the existing add-form entry point; compare the old and new fields/payloads, run only `git diff --check`.
- [ ] Commit this planning slice.

### Task 5: Migrate account, asset, fund, and settings forms

**Files:**
- Create under `pixelpopup-frontend/src/features/personal-dashboard/components/forms/modules/`: `AccountForm.js`, `FundForm.js`, `CoverageForm.js`, `AssetForm.js`, `AdjustmentForm.js`, `BudgetForm.js`, `CategoryForm.js`
- Modify: `pixelpopup-frontend/src/features/personal-dashboard/components/forms/formDefinitions.js`
- Modify: `pixelpopup-frontend/src/features/personal-dashboard/components/forms/FormDialog.jsx`

**Interfaces:** The registry selects `CoverageForm` only for an existing fund record whose `fund_type` is in `coverageTypes`; new and other fund records use `FundForm`, matching current behavior. Account-card preview and institution choices remain in the shared presentation files. After this task, `formDefinitions.js` is only the public dispatcher/registry, and `FormDialog.jsx` is orchestration rather than a catalogue of form-specific branches.

- [ ] Move each remaining definition and owning form-specific body rule to its module; preserve account/fund opening value semantics and coverage premium rules exactly.
- [ ] Remove only dead conditional branches from the old files, without altering consumers or unrelated forms.
- [ ] Compare the complete entity list against the original dispatcher and inspect all fields, defaults, and submit paths; run only `git diff --check`.
- [ ] Commit this slice.

### Task 6: Make Brainstorming forms use the shared system

**Files:**
- Create under `pixelpopup-frontend/src/features/personal-dashboard/components/brainstorm/forms/`: `BoardForm.jsx`, `GroupForm.jsx`, `IdeaForm.jsx`, `CarryForm.jsx`, `ImportForm.jsx`, `BrainstormConfirmDialog.jsx`
- Modify: `pixelpopup-frontend/src/features/personal-dashboard/views/BrainstormView.jsx`
- Reuse: `components/forms/FormModalShell.jsx`, `components/forms/FormField.jsx`, `components/SelectableField.jsx`

**Interfaces:** `BrainstormView` continues to own selection, filters, paging, request/mutate calls, and toast callbacks. Each new form receives `record`, `busy`, `error`, `onSave`, and `onCancel` as appropriate; it does not call the API. `ImportForm` additionally receives `rawJson`, `preview`, `onPreview`, and `onConfirm`, preserving text on errors. `BrainstormConfirmDialog` uses the dashboard's alert-dialog primitive for delete/deactivate.

- [ ] Move board, group, idea, carry, and import draft/markup out of the page into their dedicated files without changing API paths or payloads.
- [ ] Replace form-local input/select/textarea rendering with `FormField` and `SelectableField`; remove the page-local `Choice` helper, using existing `ui/select` directly for compact card/filter controls.
- [ ] Apply the canonical `FormModalShell` to all Brainstorming forms, including width, Save icon, error state, discard confirmation, focus return, and mobile layout; use `BrainstormConfirmDialog` for destructive decisions.
- [ ] Compare imported JSON failure recovery, carry optional date, edit status/group choices, and all modal states with the current implementation; run only `git diff --check`.
- [ ] Commit this slice and report that tests/build/browser automation were deferred under project instructions.

## Deferred verification if the owner later requests testing

- Run focused Node tests: `node --test src/features/personal-dashboard/components/forms/formSubmission.test.mjs src/features/personal-dashboard/components/forms/accountFlow.test.mjs src/features/personal-dashboard/components/forms/planningForms.test.mjs` from `pixelpopup-frontend/`.
- Then run a targeted frontend build or manual browser pass only with explicit owner approval. This plan does not authorize either by itself.
