import { useRef } from "react";
import { DropdownMenu } from "radix-ui";
import { ArrowLeft, BriefcaseBusiness, ChevronDown, ExternalLink, FileCheck2, FileSearch, Link2, MoreHorizontal, Pencil, RefreshCw, Sparkles, TriangleAlert } from "lucide-react";
import { Button } from "../../personal-dashboard/ui/button";
import { AssessmentCoverage, assessmentState } from "./AssessmentSummary";
import PostingHighlights from "./PostingHighlights";

export default function ApplicationHeader({ record, assessment, dirty, busy, prepareBlocked, prepared, prepareStatus, onBack, onRefresh, onEdit, onConvert, onPrepare, onChecks, onRequirements, onFlags, onProposals, onSettings }) {
  const trigger = useRef(null), opening = useRef(false);
  const state = assessmentState(assessment, dirty, record.requirement_decisions);
  const pending = (record.pending_proposals || []).reduce((sum, item) => sum + item.count, 0);
  const actions = [
    { label: "Edit details & status", icon: Pencil, action: onEdit },
    { label: "Refresh application", icon: RefreshCw, action: onRefresh },
    { label: "AI provider & budget", icon: Sparkles, action: onSettings },
    ...(!record.client_link ? [{ label: "Create linked client/project", icon: Link2, action: onConvert }] : []),
  ];
  return <section aria-label="Job posting overview" className="min-w-0 space-y-4 rounded-lg border bg-white p-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Button size="sm" variant="ghost" disabled={busy} onClick={onBack}><ArrowLeft size={15}/>Applications</Button>
      <div className="flex items-center gap-2">
        <span id="application-prepare-status" className="sr-only">{prepareStatus}</span>
        <Button size="sm" disabled={busy || (!prepared && prepareBlocked)} aria-describedby="application-prepare-status" onClick={prepared ? onChecks : onPrepare}>{prepared ? <FileCheck2 size={15}/> : <Sparkles size={15}/>} {prepared ? "Review checks" : "Prepare missing drafts"}</Button>
        <DropdownMenu.Root><DropdownMenu.Trigger asChild><Button ref={trigger} size="icon-sm" variant="outline" disabled={busy} aria-label="More application actions"><MoreHorizontal size={17}/></Button></DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content align="end" sideOffset={6} className="personal-dashboard z-50 min-w-56 rounded-md border bg-white p-1 text-slate-950 shadow-md" onCloseAutoFocus={(event) => { if (opening.current) { event.preventDefault(); opening.current = false; } }}>
          {actions.map(({ label, icon: Icon, action }) => <DropdownMenu.Item key={label} onSelect={() => { opening.current = true; trigger.current?.focus(); action(); }} className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-3 py-2 text-sm outline-none data-[highlighted]:bg-slate-100"><Icon size={16}/>{label}</DropdownMenu.Item>)}
        </DropdownMenu.Content></DropdownMenu.Portal></DropdownMenu.Root>
      </div>
    </div>
    <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="min-w-0"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700"><BriefcaseBusiness size={20} aria-hidden="true"/></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="break-words text-lg font-semibold">{record.role}</h2><span className="rounded-md border px-2 py-0.5 text-xs capitalize text-slate-600">{record.status}</span></div><p className="mt-1 text-xs leading-5 text-slate-600">{record.company}{record.platform && ` · ${record.platform}`}{record.updated_at && <> · Updated <time dateTime={record.updated_at}>{new Date(record.updated_at).toLocaleDateString("en-PH", { timeZone: "Asia/Manila", month: "short", day: "numeric", year: "numeric" })}</time></>}</p></div>{record.url && <a aria-label="Open original job posting" className="shrink-0 rounded-sm p-1 text-blue-700 hover:text-blue-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600" href={record.url} target="_blank" rel="noopener noreferrer" title="Open original posting"><ExternalLink size={17}/></a>}</div>
        <PostingHighlights posting={record.posting} requirements={state.stale ? [] : state.requirements} variant="tags"/>
      </div>
      <div className="min-w-0 border-t pt-3 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0"><AssessmentCoverage artifact={assessment} dirty={dirty} decisions={record.requirement_decisions} compact/></div>
    </div>
    <div className="flex flex-wrap gap-x-2 gap-y-1 border-t pt-2" aria-label="Review status shortcuts">
      <Button size="sm" variant="ghost" disabled={busy} onClick={onChecks}><FileCheck2 size={14}/>{record.checklist ? `${record.checklist.completed}/${record.checklist.total} preparation steps reviewed` : "Preparation checks"}</Button>
      <Button size="sm" variant="ghost" disabled={busy} onClick={onRequirements}><FileSearch size={14}/>{state.stale ? "Reassessment needed" : state.coverage === null ? "Compare requirements" : `${state.gaps.length} evidence gaps`}</Button>
      {(state.warningCount > 0 || state.evidenceFlags > 0) && <Button size="sm" variant="ghost" disabled={busy} onClick={onFlags}><TriangleAlert size={14}/>{state.warningCount + state.evidenceFlags} review flags</Button>}
      {pending > 0 && <Button size="sm" variant="ghost" disabled={busy} onClick={onProposals}><FileCheck2 size={14}/>{pending} pending proposals<ChevronDown size={14}/></Button>}
    </div>
  </section>;
}
