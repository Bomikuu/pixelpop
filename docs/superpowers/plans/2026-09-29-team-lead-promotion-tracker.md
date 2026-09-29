# Team Lead Promotion Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a private, persistent 12-week Business dashboard for tracking leadership actions, process adoption, measurable outcomes, team independence, and promotion evidence.

**Architecture:** Add an owner-scoped `leadership` Django app under `backendv2/` and a separate `/business/*` React feature. Seed editable roadmap actions at first-run setup; derive weeks and all summaries from saved records. Reuse the personal dashboard's theme, generic shadcn/Radix controls, Lucide icons, and compatible tiles without coupling business data to finance.

**Tech Stack:** Django 5, Django REST Framework, SQLite/PostgreSQL-compatible models, React 19, Vite, Tailwind CSS, existing shadcn/Radix components, Recharts, Lucide.

**Spec:** `docs/superpowers/specs/2026-09-29-team-lead-promotion-tracker-design.md`

## Global Constraints

- Private first: Django session authentication, CSRF on mutations, owner-filtered reads/writes, and same-plan validation for every related ID. No public share links or team logins.
- Route `/business/*`; API prefix `/api/v1/leadership/`; new `backendv2/leadership/` app. Do not alter finance calculations or public SEO routes.
- First-run setup chooses start date and team name. Week 1 is the selected local date through day 7 in Asia/Manila; 12 seven-day weeks end after day 84. “90-Day Plan” is the program label, not an invented Week 13.
- Seed the supplied six phases, checklist, success criteria, and metric names, but no completed work, values, people, examples, or evidence. Missing measurements are absent, never zero.
- Action states: `not_started`, `in_progress`, `blocked`, `completed`, `delegated`, `moved`. Rollover preserves source history and one count per lineage.
- Dashboard world: white/light gray, cobalt, Instrument Sans, compact borders/cards, Lucide, restrained status accents; variance 2/10, motion 1/10, density 7/10. Summary tiles follow the existing four-primary-then-smaller-secondary pattern.
- No new frontend package. Use existing shadcn/Radix controls and Recharts. Do not apply migrations, run tests/build/lint, or automate a browser unless the user explicitly authorizes it. Test commands below are prepared verification gates, not automatic execution authority.
- Preserve the dirty worktree. Stage and commit only files named by each task; never bundle pre-existing unrelated edits.

## Review Focus

1. A start date near Manila midnight and days −1, 0, 83, 84 must select upcoming/Week 1/Week 12/finished without an extra week (Task 1 test).
2. A second authenticated user must not read, update, or attach a first user's plan, action, person, or evidence through guessed IDs (Tasks 1, 3, 7 tests).
3. Repeated action rollover must preserve every source row yet count one action lineage toward roadmap progress (Task 3 test).
4. Missing, zero-denominator, or sparse metric observations must not render fabricated zero values or percentages (Tasks 4 and 8 tests/review).
5. A late weekly report still counts toward a consecutive-report streak; future weeks cannot be marked missed (Task 5 test).

## File map and API contracts

Backend ownership: `leadership/models/plan.py` (plan), `execution.py` (goals/actions/reviews), `measurement.py` (process/metrics/quality/PR/report), `team.py` (members/delegation/knowledge/friction), `evidence.py` (evidence/health/reflection). `leadership/services/calendar.py` owns week and phase math; `seed.py` owns the editable starter template; `overview.py` owns aggregate cards and attention lists. `leadership/api/base.py` owns authentication, owner scoping, pagination, and no-store headers; API serializers and views split by matching domain under `leadership/api/`. `leadership/api/urls.py` owns the route map. `leadership/tests/` houses domain-level API/service tests. `backendv2/core/settings.py` and `core/urls.py` register the app and URL prefix. Additive migrations begin at `leadership/migrations/0001_initial.py`.

Frontend ownership: `src/features/business-dashboard/BusinessDashboard.jsx` owns the private shell and sidebar; `api.js` and `hooks/useBusinessData.js` own fetch, CSRF, cache invalidation, denied/loading/error states; `components/` owns business-specific forms, action rows, status labels, charts; `views/` owns one view per requested destination. Reuse generic components from `personal-dashboard/ui/`, `components/Panel.jsx`, and `components/SummaryTiles.jsx` only where their props and behavior fit. `src/pages/BusinessDashboardPage.jsx` is the lazy route wrapper. `src/App.jsx` mounts `/business/*` and excludes its private UI from public extras; the personal dashboard shell receives one Business workspace link.

