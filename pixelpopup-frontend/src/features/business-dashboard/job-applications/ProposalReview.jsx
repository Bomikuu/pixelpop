import { useCallback, useEffect, useState } from "react";
import { Check, CheckCheck, FileCheck2, Info, RefreshCw, Save, Trash2, TriangleAlert } from "lucide-react";
import { Button } from "../../personal-dashboard/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../personal-dashboard/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../personal-dashboard/ui/alert-dialog";
import { EmptyState, ErrorState, Panel } from "../../personal-dashboard/components/Panel";
import ProposalSection from "./ProposalSection";
import { jobApi, labels } from "./api";

const decisions = (sections) => sections.map(({ id, decision, proposed }) => ({ id, decision, proposed }));

export default function ProposalReview({ applicationId, kind, sourceDigest, version, targetProposalId, onKindChange, onUpdated, onDirtyChange, onBusyChange, onActivity, notify, disabled, draftDirty, onOpenDrafts }) {
  const [page, setPage] = useState(1), [reload, setReload] = useState(0), [data, setData] = useState(null);
  const [proposal, setProposal] = useState(null), [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState(""), [confirm, setConfirm] = useState(null);
  const dirty = Boolean(proposal && JSON.stringify(decisions(sections)) !== JSON.stringify(decisions(proposal.sections)));
  const unresolved = sections.filter((item) => item.decision === "unreviewed").length;
  const stale = proposal?.stale || proposal?.source_digest !== sourceDigest;
  const blocked = busy || disabled;
  const editedText = sections.some((section, index) => section.proposed !== proposal?.sections[index]?.proposed);
  const selectable = sections.filter((section) => section.change !== "unchanged" || section.decision === "unreviewed");
  const removalCount = selectable.filter((section) => !section.proposed && section.original).length;
  const selectProposal = useCallback((value) => { setProposal(value); setSections(value?.sections || []); }, []);
  useEffect(() => { onDirtyChange(dirty); return () => onDirtyChange(false); }, [dirty, onDirtyChange]);
  useEffect(() => { onBusyChange(busy); return () => onBusyChange(false); }, [busy, onBusyChange]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError("");
    jobApi(`applications/${applicationId}/proposals/?kind=${kind}&page=${page}${targetProposalId ? `&focus=${targetProposalId}` : ""}`, { signal: controller.signal })
      .then((result) => { setData(result); selectProposal(result.results.find((item) => item.id === targetProposalId) || result.results[0] || null); setLoading(false); })
      .catch((issue) => { if (!controller.signal.aborted) { setError(issue.message); setLoading(false); } });
    return () => controller.abort();
  }, [applicationId, kind, page, reload, version, targetProposalId, selectProposal]);
  function change(action) { if (dirty) setConfirm(action); else performNavigation(action); }
  function performNavigation(action) {
    if (action.kind) { setPage(1); onKindChange(action.kind); }
    else if (action.proposalId) selectProposal(data.results.find((item) => String(item.id) === action.proposalId));
    else if (action.page) setPage(action.page);
    else setReload((value) => value + 1);
  }
  async function save() {
    setBusy(true); setError("");
    onActivity?.(`Saving ${labels[kind].toLowerCase()} review`, "Sending your section decisions to Django. The server checks the proposal version before saving; no AI call is made.", "waiting");
    try {
      const saved = await jobApi(`applications/${applicationId}/proposals/${proposal.id}/`, { method: "PATCH", body: { expected_version: proposal.version, sections: decisions(sections) } });
      selectProposal(saved); setData((previous) => ({ ...previous, results: previous.results.map((item) => item.id === saved.id ? saved : item) }));
      onActivity?.("Review saved", "Django returned the saved review decisions. Edited sections need a fresh decision before acceptance.", "ready");
      notify("Review saved. Edited sections need a new decision.");
    } catch (issue) { setError(issue.message); onActivity?.("Review needs checking", `Review decisions could not be confirmed: ${issue.message}`, "failed"); }
    finally { setBusy(false); }
  }
  async function finish(action) {
    setBusy(true); setError(""); setConfirm(null);
    onActivity?.(`${action === "accept" ? "Accepting" : "Discarding"} ${labels[kind].toLowerCase()} proposal`, action === "accept" ? "Django is validating the reviewed proposal before applying your accepted changes. The previous draft stays in history; no AI call is made." : "Django is closing this proposal. The saved draft is kept; no AI call is made.", "waiting");
    try {
      await jobApi(`applications/${applicationId}/proposals/${proposal.id}/${action}/`, { method: "POST", body: { expected_version: proposal.version } });
      onActivity?.("Updating proposal results", `Django confirmed the ${action === "accept" ? "acceptance" : "discard"}. Refreshing saved drafts and application status.`, "received");
      selectProposal(null); setPage(1); setReload((value) => value + 1);
      notify(action === "accept" ? "Reviewed draft accepted. Your previous saved text remains in history." : "Proposal discarded. Your saved draft was kept.");
      await onUpdated(action === "accept" ? kind : null);
      onActivity?.("Proposal action complete", action === "accept" ? "The reviewed draft was accepted and the application refreshed. Its previous text remains in history." : "The proposal was discarded and the application refreshed. The saved draft was kept.", "ready");
    } catch (issue) { setError(issue.message); onActivity?.("Proposal action needs checking", `The proposal action or result refresh could not finish: ${issue.message}`, "failed"); }
    finally { setBusy(false); }
  }
  return <Panel title="Review proposed changes" description="AI proposals never replace your saved draft until you accept the reviewed version.">
    <div className="mb-4 flex flex-wrap items-end gap-3"><div className="min-w-44 flex-1"><label htmlFor="proposal-kind" className="mb-1.5 block text-xs font-medium text-slate-600">Document</label><Select value={kind} disabled={blocked} onValueChange={(next) => change({ kind: next })}><SelectTrigger id="proposal-kind"><SelectValue/></SelectTrigger><SelectContent className="personal-dashboard">{["resume", "cover_letter", "answers", "interview_prep"].map((key) => <SelectItem key={key} value={key}>{labels[key]}</SelectItem>)}</SelectContent></Select></div>
      {data?.results?.length > 0 && <div className="min-w-48 flex-1"><label htmlFor="proposal-select" className="mb-1.5 block text-xs font-medium text-slate-600">Pending proposal</label><Select value={proposal ? String(proposal.id) : ""} disabled={blocked || loading} onValueChange={(proposalId) => change({ proposalId })}><SelectTrigger id="proposal-select"><SelectValue/></SelectTrigger><SelectContent className="personal-dashboard">{data.results.map((item) => <SelectItem key={item.id} value={String(item.id)}>{new Date(item.created_at).toLocaleString()} · #{item.id}{item.stale ? " · Sources changed" : ""}</SelectItem>)}</SelectContent></Select></div>}
      <Button size="sm" variant="outline" disabled={blocked || loading} onClick={() => change({ refresh: true })}><RefreshCw size={15}/>Refresh review</Button>
    </div>
    {error && <ErrorState message={error}/>}
    {loading ? <p role="status" className="py-10 text-center text-sm text-slate-600">Loading proposals…</p> : proposal ? <>
      <div className="mb-4 space-y-1 rounded-md border border-blue-200 bg-blue-50 p-3 text-blue-900"><h3 className="flex items-center gap-2 text-sm font-semibold"><FileCheck2 size={17} aria-hidden="true"/>New AI proposal · #{proposal.id}</h3><p className="text-xs leading-5">Generated {new Date(proposal.created_at).toLocaleString("en-PH", { timeZone: "Asia/Manila" })} (Manila) · Compared against {proposal.source_reference ? "your reviewed source résumé" : `saved revision ${proposal.base_revision}`}. The current saved document has not been replaced.</p></div>
      {stale && <p role="alert" className="mb-4 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><TriangleAlert size={17} className="mt-0.5 shrink-0"/>The saved draft or sources changed. Create a new proposal from current sources; this proposal can still be discarded.</p>}
      {proposal.source_reference && <p className="mb-4 flex items-start gap-2 text-xs leading-6 text-slate-600"><Info size={16} className="mt-1 shrink-0"/>This is your first tailored résumé: the original side is your reviewed source résumé, not a previously saved application draft. Unstructured text is compared as a whole document.</p>}
      {proposal.generation_mode === "tailor" && <p className="mb-4 flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm leading-6 text-blue-900"><FileCheck2 size={17} className="mt-0.5 shrink-0" aria-hidden="true"/>Role-tailoring proposal. Inspect each section's reason, source quotations and before/after text. Keep, edit or reject changes; after acceptance, run the final check from the saved résumé editor.</p>}
      {proposal.generation_mode === "fix" && <p className="mb-4 flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm leading-6 text-blue-900"><FileCheck2 size={17} className="mt-0.5 shrink-0" aria-hidden="true"/>One-pass checklist fix proposal. Review the changes and any unresolved evidence gaps before accepting. Acceptance does not mark findings resolved; rerun the final check yourself when ready.</p>}
      {proposal.generation_mode === "experience" && <p className="mb-4 flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm leading-6 text-blue-900"><FileCheck2 size={17} className="mt-0.5 shrink-0" aria-hidden="true"/>Experience additions only. Your existing résumé was preserved. Edit the proposed examples and replace placeholders with work you actually did, or choose Keep original to reject them. Acceptance changes this résumé, not your profile facts or evidence score.</p>}
      {!!proposal.warnings?.length && <ul className="mb-4 list-disc space-y-1 rounded-md bg-amber-50 py-3 pr-3 pl-8 text-xs leading-5 text-amber-900">{proposal.warnings.map((item, index) => <li key={index}>{item}</li>)}</ul>}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-y py-3"><p role="status" className="flex items-center gap-2 text-sm text-slate-700"><FileCheck2 size={17}/>{unresolved ? `${unresolved} section${unresolved === 1 ? "" : "s"} need a decision` : "All section decisions complete"}{dirty && " · Unsaved review"}</p><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={blocked || stale || !dirty} onClick={save}><Save size={15}/>{busy ? "Working…" : "Save review"}</Button><Button size="sm" disabled={blocked || stale || dirty || draftDirty || unresolved > 0} onClick={() => finish("accept")}><Check size={15}/>Accept reviewed draft</Button><Button size="sm" variant="ghost" disabled={blocked} onClick={() => setConfirm({ discard: true })}><Trash2 size={15}/>Discard</Button></div></div>
      {draftDirty && <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-200 bg-amber-50 p-3"><p className="flex items-start gap-2 text-xs leading-5 text-amber-900"><Info size={16} className="shrink-0"/>Save your application-package edits before accepting a proposal. Those local edits are still available.</p><Button size="sm" variant="outline" disabled={blocked} onClick={onOpenDrafts}>Open drafts</Button></div>}
      {dirty && <p className="mb-4 text-xs text-slate-600">Save your decisions before accepting. Saving edited text resets that section's decision for a fresh review.</p>}
      {selectable.length > 0 && <div className="mb-4 flex flex-wrap items-center gap-3"><Button type="button" size="sm" variant="outline" disabled={blocked || stale || editedText || selectable.every((section) => section.decision === "proposed")} onClick={() => setSections((previous) => previous.map((section) => section.change !== "unchanged" || section.decision === "unreviewed" ? { ...section, decision: "proposed" } : section))}><CheckCheck size={15}/>Select all proposed</Button><p className="text-xs text-slate-600">{editedText ? "Save edited text before selecting all." : `Selects changes locally; save your review before accepting.${removalCount ? ` Includes ${removalCount} section removal${removalCount === 1 ? "" : "s"}.` : ""}`}</p></div>}
      {sections.map((section, index) => <ProposalSection key={`${proposal.id}-${section.id}`} section={section} savedSection={proposal.sections[index]} proposalId={proposal.id} disabled={blocked || stale} onChange={(patch) => setSections((previous) => previous.map((item) => item.id === section.id ? { ...item, ...patch } : item))}/>)}
    </> : !error && <EmptyState icon={FileCheck2} title="No pending proposals for this document" message="Generate a proposal from the Application package, or write a draft manually and mark it reviewed."/>}
    {data && (data.next || data.previous) && <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-3"><p className="text-xs text-slate-600">Page {page} · {data.count} pending proposals</p><div className="flex gap-2"><Button size="sm" variant="outline" disabled={blocked || loading || !data.previous} onClick={() => change({ page: page - 1 })}>Previous</Button><Button size="sm" variant="outline" disabled={blocked || loading || !data.next} onClick={() => change({ page: page + 1 })}>Next</Button></div></div>}
    <AlertDialog open={!!confirm} onOpenChange={(open) => { if (!open) setConfirm(null); }}><AlertDialogContent className="personal-dashboard"><AlertDialogHeader><AlertDialogTitle>{confirm?.discard ? "Discard this proposal?" : "Leave unsaved review decisions?"}</AlertDialogTitle><AlertDialogDescription>{confirm?.discard ? "The proposal and its review will be closed. Your accepted draft and earlier revisions are unchanged." : "Save the review first to keep your local text and decisions."}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { const action = confirm; setConfirm(null); if (action.discard) finish("discard"); else performNavigation(action); }}>{confirm?.discard ? "Discard proposal" : "Leave review"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </Panel>;
}
