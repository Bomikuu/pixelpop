import { useState } from "react";
import { Check, ChevronDown, FileSearch, FileText, Info, MinusCircle, Pencil, RotateCcw } from "lucide-react";
import { Button } from "../../personal-dashboard/ui/button";
import MarkdownEditor from "../client-workflow/MarkdownEditor";

function TextChanges({ original, proposed, side }) {
  const before = original.split("\n"), after = proposed.split("\n");
  let start = 0, tail = 0;
  while (start < before.length && start < after.length && before[start] === after[start]) start++;
  while (tail < before.length - start && tail < after.length - start && before[before.length - tail - 1] === after[after.length - tail - 1]) tail++;
  const lines = side === "original" ? before : after;
  return <div className="whitespace-pre-wrap break-words text-sm leading-6">{lines.map((line, index) => {
    const changed = index >= start && index < lines.length - tail && original !== proposed;
    return <div key={index} className={`min-h-6 px-2 ${changed ? side === "original" ? "bg-rose-50 text-rose-900" : "bg-emerald-50 text-emerald-900" : "text-slate-700"}`}>{changed && <span className="mr-2 inline-block text-xs font-medium" aria-label={side === "original" ? "Removed or changed line" : "Added or changed line"}>{side === "original" ? "−" : "+"}</span>}{line || " "}</div>;
  })}</div>;
}

export default function ProposalSection({ section, savedSection, proposalId, disabled, onChange }) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const comparisonId = `proposal-${proposalId}-${section.id}-comparison`;
  const textChanged = section.proposed !== savedSection.proposed;
  const needsChoice = section.change !== "unchanged" || section.decision === "unreviewed";
  return <section className="space-y-3 border-t py-5 first:border-t-0 first:pt-0">
    <div className="flex flex-wrap items-start justify-between gap-3"><h3 className="min-w-0 flex-1"><button type="button" aria-expanded={expanded} aria-controls={comparisonId} onClick={() => setExpanded(!expanded)} className="flex w-full items-start gap-2 rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><ChevronDown size={17} aria-hidden="true" className={`mt-0.5 shrink-0 transition-transform motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`}/><span><span className="block text-sm font-semibold">{section.title}</span><span className="mt-1 block text-xs font-normal text-slate-600">{!needsChoice ? "Unchanged · Kept automatically" : `${section.change[0].toUpperCase()}${section.change.slice(1)} section · ${section.decision === "unreviewed" ? "Needs your decision" : section.decision === "original" ? "Keeping original" : "Using proposed text"}`}</span></span></button></h3>{needsChoice && <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" aria-pressed={section.decision === "original"} disabled={disabled || textChanged} className={section.decision === "original" ? "border-blue-500! bg-blue-50! text-blue-800!" : ""} onClick={() => onChange({ decision: "original" })}><RotateCcw size={14}/>{section.original ? "Keep original" : "Omit new section"}</Button><Button size="sm" variant="outline" aria-pressed={section.decision === "proposed"} disabled={disabled || textChanged} className={section.decision === "proposed" ? "border-blue-500! bg-blue-50! text-blue-800!" : ""} onClick={() => onChange({ decision: "proposed" })}><Check size={14}/>{section.proposed ? "Use proposed" : "Remove section"}</Button></div>}</div>
    {textChanged && <p role="status" className="text-xs text-amber-800">Save your edited text first, then choose which version to keep.</p>}
    {!expanded && (section.rationale_warning || section.rationale?.some((note) => note.evidence_warning)) && <p className="flex items-center gap-2 text-xs text-amber-900"><Info size={15} aria-hidden="true"/>Source cautions—expand this section before deciding.</p>}
    <div id={comparisonId} hidden={!expanded} className="space-y-3">
    {!!section.rationale?.length && <div className="space-y-2 rounded-md border bg-slate-50 p-3 text-xs leading-5 text-slate-700">
      <h4 className="flex items-center gap-2 font-medium"><FileSearch size={15} aria-hidden="true"/>Why this changed</h4>
      {section.rationale.map((note, index) => <div key={index} className="space-y-2"><p><span className="font-medium">{note.section_title}:</span> {note.reason}</p><details><summary className="cursor-pointer font-medium">Supporting source quotations ({note.sources.length})</summary>{note.sources.length ? <ul className="mt-2 space-y-2">{note.sources.map((source, position) => <li key={position}><span className="font-medium">{source.source === "facts" ? "Profile facts" : source.source === "clarifications" ? "Your confirmed application answer" : "Reviewed résumé"}:</span> “{source.excerpt}”</li>)}</ul> : <p className="mt-2">No factual source quote supplied. This may be a wording/layout change; verify any factual claims yourself.</p>}{note.evidence_warning && <p className="mt-2 text-amber-900">{note.evidence_warning}</p>}</details></div>)}
      {(textChanged || section.rationale_stale) && <p className="flex items-start gap-2 text-amber-900"><Info size={15} className="shrink-0" aria-hidden="true"/>This explanation refers to the AI's original proposal, not your subsequent edits. Review your edited claims separately.</p>}
    </div>}
    {section.rationale_warning && <p className="flex items-start gap-2 text-xs leading-5 text-amber-900"><Info size={15} className="shrink-0" aria-hidden="true"/>{section.rationale_warning}</p>}
    <div className="grid gap-3 lg:grid-cols-2"><div className="min-w-0 rounded-md border bg-white"><p className="flex items-center gap-2 border-b bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600"><FileText size={14}/>Current saved text · Read-only</p><div className="p-2">{section.original ? <TextChanges original={section.original} proposed={section.proposed} side="original"/> : <p className="flex items-center gap-2 p-3 text-xs text-slate-500"><MinusCircle size={16}/>No original section. This is an addition.</p>}</div></div>
      <div className="min-w-0 rounded-md border bg-white"><div className="flex flex-wrap items-center justify-between gap-2 border-b bg-slate-50 px-3 py-2"><p className="flex items-center gap-2 text-xs font-medium text-slate-600"><Pencil size={14}/>New AI proposal · Editable</p><Button size="sm" variant="ghost" disabled={disabled} aria-expanded={editing} aria-controls={`proposal-${proposalId}-${section.id}-editor`} onClick={() => setEditing(!editing)}><Pencil size={13}/>{editing ? "Hide editor" : "Edit section"}</Button></div><div className="p-2">{editing ? <div id={`proposal-${proposalId}-${section.id}-editor`}><fieldset disabled={disabled}><MarkdownEditor id={`proposal-${proposalId}-${section.id}-body`} value={section.proposed} label="Edit proposed text (Markdown)" required={false} maxLength={30000} onChange={(proposed) => onChange({ proposed, decision: "unreviewed", change: "changed" })}/></fieldset></div> : section.proposed ? <TextChanges original={section.original} proposed={section.proposed} side="proposed"/> : <p className="flex items-center gap-2 p-3 text-xs text-slate-500"><MinusCircle size={16}/>The proposal removes this section. Your decision is required.</p>}</div></div>
    </div>
    <p className="text-xs text-slate-500">Removed/changed text is marked −; added/changed text is marked +. Markdown formatting is shown as text for comparison.</p>
    </div>
  </section>;
}
