# Business weekly progress and daily check-in — design

Status: approved in-chat design; awaiting review of this written spec.

## Purpose and scope

Help Miku close each workday deliberately and see whether the current week's recorded actions are finished. Add a progress bar and a restrained completion celebration to Weekly actions. Add a five-question, date-specific end-of-day (EOD) check-in for the team member explicitly marked “This is me.” This is a private, manual tracker, not an automated assessment of someone's productivity. Do not infer an answer from PR, documentation, task, or message records.

The daily checklist is available in the Business dashboard; it sends no scheduled reminder, email, or notification. A fresh unsaved checklist appears on each new Asia/Manila calendar day. Saved days remain editable and visible in history. No placeholder answers or historical check-ins are seeded.

## Existing product constraints

- Preserve the existing `/business/*` shell, Django session/CSRF authentication, plan-scoped access, Tailwind/Shadcn patterns, and compact light/cobalt design (variance 2/10, motion 1/10, density 7/10).
- Use the current `WeeklyAction` records and week boundaries. A moved source is excluded from that week's progress; its follow-up belongs to its new week. Only `completed` counts as completed. Delegated, blocked, and in-progress actions remain unfinished.
- Do not alter finance data, public routes, or the 12-week plan's reporting and scoring rules. Do not add a performance score or claim that a check-in proves work was done.
- Create an additive Django migration for new data, but do not apply it to the user's database without a separate request. No dependency is required.

## Identity and persistence

Add a boolean “This is me” marker to `TeamMember`, allowing at most one marked member per plan. The plan owner selects an existing member on the Team Development page or creates one and then marks it. Do not guess identity from names or create a sample member. Marking another member as self clears the previous marker atomically and explicitly warns that existing dated check-ins remain attached to their original member; changing the marker does not silently rewrite history.

Add `DailyCheckIn` in `backendv2/leadership/`, with `plan`, `member`, `date`, five answer values, `created_at`, and `updated_at`. A unique constraint on `(plan, member, date)` prevents duplicate days. Each answer is one of `done`, `not_done`, or `not_applicable`; an unanswered field remains empty. The five stable prompts are:

1. Reviewed a PR?
2. Created or updated documentation?
3. Sent your EOD update?
4. Connected with at least one person?
5. Finished today's planned tasks?

The API permits saving today or an earlier date, never a future Manila date. It validates that the member belongs to the authenticated owner's active plan and that every answer uses a supported value. Reads and writes are private and plan-scoped. Saving a new day creates one row; later changes update that row. Deleting a member with check-in history is blocked to preserve the history. The frontend does not expose check-in deletion in this iteration.

## Weekly actions progress

The Weekly actions panel, including its current-week and roadmap-week appearances, shows `completed / active` and a labeled progress bar. The denominator includes this week's non-moved actions, not all roadmap actions. With no actions, show “No actions to track” rather than 100% or a celebration. When all active actions are completed, switch to a compact green completion container with a check/sparkle icon and copy such as “Week complete — great work closing every action.” The completed state remains visible on return; any entrance motion is brief, non-essential, and removed under `prefers-reduced-motion`. Reopening or adding an unfinished action returns the normal progress state.

## Daily check-in experience

On This Week, place one compact EOD panel after Weekly actions. It identifies the Manila date, shows the five prompts as accessible selectable choices, an explicit Save check-in button, and a factual count of Done responses against applicable prompts. The same check-in is available on the marked member's detail page, where dated history appears newest first in a bounded, paginated list. Non-self member pages do not show the owner's EOD checklist. If no member is marked, show a direct link to Team Development with guidance to mark “This is me”; do not create records under an arbitrary member. Daily check-ins remain available on the member page before or after the 12-week action window while the plan is active.

Unanswered or Not done items keep the day incomplete. Not applicable is excluded from the applicable-item denominator. A day is complete only when every applicable item is Done **and at least one item is applicable**. If all five are Not applicable, show a neutral “No applicable items recorded” state rather than a green completion claim. The completed day's container is green with the copy “Good work today — you closed the loop.” An incomplete day's container is softly red with “A few things are still open — choose what to improve tomorrow.” The title and counts also communicate status without relying on color. Today can show “Keep going” until saved; past incomplete days use the improvement wording. History shows the saved date, completion count, and green/red status at a glance, with an edit path.

The panel uses an explicit save action consistent with other Business forms: disabled/loading state during save, inline recoverable errors, success toast, and no lost draft on request failure. Reopening today's page loads the saved answers. A local midnight rollover shows a fresh day while retaining yesterday's record. A date cannot be selected or saved in the future.

## Validation and edge cases

- The backend resolves the Manila date; client time cannot make a future or duplicate day valid.
- A second save for the same member/date updates the existing check-in, never creates another record.
- Switching “This is me” does not transfer historical check-ins or expose another plan's member data.
- Weekly progress updates after action completion, reopening, carry, deletion, or addition; zero actions never triggers celebration.
- Missing self marker, empty history, network failure, invalid answer, and another-plan member IDs each have a clear state or error.
- Keyboard users can operate all choices and Save; focus remains visible. Green/red containers include text and icons. Reduced motion removes celebratory movement.
- Per project instruction, implementation may inspect source and diff but must not run tests, build, lint, or browser automation unless the user explicitly requests testing.
