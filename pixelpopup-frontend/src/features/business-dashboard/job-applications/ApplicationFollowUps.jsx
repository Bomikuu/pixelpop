import { useEffect, useState } from "react";
import { ArrowRight, CalendarClock, Clock3, MessageSquare, RefreshCw } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Button } from "../../personal-dashboard/ui/button";
import { Tabs, TabsList, TabsTrigger } from "../../personal-dashboard/ui/tabs";
import { EmptyState, ErrorState, Panel } from "../../personal-dashboard/components/Panel";
import FollowUpForm from "./FollowUpForm";
import WorkflowPages from "./WorkflowPages";
import { jobApi } from "./api";

function dueText(date, today) {
  const days = Math.round((Date.parse(`${date}T00:00:00+08:00`) - Date.parse(`${today}T00:00:00+08:00`)) / 86400000);
  return days === 0 ? "Due today" : days < 0 ? `${Math.abs(days)} day${days === -1 ? "" : "s"} overdue` : `In ${days} day${days === 1 ? "" : "s"}`;
}

export default function ApplicationFollowUps({ navigate, notify }) {
  const [params, setParams] = useSearchParams();
  const range = params.get("range") === "upcoming" ? "upcoming" : "due";
  const page = Math.max(1, Number.parseInt(params.get("page") || "1", 10) || 1);
  const [data, setData] = useState(null), [busy, setBusy] = useState(true), [error, setError] = useState(""), [reload, setReload] = useState(0), [dialog, setDialog] = useState(null);
  const update = (values) => setParams((previous) => { const next = new URLSearchParams(previous); Object.entries(values).forEach(([key, value]) => next.set(key, String(value))); return next; });
  useEffect(() => {
    const controller = new AbortController(); setBusy(true); setError("");
    jobApi(`applications/follow-ups/?range=${range}&page=${page}`, { signal: controller.signal }).then((result) => { if (!controller.signal.aborted) { setData(result); setBusy(false); } }).catch((issue) => { if (!controller.signal.aborted) { setError(issue.message); setBusy(false); } });
    return () => controller.abort();
  }, [range, page, reload]);
  return <Panel title="Follow-ups" description="Your in-app next actions. No message is sent and no date is chosen automatically." action={<Button size="sm" variant="outline" disabled={busy} onClick={() => setReload((value) => value + 1)}><RefreshCw size={15}/>Refresh</Button>}>
    <Tabs value={range} onValueChange={(value) => update({ range: value, page: 1 })}><TabsList variant="line" className="mb-4"><TabsTrigger value="due"><Clock3 size={15}/>Due</TabsTrigger><TabsTrigger value="upcoming"><CalendarClock size={15}/>Upcoming</TabsTrigger></TabsList></Tabs>
    {error && <ErrorState message={error} retry={() => { if (page > 1) update({ page: 1 }); else setReload((value) => value + 1); }}/>} 
    {busy ? <p role="status" className="py-10 text-sm text-slate-600">Loading follow-ups…</p> : !error && <>
      {data?.results?.length ? <ul className="divide-y">{data.results.map((item) => { const overdue = item.follow_up_on < data.today; return <li key={item.id} className="flex flex-wrap items-start gap-3 py-4 first:pt-0"><span className={`grid size-10 shrink-0 place-items-center rounded-full ${overdue ? "bg-red-50 text-red-800" : range === "due" ? "bg-amber-50 text-amber-800" : "bg-blue-50 text-blue-700"}`}><CalendarClock size={19}/></span><div className="min-w-0 flex-1"><a href={`/business/applications/${item.id}`} onClick={(event) => { if (!event.ctrlKey && !event.metaKey && event.button === 0) { event.preventDefault(); navigate(`applications/${item.id}`); } }} className="break-words text-sm font-medium hover:text-blue-700 hover:underline focus-visible:outline-blue-600">{item.role}</a><p className="mt-1 text-xs text-slate-600">{item.company} · <span className="capitalize">{item.status}</span>{item.status === "ready" && " · Pre-submission next action"}</p><p className={`mt-2 flex items-center gap-1.5 text-xs ${overdue ? "text-red-800" : "text-slate-600"}`}><Clock3 size={14}/>{dueText(item.follow_up_on, data.today)} · <time dateTime={item.follow_up_on}>{new Date(`${item.follow_up_on}T00:00:00+08:00`).toLocaleDateString("en-PH", { timeZone: "Asia/Manila", month: "short", day: "numeric", year: "numeric" })}</time></p>{item.latest_response && <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">Latest reply ({item.latest_response.occurred_on}): {item.latest_response.message}</p>}</div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => navigate(`applications/${item.id}`)}><ArrowRight size={15}/>Open</Button><Button size="sm" variant="outline" onClick={() => setDialog({ record: item, mode: "reschedule" })}><CalendarClock size={15}/>Reschedule</Button><Button size="sm" onClick={() => setDialog({ record: item, mode: "record" })}><MessageSquare size={15}/>Record follow-up</Button></div></li>; })}</ul> : <EmptyState icon={CalendarClock} title={range === "due" ? "No follow-ups due" : "No upcoming follow-ups"} message="Scheduled Ready, Applied and Interviewing applications appear here. Set a date on an application to add it."/>}
      <WorkflowPages data={data} page={page} onPage={(value) => update({ page: value })} busy={busy}/>
    </>}
    {dialog && <FollowUpForm record={dialog.record} mode={dialog.mode} notify={notify} onCancel={() => setDialog(null)} onSaved={() => { setDialog(null); update({ page: 1 }); setReload((value) => value + 1); }}/>} 
  </Panel>;
}
