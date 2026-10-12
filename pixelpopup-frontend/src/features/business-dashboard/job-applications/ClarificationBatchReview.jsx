import { CheckCircle2, CircleHelp, Pencil } from "lucide-react";
import { Button } from "../../personal-dashboard/ui/button";

const sourceLabels = { facts: "Profile", resume_text: "Source résumé", project_experience: "Confirmed project", clarifications: "Confirmed answer" };

export default function ClarificationBatchReview({ findings, values, drafts, disabled, onEdit }) {
  return <section aria-labelledby="clarification-batch-title" className="min-w-0 space-y-3">
    <div><h3 id="clarification-batch-title" className="text-sm font-semibold">Review all answers together</h3><p className="mt-1 text-xs leading-5 text-slate-600">These are drafts, not confirmed facts. Check the wording below; use Edit only where needed.</p></div>
    <ul className="min-w-0 divide-y rounded-md border bg-white">
      {findings.map((finding, index) => {
        const answered = values[`status_${index}`] === "answered", draft = drafts[index];
        const Icon = answered ? CheckCircle2 : CircleHelp;
        const text = values[`answer_${index}`] || draft?.reason || "No supported answer. Leave unresolved or add actual details.";
        return <li key={index} className="min-w-0 space-y-2 p-3 sm:p-4">
          <div className="flex items-start gap-2"><Icon size={16} className={`mt-0.5 shrink-0 ${answered ? "text-emerald-800" : "text-slate-600"}`} aria-hidden="true"/><div className="min-w-0 flex-1"><h4 className="break-words text-sm font-medium">{finding.section_title}</h4><p className="text-xs text-slate-600">{finding.category} · {answered ? draft ? "AI draft · Review facts" : "Existing / edited answer" : values[`status_${index}`] === "not_used" ? "Not applicable" : "Still unresolved"}</p></div><Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => onEdit(index)}><Pencil size={14}/>Edit</Button></div>
          <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{text.length > 400 ? `${text.slice(0, 400)}…` : text}</p>
          {text.length > 400 && <details className="text-xs leading-5 text-slate-600"><summary className="w-fit cursor-pointer rounded-sm hover:text-blue-800 focus-visible:outline-2 focus-visible:outline-blue-600">Read full answer</summary><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{text}</p></details>}
          {draft?.reason && values[`answer_${index}`] && <p className="break-words text-xs leading-5 text-slate-600">{draft.reason}</p>}
          {draft?.sources?.length > 0 && <details className="min-w-0 text-xs leading-5 text-slate-600"><summary className="w-fit cursor-pointer rounded-sm hover:text-blue-800 focus-visible:outline-2 focus-visible:outline-blue-600">View {draft.sources.length} supporting source{draft.sources.length === 1 ? "" : "s"}</summary><ul className="mt-2 space-y-2">{draft.sources.map((source, sourceIndex) => <li key={sourceIndex} className="break-words"><span className="font-medium text-slate-800">{sourceLabels[source.source]}:</span> {source.excerpt}</li>)}</ul></details>}
        </li>;
      })}
    </ul>
  </section>;
}
