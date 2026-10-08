import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { CheckCircle2, ChevronDown, FileCheck2, FileSearch, Info, Pencil, Sparkles, TriangleAlert } from "lucide-react";
import { Button } from "../../personal-dashboard/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../personal-dashboard/ui/tabs";
import { EmptyState } from "../../personal-dashboard/components/Panel";

const tones = {
  covered: { label: "Already covered", icon: CheckCircle2, className: "bg-emerald-50 text-emerald-800" },
  under_emphasized: { label: "Under-emphasized", icon: FileSearch, className: "bg-blue-50 text-blue-800" },
  missing_evidence: { label: "Missing evidence", icon: TriangleAlert, className: "bg-amber-50 text-amber-900" },
};

function ReportHeader({ report, stale, compact = false }) {
  const [expanded, setExpanded] = useState(false);
  useEffect(() => setExpanded(false), [report.id]);
  return <div className="space-y-2 text-xs leading-5 text-slate-600">
    <p>Based on {report.revision ? `saved revision ${report.revision}` : "your reviewed source résumé"} · {new Date(report.created_at).toLocaleString("en-PH", { timeZone: "Asia/Manila" })} (Manila)</p>
    {stale && <p role="status" className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-900"><TriangleAlert size={16} className="shrink-0" aria-hidden="true"/>The résumé or sources changed. Save your edits and rerun this report before relying on it.</p>}
    <div id={`resume-report-${report.id}`} className={`max-w-prose space-y-2 text-sm text-slate-700 ${compact && !expanded ? "line-clamp-3" : ""}`}><ReactMarkdown components={{ img: () => null, h1: ({ children }) => <p className="font-medium">{children}</p>, h2: ({ children }) => <p className="font-medium">{children}</p>, h3: ({ children }) => <p className="font-medium">{children}</p>, ul: ({ children }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>, ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5">{children}</ol> }}>{report.body}</ReactMarkdown></div>
    {compact && <Button type="button" size="sm" variant="ghost" aria-expanded={expanded} aria-controls={`resume-report-${report.id}`} onClick={() => setExpanded(!expanded)}><ChevronDown size={14} className={expanded ? "rotate-180" : ""}/>{expanded ? "Show less summary" : "Show full summary"}</Button>}
    {!!report.warnings?.length && <details><summary className="cursor-pointer font-medium text-amber-900">Review cautions ({report.warnings.length})</summary><ul className="mt-2 list-disc space-y-1 pl-5">{report.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul></details>}
  </div>;
}

export default function ResumeOptimization({ opportunities, check, dirty, blockedReason, busy, saved, pendingCount, onGenerate, onReview, onEditSection }) {
  const [tab, setTab] = useState("discover");
  const [filter, setFilter] = useState("all");
  const [expandedOpportunities, setExpandedOpportunities] = useState(false);
  useEffect(() => setExpandedOpportunities(false), [filter, opportunities?.id]);
  // Open the report that just arrived, without collapsing other application tabs.
  useEffect(() => {
    if (check?.id || opportunities?.id) {
      setTab(check?.id && (!opportunities?.id || new Date(check.created_at) > new Date(opportunities.created_at)) ? "check" : "discover");
    }
  }, [check?.id, check?.created_at, opportunities?.id, opportunities?.created_at]);
  const opportunityStale = Boolean(dirty || opportunities?.stale);
  const checkStale = Boolean(dirty || check?.stale);
  const rows = (opportunities?.opportunities || []).filter((row) => filter === "all" || row.state === filter);
  const visibleRows = expandedOpportunities ? rows : rows.slice(0, 3);
  return <section className="space-y-3 border-y py-4" aria-label="Résumé optimization workflow">
    <div><h3 className="text-sm font-semibold">Optimize for this role</h3><p className="mt-1 text-xs leading-5 text-slate-600">Find source-backed opportunities, review a tailored proposal, then check the saved résumé. Every AI step requires its own cost approval.</p></div>
    {blockedReason && <p id="resume-optimization-help" role="status" className="flex items-start gap-2 text-xs leading-5 text-amber-900"><Info size={16} className="shrink-0" aria-hidden="true"/>{blockedReason}</p>}
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList variant="line" className="max-w-full overflow-x-auto"><TabsTrigger value="discover"><FileSearch size={15}/>Find opportunities</TabsTrigger><TabsTrigger value="tailor"><Sparkles size={15}/>Tailor résumé</TabsTrigger><TabsTrigger value="check"><FileCheck2 size={15}/>Final check</TabsTrigger></TabsList>
      <TabsContent value="discover" className="mt-3 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3"><p className="max-w-prose text-xs leading-5 text-slate-600">Identify genuine skills that deserve more emphasis—not qualifications to invent.</p><Button type="button" variant="outline" size="sm" disabled={!!blockedReason} aria-describedby={blockedReason ? "resume-optimization-help" : undefined} onClick={() => onGenerate("discover")}><FileSearch size={15}/>{opportunities ? "Refresh opportunities" : "Find keyword opportunities"}</Button></div>
        {opportunities ? <><ReportHeader report={opportunities} stale={opportunityStale} compact/><div className="flex flex-wrap gap-2" role="group" aria-label="Filter keyword opportunities">{["all", ...Object.keys(tones)].map((value) => <Button key={value} type="button" size="sm" variant={filter === value ? "secondary" : "ghost"} aria-pressed={filter === value} onClick={() => setFilter(value)}>{value === "all" ? "All" : tones[value].label} ({opportunities.opportunities.filter((row) => value === "all" || row.state === value).length})</Button>)}</div>
          {rows.length ? <ul className="divide-y rounded-md border bg-white">{visibleRows.map((row, index) => { const tone = tones[row.state] || tones.missing_evidence; const Icon = tone.icon; return <li key={index} className="space-y-2 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><h4 className="text-sm font-medium">{row.keyword}</h4><span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${tone.className}`}><Icon size={14} aria-hidden="true"/>{tone.label}</span></div><p className="text-xs leading-5 text-slate-600"><span className="font-medium">Posting:</span> “{row.posting_excerpt}”</p><p className="text-sm leading-6 text-slate-700">{row.suggestion}</p><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-slate-600">Destination: {row.section_title}</p>{row.section_key && saved && <Button type="button" variant="outline" size="sm" disabled={busy || opportunityStale} onClick={() => onEditSection(row.section_key)}><Pencil size={14}/>Edit section</Button>}</div>{row.resume_excerpt && <p className="text-xs leading-5 text-slate-600">In your résumé: “{row.resume_excerpt}”</p>}<details className="text-xs text-slate-600"><summary className="cursor-pointer font-medium">Supporting source quotations ({row.sources.length})</summary>{row.sources.length ? <ul className="mt-2 space-y-2">{row.sources.map((source, position) => <li key={position} className="leading-5"><span className="font-medium">{source.source === "facts" ? "Profile facts" : source.source === "clarifications" ? "Your confirmed application answer" : "Reviewed résumé"}:</span> “{source.excerpt}”</li>)}</ul> : <p className="mt-2">No supporting source evidence. Supply real facts before making a résumé claim.</p>}{row.evidence_warning && <p className="mt-2 text-amber-900">{row.evidence_warning}</p>}</details></li>; })}</ul> : <EmptyState icon={FileSearch} title="No opportunities in this view" message="Choose another filter, or refresh the report after updating your sources."/>}{rows.length > 3 && <Button type="button" size="sm" variant="outline" aria-expanded={expandedOpportunities} onClick={() => setExpandedOpportunities(!expandedOpportunities)}><ChevronDown size={14} className={expandedOpportunities ? "rotate-180" : ""}/>{expandedOpportunities ? "Show less" : `Show more (${rows.length - visibleRows.length} more)`}</Button>}</> : <EmptyState icon={FileSearch} title="Find what your résumé could emphasize" message="Run a quoted comparison to see covered keywords, supported opportunities and evidence gaps."/>}
      </TabsContent>
      <TabsContent value="tailor" className="mt-3 space-y-3">
        <p className="max-w-prose text-sm leading-6 text-slate-700">One proposal combines supported keywords, achievement-focused bullets, clearer wording, relevant experience, a concise summary and your strongest differentiators. No invented metrics or qualifications.</p>
        <ul className="list-disc space-y-1 pl-5 text-xs leading-5 text-slate-600"><li>Your current section order and document layout are preserved.</li><li>Each changed section shows before/after text, the reason and source quotations.</li><li>Edit, keep or reject each section; the saved résumé changes only after acceptance.</li></ul>
        <div className="flex flex-wrap gap-2"><Button type="button" size="sm" disabled={!!blockedReason} aria-describedby={blockedReason ? "resume-optimization-help" : undefined} onClick={() => onGenerate("tailor")}><Sparkles size={15}/>Tailor résumé for this role</Button>{pendingCount > 0 && <Button type="button" size="sm" variant="outline" disabled={busy || dirty} onClick={onReview}><FileCheck2 size={15}/>Review pending proposals ({pendingCount})</Button>}</div>
      </TabsContent>
      <TabsContent value="check" className="mt-3 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3"><p className="max-w-prose text-xs leading-5 text-slate-600">Check the saved text for high-impact fixes before submission—not an acceptance score or a tested ATS result.</p><div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" disabled={!!blockedReason || busy || !saved} aria-describedby={!saved ? "resume-check-save-help" : blockedReason ? "resume-optimization-help" : undefined} onClick={() => onGenerate("check")}><FileCheck2 size={15}/>{check ? "Run check again" : "Run final recruiter check"}</Button>{check?.findings?.length > 0 && <Button type="button" size="sm" disabled={!!blockedReason || busy || !saved || checkStale} aria-describedby="resume-fix-help" onClick={() => onGenerate("fix")}><Sparkles size={15}/>Resolve issues</Button>}</div></div>
        {check?.findings?.length > 0 && <p id="resume-fix-help" className="flex items-start gap-2 text-xs leading-5 text-slate-600"><Info size={15} className="shrink-0" aria-hidden="true"/>{checkStale ? "Save your résumé and rerun the check before requesting fixes." : `Answer questions for all ${check.findings.length} findings first, then approve the cost for one AI fix proposal. Unanswered gaps stay flagged; no automatic retry or recheck.`}</p>}
        {!saved && <p id="resume-check-save-help" className="flex items-start gap-2 text-xs text-slate-600"><Info size={15} className="shrink-0" aria-hidden="true"/>Save or accept a résumé draft before running the final check.</p>}
        {check ? <>
          <ReportHeader report={check} stale={checkStale} compact/>
          {check.findings.length ? <><p className="text-xs text-slate-600">{check.findings.length} findings · {check.findings.filter((finding) => finding.priority === "high").length} high priority. Open a finding for context and the suggested fix.</p><ol className="divide-y rounded-md border bg-white">{check.findings.map((finding, index) => <li key={index}><details className="group/finding">
            <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 rounded-md p-3 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-600 [&::-webkit-details-marker]:hidden">
              <span className="min-w-0 flex-1 text-sm font-medium capitalize">{finding.category} · {finding.section_title}</span>
              <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${finding.priority === "high" ? "bg-rose-50 text-rose-900" : finding.priority === "medium" ? "bg-amber-50 text-amber-900" : "bg-slate-100 text-slate-700"}`}><TriangleAlert size={14} aria-hidden="true"/>{finding.priority} priority</span>
              <ChevronDown size={16} className="shrink-0 text-slate-500 transition-transform motion-reduce:transition-none group-open/finding:rotate-180"/>
            </summary>
            <div className="space-y-2 border-t p-3">
            <p className="text-sm leading-6 text-slate-700">{finding.explanation}</p>
            {finding.excerpt && <blockquote className="border-l pl-3 text-xs leading-5 text-slate-600">{finding.excerpt}</blockquote>}
            <p className="text-sm leading-6 text-slate-700">{finding.suggestion}</p>
            <Button type="button" size="sm" variant="outline" disabled={busy || checkStale} onClick={() => onEditSection(finding.section_key)}><Pencil size={14}/>Review & edit section</Button>
            </div>
          </details></li>)}</ol></> : checkStale || check.warnings?.length ? <p className="flex items-start gap-2 text-sm leading-6 text-amber-900"><Info size={18} className="shrink-0" aria-hidden="true"/>No current, caution-free findings are available. Review the warnings and rerun the check before relying on this report.</p> : <p className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900"><CheckCircle2 size={18} className="shrink-0" aria-hidden="true"/>No findings were returned for this revision. Confirm accuracy yourself; this is not a guarantee of acceptance.</p>}
        </> : <EmptyState icon={FileCheck2} title="Final check not run yet" message="Once your changes are saved, run the quoted check and open findings directly in the section editor."/>}
      </TabsContent>
    </Tabs>
  </section>;
}
