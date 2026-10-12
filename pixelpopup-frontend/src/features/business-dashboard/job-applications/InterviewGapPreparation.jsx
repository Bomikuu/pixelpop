import { useState } from "react";
import { BookOpen, ChevronDown, Sparkles } from "lucide-react";
import { Button } from "../../personal-dashboard/ui/button";
import ExperienceExampleReview from "./ExperienceExampleReview";

export default function InterviewGapPreparation({ data, rows = [], busy, blockedReason, onRequest, onReview, onConfirm }) {
  const [expanded, setExpanded] = useState(false);
  const items = (data?.items || []).filter((item) => item.status !== "discarded");
  const visible = expanded ? items : items.slice(0, 3);
  return <section className="space-y-3 rounded-md border bg-white p-4" aria-labelledby="gap-preparation-title">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 id="gap-preparation-title" className="flex items-center gap-2 text-sm font-semibold"><BookOpen size={17}/>Examples & targeted preparation</h3><p className="mt-1 text-xs leading-5 text-slate-600">Approve wording for practice. Confirm actual work separately before résumé tailoring.</p></div><div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" disabled={busy || !!blockedReason} onClick={() => onRequest({ mode: "gapplan" })}><BookOpen size={15}/>Study a requirement</Button>{data?.resume_reference && <Button type="button" size="sm" variant="outline" disabled={busy || !!blockedReason} onClick={() => onRequest({ mode: "gapplan", resume_proposal_id: data.resume_reference.id, reference_version: data.resume_reference.version })}><Sparkles size={15}/>Prepare résumé changes</Button>}</div></div>
    {blockedReason && <p role="status" className="text-xs leading-5 text-amber-900">{blockedReason}</p>}
    {visible.length ? <ul>{visible.map((item) => <ExperienceExampleReview key={item.id} item={item} row={rows.find((row) => row.requirement_key === item.requirement_key)} busy={busy} preparationDisabled={!!blockedReason} onReview={onReview} onConfirm={onConfirm} onPrepare={(example) => onRequest({ ...example.selection, mode: "gapplan", example_proposal_id: example.id, resume_proposal_id: null, reference_version: example.version })}/>)}</ul> : <p className="flex items-center gap-2 py-3 text-sm text-slate-600"><BookOpen size={18}/>No targeted preparation yet. Start an example in Checks → Tailor résumé, or choose a requirement here.</p>}
    {items.length > 3 && <Button type="button" size="sm" variant="ghost" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}><ChevronDown size={15} className={expanded ? "rotate-180" : ""}/>{expanded ? "Show less" : `Show more (${items.length - 3})`}</Button>}
  </section>;
}
