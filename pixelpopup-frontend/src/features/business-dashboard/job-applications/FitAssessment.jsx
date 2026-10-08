import { Children, isValidElement, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { CheckCircle2, ChevronDown, CircleHelp, FileSearch, History, Info, ListChecks, Pencil, Save, Sparkles, Target, TriangleAlert } from "lucide-react";
import { Button } from "../../personal-dashboard/ui/button";
import { EmptyState } from "../../personal-dashboard/components/Panel";
import MarkdownEditor from "../client-workflow/MarkdownEditor";
import { DocumentActions } from "../client-workflow/shared";
import { AssessmentCoverage, assessmentState } from "./AssessmentSummary";
import { documentSections, sectionContent } from "./documentSections";

const markdownComponents = {
  img: () => null,
  h1: ({ children }) => <h4 className="mb-2 text-sm font-semibold">{children}</h4>,
  h2: ({ children }) => <h4 className="mb-2 mt-4 text-sm font-semibold">{children}</h4>,
  h3: ({ children }) => <h4 className="mb-2 mt-4 text-sm font-semibold">{children}</h4>,
  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-3 list-disc space-y-2 pl-5 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 list-decimal space-y-2 pl-5 last:mb-0">{children}</ol>,
};

const actionPreviewComponents = {
  ...markdownComponents,
  p: ({ children }) => <p className="mb-2 line-clamp-2 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="space-y-2">{Children.toArray(children).filter(isValidElement).slice(0, 3)}</ul>,
  ol: ({ children }) => <ol className="space-y-2">{Children.toArray(children).filter(isValidElement).slice(0, 3)}</ol>,
  li: ({ children }) => <li className="flex items-start gap-2"><ListChecks size={17} className="mt-0.5 shrink-0 text-blue-700" aria-hidden="true"/><div className="min-w-0 line-clamp-2">{children}</div></li>,
};

function sectionIcon(title) {
  if (/recommend|overall|verdict|fit|summary/i.test(title)) return Target;
  if (/gap|missing|risk|limitation/i.test(title)) return TriangleAlert;
  if (/strength|match|advantage|evidence/i.test(title)) return CheckCircle2;
  if (/question|clarif|unknown/i.test(title)) return CircleHelp;
  if (/step|action|priorit/i.test(title)) return ListChecks;
  return FileSearch;
}

function Disclosure({ label, children }) {
  return <details className="group min-w-0 text-sm">
    <summary className="flex cursor-pointer list-none items-center gap-2 rounded-sm py-2 text-slate-600 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 [&::-webkit-details-marker]:hidden">
      <span>{label}</span><ChevronDown size={16} className="ml-auto shrink-0 transition-transform motion-reduce:transition-none group-open:rotate-180" aria-hidden="true"/>
    </summary>
    <div className="mt-2 min-w-0 break-words text-sm leading-6 text-slate-700">{children}</div>
  </details>;
}

function EvidenceList({ title, icon: Icon, rows, empty, warning = false, supportingSection }) {
  // The coverage summary flags required gaps; keep long evidence lists expandable.
  const visibleCount = 3;
  const renderRow = (row, index) => {
    const RowIcon = row.notMet ? TriangleAlert : row.status === "supported" ? CheckCircle2 : row.status === "partial" ? CircleHelp : FileSearch;
    const status = row.notMet ? "Not met" : row.status === "supported" ? "Supported" : row.status === "partial" ? "Partial" : "Not evidenced";
    return <li key={row.index ?? index} className="py-2">
      <details className="group/row">
        <summary className="flex cursor-pointer list-none items-start gap-2 rounded-sm text-sm hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 [&::-webkit-details-marker]:hidden">
          <span className={`grid size-7 shrink-0 place-items-center rounded-full ${warning ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-700"}`}><RowIcon size={15} aria-hidden="true"/></span>
          <span className="min-w-0 flex-1 break-words"><span className="block font-medium leading-5">{row.text}</span><span className={`mt-1 flex flex-wrap gap-1 text-xs ${warning ? "text-amber-900" : "text-emerald-800"}`}><span>{status}</span>{row.importance === "required" && <span className="rounded-sm bg-slate-100 px-1 text-slate-600">Required</span>}</span></span>
          <ChevronDown size={15} className="mt-1 shrink-0 text-slate-500 transition-transform motion-reduce:transition-none group-open/row:rotate-180" aria-hidden="true"/>
        </summary>
        <p className="mt-2 pl-9 text-xs leading-5 text-slate-600">{row.notMet ? "You recorded this as not met. Review this limitation even if the earlier AI evidence differs." : row.explanation || "No supporting explanation recorded. Reassess to refresh the evidence."}{row.evidence_warning && <span className="mt-1 block text-amber-900">Source quotation needs review.</span>}</p>
      </details>
    </li>;
  };
  return <section className="min-w-0 space-y-2 border-t pt-4">
    <h3 className="flex items-center gap-2 text-sm font-semibold"><Icon size={18} className={`shrink-0 ${warning ? "text-amber-800" : "text-emerald-700"}`} aria-hidden="true"/>{title}<span className="ml-auto rounded-md bg-slate-100 px-2 py-0.5 text-xs font-normal tabular-nums text-slate-600">{rows.length}</span></h3>
    {rows.length ? <><ul className="divide-y">{rows.slice(0, visibleCount).map(renderRow)}</ul>{rows.length > visibleCount && <Disclosure label={`Show ${rows.length - visibleCount} more ${warning ? "gaps" : "matches"}`}><ul className="divide-y">{rows.slice(visibleCount).map(renderRow)}</ul></Disclosure>}</> : <p className="py-2 text-xs leading-5 text-slate-600">{empty}</p>}
    {supportingSection && <Disclosure label="Read assessment reasoning"><ReactMarkdown components={markdownComponents}>{sectionContent(supportingSection)}</ReactMarkdown></Disclosure>}
  </section>;
}

function SummarySection({ section, lead = false, actions = false }) {
  const Icon = sectionIcon(section.title);
  const content = sectionContent(section).trim();
  const title = section.title === "Header & introduction" ? "Role fit summary" : section.title === "Whole document" ? "Recommendation" : section.title;
  return <section className={`min-w-0 space-y-2 ${lead ? "" : "border-t pt-4"}`}>
    <h3 className="flex items-center gap-2 text-sm font-semibold"><Icon size={18} className="shrink-0 text-blue-700" aria-hidden="true"/>{title}</h3>
    <div className={`max-w-prose break-words text-sm leading-6 text-slate-700 ${actions ? "" : "line-clamp-6"}`}><ReactMarkdown components={actions ? actionPreviewComponents : markdownComponents}>{content}</ReactMarkdown></div>
    <Disclosure label={`Read all ${title.toLowerCase()}`}><ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown></Disclosure>
  </section>;
}

export default function FitAssessment({ artifact, body, context, onChange, onSave, onGenerate, onHistory, busy, loading, generationHelp, error, notify }) {
  const [editing, setEditing] = useState(false);
  const pageRef = useRef(null);
  const dirty = body !== (artifact?.body || "");
  const state = assessmentState(artifact, dirty, context?.decisions);
  const needsAttention = state.stale || state.requiredGaps || state.warningCount || state.evidenceFlags;
  const title = `Fit assessment summary${context?.role ? ` · ${context.role}${context.company ? ` at ${context.company}` : ""}` : ""}`;
  const supported = state.requirements.filter((row, index) => row.status === "supported" && !state.gaps.some((gap) => gap.index === index && gap.notMet));
  const sections = documentSections(body);
  const introduction = sections.find((section) => section.title === "Header & introduction");
  const recommendation = sections.find((section) => /recommend|overall|verdict|summary/i.test(section.title)) || sections.find((section) => ["Whole document", "Header & introduction"].includes(section.title));
  const strengths = sections.find((section) => section !== recommendation && /strength|match|advantage/i.test(section.title));
  const gaps = sections.find((section) => section !== recommendation && /gap|missing|risk|limitation/i.test(section.title));
  const nextSteps = sections.find((section) => section !== recommendation && /step|action|priorit/i.test(section.title));
  const supportingSections = sections.filter((section) => ![introduction, recommendation, strengths, gaps, nextSteps].includes(section));
  const helpId = "fit-assessment-generation-help";
  const copyText = [state.stale ? "Earlier assessment · Reassessment needed" : state.label,
    state.coverage !== null ? `${state.supported} of ${state.requirements.length} requirements fully supported; ${state.partial} partial. Evidence coverage is not a hiring prediction.` : "",
    body,
    state.requirements.length ? `\nSupported matches\n${supported.map((row) => `• ${row.text}: ${row.explanation || "No supporting explanation recorded."}`).join("\n")}` : "",
    state.gaps.length ? `\nMissing or partial evidence\n${state.gaps.map((row) => `• ${row.text}: ${row.notMet ? "Recorded as not met; review this limitation." : row.explanation || "No supporting explanation recorded."}`).join("\n")}` : "",
    state.warnings.length ? `\nReview cautions\n${state.warnings.join("\n")}` : "",
    artifact?.evidence?.length ? `\nSource facts used\n${artifact.evidence.join("\n")}` : ""].filter(Boolean).join("\n\n");
  return <div className="space-y-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="text-base font-semibold">Fit assessment</h2><p className="mt-1 text-xs leading-5 text-slate-600">Your fit, strongest evidence and next steps.{artifact?.revision > 0 && ` · Revision ${artifact.revision}`}</p></div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" disabled={!!generationHelp} aria-describedby={generationHelp ? helpId : undefined} onClick={() => onGenerate("routine")}><Sparkles size={15}/>{artifact?.body ? "Reassess fit" : "Assess fit"}</Button>
        {artifact?.body && <Button type="button" size="sm" variant="outline" disabled={!!generationHelp} aria-describedby={generationHelp ? helpId : undefined} onClick={() => onGenerate("refine")}><Sparkles size={15}/>Refine summary</Button>}
      </div>
    </div>
    {generationHelp && <p id={helpId} role="status" className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900"><Info size={17} className="mt-0.5 shrink-0" aria-hidden="true"/>{generationHelp}</p>}
    {error && <p role="alert" className="flex items-start gap-2 text-sm text-rose-900"><TriangleAlert size={17} className="shrink-0" aria-hidden="true"/>{error}</p>}
    <div className="flex flex-wrap items-center justify-between gap-3">
      <fieldset disabled={!body.trim()}><DocumentActions title={title} body={copyText} pageRef={pageRef} onMessage={notify}/></fieldset>
      <div className="flex flex-wrap gap-2">
        {artifact?.revision > 0 && <Button type="button" size="sm" variant="outline" disabled={busy || loading} onClick={onHistory}><History size={15}/>Previous assessments</Button>}
        <Button type="button" size="sm" variant="ghost" disabled={busy} aria-expanded={editing} aria-controls="fit-assessment-notes" onClick={() => setEditing(!editing)}><Pencil size={15}/>{editing ? "Hide note editor" : "Edit assessment notes"}</Button>
        {(editing || dirty) && <Button type="button" size="sm" disabled={busy || !dirty || !body.trim()} onClick={onSave}><Save size={15}/>Save summary</Button>}
      </div>
    </div>
    <div className="space-y-4">
      {body.trim() ? <>
        {context?.role && <p className="text-sm font-medium text-slate-800">{context.role}{context.company && ` at ${context.company}`}</p>}
        <div className={`min-w-0 space-y-4 rounded-md border p-4 ${needsAttention ? "border-amber-200" : state.positive ? "border-emerald-200" : "border-blue-200"}`}>
          <AssessmentCoverage artifact={artifact} dirty={dirty} decisions={context?.decisions} compact/>
          {introduction && introduction !== recommendation && <div className="border-t pt-3"><SummarySection section={introduction} lead/></div>}
          {recommendation && <div className="border-t pt-3"><SummarySection section={recommendation} lead/></div>}
        </div>
        {state.stale && <p role="status" className="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-sm leading-5 text-amber-950"><TriangleAlert size={17} className="shrink-0" aria-hidden="true"/>Earlier assessment. Save any note edits and reassess before relying on this recommendation.</p>}
        <div className="grid min-w-0 gap-x-6 gap-y-5 md:grid-cols-2">
          {state.requirements.length > 0 ? <>
            <EvidenceList title="Strengths" icon={CheckCircle2} rows={supported} supportingSection={strengths} empty="No fully supported requirements yet. Add genuine evidence and reassess."/>
            <EvidenceList title="Gaps to address" icon={TriangleAlert} rows={state.gaps} supportingSection={gaps} warning empty="No gaps flagged. Verify source accuracy before applying."/>
          </> : <>{strengths && <SummarySection section={strengths}/>} {gaps && <SummarySection section={gaps}/>}</>}
        </div>
        {nextSteps && <SummarySection section={nextSteps} actions/>}
        {!!state.warnings.length && <section className="space-y-2 border-t pt-4"><h3 className="flex items-center gap-2 text-sm font-semibold text-amber-900"><TriangleAlert size={18} aria-hidden="true"/>Review cautions</h3><ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">{state.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul></section>}
        {!!state.evidenceFlags && <p className="flex items-start gap-2 text-xs leading-5 text-amber-900"><Info size={16} className="shrink-0" aria-hidden="true"/>{state.evidenceFlags} source quotation{state.evidenceFlags === 1 ? " needs" : "s need"} review. Check the requirement evidence before applying.</p>}
        {(supportingSections.length > 0 || artifact?.evidence?.length > 0) && <div className="border-t pt-2"><Disclosure label="Supporting details & source facts">
          <div className="space-y-4">{supportingSections.map((section) => <section key={section.id}><h3 className="mb-2 flex items-center gap-2 text-sm font-semibold"><CircleHelp size={17} aria-hidden="true"/>{section.title}</h3><ReactMarkdown components={markdownComponents}>{sectionContent(section)}</ReactMarkdown></section>)}
            {!!artifact?.evidence?.length && <section><h3 className="mb-2 flex items-center gap-2 text-sm font-semibold"><FileSearch size={17} aria-hidden="true"/>Source facts used</h3><ul className="list-disc space-y-1 pl-5 text-xs">{artifact.evidence.map((item, index) => <li key={index}>{item}</li>)}</ul></section>}
          </div>
        </Disclosure></div>}
      </> : <EmptyState icon={FileSearch} title="See how you fit this role" message="Assess your confirmed experience against the job posting to get a recommendation, strengths, gaps and next steps. Review the cost quote before requesting AI assistance."/>}
    </div>
    {/* Print reads this full report, never the clamped or collapsed screen summary. */}
    <div ref={pageRef} hidden aria-hidden="true">
      <h2>{title}</h2><p>{state.label}</p>
      {state.stale && <p>Earlier assessment. Save any note edits and reassess before relying on this recommendation.</p>}
      {state.coverage !== null && <p>{state.supported} of {state.requirements.length} requirements fully supported; {state.partial} partial. Evidence coverage is not an ATS score or hiring prediction.</p>}
      <ReactMarkdown components={{ img: () => null }}>{body}</ReactMarkdown>
      {state.requirements.length > 0 && <><h3>Supported matches</h3><ul>{supported.map((row, index) => <li key={index}>{row.text}: {row.explanation}</li>)}</ul><h3>Missing or partial evidence</h3><ul>{state.gaps.map((row) => <li key={row.index}>{row.text}: {row.notMet ? "Recorded as not met; review this limitation." : row.explanation}</li>)}</ul></>}
      {!!state.warnings.length && <><h3>Review cautions</h3><ul>{state.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul></>}
      {!!artifact?.evidence?.length && <><h3>Source facts used</h3><ul>{artifact.evidence.map((item, index) => <li key={index}>{item}</li>)}</ul></>}
    </div>
    {editing && <section id="fit-assessment-notes" className="space-y-3 border-t pt-4"><h3 className="text-sm font-medium">Assessment notes · Optional</h3><p className="text-xs leading-5 text-slate-600">Editing these notes does not change the underlying requirement evidence. Save, then reassess to refresh the comparison.</p><fieldset disabled={busy}><MarkdownEditor id="application-assessment-body" value={body} onChange={onChange}/></fieldset></section>}
  </div>;
}
