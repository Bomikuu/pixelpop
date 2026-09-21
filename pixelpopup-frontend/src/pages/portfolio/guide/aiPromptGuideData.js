export const PROMPT_SCENARIOS = [
  {
    id: "ui",
    label: "UI change",
    vague: "Improve the page and make it look better.",
    specific: `Task: Improve the CTA in src/pages/asta/AstaHero.jsx.

Requirements:
- Keep the current layout, copy, route, and click handler.
- Use the existing Tailwind design tokens.
- Increase contrast and make the primary action easier to scan.
- Do not edit other sections or fix unrelated issues.

Verification:
- Do not run builds, tests, browser automation, or terminal commands.
- Review the changed component only and report the file modified.`,
    lesson: "Name the surface, protected behavior, visual goal, and verification boundary.",
  },
  {
    id: "bug",
    label: "Bug fix",
    vague: "The modal is broken. Fix it.",
    specific: `Task: Center the existing Start a Project modal at desktop and mobile widths.

Scope:
- Edit only src/pages/asta/components/StartProjectModal.jsx.
- Preserve the form fields, validation, submission behavior, and close controls.

Expected behavior:
- The dialog stays centered in the viewport.
- Its content scrolls internally when taller than the viewport.
- The page behind it does not scroll.

Verification:
- Do not run tests or a build.
- Review the changed file and provide a short manual check list.`,
    lesson: "Describe the observed failure, expected behavior, exact scope, and what must survive.",
  },
  {
    id: "content",
    label: "Content update",
    vague: "Add these people to the team page.",
    specific: `Task: Add the supplied team members to src/data/team.json.

Source of truth:
- Use only the names, roles, links, email addresses, and image paths supplied in this prompt.
- Create a short professional bio for each person.
- Do not search for or infer additional personal information.

Implementation:
- Preserve the current JSON schema.
- Keep entries ordered by the existing order field.
- Do not edit the team page component.

Verification:
- No build or tests.
- Confirm that the JSON remains valid.`,
    lesson: "Declare supplied content as authoritative data and say whether outside research is allowed.",
  },
];

export const PROMPT_FIELDS = [
  {
    id: "objective",
    label: "Exact task",
    placeholder: "Make the Visit Walkspan CTA more prominent",
    hint: "One concrete outcome, written as a verb plus an object.",
  },
  {
    id: "scope",
    label: "Allowed file or route",
    placeholder: "src/pages/portfolio/components/SelectedWorks.jsx",
    hint: "An exact path is cheaper than asking the agent to search the repository.",
  },
  {
    id: "source",
    label: "Authoritative source data",
    placeholder: "Use the five screenshots and copy supplied in this prompt only.",
    hint: "State what is absolute data and where, if anywhere, the agent may look for more.",
  },
  {
    id: "preserve",
    label: "What must not change",
    placeholder: "Keep layout, route, carousel behavior, and existing click handler.",
    hint: "Protected behavior prevents accidental redesigns and refactors.",
  },
  {
    id: "acceptance",
    label: "Definition of done",
    placeholder: "CTA has stronger contrast, remains keyboard accessible, and does not shift layout.",
    hint: "Describe visible or testable outcomes, not taste words like better or modern.",
  },
];

