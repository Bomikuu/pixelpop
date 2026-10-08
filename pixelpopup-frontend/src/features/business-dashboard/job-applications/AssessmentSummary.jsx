import { useState } from "react";
import { CheckCircle2, ChevronDown, FileSearch, TriangleAlert, X } from "lucide-react";
import { Button } from "../../personal-dashboard/ui/button";

export function assessmentState(artifact, dirty, decisions = []) {
  const requirements = artifact?.requirements || [];
  const warnings = artifact?.warnings || [];
  const warningCount = artifact?.warning_count ?? warnings.length;
  const stale = artifact?.requirements_stale || dirty;
  const supported = requirements.filter((item) => item.status === "supported").length;
  const partial = requirements.filter((item) => item.status === "partial").length;
  const gaps = requirements.map((item, index) => ({ ...item, index, notMet: item.importance === "required" && decisions[index]?.applicant_decision?.decision === "not_met" && !decisions[index]?.applicant_decision?.stale })).filter((item) => item.status !== "supported" || item.notMet)
    .sort((a, b) => Number(b.importance === "required") - Number(a.importance === "required"));
  const requiredGaps = gaps.filter((item) => item.importance === "required").length;
  const evidenceFlags = requirements.filter((item) => item.evidence_warning).length;
  const coverage = requirements.length ? Math.round(supported / requirements.length * 100) : null;
  const strong = coverage >= 80 && !requiredGaps && !warningCount && !evidenceFlags;
  const label = stale ? "Reassessment needed" : coverage === null ? "No structured comparison yet" :
    requiredGaps ? "Required evidence needs attention" : warningCount || evidenceFlags ? "Review flags need attention" : strong ? "Strong alignment" : coverage >= 50 ? "Partial alignment" : "More evidence needed";
  const positive = !stale && strong;
  return { requirements, warnings, warningCount, stale, supported, partial, gaps, requiredGaps, evidenceFlags, coverage, label, positive };
}

export function AssessmentCoverage({ artifact, dirty = false, decisions = [], compact = false }) {
  const { requirements, stale, supported, partial, coverage, label, positive, requiredGaps, warningCount, evidenceFlags } = assessmentState(artifact, dirty, decisions);
  const hasCoverage = !stale && coverage !== null;
  const attention = stale || requiredGaps || warningCount || evidenceFlags;
  const Icon = positive ? CheckCircle2 : attention ? TriangleAlert : FileSearch;
  return <section aria-label="Assessment coverage" className="flex min-w-0 items-start gap-3">
    <div role={hasCoverage ? "progressbar" : undefined} aria-label={hasCoverage ? "Fully supported job requirements" : "Evidence coverage unavailable"} aria-valuenow={hasCoverage ? coverage : undefined} aria-valuemin={hasCoverage ? 0 : undefined} aria-valuemax={hasCoverage ? 100 : undefined} aria-valuetext={hasCoverage ? `${supported} of ${requirements.length} requirements fully supported (${coverage} percent)` : undefined} className={`relative grid ${compact ? "size-16" : "size-20"} shrink-0 place-items-center ${positive ? "text-emerald-600" : attention ? "text-amber-600" : "text-blue-600"}`}>
      <svg viewBox="0 0 80 80" className="absolute inset-0 size-full -rotate-90" aria-hidden="true"><circle cx="40" cy="40" r="33" fill="none" stroke="currentColor" strokeWidth="5" className="text-slate-100"/>{hasCoverage && coverage > 0 && <circle cx="40" cy="40" r="33" fill="none" stroke="currentColor" strokeWidth="5" pathLength="100" strokeDasharray={`${coverage} 100`} strokeLinecap="round"/>}</svg>
      <span aria-hidden="true" className="text-lg font-semibold tabular-nums text-slate-950">{hasCoverage ? `${coverage}%` : "—"}</span>
    </div>
    <div className="min-w-0 pt-1"><p className={`flex items-start gap-1.5 text-sm font-semibold ${positive ? "text-emerald-800" : attention ? "text-amber-900" : "text-slate-950"}`}><Icon size={16} className="mt-0.5 shrink-0" aria-hidden="true"/>{label}</p>
      <p className="mt-1 text-xs leading-5 text-slate-600">{hasCoverage ? `${supported}/${requirements.length} supported · ${partial} partial · ${requirements.length - supported - partial} not evidenced` : dirty ? "Unsaved assessment edits; save and reassess." : stale ? "Sources changed; reassess to refresh coverage." : "Compare requirements to see evidence coverage."}</p>
      {compact ? <p className="mt-1 text-xs text-slate-500">Evidence coverage—not a hiring prediction.</p> : <details className="mt-2 text-xs leading-5 text-slate-600"><summary className="cursor-pointer rounded-sm hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">About evidence coverage</summary><p className="mt-2">Fully supported rows ÷ all assessed rows. Partial rows do not count as fully supported. Strong alignment means at least 80% coverage with no required gaps or review flags. Otherwise, 50% or more is partial alignment; less needs more evidence. Required gaps and review flags take priority. This is not an ATS score or hiring prediction.</p></details>}
    </div>
  </section>;
}

