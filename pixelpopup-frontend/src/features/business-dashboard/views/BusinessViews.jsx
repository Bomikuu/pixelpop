import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { ArrowRight, BookOpen, CalendarClock, ChartNoAxesCombined, CheckCircle2, CircleDot, ClipboardCheck, FileText, FolderCheck, GitBranch, Layers3, Plus, RefreshCw, ShieldCheck, Target, TriangleAlert, Users, Workflow } from "lucide-react";
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from "recharts";
import { allRecords } from "../api";
import { choices, pageSections, resourceConfigs } from "../config";
import Records from "../components/Records";
import DailyCheckIn from "../components/DailyCheckIn";
import AttentionRail from "../components/AttentionRail";
import { Button } from "../../personal-dashboard/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../personal-dashboard/ui/select";
import { EmptyState, ErrorState, Panel } from "../../personal-dashboard/components/Panel";

const statusClasses = { completed: "bg-emerald-50 text-emerald-800", blocked: "bg-rose-50 text-rose-800", in_progress: "bg-blue-50 text-blue-800", delegated: "bg-indigo-50 text-indigo-800", moved: "bg-slate-100 text-slate-700" };

function SummaryCard({ icon: Icon, label, value, hint, tone = "blue" }) {
  const tones = { blue: "bg-blue-50 text-blue-700", green: "bg-emerald-50 text-emerald-700", amber: "bg-amber-50 text-amber-800", red: "bg-rose-50 text-rose-700" };
  return <div className="min-w-0 rounded-lg border bg-white p-4 transition-colors hover:border-blue-200 hover:bg-blue-50/30"><div className="flex items-start justify-between gap-2"><p className="text-sm text-slate-600">{label}</p><span className={`grid size-9 shrink-0 place-items-center rounded-full ${tones[tone]}`}><Icon size={17} aria-hidden="true" /></span></div><p className="mt-3 text-2xl font-semibold tabular-nums text-slate-950">{value}</p><p className="mt-1 text-xs leading-5 text-slate-500">{hint}</p></div>;
}