Backend paths in tasks are relative to `backendv2/leadership/` unless prefixed with `backendv2/`; frontend `views/` and `components/` paths are relative to `pixelpopup-frontend/src/features/business-dashboard/` unless prefixed with `pixelpopup-frontend/`.

All list APIs use DRF pagination (`page`, `page_size`, `q` where applicable) and return the established `{count,next,previous,results}` shape. The domain route groups are `/plans/`, `/actions/`, `/goals/`, `/processes/`, `/process-observations/`, `/metric-definitions/`, `/metric-entries/`, `/quality-observations/`, `/pr-reviews/`, `/weekly-reports/`, `/team-members/`, `/delegations/`, `/knowledge/`, `/friction/`, `/evidence/`, `/health/`, `/reflections/`, and `/weekly-reviews/`. Read-only `/bootstrap/` returns `{user, csrfToken, plan, currentWeek, currentPhase}`; `/overview/` returns computed tiles and attention. The exact response fields are locked by each task's serializer and tests before consumers are built.

### Task 1: Private plan, week math, and editable starter seed

**Files:** Create `backendv2/leadership/{__init__,apps}.py`, `models/{__init__,plan,execution,team}.py`, `services/{__init__,calendar,seed}.py`, `api/{__init__,base,plan,urls}.py`, `tests/{__init__,test_plan}.py`, `migrations/{__init__,0001_initial}.py`. Modify `backendv2/core/{settings,urls}.py`.

**Interfaces:** `week_for_date(start_date: date, on_date: date) -> int | None` returns 1–12 or `None`; `plan_period(start_date: date, on_date: date) -> Literal["upcoming", "active", "finished"]`; `phase_for_week(week: int) -> int` returns 1–6. `seed_plan(plan: LeadershipPlan) -> None` creates phase-linked baseline `WeeklyAction` rows exactly once. `POST /plans/` accepts `{team_name,start_date}` and returns plan ID/start date; `GET /bootstrap/` returns setup-required or active state and CSRF token. `GET /plans/` returns only the request user's plans. The initial schema includes nullable action owner referencing a plan-local `TeamMember`, so later features never use free-text foreign keys.

- [ ] Write `test_plan.py`: assert day −1 is upcoming; day 0 is Week 1; day 83 is Week 12; day 84 is finished; owner B gets no owner A plan or seed records; duplicate setup is rejected; seeded actions are incomplete and sample metrics/people absent.

  ```python
  def test_week_boundaries(self):
      start = date(2026, 9, 29)
      self.assertEqual(plan_period(start, start - timedelta(days=1)), "upcoming")
      self.assertEqual(week_for_date(start, start), 1)
      self.assertEqual(week_for_date(start, start + timedelta(days=83)), 12)
      self.assertEqual(plan_period(start, start + timedelta(days=84)), "finished")
  ```
- [ ] Prepared verification: `backendv2/.venv/bin/python backendv2/manage.py test leadership.tests.test_plan` from repo root; expected all tests pass if the user authorizes test execution.
- [ ] Implement plan model, calendar/phase helpers, idempotent six-phase seed, owner-scoped plan/bootstrap API, app registration, and additive migration. Keep plan start date immutable after setup records exist.
- [ ] Review only Task 1 diff and, when authorized, run its prepared test command; commit Task 1 files together as `feat(leadership): add private plan and roadmap seed`.

### Task 2: Business route, setup, and shared visual shell

**Files:** Create `pixelpopup-frontend/src/pages/BusinessDashboardPage.jsx`, `src/features/business-dashboard/BusinessDashboard.jsx`, `src/features/business-dashboard/api.js`, `src/features/business-dashboard/hooks/useBusinessData.js`, `src/features/business-dashboard/components/SetupDialog.jsx`, `src/features/business-dashboard/views/OverviewView.jsx`. Modify `pixelpopup-frontend/src/App.jsx` and `src/features/personal-dashboard/Dashboard.jsx` only for the route, public-extras exclusion, and workspace link.

