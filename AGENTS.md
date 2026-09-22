# Project instructions

## Task scope and token discipline

- Stay focused on the requested task and its directly affected files.
- Do not fix unrelated bugs, warnings, refactors, or visual inconsistencies discovered during inspection unless the user explicitly asks for them or they block the requested work.
- Prefer the narrowest relevant validation needed to verify the requested behavior; record unrelated findings without expanding scope.
- Do not dispatch subagents for localized implementation or validation. Use them only when the user explicitly requests them or the task contains clearly independent workstreams that materially benefit from parallel execution.
- If a missing content or product decision would materially change the result, ask the user instead of expanding inspection, testing, or agent work to guess the answer.

## Design context

Before modifying any user-facing interface, read:

- `PRODUCT.md`
- `DESIGN.md`
- `DESIGN_GUIDELINES.md`

Treat these files as the source of truth for the product audience, visual language,
spacing, typography, colors, component styling, and interaction standards.

## Frontend workflow

For UI design, redesign, visual review, responsive layout, or component-polish tasks:

- Use the `impeccable` skill.
- Use the `frontend-ui-engineering` skill.
- Use the `design-taste-frontend` skill for landing pages, portfolio pages, and visual redesigns.
- Before implementing those surfaces, state the skill's one-line design read and choose explicit design variance, motion intensity, and visual density values from the brief.
- Run the `design-taste-frontend` pre-flight check before declaring frontend work complete. Project design documents and supplied screenshots remain the higher-priority visual source of truth.
- Inspect the existing implementation before changing it.
- Preserve existing behavior, routes, data flow, and functionality.
- Do not introduce a different visual style from the project design documents.
- Do not use excessive rounded cards, pills, gradients, shadows, or generic dashboard patterns.
- Treat attached screenshots as primary visual specifications when provided.

## Visual validation

A# AGENT.md

## Purpose

Work efficiently, stay within the user's requested scope, and make the smallest correct change.

The goal is **not** to minimize thinking. The goal is to minimize unnecessary actions, searches, commands, file changes, testing, narration, and token usage while still producing a correct result.

Use judgment. Be precise, not passive.

---

# 1. Core Operating Rule

Before taking action, identify:

1. What the user explicitly asked to change.
2. Which file(s) or component(s) are explicitly in scope.
3. Whether the request is clear enough to implement safely.
4. What minimum context is needed to make the change correctly.

Then make the smallest correct change.

Do not expand the task unless necessary.

---

# 2. Clarify When the Request Is Not Clear

If an important requirement is ambiguous, conflicting, or missing, ask the user before making assumptions.

Ask for clarification when the ambiguity could materially change:

- behavior
- UI structure
- data flow
- API behavior
- file scope
- component ownership
- expected output
- business logic

Do **not** ask questions about minor implementation details when the existing code already makes the intended pattern obvious.

Examples:

Good:

- The user asks to add a new status but does not define what the status should do.
- The requested change could reasonably belong to two different components.
- The requested behavior conflicts with the existing implementation.

Do not clarify unnecessarily:

- Existing spacing conventions make the appropriate spacing obvious.
- The user asks to make a button more prominent and the current design system already defines primary buttons.
- A screenshot clearly shows the requested placement.

When clarification is needed, ask a concise question and wait.

---

# 3. File Scope Is Strict

If the user specifies a file, treat that file as the editable scope.

Example:

> "Update `ClinicSettings.vue`."

Then:

- Read `ClinicSettings.vue`.
- Edit `ClinicSettings.vue`.
- Do not modify other files unless the user approves it.

You may inspect related code when necessary to understand references inside the specified file.

This includes:

- imported components
- imported utilities
- composables/hooks
- types/interfaces
- styles referenced by the file
- directly used API functions
- direct parent/child relationships when required to understand behavior

Reading or searching a related file does **not** automatically give permission to modify it.

If the requested change cannot be completed correctly without editing another file:

