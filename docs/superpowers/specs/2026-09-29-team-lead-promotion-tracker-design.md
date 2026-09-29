# Team Lead Promotion Tracker — design

Status: approved design; native implementation added, pending database migration and runtime verification.

## Purpose and scope

Build a private Business dashboard for Miku's 12-week path from senior developer to team leader. The tracker should answer what leadership systems are being built, what matters this week, whether the team is adopting them, what outcomes changed, what evidence exists for promotion, and whether the team can operate without depending on one person. It is not a project-management board or a numerical leadership grade.

The initial product is single-user and manually maintained. Records are scoped to the authenticated plan owner; team members are named subjects and owners inside the plan, not login accounts. Model relationships must allow plan membership and shared editing to be added later without merging business records into finance or rewriting ownership semantics. Do not expose public links or invent integrations with GitHub, Slack, Notion, Search Console, Ahrefs, or PostHog in this release. Store external URLs as evidence and enter metrics manually.

The supplied Network/Cortico roadmap is editable starter content, not proof of completed work. Example counts, percentages, names such as Developer A, and business metrics must never appear as actual results. The user chooses the plan's start date and team name on first visit. Week 1 starts on that local date; each successive week is the next seven-day interval in Asia/Manila. The supplied “90-Day Plan” title names a 12-week program; the tracked weeks span 84 days, with no invented Week 13 or six-day action schedule. Before the start date, show the upcoming start; after day 84, show the completed plan and preserve history. The start date is fixed once the plan contains records to avoid silently moving historical weeks.

## Architecture and access

- Frontend route: `/business/*`, with a compact link between the Personal and Business workspaces. Keep the existing `/dashboard/*` behavior intact.
- Backend: new `backendv2/leadership/` Django app with its own models, migrations, serializers, views, and `/api/v1/leadership/` routes. Do not put leadership tables into `finance.models` or couple leadership APIs to finance calculations.
- Use the existing Django session login and CSRF model. All reads and writes require authentication and filter by plan owner. Validate every related object against the same plan; knowing an ID must not grant access to another plan's data. A future collaborator can be represented by a plan membership relation later, with authorization checked centrally.
- Reuse existing dashboard theme tokens, Instrument Sans, Lucide, Tailwind utilities, compatible shadcn/Radix controls, and generic summary/chart/panel patterns where they truly fit. Do not copy finance-specific accounting behavior or refactor the personal dashboard shell wholesale. No new visual identity or component dependency is required.
- Additive migrations may be created during implementation; do not apply them to the user's database automatically. No database reset or sample business records.

## Navigation and page hierarchy

The business sidebar contains these destinations, grouped for scanability: Overview, This Week, 90-Day Plan, Team Goals, PR & Quality, Metrics, Team Development, Delegation, Processes, Documentation, Evidence, Reflection. Show a small progress indicator only where a denominator or completed review exists. The sidebar collapses like the personal dashboard and becomes a usable mobile menu. Each destination has its own URL, accessible page heading, loading/empty/error state, and clear add/edit action.

The first viewport of Overview is operational, not a marketing hero: a compact “Road to Team Leader” heading, subtitle from the supplied brief, calculated week and phase, then four equal priority summary tiles. The priority measures are weekly actions completed, processes adopted, evidence items, and team members holding meaningful ownership. A smaller secondary row may show processes introduced and weekly reporting streak. All measures are computed from saved records and have explicit labels and denominators. No sample values or fabricated leadership score. Below, show this week's 5–8 highest-priority actions, current phase goal, created-versus-adopted processes, real metric movement, and evidence or independence gaps. The longer details belong to their pages.

The surface uses the established light/cobalt personal-dashboard language: white panels on a soft field, thin borders, compact cards, minimal radius, restrained hover/focus feedback, small semantic badges, and Lucide icons. Design variance 2/10, motion intensity 1/10, visual density 7/10. No giant hero cards, glossy gradients, gamification, motivational filler, or unnecessary animations. On narrow screens, stacked panels and scrollable tables preserve access to every field and action.

## Plan and action model

`LeadershipPlan` has an owner, team name, start date, state, and timestamps. A user initially has one active plan, but records attach to a plan rather than a global user singleton. The six phase definitions and supplied checklist are versioned seed templates. On setup, create editable plan-specific action instances distributed across their two-week phase so the current-week list remains approximately 5–8 important actions. Keep the source text of the requested checklist and success criteria; do not mark any item complete or seed example outcomes.

Each weekly action stores plan, planned week, current week, phase, title, optional description, owner/team member, due date, priority, status (`not_started`, `in_progress`, `blocked`, `completed`, `delegated`, `moved`), notes, evidence URLs, and optional leadership result. Completion is persistent. Custom actions use the same model. Expandable rows expose fields without turning the overview into a full form.

Moving an unfinished action creates a linked follow-up in the next week and marks the source `moved`; the original week and its notes remain visible. A lineage/root key ensures plan progress counts the action once, not once per rollover. Completed actions cannot be moved without reopening them explicitly. The week view clearly distinguishes planned, carried, delegated, blocked, and completed items. Roadmap progress is labeled as action completion, not promotion readiness.

`TeamGoal` stores week, owner, desired outcome, success measure, linked actions, and an end-of-week outcome note. Only one goal is marked primary per week. The supplied goal-oriented examples are guidance, not seeded claims of work done.

## Measurements and reporting