export default function AssessmentSummary({ artifact, dirty = false, onInspect, busy = false, decisions = [] }) {
  const [dismissed, setDismissed] = useState(null);
  const { warnings, stale, gaps, evidenceFlags } = assessmentState(artifact, dirty, decisions);
  const attentionKey = JSON.stringify({ artifact, dirty, decisions });

  function gapRow(item) {
    const text = <><span className="font-medium">{item.text}</span><span className="mt-1 block text-xs">{item.importance === "required" ? "Required · " : item.importance === "preferred" ? "Preferred · " : ""}{item.notMet ? "You recorded Not met. This limitation remains flagged even if AI evidence differs." : item.status === "partial" ? "Partially supported—clarify the remaining evidence." : "Not evidenced in your supplied records."}</span></>;
    return <li key={item.index}>{onInspect ? <button type="button" disabled={busy} onClick={() => onInspect(item.index)} className="w-full cursor-pointer rounded-md p-2 text-left text-sm leading-5 transition-colors hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent">{text}</button> : <p className="p-2 text-sm leading-5">{text}</p>}</li>;
  }

  if (!(stale || gaps.length || warnings.length || evidenceFlags)) return null;
  const flaggedOnly = (artifact?.requirements || []).filter((item, index) => item.evidence_warning && !gaps.some((gap) => gap.index === index)).length;
  const count = gaps.length + flaggedOnly + warnings.length + Number(!!stale);
  if (dismissed === attentionKey) return <div><Button type="button" size="sm" variant="ghost" onClick={() => setDismissed(null)}><TriangleAlert size={15}/>Show attention ({count || evidenceFlags})</Button></div>;
  return <div className="flex items-start gap-1 rounded-md border border-amber-200 bg-amber-50 p-2 text-amber-950"><details aria-label="Assessment needs attention" className="group min-w-0 flex-1 p-1">
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 rounded-sm text-sm font-semibold hover:text-amber-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 [&::-webkit-details-marker]:hidden"><TriangleAlert size={17} aria-hidden="true"/>Needs attention<span className="rounded-md border border-amber-200 px-1.5 py-0.5 text-xs font-normal">{count || evidenceFlags} review item{(count || evidenceFlags) === 1 ? "" : "s"}</span>{stale && <span className="hidden text-xs font-normal sm:inline">Reassessment needed</span>}<ChevronDown size={17} aria-hidden="true" className="ml-auto shrink-0 transition-transform motion-reduce:transition-none group-open:rotate-180"/></summary>
      <div className="mt-3 border-t border-amber-200/60 pt-3">
      {stale && <p className="mb-2 text-sm leading-6">{dirty ? "Save your assessment edits and reassess. These are the earlier evidence gaps." : "The posting or profile sources changed. Reassess before relying on these earlier evidence gaps."}</p>}
      {!!gaps.length && <><ul className="divide-y divide-amber-200/60">{gaps.slice(0, 3).map(gapRow)}</ul>{gaps.length > 3 && <details className="mt-2"><summary className="cursor-pointer rounded-sm text-sm hover:text-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">See more · {gaps.length - 3} evidence gaps</summary><ul className="mt-2 divide-y divide-amber-200/60">{gaps.slice(3).map(gapRow)}</ul></details>}</>}
      {!!warnings.length && <><ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">{warnings.slice(0, 2).map((warning, index) => <li key={index}>{warning}</li>)}</ul>{warnings.length > 2 && <details className="mt-2"><summary className="cursor-pointer rounded-sm text-sm hover:text-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">See more · {warnings.length - 2} review flags</summary><ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">{warnings.slice(2).map((warning, index) => <li key={index}>{warning}</li>)}</ul></details>}</>}
      {!!evidenceFlags && <p className="mt-2 text-sm leading-6">{evidenceFlags} requirement{evidenceFlags === 1 ? " has" : "s have"} quotations needing review. Inspect their source excerpts below.</p>}
      <p className="mt-2 text-xs leading-5">Not evidenced means your records do not show it—not that you lack the skill.</p>
      </div>
  </details><Button type="button" size="icon-sm" variant="ghost" aria-label="Dismiss attention notice for this assessment" title="Dismiss notice—not resolve issues" onClick={() => setDismissed(attentionKey)}><X size={16}/></Button></div>;
}