1. Explain which additional file needs to change.
2. Explain why in one or two sentences.
3. Ask the user for approval before editing it.

Do not silently broaden the edit scope.

---

# 4. When No File Is Specified

If the user does not specify a file:

1. Locate the most likely implementation using the narrowest available method.
2. Inspect the directly relevant file.
3. Follow direct references only when required.
4. Edit only the files necessary for the requested behavior.

Do not perform broad repository exploration before checking the obvious implementation.

Prefer:

`requested feature -> likely component -> direct dependencies`

Avoid:

`requested feature -> entire repository -> architecture history -> unrelated modules`

---

# 5. Search Discipline

Search only when search is needed.

Prefer narrow searches scoped to:

- the named file
- the relevant directory
- the exact component name
- the exact text shown in the UI
- a directly referenced symbol

Expand the search only when the narrow search does not find enough information.

Do not:

- search the whole repository using many loosely related keywords
- inspect old rollout summaries by default
- inspect historical task notes by default
- search unrelated backend/frontend areas
- crawl large directory trees without a reason
- repeatedly search for information already found

If the user specifies a file and the needed implementation is already visible there, do not search elsewhere.

---

# 6. Terminal and Command Usage

Do not use terminal/shell commands unless they are genuinely needed.

Prefer direct file reading/editing capabilities when available.

Do not run commands merely to:

- inspect something already visible
- confirm obvious file paths
- generate unnecessary context
- narrate progress
- inspect unrelated repository history
- collect project-wide statistics
- search documentation that is not needed
- run broad diagnostics for a local UI change

If a terminal command is necessary, use the smallest targeted command possible.

Examples of reasonable command use:

- locating a file when its location is unknown
- checking a direct reference that cannot otherwise be resolved
- inspecting a small relevant diff
- performing a user-requested command
- handling a task that inherently requires shell execution

Do not chain many commands when one targeted operation is sufficient.

---

# 7. No Automatic Testing

Do not run tests unless the user explicitly asks for testing.

This includes:

- unit tests
- integration tests
- end-to-end tests
- Playwright/Cypress
- full builds
- full type checks
- repository-wide linting
- test suites
- browser automation

The user may perform manual testing.

After making the change, you may mention what the user should manually verify if useful, but keep it concise.

Exception:

If a tool automatically performs a lightweight syntax or editor validation as part of saving/editing, that is acceptable.

Do not initiate additional testing commands unless requested.

---

# 8. Do Not Run Builds by Default

Do not run:

- `npm run build`
- `npm run test`
- `npm run lint`
- `npm run typecheck`
- `pytest`
- `docker compose`
- deployment commands
- CI commands

unless:

- the user explicitly requests them, or
- the task itself is specifically about those commands.

For ordinary code/UI changes, make the edit and stop.

---

# 9. Simple Task Fast Path

Treat the following as SIMPLE tasks unless evidence shows otherwise:

- copy/text changes
- adding screenshots or images
- changing spacing
- adjusting padding/margins
- changing typography
- changing colors
- making a CTA more prominent
- modifying an existing component
- adding/removing a small UI element
- minor responsive changes
- replacing an asset
- changing an icon
- adding content to an existing carousel
- adjusting an existing modal
- minor CSS/Tailwind changes
- small conditional rendering changes
- straightforward bug fixes with an obvious cause

For SIMPLE tasks:

1. Read the relevant implementation.
2. Understand the local pattern.
3. Make the requested change.
4. Review the changed code.
5. Stop.

Do not turn a simple task into an architecture exercise.

---

# 10. Complex Tasks

Use deeper investigation when the task actually requires it.

Examples:

- new architecture
- major feature spanning multiple systems
- database/schema changes
- API contract changes
- authentication/authorization changes
- difficult bugs with unknown root cause
- security-sensitive changes
- large refactors
- performance problems requiring profiling
- cross-module state changes
- major UI redesigns
- infrastructure/deployment work

For complex tasks, additional investigation is allowed, but it must remain relevant to the requested outcome.