**Interfaces:** `businessApi(path: string, options?: RequestInit, csrf?: string) -> Promise<object>` mirrors the finance client at `/api/v1/leadership/`; `useBusinessData() -> {status,data,request,mutate,refresh}`. `BusinessDashboard` uses `bootstrap` from Task 1, requires setup if no plan, and mounts twelve URL-addressable views with loading/denied/retry states. Nonbuilt destinations render a truthful “Coming in this implementation” placeholder until their task lands, never fabricated values.

- [ ] Review route guarding, setup error retention, 390px sidebar structure, keyboard focus, and workspace-switch links in the changed source; record unresolved runtime checks for the user.
- [ ] Implement lazy route and private extras exclusion, generic shell with the approved sidebar labels, first-run setup, and API hook. Reuse theme and shadcn controls; do not copy personal finance data flow.
- [ ] Review route/component diff and the checklist; when the user authorizes browser checks, verify setup, error, denied, desktop, and narrow viewport; commit only Task 2 files as `feat(leadership): add private business workspace`.

### Task 3: Weekly actions, goals, and 90-Day Plan

**Files:** Modify `backendv2/leadership/models/execution.py`, `services/seed.py`, `api/urls.py`; create `api/execution.py`, `tests/test_execution.py`, `migrations/0002_execution.py`. Create frontend `views/{ThisWeek,Roadmap,Goals}View.jsx` and `components/{ActionDialog,ActionRow,GoalDialog}.jsx`.

**Interfaces:** `POST /actions/{id}/carry/` returns `{source,follow_up}` and moves only an unfinished action into week `current_week + 1`; both rows share `lineage_id`, and source becomes `moved`. CRUD actions include title, planned/current week, phase, owner, due date, priority, status, notes, evidence URLs, and leadership result. `GET /actions/?week=N` is paginated. `GET/POST/PATCH /goals/` owns a single primary goal per week.

- [ ] Write tests asserting the seeded checklist is distributed roughly 5–8 actions per week, completion persists, custom actions save, a blocked/delegated action is distinguishable, repeated carry cannot fork, multi-week lineage counts once, and cross-plan owner/related-person IDs are rejected.

  ```python
  def test_carry_preserves_history_without_double_counting(self):
      carried = self.client.post(f"/api/v1/leadership/actions/{self.action.id}/carry/")
      self.assertEqual(carried.status_code, 200)
      self.action.refresh_from_db()
      self.assertEqual(self.action.status, "moved")
      self.assertEqual(carried.data["follow_up"]["lineage_id"], str(self.action.lineage_id))
      self.assertEqual(self.client.post(f"/api/v1/leadership/actions/{self.action.id}/carry/").status_code, 400)
  ```
- [ ] Prepared verification: `backendv2/.venv/bin/python backendv2/manage.py test leadership.tests.test_execution`; expected pass only when authorized to run.
- [ ] Implement models/serializers/views and the three views; keep completed source history visible after a carry; show the phase goal and success criteria. Use explicit save/cancel and accessible status text.
- [ ] Review Task 3 diff and, if authorized, run prepared tests; commit as `feat(leadership): track weekly goals and roadmap actions`.

### Task 4: Processes, PR quality, and manual metrics

**Files:** Create `backendv2/leadership/models/measurement.py`, `api/measurement.py`, `tests/test_measurement.py`, `migrations/0003_measurement.py`; modify `api/urls.py`. Create frontend `views/{Processes,Quality,Metrics}View.jsx` and `components/{MetricChart,ObservationDialog,PrReviewDialog}.jsx`.

**Interfaces:** Process CRUD plus weekly adoption observations distinguish created from used. `ensure_metric_definitions(plan) -> None` seeds only definition names/units/directions, idempotently for both new and pre-existing plans; a data migration backfills existing plans. Weekly metric entries accept a measured numeric value or numerator/denominator plus source, explanation, and next action. Quality observations accept checked/eligible counts and targets; PR reviews accept PR URL, developer/reviewer, outcome, and coaching note. `MetricChart` accepts sparse ordered `{week,value|null}` points and a table, never converting `null` to zero.

- [ ] Write tests for missing values, denominator zero, cross-plan foreign keys, process created-versus-adopted counts, weekly previous-period comparison, and applicable-only PR screenshot denominator.

  ```python
  def test_missing_metric_is_not_zero(self):
      response = self.client.get("/api/v1/leadership/metric-entries/?week=4")
      self.assertEqual(response.status_code, 200)
      self.assertEqual(response.data["results"], [])
      self.assertFalse(response.data.get("comparison"))
  ```
