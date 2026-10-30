import { Button } from "../../personal-dashboard/ui/button";
import { resumePriorities } from "./resumePriorities";

export default function ResumePriorityGaps({ record, assessmentDirty, busy, comparisonBlockedReason, onCompare, onResolve }) {
  const { priorities, count, stale, hasComparison } = resumePriorities(record, assessmentDirty);
  return <section aria-labelledby="resume-priority-gaps" className="mb-5 border-b pb-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 id="resume-priority-gaps" className="text-sm font-semibold">Priority gaps</h2>
      <Button type="button" variant="outline" size="sm" disabled={busy || !!comparisonBlockedReason} aria-describedby={comparisonBlockedReason ? "resume-comparison-help" : undefined} onClick={onCompare}>{hasComparison ? "Reassess requirements" : "Compare requirements"}</Button>
    </div>
    {comparisonBlockedReason && <p id="resume-comparison-help" className="mt-2 text-xs leading-5 text-slate-600">{comparisonBlockedReason}</p>}
    {stale ? <p role="status" className="mt-3 text-sm leading-6 text-amber-900">{assessmentDirty ? "Save your assessment edits, then reassess to refresh these priorities." : "Your posting or sources changed. Reassess to refresh these priorities."}</p>
      : !hasComparison ? <p className="mt-3 text-sm leading-6 text-slate-600">Compare the posting with your confirmed sources to find the three gaps to address first. Review the cost estimate before generation.</p>
      : !priorities.length ? <p className="mt-3 text-sm leading-6 text-slate-600">No requirement gaps or evidence flags in this comparison. Tailor the wording, then run a final check on your saved résumé.</p>
      : <>
        <p className="mt-2 text-xs leading-5 text-slate-600">{count > 3 ? `Showing 3 of ${count} gaps. ` : ""}Required criteria come first. Add a real example or record a limitation before tailoring.</p>
        <ul className="mt-2 divide-y">{priorities.map((row) => <li key={row.index} className="space-y-2 py-3">
          <h3 className="break-words text-sm font-medium">{row.text}</h3>
          <p className="text-xs leading-5 text-slate-600">{row.importance === "required" ? "Required" : row.importance === "preferred" ? "Preferred" : "Importance unspecified"} · {row.notMet ? "You recorded Not met" : row.applicant_decision?.stale ? "Reconfirm your earlier answer" : row.evidence_warning ? "Evidence needs review" : row.status === "partial" ? "Partially supported" : "Not evidenced"}</p>
          <p className="text-xs leading-5 text-slate-700">{row.notMet ? "Keep this limitation explicit; wording changes cannot resolve it." : row.applicant_decision?.decision === "evidence_added" && !row.applicant_decision.stale ? "Your confirmed answer is available for tailoring. Reassess to update evidence coverage." : row.evidence_warning ? "Review the quoted source and clarify any mismatch before relying on it." : row.status === "partial" ? "Clarify your personal contribution, tools used and a recorded outcome for the missing detail." : "Add a specific project or task that demonstrates this requirement, if you have one."}</p>
          <details className="text-xs leading-5 text-slate-600"><summary className="cursor-pointer rounded-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">Posting & available evidence</summary><div className="mt-2 space-y-2">
            {row.posting_excerpt && <p className="whitespace-pre-wrap break-words"><span className="font-medium">Posting: </span>{row.posting_excerpt}</p>}
            {row.explanation && <p className="break-words">{row.explanation}</p>}
            {row.sources?.length ? row.sources.map((source, index) => <div key={index}><p className="mb-1 font-medium">{{ facts: "Profile facts", resume_text: "Reviewed résumé", project_experience: "Confirmed project", clarifications: "Application answer" }[source.source] || source.source}</p><blockquote className="whitespace-pre-wrap break-words border-l border-slate-300 pl-3">{source.excerpt}</blockquote></div>) : <p>No supporting excerpt in this comparison.</p>}
            {row.evidence_warning && <p className="text-amber-900">{row.evidence_warning}</p>}
            {row.applicant_decision?.note && <p className="whitespace-pre-wrap break-words"><span className="font-medium">Your answer{row.applicant_decision.stale ? " (needs reconfirmation)" : ""}: </span>{row.applicant_decision.note}</p>}
          </div></details>
          {row.requirement_key && <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => onResolve(row)}>{row.applicant_decision ? "Review answer" : "Add evidence / limitation"}</Button>}
        </li>)}</ul>
      </>}
  </section>;
}