Even for complex tasks, avoid unrelated exploration.

---

# 11. Skill and Instruction Loading

Do not load broad or overlapping skills merely because they are available.

A small UI task should not automatically trigger:

- brainstorming
- design-system analysis
- frontend architecture analysis
- project-history analysis
- generalized "best practices" workflows
- multiple overlapping UI/design skills

Use a specialized skill only when it materially helps complete the task.

Examples:

"Make this existing button more prominent."
-> No design skill needed.

"Add these screenshots to the current project carousel."
-> No architecture skill needed.

"Design a new application-wide component system."
-> Frontend architecture/design guidance may be useful.

"Redesign the full dashboard information hierarchy."
-> Design guidance may be useful.

Skills are references, not mandatory preprocessing.

---

# 12. Existing Code Is the Primary Source of Truth

When changing an existing feature:

- inspect the current implementation first
- preserve existing conventions
- reuse existing components
- reuse existing utilities
- reuse existing styles/classes
- follow the current data shape
- follow the established component structure

Do not introduce new abstractions when the existing implementation already solves the problem.

Do not refactor unrelated code while making a small change.

Do not "clean up" nearby code unless the user requests it or it is required for the change.

---

# 13. Preserve Project Conventions

Match the existing project's:

- naming
- indentation
- component patterns
- Tailwind conventions
- state-management patterns
- API patterns
- error handling
- file structure
- TypeScript style
- Vue/React conventions

Do not impose a different preferred architecture simply because it is theoretically cleaner.

Consistency with the existing codebase is usually more valuable than unnecessary rewrites.

---

# 14. Screenshot and UI Requests

When the user provides screenshots or visual references:

- treat them as authoritative references for the requested change
- use the user's explanation of what each screenshot represents
- integrate them into the existing design
- preserve the surrounding UI unless redesign was requested

Do not independently reinvent the feature.

Do not turn an asset insertion task into a full redesign.

If the user asks for minor UI improvement, keep it minor.

Examples:

"Make the Visit button more prominent."
-> Improve the existing CTA.

Do not:
-> redesign the entire project card
-> change the whole color system
-> introduce a new navigation structure

unless requested.

---

# 15. Minimal Change Principle

Prefer the smallest implementation that correctly satisfies the request.

Good:

- modify the existing condition
- add the new image to the existing data structure
- update the existing class list
- add a small reusable helper only when repetition warrants it

Avoid:

- replacing the whole component
- creating a new architecture
- rewriting unrelated logic
- changing multiple files unnecessarily
- introducing dependencies without need

A good change should have a clear relationship between every modified line and the user's request.

---

# 16. Do Not Over-Plan

For small tasks, do not create long implementation plans before editing.

Do not spend multiple messages explaining what you are about to do.

If the task is clear, execute it.

For larger tasks, a short plan is acceptable when it helps avoid mistakes.

Planning should be proportional to complexity.

---

# 17. Keep Tool Narration Minimal

Do not narrate routine actions such as:

- "I am now searching..."
- "I am loading..."
- "I am inspecting..."
- "I am checking the data shape..."
- "I am reading the frontend skill..."
- "I am examining the architecture..."

Only communicate during execution when:

- clarification is needed
- a blocker is found
- scope needs to expand
- the requested behavior conflicts with existing code
- a potentially destructive decision requires approval

Otherwise, perform the work quietly and report the result.

---

# 18. Do Not Use Historical Context Unless Needed

Do not automatically inspect:

- previous agent runs
- rollout summaries
- archived implementation notes
- task history
- old plans
- previous patches

Use historical context only when:

- the user explicitly refers to previous work
- the current source code is insufficient
- a regression requires understanding an earlier implementation
- a relevant project instruction explicitly requires it

Current source code is normally the source of truth.

---

# 19. Do Not Guess Business Logic

The agent should remain intelligent, but should not invent requirements.

If the code clearly establishes the intended pattern, follow it.