function ActionPreview({ actions, navigate }) {
  return <Panel title="This week's priorities" description="Saved actions for the current week. Carried work remains linked to its original week." action={<Button variant="outline" onClick={() => navigate("week")}>Open week <ArrowRight size={15} /></Button>}>
    {actions?.length ? <div className="divide-y rounded-md border">{actions.map((action) => <div key={action.id} className="flex flex-wrap items-center gap-3 p-3 transition-colors hover:bg-blue-50/50"><span className={`grid size-9 place-items-center rounded-full ${action.status === "completed" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>{action.status === "completed" ? <CheckCircle2 size={17} /> : <CircleDot size={17} />}</span><div className="min-w-0 flex-1"><p className="text-sm font-medium text-slate-950">{action.title}</p><p className="text-xs text-slate-500">{action.owner || "Unassigned"}{action.due_date ? ` · Due ${action.due_date}` : ""}</p></div><span className={`rounded-md px-2 py-1 text-xs capitalize ${statusClasses[action.status] || "bg-slate-100 text-slate-700"}`}>{action.status.replaceAll("_", " ")}</span></div>)}</div> : <EmptyState title="No actions this week" message="Use This Week to add a focused action." icon={ClipboardCheck} />}
  </Panel>;
}

export function OverviewView({ overview, bootstrap, navigate, csrf, revision }) {
  const [attentionData, setAttentionData] = useState({ actions: [], members: [], knowledge: [], health: [], loading: true, error: "" });
  const [attentionRetry, setAttentionRetry] = useState(0);
  useEffect(() => {
    if (!overview) return undefined;
    let active = true;
    setAttentionData((old) => ({ ...old, loading: true, error: "" }));
    Promise.all([allRecords("actions", csrf), allRecords("team-members", csrf), allRecords("knowledge", csrf), allRecords("health", csrf)]).then(([actions, members, knowledge, health]) => {
      if (active) setAttentionData({ actions, members, knowledge, health, loading: false, error: "" });
    }).catch((cause) => {
      if (active) setAttentionData((old) => ({ ...old, loading: false, error: cause.message }));
    });
    return () => { active = false; };
  }, [Boolean(overview), csrf, revision, attentionRetry]);
  if (!overview) return <div className="space-y-4" aria-busy="true"><div className="h-24 animate-pulse rounded-lg bg-slate-100"/><div className="h-48 animate-pulse rounded-lg bg-slate-100"/></div>;
  const active = overview.period === "active";
  const progress = overview.total_actions ? Math.round(overview.completed_actions / overview.total_actions * 100) : 0;
  const knowledgeRisks = attentionData.knowledge.filter((item) => item.important && (!item.backup_owner || !item.backup_tested));
  const healthByCategory = Object.fromEntries(attentionData.health.map((item) => [item.category, item]));
  const healthLabels = Object.fromEntries(choices.healthCategories);
  const rhythm = [
    ["This week's work", "Review and complete actions", "week", ClipboardCheck],
    ["Measure results", "Record observed movement", "metrics", ChartNoAxesCombined],
    ["Save evidence", "Keep concrete examples", "evidence", FolderCheck],
    ["Reflect", "Review patterns and lessons", "reflection", FileText],
  ];
  return <div className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Road to Team Leader</p><h2 className="mt-1 text-xl font-semibold text-slate-950">{bootstrap.plan.team_name}</h2><p className="mt-1 text-sm text-slate-600">Build repeatable team systems, develop people, create feedback loops, and improve team performance beyond individual task delivery.</p></div><span className="rounded-md border bg-white px-3 py-2 text-sm text-slate-700">{active ? `Week ${overview.currentWeek} of 12 · ${overview.phaseName}` : overview.period === "upcoming" ? `Starts ${bootstrap.plan.start_date}` : "12-week plan finished"}</span></div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><SummaryCard icon={CheckCircle2} label="Actions completed" value={`${overview.completed_actions} / ${overview.total_actions}`} hint="Unique actions across the plan" tone="green"/><SummaryCard icon={Layers3} label="Processes adopted" value={overview.adopted_processes} hint="Latest team-use observations" tone="blue"/><SummaryCard icon={FolderCheck} label="Evidence items" value={overview.evidence_items} hint="Recorded promotion examples" tone="amber"/><SummaryCard icon={Users} label="People holding ownership" value={overview.ownership_people} hint="Distinct active delegation owners" tone="blue"/></div>
    <section aria-labelledby="business-rhythm-title" className="rounded-md border bg-white px-4 py-3"><div className="flex flex-wrap items-baseline gap-x-3 gap-y-1"><h3 id="business-rhythm-title" className="text-sm font-semibold text-slate-950">Leadership rhythm</h3><p className="text-xs text-slate-600">Work → results → evidence → reflection</p></div><ol className="mt-2 grid gap-1 sm:grid-cols-2 2xl:grid-cols-4">{rhythm.map(([title, description, destination, Icon]) => <li key={destination}><Button variant="ghost" className="group h-auto w-full justify-start gap-3 px-2 py-2 text-left" onClick={() => navigate(destination)}><Icon size={18} className="shrink-0 text-blue-700" aria-hidden="true"/><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-950">{title}</span><span className="block text-xs font-normal leading-5 text-slate-600">{description}</span></span><ArrowRight size={15} className="shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true"/></Button></li>)}</ol></section>
    <div className="rounded-md border bg-white px-4 py-3"><div className="flex justify-between gap-3 text-xs"><span className="font-medium text-slate-700">Roadmap action completion</span><span className="tabular-nums text-slate-600">{progress}%</span></div><div role="progressbar" aria-label="Roadmap action completion" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-blue-600 transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${progress}%` }}/></div><p className="mt-2 text-xs text-slate-500">Action completion is not a promotion-readiness score.</p></div>
    <div className="grid gap-3 sm:grid-cols-2"><SummaryCard icon={GitBranch} label="Processes introduced" value={overview.processes_introduced} hint="Creation does not imply adoption"/><SummaryCard icon={FileText} label="Reporting streak" value={`${overview.reporting?.streak || 0} ${overview.reporting?.streak === 1 ? "week" : "weeks"}`} hint="Consecutive submitted weekly updates"/></div>
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]"><div className="min-w-0 space-y-5"><ActionPreview actions={overview.current_actions} navigate={navigate}/><Panel title="Metric movement" description="Only recorded measurements are shown; missing weeks are never treated as zero." action={<Button variant="outline" onClick={() => navigate("metrics")}>Open metrics <ArrowRight size={15}/></Button>}>{overview.metric_movements?.length ? <div className="grid gap-3 sm:grid-cols-2">{overview.metric_movements.map((metric) => <div key={metric.id} className="rounded-md border p-3"><p className="text-sm font-medium">{metric.name}</p><p className="mt-2 text-xl tabular-nums">{metric.current} <span className="text-xs text-slate-500">{metric.unit}</span></p><p className="mt-1 text-xs text-slate-600">Previous: {metric.previous ?? "Not recorded"}</p>{metric.movement_note && <p className="mt-2 text-xs text-slate-600">{metric.movement_note}</p>}</div>)}</div> : <EmptyState title="No measurements yet" message="Enter an actual weekly value on the Metrics page to compare periods." icon={Target}/>}</Panel></div><div className="min-w-0 space-y-5"><Panel title="Current phase goal" description={overview.phaseName || "The plan is outside its active 12 weeks."}><p className="text-sm font-medium text-slate-950">{overview.phaseGoal || "No active phase"}</p>{overview.phaseSuccess && <p className="mt-2 text-sm text-slate-600">Success: {overview.phaseSuccess}</p>}<Button variant="link" className="mt-3" onClick={() => navigate("goals")}>View team goals <ArrowRight size={15}/></Button></Panel><Panel title="Independence & evidence" description="Open each risk or evidence area to review the record and act.">
      {attentionData.loading ? <div className="space-y-2" aria-busy="true" aria-label="Loading independence and evidence"><div className="h-12 animate-pulse rounded-md bg-slate-100"/><div className="h-12 animate-pulse rounded-md bg-slate-100"/></div> : attentionData.error ? <ErrorState message={attentionData.error} retry={() => setAttentionRetry((old) => old + 1)}/> : <div className="space-y-4 text-sm">
        <section aria-label="Knowledge continuity risks"><p className="mb-2 flex items-center gap-2 font-semibold text-slate-900"><BookOpen size={16} className={knowledgeRisks.length ? "text-rose-700" : "text-emerald-700"} aria-hidden="true"/>{knowledgeRisks.length} important knowledge {knowledgeRisks.length === 1 ? "item" : "items"} without a tested backup</p>{knowledgeRisks.length ? <ul className="divide-y rounded-md border border-rose-200 bg-rose-50/50">{knowledgeRisks.map((item) => <li key={item.id}><a href={`/business/documentation?knowledge=${item.id}`} onClick={(event) => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); navigate(`documentation?knowledge=${item.id}`); } }} className="group flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-rose-100/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"><span className="min-w-0 flex-1"><span className="block break-words font-medium text-slate-950">{item.title}</span><span className="block text-xs text-rose-800">{!item.backup_owner ? "No backup owner assigned" : "Backup has not performed it"}</span></span><ArrowRight size={15} className="shrink-0 text-rose-700 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true"/></a></li>)}</ul> : <p className="text-xs text-emerald-800">No important knowledge item currently lacks a tested backup.</p>}</section>
        <section aria-label="Leadership evidence gaps"><p className="mb-2 flex items-center gap-2 font-semibold text-slate-900"><ShieldCheck size={16} className={overview.health_gaps?.length ? "text-amber-700" : "text-emerald-700"} aria-hidden="true"/>{overview.health_gaps?.length || 0} leadership evidence {overview.health_gaps?.length === 1 ? "area" : "areas"} need attention</p>{overview.health_gaps?.length ? <ul className="divide-y rounded-md border">{overview.health_gaps.map((gap) => { const record = healthByCategory[gap.category]; const destination = record ? `evidence?health=${record.id}` : `evidence?category=${encodeURIComponent(gap.category)}`; const urgent = gap.level === "needs_more"; return <li key={gap.category}><a href={`/business/${destination}`} onClick={(event) => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); navigate(destination); } }} className={`group flex items-center gap-3 px-3 py-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${urgent ? "hover:bg-rose-50" : "hover:bg-amber-50"}`}><span className="min-w-0 flex-1"><span className="block font-medium text-slate-950">{healthLabels[gap.category] || gap.category}</span><span className={`block text-xs ${urgent ? "text-rose-800" : "text-amber-800"}`}>{urgent ? "Needs more evidence" : "Not assessed"}{gap.rationale && gap.rationale !== "Not assessed yet." ? ` · ${gap.rationale}` : ""}</span></span><ArrowRight size={15} className="shrink-0 text-slate-500 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true"/></a></li>; })}</ul> : <p className="text-xs text-emerald-800">No leadership evidence areas currently need attention.</p>}</section>
      </div>}
    </Panel><AttentionRail actions={attentionData.actions} members={attentionData.members} currentWeek={overview.currentWeek} loading={attentionData.loading} error={attentionData.error} retry={() => setAttentionRetry((old) => old + 1)} navigate={navigate}/></div></div>
  </div>;
}

