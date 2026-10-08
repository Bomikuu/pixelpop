import { ArrowRight, BriefcaseBusiness, CalendarClock } from "lucide-react";
import { AssessmentCoverage } from "./AssessmentSummary";
import PostingHighlights from "./PostingHighlights";

export default function ApplicationListItem({ item, navigate }) {
  const assessment = item.assessment_summary;
  return <li>
    <a href={`/business/applications/${item.id}`} onClick={(event) => {
      if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.button === 0) {
        event.preventDefault(); navigate(`applications/${item.id}`);
      }
    }} className="group grid min-w-0 cursor-pointer gap-4 rounded-md p-4 text-slate-950 no-underline transition-colors hover:bg-blue-50/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 lg:grid-cols-[minmax(0,1fr)_minmax(240px,320px)]">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700"><BriefcaseBusiness size={19} aria-hidden="true"/></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><h3 className="break-words text-sm font-medium">{item.role}</h3><span className={`rounded border px-2 py-0.5 text-xs capitalize ${item.status === "offer" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : item.status === "rejected" ? "border-red-200 bg-red-50 text-red-800" : "border-slate-200 bg-white text-slate-600"}`}>{item.status}</span><ArrowRight size={16} aria-hidden="true" className="ml-auto shrink-0 text-slate-400 transition-transform motion-safe:group-hover:translate-x-1"/></div>
          <p className="mt-1 text-sm text-slate-600">{item.company}{item.platform && ` · ${item.platform}`}</p>
          <PostingHighlights posting={item.posting} requirements={assessment?.requirements_stale ? [] : assessment?.requirements || []} variant="tags" compact/>
          <p className="mt-2 text-xs text-slate-500">Added {new Date(item.created_at).toLocaleDateString("en-PH", { timeZone: "Asia/Manila" })}{item.applied_on && ` · Applied ${item.applied_on}`}</p>
          {item.latest_response && <p className="mt-2 line-clamp-2 text-xs text-slate-600">Latest reply · {item.latest_response.message}</p>}
          {item.follow_up_on && <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-600"><CalendarClock size={13} aria-hidden="true"/>Follow up {item.follow_up_on}</p>}
        </div>
      </div>
      <div className="min-w-0 border-t pt-3 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0"><AssessmentCoverage artifact={assessment} decisions={assessment?.decisions} compact/></div>
    </a>
  </li>;
}