If business behavior is uncertain and the choice matters, ask.

Never silently invent:

- pricing behavior
- permission rules
- workflow rules
- API semantics
- database behavior
- user-role behavior
- validation rules

UI implementation details may be inferred from the existing design system when safe.

Business behavior should not be invented.

---

# 20. Permission to Investigate When Something Is Wrong

These restrictions should not make the agent blind.

If the expected implementation is not where it should be, or the requested change appears unsafe or impossible, investigate enough to understand why.

You may broaden investigation when:

- the referenced file does not contain the expected feature
- a direct dependency controls the requested behavior
- the code contains conflicting implementations
- a required type or API contract is unclear
- the requested change would obviously break existing behavior
- the user's assumption does not match the source code

When expanding investigation:

1. Stay focused on the specific problem.
2. Inspect the nearest relevant dependency first.
3. Stop once enough information is available.
4. Ask permission before modifying files outside the allowed edit scope.

The goal is **controlled investigation**, not zero investigation.

---

# 21. Error Handling

If you encounter an error while making the requested change:

- determine whether it is caused by your change
- inspect the directly relevant code
- fix it if it is within scope

If fixing it requires changing another file that the user did not authorize:

- explain the dependency
- ask before modifying that file

Do not launch broad diagnostics for unrelated pre-existing errors.

---

# 22. Dependencies

Do not add, remove, or upgrade dependencies unless the user explicitly requests it or the requested feature cannot reasonably be implemented without one.

If a dependency change is required:

- explain why
- ask before changing package files

Prefer existing dependencies and utilities.

---

# 23. Destructive or High-Risk Changes

Always ask before performing destructive or high-risk actions such as:

- deleting large amounts of code
- deleting files
- migrations that remove data
- force pushes
- resets
- dropping databases
- changing production infrastructure
- changing secrets
- modifying authentication/security behavior beyond the explicit request
- large dependency upgrades

Do not infer permission for destructive actions from a general feature request.

---

# 24. Completion Behavior

When the requested change is complete:

- summarize what changed briefly
- mention the file(s) modified
- mention any important implementation detail
- mention manual verification only if useful
- stop

Do not provide a long retrospective unless requested.

Example:

> Updated `WalkspanProject.vue`:
>
> - added the five Walkspan screenshots to the existing carousel
> - kept the existing project layout
> - made the Visit CTA more prominent
>
> No tests were run, per project instructions.

That is enough.

---

# 25. Priority Order

When deciding what to do, use this priority:

1. User's latest explicit instruction
2. User-specified file/edit scope
3. Existing project behavior and conventions
4. Directly relevant source code
5. Minimal correct implementation
6. Broader investigation only when necessary
7. General best practices

Do not override a clear user request with generic best practices unless the request would create a serious technical, security, or data-loss problem.

---

# 26. Default Decision Framework

Use this quick decision process:

### Is the request clear?

Yes:
-> continue.

No, and the ambiguity materially affects the result:
-> ask the user.

### Did the user specify a file?

Yes:
-> edit only that file.
-> inspect direct dependencies only if needed.
-> ask before editing another file.

No:
-> locate the most likely implementation narrowly.

### Is this a simple local change?

Yes:
-> inspect -> edit -> review -> stop.

No:
-> investigate only the relevant architecture.

### Did the user request tests?

Yes:
-> run the requested tests.

No:
-> do not run tests/builds.

### Is a terminal command necessary?

Yes:
-> run the smallest targeted command.

No:
-> do not use the terminal.

### Does the change require broader scope?

Yes:
-> explain why and ask before expanding edits.

No:
-> stay in scope.

---

# 27. The Main Principle

**Be intelligent in reasoning, conservative in scope, and economical in execution.**

The agent is expected to understand the code and notice problems.

The agent is **not** expected to explore everything it can access.

Think as much as needed.

Read as much as needed.

Change as little as needed.

Run as little as needed.

Ask when an important decision belongs to the user.

Then stop when the requested work is complete.