export function ThisWeekView({ bootstrap, overview, csrf, notify, refresh }) {
  const week = bootstrap.currentWeek;
  if (!week) return <div className="space-y-5"><Panel title={bootstrap.period === "upcoming" ? "Your plan has not started" : "The 12-week plan is complete"} description={bootstrap.period === "upcoming" ? `Week 1 begins ${bootstrap.plan.start_date}. You can prepare the roadmap now.` : "Your historical actions and reviews remain available in their sections."}><EmptyState title="No active week" message="Use the 90-Day Plan to inspect or edit any week." icon={CalendarClock}/></Panel><DailyCheckIn csrf={csrf} notify={notify}/></div>;
  return <div className="space-y-5"><div className="rounded-lg border bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Week {week} · Phase {bootstrap.currentPhase}</p><h2 className="mt-1 text-lg font-semibold">{overview?.phaseName}</h2><p className="mt-1 text-sm text-slate-600">{overview?.phaseGoal}</p>{bootstrap.reportDueDate && <p className="mt-2 flex items-center gap-2 text-xs text-slate-600"><CalendarClock size={15}/> Weekly update: Tuesday, {bootstrap.reportDueDate}</p>}{overview?.reporting?.missedWeeks?.length > 0 && <p className="mt-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-sm text-amber-900"><TriangleAlert size={16} className="mt-0.5 shrink-0"/> Weekly updates missing for {overview.reporting.missedWeeks.map((item) => `Week ${item}`).join(", ")}.</p>}</div><Records resource="actions" csrf={csrf} currentWeek={week} filterWeek={week} checklist={bootstrap.reportChecklist} notify={notify} refresh={refresh}/><DailyCheckIn csrf={csrf} notify={notify}/><Records resource="weekly-reviews" csrf={csrf} currentWeek={week} filterWeek={week} checklist={bootstrap.reportChecklist} notify={notify} refresh={refresh}/>{week >= 7 && <Records resource="weekly-reports" csrf={csrf} currentWeek={week} filterWeek={week} checklist={bootstrap.reportChecklist} notify={notify} refresh={refresh}/>}</div>;
}

