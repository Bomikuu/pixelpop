import { useEffect, useState } from "react";
import { CheckCircle2, ChevronDown, Circle, Clock3, FileSearch, Info, LoaderCircle, Receipt, TriangleAlert, X } from "lucide-react";
import { Button } from "../../personal-dashboard/ui/button";
import ProviderIcon from "./ProviderIcon";
import { isResumeReport } from "./api";

const states = {
  queued: { label: "Queued", icon: Circle, tone: "text-slate-600" },
  waiting: { label: "Waiting for AI", icon: LoaderCircle, tone: "text-blue-800" },
  received: { label: "Response received", icon: CheckCircle2, tone: "text-blue-800" },
  ready: { label: "Ready to review", icon: CheckCircle2, tone: "text-emerald-800" },
  failed: { label: "Needs checking", icon: TriangleAlert, tone: "text-amber-900" },
  not_started: { label: "Not started", icon: Circle, tone: "text-slate-600" },
};

function elapsed(start, end) {
  const seconds = Math.max(0, Math.floor(((end || Date.now()) - start) / 1000));
  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export default function AIActivityPanel({ activity, busy, onReview, onUsage, onDismiss }) {
  const [, tick] = useState(0);
  useEffect(() => {
    if (!busy) return;
    const timer = setInterval(() => tick((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [busy]);
  if (!activity) return null;
  const generation = activity.type === "generation";
  const ready = activity.items.filter((item) => item.status === "ready");
  const received = activity.items.filter((item) => ["received", "ready"].includes(item.status));
  const complete = generation && !busy && ready.length === activity.items.length;
  return <section className={`rounded-md border p-3 ${complete ? "border-emerald-200 bg-emerald-50" : "bg-white"}`} aria-label="Application activity">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-950">{complete ? <CheckCircle2 size={20} className="text-emerald-800" aria-hidden="true"/> : generation ? <ProviderIcon provider={activity.provider} size={20}/> : <FileSearch size={18} aria-hidden="true"/>}{complete ? "AI request complete · New results ready" : activity.title}</h3>
        {(busy || activity.items.some((item) => ["failed", "received"].includes(item.status))) && <p role="status" className="mt-1 text-sm leading-6 text-slate-700">{activity.message}</p>}
      </div>
      <div className="flex items-center gap-3 text-xs text-slate-600">
        <span className="flex items-center gap-1.5 tabular-nums" aria-label={`Started at ${new Date(activity.startedAt).toLocaleTimeString()}`}><Clock3 size={15} aria-hidden="true"/><span aria-hidden="true">{elapsed(activity.startedAt, activity.endedAt)}</span></span>
        {!busy && <Button type="button" variant="ghost" size="icon-sm" aria-label="Dismiss activity panel" onClick={onDismiss}><X size={16}/></Button>}
      </div>
    </div>
    <details key={activity.startedAt} open={busy || activity.items.some((item) => ["failed", "received"].includes(item.status))} className="group mt-2"><summary className="w-fit cursor-pointer rounded-sm text-xs text-slate-600 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">{generation ? `${received.length}/${activity.items.length} responses received · ` : ""}See activity details</summary><div className="mt-3 space-y-3">
    {!busy && !activity.items.some((item) => ["failed", "received"].includes(item.status)) && <p className="text-xs leading-5 text-slate-600">{activity.message}</p>}
    <ul className="divide-y border-y">
      {activity.items.map((item) => {
        const state = states[item.status] || states.queued;
        const Icon = state.icon;
        const statusLabel = generation ? state.label : item.status === "waiting" ? "Waiting for Django" : item.status === "ready" ? "Complete" : item.status === "received" ? "Updating view" : state.label;
        return <li key={item.kind} className="py-3">
          <details className="group">
            <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 rounded-sm text-sm hover:text-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 [&::-webkit-details-marker]:hidden">
              <Icon size={17} className={`shrink-0 ${state.tone} ${item.status === "waiting" ? "animate-spin motion-reduce:animate-none" : ""}`} aria-hidden="true"/>
              <span className="min-w-0 flex-1 font-medium">{item.label}</span>
              <span className={`text-xs ${state.tone}`}>{statusLabel}</span>
              {item.startedAt && <span className="text-xs tabular-nums text-slate-500" aria-hidden="true">{elapsed(item.startedAt, item.endedAt)}</span>}
              <ChevronDown size={15} className="shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true"/>
              <span className="sr-only">Request details</span>
            </summary>
            <div className="mt-3 space-y-2 pl-6 text-xs leading-6 text-slate-600">
              <p>{item.detail}</p>
              {generation && <>
                <dl className="grid gap-2 sm:grid-cols-2"><div><dt className="font-medium text-slate-800">Provider / model</dt><dd className="break-words">{item.providerLabel} / {item.model}</dd></div><div><dt className="font-medium text-slate-800">Expected result</dt><dd>{isResumeReport(item.mode) ? "A report linked to the saved résumé revision and sources. No draft changes or approvals." : item.kind === "assessment" ? "Saved fit assessment and source-backed requirement comparisons." : "A proposal for your review. Your existing draft is not replaced automatically."}</dd></div></dl>
                <p><strong className="font-medium text-slate-800">Sources:</strong> {activity.sourceSummary}{["refine", "experience", "discover", "tailor", "check", "fix"].includes(item.mode) ? " The current résumé/draft text is also included for this request." : " No existing draft text is sent for routine generation."}{item.mode === "fix" && " Includes your saved checklist answers for this application."}</p>
                <p>Uses saved records on the server—not unsaved editor text. Source checks, the AI call and response validation share one request; the backend does not stream their internal stages.</p>
                {item.status === "ready" && <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => onReview(item.kind, item.mode, item.proposalId)}><FileSearch size={15}/>Open {isResumeReport(item.mode) ? "report" : item.kind === "assessment" ? "assessment" : "proposal"}</Button>}
              </>}
            </div>
          </details>
        </li>;
      })}
    </ul>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="flex max-w-xl items-start gap-2 text-xs leading-5 text-slate-600"><Info size={15} className="mt-0.5 shrink-0" aria-hidden="true"/><span>{busy ? "Expand a row to inspect its request details while you wait. Closing or refreshing this page does not cancel a provider request; keep it open to see the result." : activity.items.some((item) => item.status === "failed" || item.status === "received") ? "A request or view refresh needs checking. Completed responses are retained; check saved results and AI usage before retrying." : generation ? "Next: review the assessment or proposal. No application has been submitted." : "This action has finished. No AI generation was requested."}</span></p>
      {!busy && generation && <div className="flex flex-wrap gap-2">{ready.length > 0 && <Button type="button" variant="outline" size="sm" onClick={() => onReview(ready[0].kind, ready[0].mode, ready[0].proposalId)}><FileSearch size={15}/>Open new result</Button>}<Button type="button" variant="outline" size="sm" onClick={onUsage}><Receipt size={15}/>Check AI usage</Button></div>}
    </div>
    </div></details>
  </section>;
}
