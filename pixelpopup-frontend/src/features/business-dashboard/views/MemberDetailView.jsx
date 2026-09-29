import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, BookOpen, CalendarClock, ChartNoAxesCombined, CheckCircle2, CircleAlert, CircleHelp, ClipboardCheck, GitPullRequest, Target, UserRoundCheck, Users, Workflow } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { allRecords, leadershipApi } from "../api";
import { Button } from "../../personal-dashboard/ui/button";
import { EmptyState, ErrorState, Panel } from "../../personal-dashboard/components/Panel";
import DailyCheckIn from "../components/DailyCheckIn";
import { memberWorkSignal, todayInManila } from "../attention";

const resources = ["actions", "goals", "delegations", "processes", "pr-reviews", "knowledge", "friction", "metric-entries", "metric-definitions"];
const statusText = (value) => String(value || "Not started").replaceAll("_", " ");

function MemberStat({ icon: Icon, label, value, detail }) {
  return <div className="rounded-md border bg-white p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm text-slate-600">{label}</span><span className="grid size-9 place-items-center rounded-full bg-blue-50 text-blue-700"><Icon size={17} aria-hidden="true"/></span></div><p className="mt-2 text-2xl font-semibold tabular-nums text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-600">{detail}</p></div>;
}

function MemberList({ items, empty, icon: Icon, label, detail }) {
  if (!items.length) return <EmptyState title={empty} message="No matching record has been saved for this person yet." icon={Icon}/>;
  return <ul className="divide-y rounded-md border bg-white">{items.map((item) => <li key={item.id} className="flex flex-wrap items-center gap-3 px-3 py-3"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700"><Icon size={17} aria-hidden="true"/></span><div className="min-w-0 flex-1"><p className="text-sm font-medium text-slate-950">{label(item)}</p><p className="mt-0.5 text-xs text-slate-600">{detail(item)}</p></div></li>)}</ul>;
}

export default function MemberDetailView({ memberId, csrf, currentWeek, onBack, onMemberLoaded, notify }) {
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [markingSelf, setMarkingSelf] = useState(false);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [person, ...lists] = await Promise.all([leadershipApi(`team-members/${memberId}/`, {}, csrf), ...resources.map((resource) => allRecords(resource, csrf))]);
      setMember(person);
      setData(Object.fromEntries(resources.map((resource, index) => [resource, lists[index]])));
      onMemberLoaded(person.id, person.name);
    } catch (cause) { setError(cause.status === 404 ? "This team member was not found in your plan." : cause.message); }
    finally { setLoading(false); }
  }, [memberId, csrf, onMemberLoaded]);
  useEffect(() => { load(); }, [load, revision]);

  const view = useMemo(() => {
    if (!data || !member) return null;
    const id = member.id;
    const actions = data.actions.filter((item) => item.owner === id && item.status !== "moved");
    const goals = data.goals.filter((item) => item.owner === id);
    const delegations = data.delegations.filter((item) => item.new_owner === id);
    const processes = data.processes.filter((item) => item.owner === id);
    const reviews = data["pr-reviews"].filter((item) => item.developer === id || item.reviewer === id);
    const knowledge = data.knowledge.filter((item) => item.original_owner === id || item.backup_owner === id);
    const friction = data.friction.filter((item) => item.owner === id);
    const actionIds = new Set(data.actions.filter((item) => item.owner === id).map((item) => item.id));
    const measurements = data["metric-entries"].filter((item) => actionIds.has(item.action));
    const definitions = new Map(data["metric-definitions"].map((item) => [item.id, item]));
    const weekly = Array.from({ length: 12 }, (_, index) => ({ week: `W${index + 1}`, assigned: actions.filter((item) => item.current_week === index + 1).length, completed: actions.filter((item) => item.current_week === index + 1 && item.status === "completed").length }));
    return { actions, goals, delegations, processes, reviews, knowledge, friction, measurements, definitions, weekly };
  }, [data, member]);

  if (loading) return <div aria-busy="true" className="space-y-4"><div className="h-24 animate-pulse rounded-md bg-slate-100"/><div className="h-40 animate-pulse rounded-md bg-slate-100"/></div>;
  if (error) return <ErrorState message={error} retry={() => setRevision((old) => old + 1)}/>;
  if (!view) return null;

  const completed = view.actions.filter((item) => item.status === "completed").length;
  const active = view.actions.filter((item) => ["not_started", "in_progress", "blocked", "delegated"].includes(item.status)).length;
  const owned = view.delegations.filter((item) => !item.took_work_back).length;
  const reviewed = view.reviews.filter((item) => item.reviewer === member.id).length;
  const ownedWork = [
    ...view.delegations.map((item) => ({ id: `delegation-${item.id}`, title: item.title, detail: `Delegation · ${item.progress}% progress${item.took_work_back ? " · Taken back" : ""}` })),
    ...view.processes.map((item) => ({ id: `process-${item.id}`, title: item.name, detail: "Process owner" })),
    ...view.knowledge.map((item) => ({ id: `knowledge-${item.id}`, title: item.title, detail: item.backup_owner === member.id ? "Backup owner" : "Knowledge owner" })),
    ...view.friction.map((item) => ({ id: `friction-${item.id}`, title: item.friction, detail: `Improvement owner · ${statusText(item.status)}` })),
  ];
  const workSignal = memberWorkSignal(member, data.actions, currentWeek, todayInManila());
  const signalStyle = {
    urgent: "border-rose-200 bg-rose-50 text-rose-900",
    soon: "border-amber-200 bg-amber-50 text-amber-900",
    good: "border-emerald-200 bg-emerald-50 text-emerald-900",
    neutral: "border-slate-200 bg-slate-50 text-slate-800",
  };
  const SignalIcon = { urgent: CircleAlert, soon: CalendarClock, good: CheckCircle2, neutral: CircleHelp }[workSignal.level];

  const markSelf = async () => {
    if (!window.confirm(`Mark ${member.name} as “This is me”? Any existing check-ins remain with the person originally recorded; they will not move.`)) return;
    setMarkingSelf(true);
    try {
      const updated = await leadershipApi(`team-members/${member.id}/mark-self/`, { method: "POST" }, csrf);
      setMember(updated);
      notify?.(`${updated.name} is now marked as you.`);
    } catch (cause) { notify?.(cause.message, true); }
    finally { setMarkingSelf(false); }
  };

  return <div className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-start gap-3"><span className="grid size-12 shrink-0 place-items-center rounded-full bg-blue-50 text-base font-semibold text-blue-700" aria-hidden="true">{member.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</span><div><h2 className="flex items-center gap-2 text-xl font-semibold text-slate-950">{member.name}{member.is_self && <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-800">You</span>}</h2><p className="mt-1 text-sm text-slate-600">{member.role || "Team member"}</p></div></div><div className="flex flex-wrap gap-2">{!member.is_self && <Button variant="outline" onClick={markSelf} disabled={markingSelf}><UserRoundCheck size={16}/>{markingSelf ? "Saving…" : "Mark as me"}</Button>}<Button variant="outline" onClick={onBack}><ArrowLeft size={16}/> Team development</Button></div></div>
    <section aria-label="Recorded work status" className={"flex flex-wrap items-start gap-3 rounded-md border p-4 text-sm " + signalStyle[workSignal.level]}><SignalIcon size={19} className="mt-0.5 shrink-0" aria-hidden="true"/><div className="min-w-0 flex-1"><p className="font-semibold">{workSignal.title}</p><p className="mt-1">{workSignal.detail}. This reflects saved action records, not an assessment of the person.</p>{workSignal.items.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{workSignal.items.slice(0, 3).map(({ action }) => <Button key={action.id} size="sm" variant="outline" onClick={() => navigate("/business/roadmap?action=" + action.id)}><span className="max-w-52 truncate">Open {action.title}</span></Button>)}</div>}</div></section>
    {(member.strengths || member.developing || member.ownership_opportunity) && <div className="grid gap-3 rounded-md border bg-white p-4 text-sm sm:grid-cols-3">{[["Strengths", member.strengths], ["Developing", member.developing], ["Ownership opportunity", member.ownership_opportunity]].filter(([, value]) => value).map(([label, value]) => <div key={label}><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-1 whitespace-pre-wrap text-slate-800">{value}</p></div>)}</div>}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MemberStat icon={ClipboardCheck} label="Assigned actions" value={view.actions.length} detail={`${active} currently open`}/><MemberStat icon={CheckCircle2} label="Completed actions" value={`${completed} / ${view.actions.length}`} detail={view.actions.length ? `${Math.round(completed / view.actions.length * 100)}% recorded complete · not a performance score` : "No assigned actions yet"}/><MemberStat icon={Users} label="Delegated ownership" value={owned} detail="Items not taken back"/><MemberStat icon={GitPullRequest} label="PRs reviewed" value={reviewed} detail={`${view.reviews.length} PRs involving this person`}/></div>
    {member.is_self && <DailyCheckIn csrf={csrf} notify={notify} memberId={member.id} showHistory/>}
    <Panel title="Weekly action activity" description="Assigned and completed action records by week. Empty weeks are zero recorded actions, not a judgment of work quality.">{view.actions.length ? <><div className="h-56 min-w-0" role="img" aria-label={`Weekly assigned and completed action counts for ${member.name}`}><ResponsiveContainer width="100%" height="100%"><BarChart data={view.weekly} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}><CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false}/><XAxis dataKey="week" fontSize={11}/><YAxis allowDecimals={false} fontSize={11}/><Tooltip/><Legend/><Bar name="Assigned" dataKey="assigned" fill="#93c5fd" radius={[2, 2, 0, 0]}/><Bar name="Completed" dataKey="completed" fill="#2563eb" radius={[2, 2, 0, 0]}/></BarChart></ResponsiveContainer></div><div className="sr-only"><table><caption>Weekly action counts for {member.name}</caption><thead><tr><th>Week</th><th>Assigned</th><th>Completed</th></tr></thead><tbody>{view.weekly.map((item) => <tr key={item.week}><th>{item.week}</th><td>{item.assigned}</td><td>{item.completed}</td></tr>)}</tbody></table></div></> : <EmptyState title="No actions assigned" message="Assign this person to a weekly action to see factual activity here." icon={ChartNoAxesCombined}/>}</Panel>
    <div className="grid gap-5 xl:grid-cols-2"><Panel title="Assigned actions" description="Current action records, including carried follow-ups."><MemberList items={view.actions} empty="No assigned actions" icon={ClipboardCheck} label={(item) => item.title} detail={(item) => `Week ${item.current_week} · ${statusText(item.status)}${item.due_date ? ` · Due ${item.due_date}` : ""}`}/></Panel><Panel title="Owned work" description="Delegations, processes, knowledge, and improvements attached to this person."><MemberList items={ownedWork} empty="No owned work recorded" icon={Workflow} label={(item) => item.title} detail={(item) => item.detail}/></Panel></div>
    <div className="grid gap-5 xl:grid-cols-2"><Panel title="Team goals" description="Goals where this person is the named owner."><MemberList items={view.goals} empty="No owned goals" icon={Target} label={(item) => item.title} detail={(item) => `Week ${item.week}${item.outcome ? ` · ${item.outcome}` : " · Outcome not recorded"}`}/></Panel><Panel title="PR involvement" description="Developer and reviewer roles from recorded PR reviews."><MemberList items={view.reviews} empty="No PR reviews recorded" icon={GitPullRequest} label={(item) => item.name} detail={(item) => `${item.reviewer === member.id ? "Reviewer" : "Developer"}${item.developer === member.id && item.reviewer === member.id ? " and developer" : ""} · ${item.reviewed_on}${item.outcome ? ` · ${item.outcome}` : ""}`}/></Panel></div>
    <Panel title="Linked measurements" description="Only measurements explicitly linked to this person's assigned actions; these are team metrics, not an individual score."><MemberList items={view.measurements} empty="No linked measurements" icon={BookOpen} label={(item) => view.definitions.get(item.definition)?.name || `Metric #${item.definition}`} detail={(item) => `Week ${item.week} · ${item.value !== null ? `${item.value} ${view.definitions.get(item.definition)?.unit || ""}` : item.denominator ? `${item.numerator}/${item.denominator}` : "No value"}${item.movement_note ? ` · ${item.movement_note}` : ""}`}/></Panel>
  </div>;
}
