import { useEffect, useState } from "react";
import { FileText, Receipt, Sparkles } from "lucide-react";
import { Panel, EmptyState, ErrorState } from "../../personal-dashboard/components/Panel";
import { Button } from "../../personal-dashboard/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../personal-dashboard/ui/select";
import ApplicationBudget, { usd } from "./ApplicationBudget";
import CostReconciliationForm from "./CostReconciliationForm";
import WorkflowPages from "./WorkflowPages";
import { jobApi, generationLabel, isResumeReport } from "./api";

export default function ApplicationUsage({ applicationId, refreshKey, onUseAlternative, notify }) {
  const [data, setData] = useState(null), [page, setPage] = useState(1), [version, setVersion] = useState(0), [busy, setBusy] = useState(true), [error, setError] = useState(""), [dialog, setDialog] = useState(null);
  const [scope, setScope] = useState(applicationId ? "all" : "current");
  useEffect(() => {
    const controller = new AbortController(); setBusy(true); setError("");
    jobApi(`${applicationId ? `applications/${applicationId}/` : ""}usage/?page=${page}&scope=${scope}`, { signal: controller.signal }).then((result) => { if (!controller.signal.aborted) { setData(result); setBusy(false); } }).catch((issue) => { if (!controller.signal.aborted) { setError(issue.message); setBusy(false); } });
    return () => controller.abort();
  }, [applicationId, page, scope, version, refreshKey]);
  return <div className="space-y-4"><ApplicationBudget usage={data?.usage}/><Panel title={applicationId ? "AI usage for this application" : "AI requests across applications"} description="Provider token estimates and explicitly reconciled charges stay separate. Monthly allowance includes all your applications.">
    <div className="mb-4"><Select value={scope} onValueChange={(value) => { setScope(value); setPage(1); }}><SelectTrigger aria-label="AI usage scope"><SelectValue/></SelectTrigger><SelectContent className="personal-dashboard"><SelectItem value="all">All requests</SelectItem><SelectItem value="current">This month</SelectItem><SelectItem value="unresolved">Unresolved this month</SelectItem></SelectContent></Select></div>
    {error && <ErrorState message={error} retry={() => setVersion(version + 1)}/>}
    {busy ? <p role="status" className="py-8 text-sm text-slate-600">Loading AI usage…</p> : !error && <>
      {data?.results?.length ? <ul className="divide-y">{data.results.map((run) => <li key={run.id} className="space-y-2 py-4 first:pt-0">
        <div className="flex flex-wrap justify-between gap-2"><h3 className="flex items-center gap-2 text-sm font-medium"><Sparkles size={16} className="text-blue-700"/>{generationLabel(run.kind, run.mode)}</h3><span className="text-xs capitalize text-slate-600">{run.proposal_status ? { pending: "Proposal ready", accepted: "Accepted", discarded: "Discarded" }[run.proposal_status] : run.status}</span></div>
        {!applicationId && <p className="text-xs text-slate-600"><a className="text-blue-700 underline underline-offset-4" href={`/business/applications/${run.application_id}`}>{run.application_role}</a></p>}
        <p className="text-xs text-slate-600">{run.provider} / {run.model} · {new Date(run.created_at).toLocaleString("en-PH", { timeZone: "Asia/Manila" })} (Manila)</p>
        <p className="text-xs text-slate-600">Input: {run.input_tokens ?? "unavailable"} · Output: {run.output_tokens ?? "unavailable"} tokens</p>
        <p className="text-xs text-slate-600">Token-cost estimate: {usd(run.estimated_cost_usd)}{run.pricing_date && ` · rates ${run.pricing_date}`}</p>
        {run.reconciled_cost_usd != null ? <p className="text-xs text-emerald-800">Reconciled charge: {usd(run.reconciled_cost_usd)} · {run.reconciliation_note}</p> : run.estimated_cost_usd == null && <p className="text-xs text-amber-900">Unresolved charge · {run.quoted_cost_usd == null ? "No known reserved amount" : `Held ${usd(run.quoted_cost_usd)}`}</p>}
        {isResumeReport(run.mode) && run.result?.body && <details className="text-xs leading-6 text-slate-600"><summary className="cursor-pointer font-medium">Saved report text · Read-only</summary><p className="mt-2 whitespace-pre-wrap break-words">{run.result.body}</p><p>Based on résumé revision {run.quote_snapshot?.expected_revision ?? "unknown"}. Check the résumé editor for current/stale status. Report text cannot be inserted as résumé content.</p></details>}
        <div className="flex flex-wrap gap-2">{onUseAlternative && !isResumeReport(run.mode) && run.status === "conflict" && run.result?.body && <Button size="sm" variant="outline" onClick={() => onUseAlternative(run.kind, run.result.body)}><FileText size={15}/>Open saved alternative</Button>}<Button size="sm" variant="outline" disabled={run.status === "running" && Date.now() - new Date(run.created_at).getTime() < 300000} onClick={() => setDialog(run)}><Receipt size={15}/>{run.reconciled_cost_usd == null ? "Reconcile charge" : "Update reconciliation"}</Button></div>
      </li>)}</ul> : <EmptyState icon={Sparkles} title={scope === "all" ? "No AI requests yet" : "No requests in this view"} message={scope === "all" ? "Generate only when you need help; manual drafting is always available." : "There are no requests matching this filter. Choose All requests to see earlier activity."}/>}
      <WorkflowPages data={data} page={page} onPage={setPage} busy={busy}/>
    </>}
  </Panel>{dialog && <CostReconciliationForm applicationId={applicationId || dialog.application_id} run={dialog} onCancel={() => { setDialog(null); setVersion(version + 1); }} onSaved={() => { setDialog(null); setPage(1); setVersion(version + 1); notify("Provider charge reconciled."); }}/>}</div>;
}
