import { ArrowRight, History, Info } from "lucide-react";
import { EmptyState, Panel } from "../../personal-dashboard/components/Panel";

const statusLabel = (value) => value.replaceAll("_", " ");

export default function AssessmentComparison({ comparison }) {
  return <Panel title="Assessment changes" description="Compare real saved assessments—not edits, inferred history or a hiring probability.">
    {!comparison?.available ? <EmptyState icon={History} title="No before-and-after comparison yet" message={comparison?.reason || "Complete two assessments to compare their recorded evidence."}/> : <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">{[["Earlier", comparison.before], ["Latest", comparison.after]].map(([label, item]) => <section key={label} className="space-y-1 border-b pb-3"><h3 className="text-sm font-medium">{label} assessment {item.historical && <span className="text-xs text-slate-500">· Historical sources</span>}</h3><p className="text-xs text-slate-600">{new Date(item.created_at).toLocaleString("en-PH", { timeZone: "Asia/Manila" })} · Manila</p><p className="text-sm tabular-nums">{item.coverage == null ? "No coverage recorded" : `${item.coverage}% evidence coverage`}</p><p className="text-xs text-slate-600">{item.counts.supported} supported · {item.counts.partial} partial · {item.counts.not_evidenced} not evidenced · {item.total} total</p></section>)}</div>
      <p className={`flex items-start gap-2 text-sm leading-6 ${comparison.comparable ? "text-slate-700" : "text-amber-900"}`}><Info size={17} className="mt-0.5 shrink-0"/><span>{comparison.comparable && <span className="font-medium">{comparison.delta > 0 ? "+" : ""}{comparison.delta} percentage points. </span>}{comparison.reason}</span></p>
      {comparison.changes.length ? <ul className="divide-y">{comparison.changes.map((row) => <li key={row.requirement_key} className="py-3 text-sm"><p className="break-words">{row.text}</p><p className="mt-1 flex items-center gap-2 text-xs capitalize text-slate-600">{statusLabel(row.before)}<ArrowRight size={14}/>{statusLabel(row.after)}</p></li>)}</ul> : <p className="text-sm text-slate-600">No evidence-status changes among matching requirements.</p>}
      {[ ["Added requirements", comparison.added], ["Removed requirements", comparison.removed] ].map(([label, rows]) => !!rows.length && <details key={label}><summary className="cursor-pointer text-sm hover:text-blue-700">{label} ({rows.length})</summary><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">{rows.map((text, index) => <li key={index}>{text}</li>)}</ul></details>)}
    </div>}
  </Panel>;
}
