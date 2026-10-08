import { ArrowRight, CalendarClock, CheckCircle2, ChevronDown, Circle, ClipboardCheck, Clock3, MinusCircle, Send } from "lucide-react";
import { Button } from "../../personal-dashboard/ui/button";

const actionLabels = { profile: "Review profile", resume: "Review résumé", cover_letter: "Review cover letter", answers: "Review answers", final_checks: "Review final checks", posting: "Record submission", activity: "Record activity" };
const states = { complete: "Reviewed", needs_review: "Needs review", not_needed: "Not needed", unset: "Not recorded", due: "Due", upcoming: "Upcoming" };
const readableDate = (date) => date ? new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "";

export default function ApplicationChecklist({ checklist, onAction, busy }) {
  if (!checklist) return null;
  return <section aria-label="Application checklist" className="rounded-md border bg-white px-3 py-2">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-3"><h2 className="flex items-center gap-2 text-sm font-medium"><ClipboardCheck size={16} aria-hidden="true"/>Checklist <span className="text-xs font-normal text-slate-600">{checklist.completed}/{checklist.total} reviewed{checklist.completed === checklist.total ? " · Ready for submission" : ""}</span></h2><progress aria-label="Reviewed preparation steps" value={checklist.completed} max={checklist.total || 1} className="h-1 w-20 accent-blue-600"/>{checklist.follow_up.state === "due" && <Button size="sm" variant="ghost" disabled={busy} onClick={() => onAction(checklist.follow_up.action)}><Clock3 size={14}/>Follow-up due</Button>}</div>
      <Button size="sm" variant="outline" disabled={busy} onClick={() => onAction(checklist.next_action)}>{actionLabels[checklist.next_action]}<ArrowRight size={14}/></Button>
    </div>
    <details className="group mt-1"><summary className="flex w-fit cursor-pointer list-none items-center gap-1 rounded-sm text-xs text-slate-600 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 [&::-webkit-details-marker]:hidden"><span className="group-open:hidden">See checklist</span><span className="hidden group-open:inline">Hide checklist</span><ChevronDown size={14} className="transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true"/></summary><div className="mt-3 space-y-3 border-t pt-3"><p className="text-xs text-slate-600">Preparation reviews only; submission is recorded separately.</p>
    <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{checklist.preparation.map((item) => {
      const Icon = item.state === "complete" ? CheckCircle2 : item.state === "not_needed" ? MinusCircle : Circle;
      return <li key={item.id}><button type="button" disabled={busy || item.state === "not_needed" && item.action !== "final_checks"} onClick={() => onAction(item.action)} className="flex w-full items-center gap-2 rounded-md border border-transparent p-2! text-left text-sm! hover:border-slate-200 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:cursor-default disabled:opacity-70"><Icon size={18} className={`shrink-0 ${item.state === "complete" ? "text-emerald-700" : "text-slate-500"}`}/><span><span className="block font-medium">{item.label}</span><span className="text-xs text-slate-600">{states[item.state]}</span></span></button></li>;
    })}</ul>
    <div className="flex flex-wrap gap-x-6 gap-y-2 border-t pt-3 text-xs">
      <button type="button" disabled={busy} onClick={() => onAction("posting")} className="inline-flex items-center gap-2 text-xs! text-slate-700 hover:text-blue-700"><Send size={14}/>{checklist.submission.state === "complete" ? `Submission recorded${checklist.submission.date ? ` · ${readableDate(checklist.submission.date)}` : ""}` : "Not submitted · Record submission"}</button>
      {checklist.follow_up.state === "not_needed" ? <span className="flex items-center gap-2 text-slate-500"><MinusCircle size={14}/>Follow-up not applicable · Closed application</span> : <button type="button" disabled={busy} onClick={() => onAction(checklist.follow_up.action)} className={`inline-flex items-center gap-2 text-xs! hover:underline ${checklist.follow_up.state === "due" ? "text-amber-800" : "text-slate-700"}`}>{checklist.follow_up.state === "due" ? <Clock3 size={14}/> : <CalendarClock size={14}/>} {checklist.follow_up.date ? `${states[checklist.follow_up.state]} follow-up · ${readableDate(checklist.follow_up.date)}` : "Set a follow-up date"}</button>}
    </div>
    </div></details>
  </section>;
}
