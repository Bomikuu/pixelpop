import { ArrowRight, CheckCircle2, ChevronRight, ClipboardCheck, FolderCheck, ShieldCheck } from "lucide-react";

export default function MobileBusinessHome({ overview, bootstrap, attention, navigate }) {
  const completed = Number(overview.completed_actions);
  const total = Number(overview.total_actions);
  const progress = total ? Math.min(100, Math.max(0, completed / total * 100)) : 0;
  const priorities = (overview.current_actions || []).filter((action) => action.status !== "completed");
  const knowledgeRisks = attention.knowledge.filter((item) => item.important && (!item.backup_owner || !item.backup_tested));
  return <div className="workspace-mobile-home">
    <section className="workspace-mobile-hero" aria-labelledby="mobile-business-plan">
      <h2 id="mobile-business-plan" className="text-lg font-semibold">{bootstrap.plan.team_name}</h2>
      <p className="workspace-summary-meta">{overview.period === "active" ? `Week ${overview.currentWeek} of 12 · ${overview.phaseName}` : overview.period === "upcoming" ? `Starts ${bootstrap.plan.start_date}` : "12-week plan finished"}</p>
      <p className="workspace-mobile-value">{completed}<span className="ml-2 text-lg font-normal">/ {total}</span></p>
      <p className="workspace-summary-meta">Plan actions completed</p>
      <div role="progressbar" aria-label="Plan actions completed" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} className="workspace-plan-progress"><div style={{ transform: `scaleX(${progress / 100})` }} /></div>
      <button type="button" className="workspace-summary-link" onClick={() => navigate("roadmap")}>View your plan<ArrowRight size={16} aria-hidden="true" /></button>
    </section>
    <section aria-labelledby="mobile-business-priorities">
      <div className="mb-3 flex items-center justify-between gap-3"><h2 id="mobile-business-priorities" className="text-base font-semibold">This week</h2><button type="button" className="min-h-11 text-sm text-[var(--site-link)]" onClick={() => navigate("week")}>View all</button></div>
      {priorities.length ? <div className="workspace-mobile-list">{priorities.slice(0, 4).map((action) => <button key={action.id} type="button" className="workspace-mobile-row" onClick={() => navigate(`roadmap?action=${action.id}`)}><ClipboardCheck size={21} className="shrink-0 text-[var(--site-link)]" aria-hidden="true" /><span className="min-w-0 flex-1"><span className="block break-words text-sm font-medium">{action.title}</span><span className="mt-1 block text-xs text-slate-500">{action.owner || "Unassigned"} · {action.status.replaceAll("_", " ")}</span></span><ChevronRight size={18} className="shrink-0" aria-hidden="true" /></button>)}</div> : <p className="flex items-center gap-2 py-4 text-sm text-slate-600"><CheckCircle2 size={19} className="shrink-0" aria-hidden="true" />No outstanding actions in this week’s saved priorities.</p>}
    </section>
    <dl className="workspace-mobile-metrics">
      <div className="workspace-mobile-metric"><dt>Processes adopted</dt><dd>{overview.adopted_processes}</dd></div>
      <div className="workspace-mobile-metric"><dt>Evidence items</dt><dd>{overview.evidence_items}</dd></div>
      <div className="workspace-mobile-metric"><dt>People with ownership</dt><dd>{overview.ownership_people}</dd></div>
      <div className="workspace-mobile-metric"><dt>Missing weekly updates</dt><dd>{overview.reporting?.missedWeeks?.length ?? "—"}</dd></div>
    </dl>
    <section aria-labelledby="mobile-business-review"><h2 id="mobile-business-review" className="mb-4 text-base font-semibold">Keep things moving</h2>
      {attention.error && <p role="alert" className="mb-3 text-sm text-red-800">{attention.error}</p>}
      <div className="workspace-mobile-list">
        <button type="button" className="workspace-mobile-row" onClick={() => navigate("documentation")}><ShieldCheck size={21} className="shrink-0" aria-hidden="true" /><span className="min-w-0 flex-1"><span className="block text-sm font-medium">Knowledge continuity</span><span className="mt-1 block text-xs text-slate-500">{attention.loading ? "Checking saved records…" : attention.error ? "Open to review saved records" : `${knowledgeRisks.length} important items without a tested backup`}</span></span><ChevronRight size={18} aria-hidden="true" /></button>
        <button type="button" className="workspace-mobile-row" onClick={() => navigate("evidence")}><FolderCheck size={21} className="shrink-0" aria-hidden="true" /><span className="min-w-0 flex-1"><span className="block text-sm font-medium">Leadership evidence</span><span className="mt-1 block text-xs text-slate-500">{overview.health_gaps?.length || 0} areas need attention</span></span><ChevronRight size={18} aria-hidden="true" /></button>
      </div>
    </section>
  </div>;
}
