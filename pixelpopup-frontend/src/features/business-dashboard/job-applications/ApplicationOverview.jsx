import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { ArrowRight, CalendarClock, CheckCircle2, ChevronDown, CircleHelp, FileCheck2, FileText, History, Info, Link2, Sparkles, TriangleAlert } from "lucide-react";
import { Button } from "../../personal-dashboard/ui/button";
import { EmptyState, Panel } from "../../personal-dashboard/components/Panel";
import ApplicationChecklist from "./ApplicationChecklist";
import { assessmentState } from "./AssessmentSummary";
import { documentSections, sectionContent } from "./documentSections";
import { labels } from "./api";

const markdown = {
  img: () => null,
  h1: ({ children }) => <h4 className="mb-2 font-medium">{children}</h4>,
  h2: ({ children }) => <h4 className="mb-2 mt-4 font-medium">{children}</h4>,
  h3: ({ children }) => <h4 className="mb-2 mt-4 font-medium">{children}</h4>,
  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5">{children}</ul>,
};

export default function ApplicationOverview({ record, assessment, dirty, busy, onAction, onInspect, onRequirements, onAssessment, onActivity, onFile, onChecks, onSettings, onLinked }) {
  const [expanded, setExpanded] = useState(false);
  const state = assessmentState(assessment, dirty, record.requirement_decisions);
  const sections = documentSections(assessment?.body || "");
  const introduction = sections.find((item) => item.title === "Header & introduction");
  const verdict = sections.find((item) => /recommend|overall|verdict|summary/i.test(item.title)) || sections[0];
  const summary = [...new Set([introduction, verdict].filter(Boolean))].map(sectionContent).join("\n\n");
  const findings = state.gaps.length ? state.gaps.slice(0, 3) : state.requirements.map((item, index) => ({ ...item, index })).slice(0, 3);
  const events = (record.activities || []).slice(0, 3);
  const pending = (record.pending_proposals || []).reduce((total, item) => total + item.count, 0);
  const date = (value) => new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

  return <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,7fr)_minmax(260px,3fr)]">
    <div className="min-w-0 space-y-4">
      <Panel title="Fit at a glance" action={<Button size="sm" variant="outline" disabled={busy} onClick={onAssessment}><FileText size={15}/>Full assessment</Button>}>
        {summary ? <><p className={`mb-3 flex items-center gap-2 text-sm font-medium ${state.positive ? "text-emerald-800" : "text-amber-900"}`}>{state.positive ? <CheckCircle2 size={17}/> : <Info size={17}/>} {state.label}</p>
          <div id="application-overview-summary" className={`max-w-prose break-words text-sm leading-6 text-slate-700 ${expanded ? "" : "line-clamp-6"}`}><ReactMarkdown components={markdown}>{summary}</ReactMarkdown></div>
          <Button size="sm" variant="ghost" className="mt-2" aria-expanded={expanded} aria-controls="application-overview-summary" onClick={() => setExpanded(!expanded)}><ChevronDown size={14} className={expanded ? "rotate-180" : ""}/>{expanded ? "Show less" : "Show full summary"}</Button>
        </> : <EmptyState icon={FileCheck2} title="Your fit has not been assessed" message="Compare your confirmed experience with this posting, then review the cost before generating." action={<Button size="sm" variant="outline" disabled={busy} onClick={onAssessment}><Sparkles size={15}/>Open assessment</Button>}/>}
        {!!findings.length && <section className="mt-4 border-t pt-4"><div className="mb-2 flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-medium">{state.gaps.length ? "Priority evidence gaps" : "Supported requirements"}</h3><span className="text-xs text-slate-600">{state.gaps.length || state.requirements.length} total</span></div>
          <ul className="divide-y">{findings.map((item) => <li key={item.index}><button type="button" disabled={busy} onClick={() => onInspect(item.index)} className="flex w-full items-start gap-3 rounded-md px-2 py-3 text-left transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-60"><span className={`grid size-8 shrink-0 place-items-center rounded-full ${item.status === "supported" && !item.notMet ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}>{item.status === "supported" && !item.notMet ? <CheckCircle2 size={16}/> : item.status === "partial" ? <CircleHelp size={16}/> : <TriangleAlert size={16}/>}</span><span className="min-w-0 flex-1"><span className="block line-clamp-2 text-sm font-medium">{item.text}</span><span className="mt-1 block text-xs capitalize text-slate-600">{item.importance} · {item.notMet ? "Recorded as not met" : item.status.replaceAll("_", " ")}</span></span><ArrowRight size={15} className="mt-2 shrink-0 text-slate-500"/></button></li>)}</ul>
          {state.requiredGaps > 0 && <p className="mt-2 text-xs text-amber-900">{state.requiredGaps} required requirement{state.requiredGaps === 1 ? " needs" : "s need"} evidence review. These are not verified skill deficiencies.</p>}
          <Button size="sm" variant="ghost" className="mt-2" disabled={busy} onClick={onRequirements}>View all {state.requirements.length} requirements<ArrowRight size={15}/></Button>
        </section>}
      </Panel>
      <ApplicationChecklist checklist={record.checklist} onAction={onAction} busy={busy}/>
      <Panel title="Latest activity" action={<Button size="sm" variant="ghost" disabled={busy} onClick={onActivity}>View activity<ArrowRight size={15}/></Button>}>
        {events.length ? <ol className="divide-y">{events.map((item) => <li key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600"><History size={15}/></span><div className="min-w-0"><p className="text-xs capitalize text-slate-600">{item.kind.replaceAll("_", " ")} · <time dateTime={item.occurred_on}>{date(item.occurred_on)}</time></p><p className="mt-1 line-clamp-2 break-words text-sm leading-6">{item.message}</p></div></li>)}</ol> : <EmptyState icon={History} title="No activity recorded" message="Replies, interviews and notes will appear here."/>}
      </Panel>
    </div>
    <aside aria-label="Application review summary" className="min-w-0 space-y-4 xl:sticky xl:top-20">
      <Panel title="Review summary">
        <dl className="space-y-3 text-sm"><div className="flex justify-between gap-3"><dt className="text-slate-600">Status</dt><dd className="capitalize">{record.status}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-600">Pending proposals</dt><dd className="tabular-nums">{pending}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-600">Recruiter check</dt><dd>{record.resume_check ? `${record.resume_check.findings?.length || 0} findings${record.resume_check.stale ? " · Outdated" : ""}` : "Not run"}</dd></div></dl>
        <Button className="mt-4 w-full" size="sm" variant="outline" disabled={busy} onClick={onChecks}><FileCheck2 size={15}/>Open checks</Button>
        <ul className="mt-4 space-y-1 border-t pt-3">{["resume", "cover_letter", "answers"].map((key) => { const artifact = record.artifacts.find((item) => item.kind === key); return <li key={key}><button type="button" disabled={busy} onClick={() => onFile(key)} className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-xs hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-60"><span className="flex items-center gap-2"><FileText size={14}/>{labels[key]}</span><span className={artifact?.review?.reviewed ? "text-emerald-800" : "text-slate-600"}>{artifact?.review?.reviewed ? "Reviewed" : artifact?.body ? "Draft" : key === "answers" && !record.questions.length ? "Not needed" : "Not saved"}</span></button></li>; })}</ul>
      </Panel>
      {(record.applied_on || record.follow_up_on) && <section className="space-y-3 rounded-md border bg-white p-4 text-sm">{[[record.applied_on, "Applied"], [record.follow_up_on, "Follow-up"]].filter(([value]) => value).map(([value, label]) => <p key={label} className="flex items-center gap-2"><CalendarClock size={16} className="shrink-0 text-slate-500"/><span className="text-slate-600">{label}</span><time className="ml-auto" dateTime={value}>{date(value)}</time></p>)}</section>}
      {record.client_link && <section className="space-y-2 rounded-md border bg-white p-4 text-sm"><h3 className="flex items-center gap-2 font-medium"><Link2 size={16}/>Linked client work</h3>{record.client_link.unavailable ? <p className="text-xs leading-5 text-amber-900">The linked project is unavailable. Review your client records.</p> : <><Button className="w-full justify-start" size="sm" variant="ghost" disabled={busy} onClick={() => onLinked(`clients/${record.client_link.client_id}`)}>{record.client_link.client_name}<ArrowRight size={14}/></Button><Button className="w-full justify-start whitespace-normal text-left" size="sm" variant="ghost" disabled={busy} onClick={() => onLinked(`clients/${record.client_link.client_id}/projects/${record.client_link.project_id}`)}>{record.client_link.project_title}<ArrowRight size={14}/></Button></>}</section>}
      <Button size="sm" variant="ghost" disabled={busy} onClick={onSettings}><Sparkles size={15}/>AI provider & budget</Button>
    </aside>
  </div>;
}