export const SKILL_GUIDE = [
  {
    id: "impeccable",
    name: "impeccable",
    category: "Design polish",
    useWhen: "Auditing, redesigning, clarifying, or polishing an existing interface.",
    invocation: "$impeccable Polish the ASTA hero while preserving its layout and behavior.",
    caution: "Give it a visual target and explicit protected behavior. Do not use it for a copy-only edit.",
  },
  {
    id: "frontend-ui-engineering",
    name: "frontend-ui-engineering",
    category: "Production UI",
    useWhen: "Building responsive components, pages, stateful interactions, or accessibility behavior.",
    invocation: "$frontend-ui-engineering Implement the responsive services dropdown using existing routes.",
    caution: "Name the framework, target component, state behavior, and accessibility expectations.",
  },
  {
    id: "api-design",
    name: "api-and-interface-design",
    category: "Contracts",
    useWhen: "Defining REST, GraphQL, module, or frontend-to-backend contracts.",
    invocation: "$api-and-interface-design Define the request and response contract for project inquiries.",
    caution: "Provide current payloads and compatibility constraints before asking for a new contract.",
  },
  {
    id: "debugging",
    name: "debugging-and-error-recovery",
    category: "Root cause",
    useWhen: "A build, test, request, or runtime behavior fails and the cause is not obvious.",
    invocation: "$debugging-and-error-recovery Diagnose this migration error. Explain the cause before changing files.",
    caution: "Include the exact error, reproduction command, and what changed recently.",
  },
  {
    id: "security",
    name: "security-and-hardening",
    category: "Security",
    useWhen: "Handling forms, untrusted input, authentication, sessions, secrets, or third-party calls.",
    invocation: "$security-and-hardening Review this public contact endpoint for abuse and injection risks.",
    caution: "State the threat model and trust boundary. Security work needs more than visual testing.",
  },
  {
    id: "performance",
    name: "performance-optimization",
    category: "Performance",
    useWhen: "Profiling slow rendering, APIs, queries, bundles, or Core Web Vitals.",
    invocation: "$performance-optimization Profile the project carousel and propose evidence-based fixes.",
    caution: "Ask for measurement before optimization. Do not assume the largest file is the bottleneck.",
  },
  {
    id: "source-driven",
    name: "source-driven-development",
    category: "Official guidance",
    useWhen: "Correctness depends on current framework, library, browser, or platform documentation.",
    invocation: "$source-driven-development Implement the API using the current official framework docs.",
    caution: "Use when documentation can change. It adds research cost, so skip it for obvious local edits.",
  },
];

export const AGENT_MD_TEMPLATE = `# Project instructions

## Task scope and token discipline

- Treat the user's prompt and supplied content as authoritative data.
- Do not search for another source unless the prompt names the exact file, route, URL, or system to inspect.
- Stay focused on the requested task and its directly affected files.
- Do not fix unrelated bugs, warnings, refactors, or visual inconsistencies unless they block the requested work.
- If the user names a file, treat that file as the editable scope. Ask before modifying another file.
- Prefer the smallest correct change over a broad rewrite.

## Inspection and terminal usage

- Inspect only the minimum context required to understand the requested change.
- Do not run terminal commands unless the prompt explicitly requests them or they are required to locate the named implementation.
- When a command is necessary, use one narrow command instead of a broad repository scan.
- Do not inspect repository history, archived tasks, or unrelated modules by default.

## Builds and testing

- Do not run builds, tests, linting, type checks, browser automation, Docker, or deployment commands unless the user explicitly asks.
- If verification is requested, run the narrowest check that proves the requested behavior.
- If the user will test manually, provide a concise manual verification list and stop.

## Implementation

- Read the current implementation before editing it.
- Preserve existing routes, handlers, data contracts, state, validation, and accessibility behavior unless the prompt says otherwise.
- Reuse existing components, utilities, design tokens, and project conventions.
- Do not add dependencies unless the requested feature cannot reasonably be implemented without one. Ask first.
- Ask a concise question when a missing decision would materially change the result.

## Skill routing

- Use \`impeccable\` for interface critique, redesign, polish, hierarchy, spacing, motion, or visual refinement.
- Use \`frontend-ui-engineering\` for production components, responsive behavior, stateful interaction, and accessibility.
- Use \`api-and-interface-design\` for REST, GraphQL, module boundaries, and public contracts.
- Use \`debugging-and-error-recovery\` when the root cause of a failure is unknown.
- Use \`security-and-hardening\` for untrusted input, authentication, sessions, secrets, and external integrations.
- Use \`performance-optimization\` only when performance is a stated requirement or measured problem.
- Use \`source-driven-development\` when current official documentation is necessary for correctness.
- Do not load overlapping skills automatically for a simple local change.

## Completion

- Report what changed and which files were modified.
- State which checks were run. If none were requested, say so plainly.
- Stop when the requested work is complete.`;