`Process` records the standard introduced, creation date, owner, description, and evidence. Dated `ProcessObservation` records whether the team is using it, numerator/denominator when measured, notes, and evidence. “Created” and “adopted” are separate fields and summary counts. Show a consistency percentage only when a meaningful denominator exists; otherwise use a qualitative state (`Healthy`, `Improving`, `Needs attention`, or `Not measured`) with the observation rationale. Progress bars are sparse and never imply precision unsupported by data.

`MetricDefinition` supplies name, unit, value type, and desired direction. Seed names but no values for PQL, booking requests/conversions, Search Console clicks/impressions/CTR/position, Ahrefs keywords, organic pages, and useful product-usage/funnel metrics. `MetricEntry` stores a week, value or numerator/denominator, source URL, explanation of movement, and next action. Charts compare actual current and previous entries, show gaps rather than zeros for missing weeks, and link engineering work → metric change → company-impact note. Avoid causal claims without a recorded explanation.

The PR & Quality page has editable quality indicators (template compliance, linked ticket, QA instructions, another developer's review, CI before merge, applicable screenshots, test expectations, documentation). Dated observations store checked/eligible counts or a clearly labeled manual value, plus a target where defined. `PRReview` records PR name and URL, developer, reviewer, outcome, coaching note, and evidence. Visual emphasis is on distributed review culture rather than how many reviews Miku personally performed.

`WeeklyReport` stores week, report date, wins, metrics narrative, changes, learnings, next actions, Slack link, and the supplied recurring Tuesday checklist. The Tuesday checklist appears for eligible weeks from the reporting phase onward, with its own persistent completion. A submitted report counts toward the consecutive-week streak even if late; a past week without a submitted report is shown as missed. Future weeks never count as missed. The report is saved historically and can be edited with a recorded update time.

## People, independence, and evidence

`TeamMember` stores name and optional role. A strength-map record for each member stores strengths, developing areas, and ownership opportunities. No placeholder people are created as real team members.

`Delegation` stores the work, original and new owner, Miku's role, notes, progress, evidence, and the six requested milestones: context explained, ownership given, proposal reviewed, independent implementation, presentation, and maintenance without Miku. It records whether Miku took the work back, with an explanation. Ownership counts use distinct people with active meaningful delegation, not assigned tasks alone.

`KnowledgeItem` stores the knowledge/process, original owner, documentation status and URL, backup owner, whether the backup has performed it, and notes. “Single point of failure” is shown when important knowledge lacks a tested backup, including when documentation exists but has not been exercised. The final absence test records Yes/Partially/No and what still depends on Miku.

`FrictionItem` stores recurring friction, frequency, impact, proposed improvement, owner, status, and observed result. The page favors small repeatable fixes over invented automation.

`LeadershipEvidence` stores date, competency (the supplied 12 options), problem, action, result, evidence link, and affected person/team, with optional links to a weekly action, process, delegation, or metric. Evidence details are editable and searchable/filterable. Blank results stay blank; examples in the brief do not become claims.

`LeadershipHealthAssessment` stores one of Strong Evidence, Some Evidence, Needs More Evidence, or Not Started for each of Process, Coaching, Delegation, Measurement, Documentation, Communication, and Team Independence. The user selects a label and explains why with linked evidence; no hidden numerical scoring rule. Clicking a category reveals the note and evidence.

`MonthlyReflection` stores month, Yes/Partially/No plus notes for each of the eight supplied readiness questions. Historical months remain visible. `WeeklyLeadershipReview` stores the seven supplied prompts for each week, a submitted timestamp, and later update time. These review records remain available after the 12-week period.

## Interaction and state contracts

- First-run setup is required before plan data is shown. If setup fails, preserve the chosen values and show a recoverable inline error.
- Explicit Save/Cancel actions for edits; saving states keep button size stable, errors identify fields, and success uses the dashboard toast pattern. Confirm destructive changes and warn before discarding a dirty draft. Avoid duplicating the same add action in header and section content.
- Links and evidence URLs are optional, validated as URLs, and rendered safely with descriptive labels. Neither a URL nor a claim is automatically verified.
- Tables/lists provide search or scoped filters when useful, pagination or bounded navigation for growing history, and clear no-records versus no-results states. Buttons have icons where the established dashboard pattern calls for them; icons are never the sole label for important actions.
- Use text plus icon/badge for status and urgency, never color alone. Charts have a readable accompanying data table and do not plot missing measurements as zero. Respect keyboard focus and reduced-motion preferences.
- The current-week view refreshes when the date changes in Asia/Manila; it does not silently roll or complete an action. Week boundaries, late reports, and plan completion are calculated consistently on the server.
- Permission failure shows a private-session sign-in state; loading and recoverable network failures never display stale business records as if current.

## Acceptance and boundaries

The requested 12 destinations, starter roadmap, editable records, persistence, rollovers, manual measurements/charts, historical reviews/reflections, and private access are in scope. Live third-party integrations, team login/collaboration, public sharing, automated scoring, calendar synchronization, and production deployment are out of scope. The implementation should not alter personal finance calculations or public SEO routes.

Verification should cover ownership isolation, week boundary math, rollover lineage, reporting streaks, data-entry validation, summary derivations, chart empty states, and responsive/keyboard behavior. Per project instruction, do not run tests, a build, or browser automation unless the user explicitly authorizes it; static source and diff review is allowed. Do not migrate or mutate the user's current database during implementation without a specific request.