- [ ] Prepared verification: `backendv2/.venv/bin/python backendv2/manage.py test leadership.tests.test_measurement`; expected pass only when authorized.
- [ ] Implement manual entry and read paths, then Processes, PR & Quality, and Metrics pages with honest missing states, current-versus-previous charts, movement notes, and links from engineering work to measured impact.
- [ ] Review Task 4 diff and, if authorized, run prepared tests; commit as `feat(leadership): measure adoption quality and impact`.

### Task 5: Weekly reporting and historical reviews

**Files:** Modify `backendv2/leadership/models/{execution,measurement}.py`, `api/{execution,measurement}.py`, `api/urls.py`; create `services/reporting.py`, `tests/test_reporting.py`, `migrations/0004_reporting.py`. Create frontend `components/{WeeklyReportDialog,WeeklyReviewDialog}.jsx`; modify `views/{ThisWeek,Metrics}View.jsx`.

**Interfaces:** Weekly reports store the requested Tuesday checklist, wins, metrics, changes, learning, next actions, report date, Slack link, and submitted/update timestamps. `report_streak(plan, as_of: date) -> {streak:int, missedWeeks:list[int]}` counts submitted past weeks consecutively, including late submissions, and never marks future weeks missed. Weekly leadership reviews store all seven supplied prompts per week.

- [ ] Write tests for a late-but-submitted report, a genuinely missed completed week, no missed future week, Tuesday due date inside an arbitrary seven-day week, historical edits, and owner isolation.

  ```python
  def test_late_report_counts_and_future_week_is_not_missed(self):
      self.make_report(week=3, submitted_on=self.plan.start_date + timedelta(days=21))
      result = report_streak(self.plan, self.plan.start_date + timedelta(days=21))
      self.assertEqual(result["streak"], 1)
      self.assertNotIn(4, result["missedWeeks"])
  ```
- [ ] Prepared verification: `backendv2/.venv/bin/python backendv2/manage.py test leadership.tests.test_reporting`; expected pass only when authorized.
- [ ] Implement persisted checklist/report and review APIs, streak service, and forms/history. Show the Tuesday checklist from reporting phase onward without creating values or Slack messages.
- [ ] Review Task 5 diff and, if authorized, run prepared tests; commit as `feat(leadership): add weekly reporting and reviews`.

### Task 6: Team map, delegation, knowledge, and gardener log

**Files:** Modify `backendv2/leadership/models/team.py`, `api/urls.py`; create `api/team.py`, `tests/test_team.py`, `migrations/0005_team.py`. Create frontend `views/{TeamDevelopment,Delegation,Documentation}View.jsx`, `components/{TeamMemberDialog,DelegationDialog,KnowledgeDialog,FrictionDialog}.jsx`; modify `views/ProcessesView.jsx`. Place friction list in the Processes destination as a separate tab instead of inventing a thirteenth sidebar item.

**Interfaces:** Team members are plan-local names, not user accounts. Delegations store original/new owner, Miku's role, six milestones, progress, took-work-back flag, explanation, and evidence. Knowledge stores original owner, documentation state/link, backup, tested flag, and importance; `is_single_point_of_failure(item) -> bool` when important knowledge lacks a tested backup. `ContinuityCheck` stores the final absence test (`yes`, `partially`, `no`), dependency note, and date. Friction records frequency, impact, improvement, owner, status, and result.

- [ ] Write tests that cross-plan member IDs are rejected; a documented but untested backup remains a single point of failure; milestones and took-work-back state persist; distinct active new owners drive the summary count.

  ```python
  def test_untested_backup_is_still_a_single_point_of_failure(self):
      item = KnowledgeItem(important=True, documentation_status="documented", backup_owner=self.member, backup_tested=False)
      self.assertTrue(is_single_point_of_failure(item))
  ```
- [ ] Prepared verification: `backendv2/.venv/bin/python backendv2/manage.py test leadership.tests.test_team`; expected pass only when authorized.
- [ ] Implement team/domain APIs and pages, editable strength map, milestone checklist, knowledge table, final absence test Yes/Partially/No with dependency note, and friction log.
- [ ] Review Task 6 diff and, if authorized, run prepared tests; commit as `feat(leadership): track delegation and team independence`.