export function RoadmapView({ bootstrap, csrf, notify, refresh, revision }) {
  const location = useLocation();
  const [actions, setActions] = useState([]); const [error, setError] = useState(""); const [selected, setSelected] = useState(bootstrap.currentWeek || 1); const [version, setVersion] = useState(0);
  const [focusRecordId, setFocusRecordId] = useState(null);
  useEffect(() => {
    const id = Number(new URLSearchParams(location.search).get("action"));
    setFocusRecordId(Number.isInteger(id) && id > 0 ? id : null);
  }, [location.search]);
  useEffect(() => { let active = true; allRecords("actions", csrf).then((data) => { if (active) { setActions(data); setError(""); } }).catch((cause) => { if (active) setError(cause.message); }); return () => { active = false; }; }, [csrf, revision, version]);
  useEffect(() => {
    const target = actions.find((action) => action.id === focusRecordId);
    if (target) setSelected(target.current_week);
  }, [actions, focusRecordId]);
  const complete = (week) => { const items = actions.filter((action) => action.current_week === week && action.status !== "moved"); return { done: items.filter((item) => item.status === "completed").length, total: items.length }; };
  return <div className="space-y-5"><Panel title="12-week roadmap" description="The supplied checklist is editable starter work, not completed outcomes. Week 1 begins on your chosen start date.">{error ? <ErrorState message={error} retry={() => setVersion((old) => old + 1)}/> : <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{bootstrap.phases.map((phase) => <div key={phase.number} className="rounded-md border bg-white p-4"><div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wider text-blue-700">Phase {phase.number}</span><span className="text-xs text-slate-500">Weeks {phase.number * 2 - 1}–{phase.number * 2}</span></div><h3 className="mt-2 font-semibold text-slate-950">{phase.name}</h3><p className="mt-1 text-sm leading-5 text-slate-600">{phase.goal}</p><p className="mt-2 text-xs text-slate-500">Success: {phase.success}</p><div className="mt-4 flex gap-2">{[phase.number * 2 - 1, phase.number * 2].map((week) => { const count = complete(week); return <Button key={week} variant={selected === week ? "default" : "outline"} size="sm" onClick={() => setSelected(week)}>Week {week} · {count.done}/{count.total}</Button>; })}</div></div>)}</div>}</Panel><Records key={selected} focusRecordId={focusRecordId} onFocused={() => setFocusRecordId(null)} resource="actions" csrf={csrf} currentWeek={selected} filterWeek={selected} checklist={bootstrap.reportChecklist} notify={notify} refresh={refresh}/></div>;
}

function MetricsChart({ csrf, revision, currentWeek }) {
  const [definitions, setDefinitions] = useState([]); const [entries, setEntries] = useState([]); const [selected, setSelected] = useState(null); const [error, setError] = useState("");
  useEffect(() => { let active = true; Promise.all([allRecords("metric-definitions", csrf), allRecords("metric-entries", csrf)]).then(([metrics, values]) => { if (!active) return; setDefinitions(metrics); setEntries(values); setSelected((old) => old && metrics.some((item) => item.id === old) ? old : metrics[0]?.id || null); setError(""); }).catch((cause) => { if (active) setError(cause.message); }); return () => { active = false; }; }, [csrf, revision]);
  const metric = definitions.find((item) => item.id === selected);
  const chartData = useMemo(() => Array.from({ length: 12 }, (_, index) => { const entry = entries.find((item) => item.definition === selected && item.week === index + 1); return { week: `W${index + 1}`, value: entry ? entry.value !== null ? Number(entry.value) : entry.denominator ? Number(((entry.numerator / entry.denominator) * 100).toFixed(1)) : null : null, note: entry?.movement_note || "" }; }), [entries, selected]);
  const current = currentWeek ? chartData[currentWeek - 1]?.value : null;
  const previous = currentWeek > 1 ? chartData[currentWeek - 2]?.value : null;
  return <Panel title="Metric trend" description="Actual weekly measurements. Gaps mean no value was recorded.">
    {error ? <ErrorState message={error}/> : !metric ? <EmptyState title="No metrics yet" message="Add a metric definition to begin tracking." icon={Target}/> : <>
      <label htmlFor="business-metric-choice" className="mb-2 block text-sm font-medium">Metric</label>
      <Select value={String(selected)} onValueChange={(value) => setSelected(Number(value))}>
        <SelectTrigger id="business-metric-choice" className="w-full max-w-xs"><SelectValue /></SelectTrigger>
        <SelectContent className="personal-dashboard">{definitions.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent>
      </Select>
      {currentWeek && <div className="mt-4 flex flex-wrap gap-3 text-sm"><span className="rounded-md border bg-blue-50 px-3 py-2">Week {currentWeek}: <strong>{current === null ? "Not recorded" : `${current} ${metric.unit}`}</strong></span>{currentWeek > 1 && <span className="rounded-md border bg-slate-50 px-3 py-2">Previous week: <strong>{previous === null ? "Not recorded" : `${previous} ${metric.unit}`}</strong></span>}{current !== null && previous !== null && <span className="rounded-md border bg-white px-3 py-2">Change: <strong>{`${current - previous > 0 ? "+" : ""}${Number((current - previous).toFixed(2))} ${metric.unit}`}</strong></span>}</div>}
      {chartData.some((point) => point.value !== null) ? <>
        <div className="mt-5 h-56 min-w-0" role="img" aria-label={`Trend for ${metric.name}; see data table below`}><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 5, right: 15, left: 0, bottom: 0 }}><CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3"/><XAxis dataKey="week" fontSize={11}/><YAxis fontSize={11} width={40}/><ChartTooltip formatter={(value) => [`${value} ${metric.unit}`, metric.name]}/><Line dataKey="value" stroke="#2f5bff" strokeWidth={2} connectNulls={false} dot={{ r: 3 }} activeDot={{ r: 5 }}/></LineChart></ResponsiveContainer></div>
        <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[480px] text-left text-xs"><caption className="sr-only">Recorded weekly values for {metric.name}</caption><thead className="border-b bg-slate-50"><tr><th className="p-2">Week</th><th className="p-2">Value</th><th className="p-2">Movement note</th></tr></thead><tbody>{chartData.map((item) => <tr key={item.week} className="border-b"><th className="p-2 font-medium">{item.week}</th><td className="p-2 tabular-nums">{item.value === null ? "Not recorded" : `${item.value} ${metric.unit}`}</td><td className="p-2 text-slate-600">{item.note || "Not recorded"}</td></tr>)}</tbody></table></div>
      </> : <EmptyState title="No weekly values recorded" message="Add a weekly measurement to draw this trend." icon={ChartNoAxesCombined}/>}
    </>}
  </Panel>;
}

function SectionInsights({ section, csrf, revision }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const resources = section === "processes" ? ["processes", "process-observations"] : section === "quality" ? ["quality-observations", "pr-reviews"] : section === "documentation" ? ["knowledge"] : section === "delegation" ? ["delegations"] : section === "evidence" ? ["health"] : null;
    if (!resources) return;
    let active = true;
    Promise.all(resources.map((resource) => allRecords(resource, csrf))).then((values) => { if (active) { setData(Object.fromEntries(resources.map((resource, index) => [resource, values[index]]))); setError(""); } }).catch((cause) => { if (active) { setData(null); setError(cause.message); } });
    return () => { active = false; };
  }, [section, csrf, revision, retry]);
  if (error) return <ErrorState message={`Could not load ${section} insights. ${error}`} retry={() => { setError(""); setRetry((old) => old + 1); }} />;
  if (!data) return <p role="status" aria-busy="true" className="rounded-md border bg-white px-4 py-3 text-sm text-slate-600">Loading {section} insights…</p>;
  if (section === "processes") {
    const processes = data.processes;
    const latest = Object.fromEntries([...data["process-observations"]].sort((a, b) => a.week - b.week || a.id - b.id).map((entry) => [entry.process, entry]));
    const adopted = processes.filter((process) => latest[process.id]?.team_using === "yes").length;
    return <Panel title="Created ≠ adopted" description={`${processes.length} processes introduced · ${adopted} recorded as used by the team.`}>{processes.length ? <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead className="border-b bg-slate-50"><tr><th className="p-2">Process</th><th className="p-2">Created</th><th className="p-2">Team using</th><th className="p-2">Consistency</th><th className="p-2">Assessment</th></tr></thead><tbody>{processes.map((process) => { const observation = latest[process.id]; const rate = observation?.eligible ? Math.round(observation.checked / observation.eligible * 100) : null; return <tr key={process.id} className="border-b"><th className="p-2 font-medium">{process.name}</th><td className="p-2">{process.created_on || "Recorded"}</td><td className="p-2 capitalize">{observation?.team_using || "Not measured"}</td><td className="p-2">{rate === null ? "Not measured" : `${rate}% (${observation.checked}/${observation.eligible})`}</td><td className="p-2 capitalize">{observation?.status?.replaceAll("_", " ") || "Not measured"}</td></tr>; })}</tbody></table></div> : <EmptyState title="No processes introduced" message="Add a process, then record whether the team actually uses it." icon={Workflow}/>}</Panel>;
  }
  if (section === "quality") {
    const latest = Object.values(Object.fromEntries([...data["quality-observations"]].sort((a, b) => a.week - b.week || a.id - b.id).map((entry) => [entry.indicator, entry])));
    return <Panel title="Engineering quality signals" description="Latest manually recorded observation per indicator. Inapplicable PRs stay outside the denominator.">{latest.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{latest.map((item) => <div key={item.indicator} className="rounded-md border p-3"><p className="text-sm font-medium capitalize">{item.indicator.replaceAll("_", " ")}</p><p className="mt-2 text-xl tabular-nums">{item.eligible ? `${Math.round(item.checked / item.eligible * 100)}%` : "Not measured"}</p><p className="text-xs text-slate-600">Week {item.week} · {item.eligible ? `${item.checked} of ${item.eligible} eligible` : "No denominator"}{item.target_percent !== null ? ` · Target ${item.target_percent}%` : ""}</p></div>)}</div> : <EmptyState title="No quality observations yet" message="Record actual checked and eligible counts to see a rate." icon={ShieldCheck}/>}</Panel>;
  }
  if (section === "documentation") {
    const risk = data.knowledge.filter((item) => item.important && (!item.backup_owner || !item.backup_tested));
    return <div className={`flex items-start gap-3 rounded-md border p-4 text-sm ${risk.length ? "border-amber-200 bg-amber-50 text-amber-900" : "bg-white text-slate-700"}`}><BookOpen size={18} className="shrink-0"/><div><p className="font-semibold">{risk.length} single {risk.length === 1 ? "point" : "points"} of failure</p><p className="mt-1">Important knowledge needs a backup who has actually performed the work. Documentation alone does not count as tested.</p></div></div>;
  }
  if (section === "delegation") {
    const active = data.delegations.filter((item) => !item.took_work_back && item.progress > 0);
    return <div className="grid gap-3 sm:grid-cols-2"><SummaryCard icon={Users} label="People with active ownership" value={new Set(active.map((item) => item.new_owner)).size} hint="Distinct people with progress on delegated work"/><SummaryCard icon={ClipboardCheck} label="Delegations in progress" value={active.length} hint="Not taken back"/></div>;
  }
  if (section === "evidence") {
    const assessments = Object.fromEntries(data.health.map((item) => [item.category, item]));
    const gaps = choices.healthCategories.filter(([category]) => !assessments[category] || ["needs_more", "not_started"].includes(assessments[category].level));
    return <div className="flex items-start gap-3 rounded-md border bg-white p-4 text-sm"><ShieldCheck size={18} className="shrink-0 text-blue-700"/><div><p className="font-semibold">{gaps.length} leadership {gaps.length === 1 ? "area needs" : "areas need"} evidence or assessment</p><p className="mt-1 text-slate-600">These labels are your own assessment, not an automatic leadership score. Open an assessment's details to see why.</p></div></div>;
  }
  return null;
}

