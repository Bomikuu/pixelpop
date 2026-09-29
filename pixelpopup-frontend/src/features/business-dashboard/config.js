export const choices = {
  priority: [["high", "High"], ["medium", "Medium"], ["low", "Low"]],
  actionStatus: [["not_started", "Not started"], ["in_progress", "In progress"], ["blocked", "Blocked"], ["completed", "Completed"], ["delegated", "Delegated"], ["moved", "Moved to next week"]],
  yesPartialNo: [["yes", "Yes"], ["partially", "Partially"], ["no", "No"]],
  health: [["strong", "Strong evidence"], ["some", "Some evidence"], ["needs_more", "Needs more evidence"], ["not_started", "Not started"]],
  competencies: [["coaching", "Coaching"], ["delegation", "Delegation"], ["team_process", "Team process"], ["feedback_loop", "Feedback loop"], ["code_review", "Code review"], ["documentation", "Documentation"], ["strategic_alignment", "Strategic alignment"], ["metrics", "Metrics"], ["cross_team_collaboration", "Cross-team collaboration"], ["team_development", "Team development"], ["servant_leadership", "Servant leadership"], ["continuous_improvement", "Continuous improvement"]],
  healthCategories: [["process", "Process"], ["coaching", "Coaching"], ["delegation", "Delegation"], ["measurement", "Measurement"], ["documentation", "Documentation"], ["communication", "Communication"], ["team_independence", "Team independence"]],
  qualityIndicators: [["template_compliance", "PR template compliance"], ["linked_ticket", "Linked ticket"], ["qa_instructions", "QA instructions"], ["peer_review", "Another developer reviewed"], ["ci_before_merge", "CI before merge"], ["screenshots", "Screenshots where relevant"], ["test_expectations", "Test expectations"], ["documentation", "Documentation"]],
};

const f = (key, label, type = "text", extra = {}) => ({ key, label, type, ...extra });
const week = f("week", "Week", "week", { required: true });
const member = (key = "owner", label = "Owner") => f(key, label, "relation", { resource: "team-members" });
const link = (key = "evidence_url", label = "Evidence link") => f(key, label, "url");
const note = (key = "notes", label = "Notes") => f(key, label, "textarea");
const choice = (key, label, options, extra = {}) => f(key, label, "select", { options, ...extra });

