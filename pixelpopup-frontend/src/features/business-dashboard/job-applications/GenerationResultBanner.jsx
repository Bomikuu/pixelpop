import { CheckCircle2, Clock3, FileSearch, Info } from "lucide-react";
import { Button } from "../../personal-dashboard/ui/button";
import { generationLabel, isResumeReport } from "./api";

export default function GenerationResultBanner({ generations, busy, onOpen, bannerRef }) {
  const result = generations?.find((item) => item.status === "completed");
  if (!result || ["accepted", "discarded"].includes(result.proposal_status)) return null;
  const report = isResumeReport(result.mode), proposal = result.proposal_id;
  const pending = proposal && result.proposal_status === "pending";
  const title = pending ? "AI proposal ready for review" : report ? "AI report ready" : proposal ? `AI proposal ${result.proposal_status}` : "AI assessment saved";
  return <section ref={bannerRef} className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3" aria-label="Latest completed AI result">
    <div className="min-w-0 flex-1"><h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-950"><CheckCircle2 size={16} aria-hidden="true"/>{busy ? `Previous completed result · ${title}` : title}</h3>
      <details className="mt-1 text-xs text-emerald-900"><summary className="w-fit cursor-pointer rounded-sm hover:text-emerald-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">{generationLabel(result.kind, result.mode)} · See more</summary><div className="mt-2 space-y-2">
      <p className="flex flex-wrap items-center gap-1.5 text-xs text-emerald-900"><Clock3 size={14} aria-hidden="true"/>Latest successful request · {result.result?.completed_at ? "Completed" : "Started"} {new Date(result.result?.completed_at || result.created_at).toLocaleString("en-PH", { timeZone: "Asia/Manila" })} (Manila) · Result #{String(result.id).slice(0, 8)}</p>
      <p className="flex items-start gap-2 text-xs leading-5 text-emerald-900"><Info size={14} className="mt-0.5 shrink-0" aria-hidden="true"/>{pending ? `This is a separate proposal based on saved revision ${result.quote_snapshot?.expected_revision || 0}. Your saved document is unchanged until you accept reviewed changes.` : report ? `This report reviews revision ${result.quote_snapshot?.expected_revision || 0}; it does not replace your résumé or complete the checklist.` : "This assessment was saved. Check its generation time and current source status before relying on it."}</p>
      </div></details>
    </div>
    {(pending || !proposal) && <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => onOpen(result.kind, result.mode, result.proposal_id)}><FileSearch size={15}/>{pending ? "Review this proposal" : report ? "Open this report" : "Open assessment"}</Button>}
  </section>;
}
