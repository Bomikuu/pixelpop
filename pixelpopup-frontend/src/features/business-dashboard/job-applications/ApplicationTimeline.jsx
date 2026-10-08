import { useEffect, useState } from "react";
import { CalendarClock, CheckCircle2, FileText, History, MessageSquare, Plus, Send, Sparkles } from "lucide-react";
import { Button } from "../../personal-dashboard/ui/button";
import { Panel, EmptyState, ErrorState } from "../../personal-dashboard/components/Panel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../personal-dashboard/ui/select";
import { jobApi } from "./api";
import WorkflowPages from "./WorkflowPages";

const icons = { response: MessageSquare, note: FileText, submitted: Send, interview: CalendarClock, follow_up: CalendarClock, date_changed: CalendarClock, generated: Sparkles, reviewed: CheckCircle2 };
const groups = [["all", "All events"], ["communication", "Replies & notes"], ["scheduling", "Interviews & follow-ups"], ["status", "Status & submissions"], ["preparation", "Preparation & review"]];
function EventItem({ item, upcoming = false }) {
  const Icon = icons[item.kind] || History;
  return <li className="flex gap-3 py-4 first:pt-0"><span className={`grid size-9 shrink-0 place-items-center rounded-full ${upcoming ? "bg-amber-50 text-amber-800" : item.kind === "response" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}><Icon size={17} aria-hidden="true"/></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2 text-xs text-slate-600"><span className="font-medium capitalize">{item.kind.replaceAll("_", " ")}</span><time dateTime={item.occurred_on}>{item.occurred_on}</time>{upcoming && <span className="rounded border border-amber-200 px-1.5 text-amber-800">Upcoming</span>}</div><p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">{item.message}</p></div></li>;
}

export default function ApplicationTimeline({ applicationId, refreshKey, onActivity }) {
  const [data, setData] = useState(null), [group, setGroup] = useState("all"), [range, setRange] = useState("history"), [page, setPage] = useState(1);
  const [busy, setBusy] = useState(true), [error, setError] = useState(""), [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setBusy(true); setError("");
    jobApi(`applications/${applicationId}/timeline/?group=${group}&range=${range}&page=${page}`, { signal: controller.signal })
      .then((result) => { if (!controller.signal.aborted) { setData(result); setBusy(false); } })
      .catch((issue) => { if (!controller.signal.aborted) { setError(issue.message); setBusy(false); } });
    return () => controller.abort();
  }, [applicationId, refreshKey, group, range, page, retry]);
  return <Panel title="Application timeline" description="Actual submissions, replies, notes and review activity. Date-only entries keep the date you recorded." action={<Button size="sm" onClick={onActivity}><Plus size={15}/>Record activity</Button>}>
    <div className="mb-4 flex flex-wrap gap-3"><Select value={group} onValueChange={(value) => { setGroup(value); setPage(1); }}><SelectTrigger aria-label="Timeline event group"><SelectValue/></SelectTrigger><SelectContent className="personal-dashboard">{groups.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select><Select value={range} onValueChange={(value) => { setRange(value); setPage(1); }}><SelectTrigger aria-label="Timeline date range"><SelectValue/></SelectTrigger><SelectContent className="personal-dashboard"><SelectItem value="history">Recorded history</SelectItem><SelectItem value="upcoming">Upcoming dates</SelectItem><SelectItem value="all">All dates</SelectItem></SelectContent></Select></div>
    {error && <ErrorState message={error} retry={() => setRetry(retry + 1)}/>}
    {busy ? <p role="status" className="py-8 text-sm text-slate-600">Loading timeline…</p> : !error && <>
      {!!data?.current_dates?.length && <div className="mb-4 flex flex-wrap gap-3 border-b pb-4">{data.current_dates.map((item) => <p key={item.field} className="flex items-center gap-2 text-xs text-slate-600"><CalendarClock size={15}/>{item.label}: <time dateTime={item.date}>{item.date}</time>{item.upcoming && " (upcoming)"}</p>)}</div>}
      {range === "history" && data?.upcoming_count > 0 && <section className="mb-5 border-b pb-4"><h3 className="mb-3 text-sm font-medium">Upcoming ({data.upcoming_count})</h3><ol className="divide-y">{data.upcoming.map((item) => <EventItem key={item.id} item={item} upcoming/>)}</ol><Button size="sm" variant="outline" onClick={() => { setRange("upcoming"); setPage(1); }}><CalendarClock size={15}/>View upcoming dates</Button></section>}
      {data?.results?.length ? <ol className="divide-y">{data.results.map((item) => <EventItem key={item.id} item={item} upcoming={range === "upcoming" || item.occurred_on > new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())}/>)}</ol> : <EmptyState icon={History} title="No events in this view" message="Try another group or record a reply, interview or note."/>}
      <WorkflowPages data={data} page={page} onPage={setPage} busy={busy}/>
    </>}
  </Panel>;
}