export const resourceConfigs = {
  actions: {
    title: "Weekly actions", singular: "action", icon: "ListChecks", display: "title", subtitle: "description",
    fields: [f("title", "Action", "text", { required: true }), f("planned_week", "Planned week", "week", { required: true }), f("description", "Description", "textarea"), member(), f("due_date", "Due date", "date"), choice("priority", "Priority", choices.priority, { defaultValue: "medium" }), choice("status", "Status", choices.actionStatus, { defaultValue: "not_started" }), note(), f("leadership_result", "Leadership result", "textarea"), f("evidence_urls", "Evidence links, one per line", "urls")],
  },
  goals: {
    title: "Team goals", singular: "goal", icon: "Target", display: "title", subtitle: "outcome",
    fields: [week, f("title", "Goal", "text", { required: true }), f("outcome", "End-of-week outcome", "textarea"), f("success_measure", "Success measure"), member(), f("is_primary", "Primary goal this week", "checkbox"), f("linked_actions", "Linked actions", "multiRelation", { resource: "actions" })],
  },
  "weekly-reviews": {
    title: "Weekly leadership reviews", singular: "review", icon: "ClipboardCheck", display: "week", prefix: "Week ",
    fields: [week, f("improved", "What improved?", "textarea"), f("adopted", "What did the team adopt?", "textarea"), f("did_not_work", "What did not work?", "textarea"), f("should_delegate", "What should I delegate?", "textarea"), f("became_independent", "What became independent of me?", "textarea"), f("process_change", "What process should change?", "textarea"), f("promotion_evidence", "What promotion evidence did I create?", "textarea")],
    submit: true,
  },
  processes: {
    title: "Team processes", singular: "process", icon: "Workflow", display: "name", subtitle: "description",
    fields: [f("name", "Process name", "text", { required: true }), f("description", "Standard or process", "textarea"), f("created_on", "Introduced on", "date"), member(), link()],
  },
  "process-observations": {
    title: "Adoption observations", singular: "observation", icon: "Activity", display: "process", prefix: "Process #",
    fields: [f("process", "Process", "relation", { resource: "processes", required: true }), week, choice("team_using", "Team using it?", [["no", "No"], ["partial", "Partially"], ["yes", "Yes"]], { defaultValue: "no" }), f("checked", "Checked", "number"), f("eligible", "Eligible", "number"), choice("status", "Assessment", [["healthy", "Healthy"], ["improving", "Improving"], ["attention", "Needs attention"], ["unmeasured", "Not measured"]], { defaultValue: "unmeasured" }), f("recorded_on", "Recorded on", "date", { required: true }), note(), link()],
  },
  "metric-definitions": {
    title: "Tracked metrics", singular: "metric", icon: "ChartNoAxesCombined", display: "name", subtitle: "unit",
    fields: [f("name", "Metric name", "text", { required: true }), f("unit", "Unit", "text", { required: true }), choice("value_type", "Value type", [["number", "Number"], ["ratio", "Ratio"]], { defaultValue: "number" }), choice("desired_direction", "Desired direction", [["up", "Up"], ["down", "Down"], ["neutral", "Neutral"]], { defaultValue: "up" })],
  },
  "metric-entries": {
    title: "Weekly measurements", singular: "measurement", icon: "ChartColumn", display: "definition", prefix: "Metric #",
    fields: [f("definition", "Metric", "relation", { resource: "metric-definitions", required: true }), week, f("value", "Value (for number metrics)", "decimal"), f("numerator", "Numerator (for ratio metrics)", "number"), f("denominator", "Denominator (for ratio metrics)", "number"), f("movement_note", "What changed and why?", "textarea"), f("next_action", "Next action", "textarea"), f("impact_note", "Company impact, if known", "textarea"), f("action", "Linked engineering action", "relation", { resource: "actions" }), f("source_url", "Source link", "url")],
  },
  "quality-observations": {
    title: "Quality indicators", singular: "indicator", icon: "ShieldCheck", display: "indicator",
    fields: [choice("indicator", "Indicator", choices.qualityIndicators, { required: true }), week, f("checked", "Checked", "number"), f("eligible", "Eligible", "number"), f("target_percent", "Target %", "number"), note(), link()],
  },
  "pr-reviews": {
    title: "PR reviews & coaching", singular: "PR review", icon: "GitPullRequest", display: "name", subtitle: "coaching_note",
    fields: [f("name", "PR name", "text", { required: true }), f("pr_url", "PR link", "url", { required: true }), member("developer", "Developer"), member("reviewer", "Reviewer"), f("reviewed_on", "Reviewed on", "date", { required: true }), f("outcome", "Outcome"), f("coaching_note", "Coaching note", "textarea")],
  },
  "weekly-reports": {
    title: "Weekly updates", singular: "report", icon: "FileText", display: "week", prefix: "Week ",
    fields: [week, f("report_date", "Report date", "date"), f("wins", "Wins", "textarea"), f("metrics", "Metrics narrative", "textarea"), f("changed", "What changed?", "textarea"), f("learned", "What we learned", "textarea"), f("next_actions", "Next actions", "textarea"), f("slack_url", "Slack update link", "url"), f("checklist", "Tuesday report checklist", "reportChecklist")],
    submit: true,
  },
  "team-members": {
    title: "Team members & strength map", singular: "team member", icon: "Users", display: "name", subtitle: "role",
    fields: [f("name", "Name", "text", { required: true }), f("role", "Role"), f("strengths", "Strengths", "textarea"), f("developing", "Developing areas", "textarea"), f("ownership_opportunity", "Ownership opportunity", "textarea")],
  },
  delegations: {
    title: "Ownership transfer", singular: "delegation", icon: "ArrowRightLeft", display: "title", subtitle: "notes",
    fields: [f("title", "Work", "text", { required: true }), member("original_owner", "Original owner"), f("new_owner", "New owner", "relation", { resource: "team-members", required: true }), f("my_role", "My role"), f("milestones", "Delegation milestones", "milestones"), f("progress", "Progress %", "number", { defaultValue: 0 }), f("took_work_back", "I took the work back", "checkbox"), f("took_work_back_note", "Why the work was taken back", "textarea"), note(), link()],
  },
  knowledge: {
    title: "Knowledge & backup owners", singular: "knowledge item", icon: "BookOpen", display: "title", subtitle: "notes",
    fields: [f("title", "Knowledge or process", "text", { required: true }), member("original_owner", "Original owner"), choice("documentation_status", "Documented?", [["none", "No"], ["partial", "Partially"], ["documented", "Yes"]], { defaultValue: "none" }), f("documentation_url", "Documentation link", "url"), member("backup_owner", "Backup owner"), f("backup_tested", "Backup has performed it", "checkbox"), f("important", "Important to team continuity", "checkbox"), note()],
  },
  "continuity-checks": {
    title: "Absence tests", singular: "absence test", icon: "UserRoundCheck", display: "recorded_on", subtitle: "dependencies",
    fields: [f("recorded_on", "Date", "date", { required: true }), choice("answer", "Can the team operate without me?", choices.yesPartialNo, { required: true }), f("dependencies", "What still depends on me?", "textarea")],
  },
  friction: {
    title: "Recurring friction", singular: "friction item", icon: "Wrench", display: "friction", subtitle: "proposed_improvement",
    fields: [f("friction", "Recurring friction", "text", { required: true }), f("frequency", "How often?"), choice("impact", "Impact", choices.priority, { defaultValue: "medium" }), f("proposed_improvement", "Small repeatable improvement", "textarea"), member(), choice("status", "Status", [["open", "Open"], ["trying", "Trying"], ["resolved", "Resolved"]], { defaultValue: "open" }), f("result", "Observed result", "textarea")],
  },
  evidence: {
    title: "Promotion evidence", singular: "evidence item", icon: "Sparkles", display: "problem", subtitle: "result",
    fields: [f("date", "Date", "date", { required: true }), choice("competency", "Competency", choices.competencies, { required: true }), f("problem", "Problem", "textarea", { required: true }), f("action", "Your action", "textarea", { required: true }), f("result", "Result (leave blank until known)", "textarea"), f("affected", "Affected person or team"), link(), f("weekly_action", "Linked action", "relation", { resource: "actions" }), f("process", "Linked process", "relation", { resource: "processes" }), f("delegation", "Linked delegation", "relation", { resource: "delegations" }), f("metric_entry", "Linked metric", "relation", { resource: "metric-entries" })],
  },
  health: {
    title: "Leadership health", singular: "assessment", icon: "HeartPulse", display: "category", subtitle: "rationale",
    fields: [choice("category", "Category", choices.healthCategories, { required: true }), choice("level", "Evidence level", choices.health, { defaultValue: "not_started" }), f("rationale", "Why does this level fit?", "textarea"), f("evidence", "Supporting evidence", "multiRelation", { resource: "evidence" })],
  },
  reflections: {
    title: "Monthly reflections", singular: "reflection", icon: "NotebookPen", display: "month",
    fields: [f("month", "Month", "month", { required: true }), f("answers", "Readiness questions", "reflectionAnswers"), f("notes", "Reflection notes", "reflectionNotes")],
    submit: true,
  },
};

export const delegationMilestones = ["Context explained", "Ownership given", "Proposal reviewed", "Independent implementation", "Presentation", "Maintenance without Miku"];
export const reflectionQuestions = [["team_process", "Can a developer explain how work moves from idea to production?"], ["goals", "Can every team member explain the team's main goals this week?"], ["metrics", "Does the team know what metrics its work affects?"], ["feedback_loops", "Do we regularly review outcomes and change behavior based on them?"], ["knowledge", "Can another person perform important processes without asking me?"], ["delegation", "Have I transferred meaningful ownership to other developers?"], ["coaching", "Can I show examples where someone became more independent after my coaching?"], ["leadership_continuity", "Can the team operate normally if I am absent?"]];

export const pageSections = {
  goals: ["goals", "weekly-reviews"],
  quality: ["quality-observations", "pr-reviews"],
  metrics: ["metric-entries", "metric-definitions", "weekly-reports"],
  team: ["team-members", "continuity-checks"],
  delegation: ["delegations"],
  processes: ["processes", "process-observations", "friction"],
  documentation: ["knowledge"],
  evidence: ["evidence", "health"],
  reflection: ["reflections"],
};