### Task 7: Evidence, health, and monthly reflection

**Files:** Create `backendv2/leadership/models/evidence.py`, `api/evidence.py`, `tests/test_evidence.py`, `migrations/0006_evidence.py`; modify `api/urls.py`. Create frontend `views/{Evidence,Reflection}View.jsx` and `components/{EvidenceDialog,HealthAssessment,ReflectionForm}.jsx`.

**Interfaces:** Evidence uses the spec's 12 competencies and stores problem, action, result, URL, affected team/person, and optional same-plan links. Health has seven categories and exactly four manual labels: Strong Evidence, Some Evidence, Needs More Evidence, Not Started; each requires why/evidence for any non-Not Started choice. Monthly reflection stores the eight named readiness answers (`yes`, `partially`, `no`) and notes; one record per plan/month.

- [ ] Write tests for all competency/health choices, month uniqueness, required rationale, safe evidence URLs, linked IDs from another plan/user rejected, and historical reflection preservation.

  ```python
  def test_cross_plan_evidence_link_is_rejected(self):
      payload = {**self.valid_evidence_payload, "plan": self.plan.id, "action": self.other_user_action.id}
      response = self.client.post("/api/v1/leadership/evidence/", payload, format="json")
      self.assertEqual(response.status_code, 400)
  ```
- [ ] Prepared verification: `backendv2/.venv/bin/python backendv2/manage.py test leadership.tests.test_evidence`; expected pass only when authorized.
- [ ] Implement evidence CRUD/filter/pagination, health assessment details, monthly reflection forms/history, and category click-through showing why; no calculated leadership score.
- [ ] Review Task 7 diff and, if authorized, run prepared tests; commit as `feat(leadership): record promotion evidence and reflection`.

### Task 8: Derived overview and cross-surface consistency

**Files:** Create/finish `backendv2/leadership/services/overview.py`, `api/overview.py`, `tests/test_overview.py`; extend `api/urls.py`. Finish frontend `views/OverviewView.jsx`, `BusinessDashboard.jsx`, and business `components/` only where needed. Add a short route-specific direction note to `docs/superpowers/specs/2026-09-29-team-lead-promotion-tracker-design.md` only if the implementation establishes a durable variation from its approved design.

**Interfaces:** `build_overview(plan, as_of: date) -> dict` returns current week/phase, four primary tile values, secondary measures, current actions, adoption attention, metric movement, reporting streak, evidence gaps, and independence attention. Counts use live saved records; lineage progress counts one chain; missing metric comparisons remain `null`. Overview presents four equal primary tiles before secondary tiles and links each attention item to its owning destination.

- [ ] Write tests that seed only template actions and assert zero completed/evidence/adopted/ownership without fake examples; then add real records and assert derived counts, lineage deduplication, sparse metric gaps, Week 12/finished state, and owner isolation.

  ```python
  def test_seeded_plan_has_no_fabricated_results(self):
      overview = build_overview(self.plan, self.plan.start_date)
      self.assertEqual(overview["completed_actions"], 0)
      self.assertEqual(overview["adopted_processes"], 0)
      self.assertEqual(overview["evidence_items"], 0)
      self.assertEqual(overview["ownership_people"], 0)
  ```
- [ ] Prepared verification: `backendv2/.venv/bin/python backendv2/manage.py test leadership.tests.test_overview`; expected pass only when authorized.
- [ ] Implement aggregate API and compact overview; ensure every requested destination is live, no placeholder remains, charts have data tables, status never relies on color alone, and route switching preserves sidebar state.
- [ ] Review only changed files and run static diff checks. If separately authorized, run focused backend tests plus one desktop/mobile and keyboard browser pass; do not run build/lint by default. Commit Task 8 files as `feat(leadership): complete business dashboard overview`.

## Final handoff

Review spec coverage against the twelve destinations and every supplied interaction: custom tasks, carry, notes/owner/evidence, manual metrics, editable people/processes, weekly reports, historical reviews/reflections, and independence test. Report any unverified runtime risk explicitly. Give the user migration instructions but do not apply the migration or start/deploy services without authorization. Do not push unless requested.