export function SectionPage({ section, bootstrap, csrf, notify, refresh, revision }) {
  const location = useLocation();
  const resources = pageSections[section] || [];
  const [active, setActive] = useState(resources[0]);
  const [focused, setFocused] = useState(null);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const knowledgeId = Number(params.get("knowledge"));
    const healthId = Number(params.get("health"));
    const category = params.get("category");
    if (section === "documentation" && Number.isInteger(knowledgeId) && knowledgeId > 0) {
      setActive("knowledge"); setFocused({ resource: "knowledge", id: knowledgeId });
    } else if (section === "evidence" && Number.isInteger(healthId) && healthId > 0) {
      setActive("health"); setFocused({ resource: "health", id: healthId });
    } else if (section === "evidence" && choices.healthCategories.some(([key]) => key === category)) {
      setActive("health"); setFocused({ resource: "health", createValues: { category } });
    } else setFocused(null);
  }, [section, location.search]);
  return <div className="space-y-5">{section === "metrics" && <MetricsChart csrf={csrf} revision={revision} currentWeek={bootstrap.currentWeek} />}{["processes", "quality", "documentation", "delegation", "evidence"].includes(section) && <SectionInsights section={section} csrf={csrf} revision={revision} />}{resources.length > 1 && <div role="tablist" aria-label="Section views" className="flex flex-wrap gap-1 border-b pb-2">{resources.map((resource) => <Button key={resource} role="tab" aria-selected={active === resource} variant={active === resource ? "secondary" : "ghost"} onClick={() => setActive(resource)}>{resourceConfigs[resource].title}</Button>)}</div>}{active && <Records key={active} resource={active} csrf={csrf} currentWeek={bootstrap.currentWeek} checklist={bootstrap.reportChecklist} notify={notify} refresh={refresh} focusRecordId={focused?.resource === active ? focused.id : null} focusCreateValues={focused?.resource === active ? focused.createValues : null} onFocused={() => setFocused(null)}/>}</div>;
}
