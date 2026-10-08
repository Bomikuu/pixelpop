import { Info, Sparkles, TriangleAlert } from "lucide-react";
import { Button } from "../../personal-dashboard/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../personal-dashboard/ui/dialog";
import ApplicationBudget, { usd } from "./ApplicationBudget";
import { generationLabel, isResumeReport } from "./api";

export default function GenerationQuoteDialog({ quote, busy, onConfirm, onCancel }) {
  const estimate = quote.combined_estimate_usd;
  const experience = quote.items.some((item) => item.mode === "experience");
  const fix = quote.items.some((item) => item.mode === "fix");
  const reportOnly = quote.items.every((item) => isResumeReport(item.mode));
  const after = estimate != null && quote.usage.remaining_usd != null ? Math.max(0, Number(quote.usage.remaining_usd) - Number(estimate)) : null;
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onCancel(); }}><DialogContent className="personal-dashboard max-h-[90dvh] overflow-y-auto bg-white sm:max-w-2xl" onInteractOutside={(event) => { if (busy) event.preventDefault(); }}><DialogHeader><DialogTitle>Review AI request costs</DialogTitle><DialogDescription>No provider call has been made. {reportOnly ? "This request produces advice only and does not change your saved résumé." : "Confirm to prepare reviewable drafts using your selected API provider."}</DialogDescription></DialogHeader>
    <ApplicationBudget usage={quote.usage}/>
    {fix && <p className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm leading-6 text-blue-900"><Info size={17} className="mt-0.5 shrink-0" aria-hidden="true"/>One AI call will use your saved answers to address the latest checklist. No automatic retry or follow-up check. Unresolved and not-used responses stay flagged, and your saved résumé stays unchanged until you review and accept the proposal.</p>}
    {experience && <p className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900"><TriangleAlert size={17} className="mt-0.5 shrink-0" aria-hidden="true"/>This request proposes experience wording for missing requirements. Examples may be hypothetical; review, edit or reject them before accepting. Your saved résumé is preserved, and no verified evidence is added automatically.</p>}
    <ul className="divide-y">{quote.items.map((item) => <li key={item.kind} className="space-y-1 py-3"><div className="flex flex-wrap justify-between gap-2 text-sm"><span className="font-medium">{generationLabel(item.kind, item.mode)}</span><span className="tabular-nums">{usd(item.estimate_usd)}</span></div><p className="text-xs text-slate-600">{item.provider} / {item.model} · {item.input_estimate.toLocaleString()} estimated input tokens · up to {item.output_limit.toLocaleString()} output tokens</p><p className="text-xs text-slate-600">{item.pricing_date ? `Rates effective ${item.pricing_date}` : "Pricing unavailable"}</p></li>)}</ul>
    <p className="flex items-start gap-2 text-xs leading-5 text-slate-600"><Info size={16} className="shrink-0"/>{quote.items[0]?.assumptions} Quotes expire after 10 minutes. Failed or uncertain calls may retain a held estimate until reconciled.</p>
    <div className="flex flex-wrap justify-between gap-2 border-t pt-3 text-sm"><span>Combined estimate: {usd(estimate)}</span>{after != null && <span>Allowance after estimates: {usd(after)}</span>}</div>
    {quote.blocked_reason && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-900">{quote.blocked_reason}</p>}
    <div className="flex justify-end gap-2"><Button variant="outline" disabled={busy} onClick={onCancel}>Cancel</Button><Button disabled={busy || !!quote.blocked_reason} onClick={() => onConfirm(quote.items)}><Sparkles size={16}/>{busy ? "Requesting…" : reportOnly ? "Run report" : experience ? "Generate experience proposal" : `Generate ${quote.items.length === 1 ? "proposal" : "drafts"}`}</Button></div>
  </DialogContent></Dialog>;
}
