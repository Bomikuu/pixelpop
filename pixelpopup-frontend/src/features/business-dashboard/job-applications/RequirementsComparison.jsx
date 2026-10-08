import { useEffect, useState } from "react";
import { CheckCircle2, ChevronDown, CircleHelp, FileSearch, Info, Pencil, RefreshCw, ShieldQuestion, Sparkles, TriangleAlert } from "lucide-react";
import { Button } from "../../personal-dashboard/ui/button";
import { Tabs, TabsList, TabsTrigger } from "../../personal-dashboard/ui/tabs";
import { EmptyState, Panel } from "../../personal-dashboard/components/Panel";

const statuses = {
  supported: { label: "Supported", icon: CheckCircle2, tone: "text-emerald-800 bg-emerald-50" },
  partial: { label: "Partial", icon: CircleHelp, tone: "text-amber-800 bg-amber-50" },
  not_evidenced: { label: "Not evidenced", icon: ShieldQuestion, tone: "text-slate-700 bg-slate-100" },
};

export default function RequirementsComparison({ artifact, decisions, historical = [], onResolve, onGenerate, onProposeExperience, experienceBlockedReason, onOpenAssessment, canGenerate, busy, focusRequest, onFocusHandled }) {
  const [filter, setFilter] = useState("all");
  const requirements = decisions || artifact?.requirements || [];
  const visible = requirements.filter((item) => filter === "all" || item.status === filter);
  const missingCount = requirements.filter((item) => ["partial", "not_evidenced"].includes(item.status)).length;
  useEffect(() => {
    if (!focusRequest) return;
    setFilter("all");
    const frame = requestAnimationFrame(() => {
      const row = document.getElementById(`job-requirement-${focusRequest.index}`);
      const group = row?.closest("details[data-requirement-group]");
      if (group) group.open = true;
      if (row) row.open = true;
      row?.scrollIntoView({ block: "center", behavior: "instant" });
      row?.querySelector("summary")?.focus({ preventScroll: true });
      onFocusHandled?.(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [focusRequest, onFocusHandled]);
  return <Panel title="Job requirements & your evidence" description="AI-assisted suggestions, traced to the posting and your reviewed sources—not independently verified qualifications." action={<Button size="sm" variant="outline" disabled={busy || !canGenerate} onClick={onGenerate}>{artifact?.body ? <RefreshCw size={15}/> : <Sparkles size={15}/>} {artifact?.body ? "Reassess requirements" : "Compare requirements"}</Button>}>
    <p className="mb-4 flex items-start gap-2 text-xs leading-5 text-slate-600"><Info size={16} className="mt-0.5 shrink-0"/>Not evidenced means your supplied records do not show the requirement. It does not mean you lack the skill.</p>
    {artifact?.requirements_stale && <p role="status" className="mb-4 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><TriangleAlert size={17} className="mt-0.5 shrink-0"/>These requirements need reassessment against your current sources. No AI call is made until you choose Reassess.</p>}
    {requirements.length ? <>
      {!!missingCount && onProposeExperience && <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-y py-3"><div className="min-w-0 flex-1"><p className="text-sm font-medium">Experience suggestions for {missingCount} requirement{missingCount === 1 ? "" : "s"}</p><p id="experience-proposal-help" className="mt-1 text-xs leading-5 text-slate-600">{experienceBlockedReason || "Review the cost first, then edit or reject each proposed addition. Your saved résumé and evidence status stay unchanged until you accept the résumé changes; suggestions are not verified history."}</p></div><Button size="sm" variant="outline" disabled={busy || !!experienceBlockedReason || artifact?.requirements_stale || !canGenerate} aria-describedby="experience-proposal-help" onClick={onProposeExperience}><Sparkles size={15}/>Propose résumé experience</Button></div>}
      <Tabs value={filter} onValueChange={setFilter}><TabsList variant="line" className="mb-4 max-w-full overflow-x-auto"><TabsTrigger value="all">All ({requirements.length})</TabsTrigger>{Object.entries(statuses).map(([key, value]) => <TabsTrigger key={key} value={key}>{value.label} ({requirements.filter((item) => item.status === key).length})</TabsTrigger>)}</TabsList></Tabs>
      {visible.length ? <div className="space-y-3">{["required", "preferred", "unspecified"].map((importance) => {
        const rows = visible.filter((item) => importance === "unspecified" ? !["required", "preferred"].includes(item.importance) : item.importance === importance);
        if (!rows.length) return null;
        return <details key={importance} data-requirement-group open={importance === "required"} className="group/requirements rounded-md border bg-white">
          <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 rounded-md px-3 py-3 text-sm hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-600 [&::-webkit-details-marker]:hidden"><span className="font-medium">{importance === "required" ? "Required" : importance === "preferred" ? "Preferred" : "Other requirements"}</span><span className="text-xs text-slate-600">{rows.length} items · {rows.filter((item) => item.status === "supported").length} supported</span><ChevronDown size={16} className="ml-auto shrink-0 transition-transform motion-reduce:transition-none group-open/requirements:rotate-180"/></summary>
          <ul className="divide-y border-t">{rows.map((item) => {
        const state = statuses[item.status] || statuses.not_evidenced;
        const Icon = state.icon;
        return <li key={requirements.indexOf(item)}><details id={`job-requirement-${requirements.indexOf(item)}`} className="group/evidence">
          <summary className="flex cursor-pointer list-none items-start gap-3 px-3 py-3 text-sm hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-600 [&::-webkit-details-marker]:hidden"><span className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full ${state.tone}`}><Icon size={15}/></span><span className="min-w-0 flex-1"><span className="block break-words font-medium leading-5">{item.text}</span><span className="mt-1 block text-xs text-slate-600">{state.label}{item.applicant_decision && " · Your decision recorded"}{item.evidence_warning && " · Quotation needs review"}</span></span><ChevronDown size={16} className="mt-1 shrink-0 text-slate-500 transition-transform motion-reduce:transition-none group-open/evidence:rotate-180"/></summary>
          <div className="grid gap-4 border-t bg-slate-50/40 p-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="min-w-0"><div className="mb-2 flex flex-wrap items-center gap-2"><span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${state.tone}`}><Icon size={14}/>{state.label}</span><span className="text-xs capitalize text-slate-500">{item.importance === "unspecified" ? "Importance unspecified" : item.importance}</span></div><h3 className="break-words text-sm font-medium">{item.text}</h3><p className="mt-2 break-words text-xs leading-6 text-slate-600">{item.explanation}</p><details className="mt-2 text-xs text-slate-600"><summary className="cursor-pointer hover:text-blue-700">Posting excerpt</summary><blockquote className="mt-2 whitespace-pre-wrap break-words border-l border-slate-300 pl-3 leading-6">{item.posting_excerpt}</blockquote></details></div>
          <div className="min-w-0 space-y-3">{item.sources?.length ? item.sources.map((source, sourceIndex) => <div key={sourceIndex}><p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-600"><FileSearch size={14}/>{source.source === "facts" ? "Reviewed experience & portfolio" : "Reviewed résumé"}</p><blockquote className="whitespace-pre-wrap break-words rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-700">{source.excerpt}</blockquote></div>) : <p className="flex items-start gap-2 rounded-md bg-slate-50 p-3 text-xs leading-5 text-slate-600"><ShieldQuestion size={16} className="shrink-0"/>No traceable supporting excerpt was supplied.</p>}{item.evidence_warning && <p className="flex items-start gap-1.5 text-xs leading-5 text-amber-800"><TriangleAlert size={15} className="shrink-0"/>{item.evidence_warning}</p>}
            {item.applicant_decision && <div className="border-t pt-3 text-xs leading-5 text-slate-600"><p className="font-medium">Your decision: {item.applicant_decision.decision.replaceAll("_", " ")}{item.applicant_decision.stale && " · Reconfirmation needed"}</p><p className="mt-1 whitespace-pre-wrap break-words">{item.applicant_decision.note}</p><p className="mt-1">Your decision is separate from AI evidence status.</p></div>}
            {onResolve && (item.status !== "supported" || item.applicant_decision) && <Button size="sm" variant="outline" disabled={busy || artifact?.requirements_stale} onClick={() => onResolve(item)}><Pencil size={15}/>{item.applicant_decision ? "Review gap decision" : "Resolve gap"}</Button>}
          </div>
          </div>
        </details></li>;
      })}</ul></details>;
      })}</div> : <EmptyState icon={FileSearch} title="No requirements in this group" message="Choose another evidence status to see the remaining requirements."/>}
    </> : <EmptyState icon={FileSearch} title={artifact?.body ? "Your assessment is still available" : "Compare the posting with your experience"} message={artifact?.body ? "This saved assessment predates structured comparisons, or returned no requirement rows. Reassess to request source-backed rows." : "Confirm your sources and configure an AI provider to identify supported requirements and gaps."} action={artifact?.body && <Button size="sm" variant="outline" onClick={onOpenAssessment}>Read saved assessment</Button>}/>}
    {!!historical.length && <details className="mt-4 border-t pt-3"><summary className="cursor-pointer text-sm hover:text-blue-700">Earlier decisions not in this assessment ({historical.length})</summary><ul className="mt-3 divide-y">{historical.map((item) => <li key={item.requirement_key} className="py-3 text-xs leading-6 text-slate-600"><p className="font-medium">{item.requirement} · {item.decision.replaceAll("_", " ")}</p><p className="whitespace-pre-wrap break-words">{item.note}</p><p>Historical note only; not carried into the current requirement set.</p></li>)}</ul></details>}
  </Panel>;
}
