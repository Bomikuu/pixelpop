import { useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "../../personal-dashboard/ui/button";
import { Textarea } from "../../personal-dashboard/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../personal-dashboard/ui/select";
import { documentSections } from "./documentSections";

export default function ResumeExperienceDrafts({ body, notes, examples = [], busy, blockedReason, onGenerate, onExternalPrompt, onChange, draftState, onDraftStateChange }) {
  const sections = documentSections(body).filter((section) => !["Whole document", "Header & introduction"].includes(section.title) && !/^#\s+/.test(section.body));
  const draft = draftState?.text || "";
  const destination = draftState?.destination || "__new__";
  const baseline = draftState?.baseline ?? body;
  const reviewed = draftState?.reviewed || false;
  const update = (patch) => onDraftStateChange((previous) => ({ text: "", destination: "__new__", baseline: body, reviewed: false, ...previous, ...patch }));
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  function selectSuggestion(text) {
    update({ text, baseline: body, reviewed: false }); setError(""); setStatus("");
  }
  function insert() {
    setError(""); setStatus("");
    if (busy || !reviewed || !draft.trim()) return;
    if (baseline !== body) { setError("Your résumé changed. Review the current document and refresh the insertion target before adding this draft."); return; }
    let next;
    if (destination === "__new__") next = `${body.trimEnd()}${body.trim() ? "\n\n" : ""}## Experience draft\n\n${draft.trim()}\n`;
    else {
      const parts = documentSections(body);
      if (!parts.some((section) => section.key === destination)) { setError("This section is no longer present. Choose a current destination."); return; }
      next = parts.map((section) => section.key === destination ? `${section.body.trimEnd()}\n\n${draft.trim()}\n` : section.body).join("");
    }
    if (next.length > 30000) { setError("The résumé would exceed 30,000 characters. Shorten this draft first."); return; }
    onChange(next); update({ text: "", baseline: next, reviewed: false }); setStatus("Experience text inserted into your unsaved résumé. Review and save the document when ready.");
  }
  return <section className="space-y-4" aria-label="Experience drafting tools">
    <div><h3 className="text-sm font-semibold">Draft experience details</h3><p className="mt-1 text-sm leading-6 text-slate-600">Explore possible project contributions and outcomes, edit the wording, then choose where to insert it. Draft ideas do not confirm employment history or change evidence coverage.</p></div>
    <div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" disabled={busy || !!blockedReason} onClick={onGenerate}><Sparkles size={15}/>Generate example</Button><Button type="button" size="sm" variant="outline" disabled={busy} onClick={onExternalPrompt}>External AI brainstorm</Button></div>
    {blockedReason && <p className="text-xs leading-5 text-slate-600">{blockedReason}</p>}
    {(notes.length > 0 || examples.length > 0) && <details className="border-y py-3"><summary className="cursor-pointer text-sm font-medium focus-visible:outline-2 focus-visible:outline-blue-600">Choose a draft suggestion ({notes.length + examples.length})</summary><ul className="mt-3 space-y-3">
      {notes.map((note, index) => <li key={`note-${index}`}><p className="whitespace-pre-wrap break-words text-sm leading-6">{note}</p><Button type="button" size="sm" variant="ghost" disabled={busy || !!draft.trim()} onClick={() => selectSuggestion(note)}>Edit this suggestion</Button></li>)}
      {examples.map((example) => <li key={example.id}><p className="text-xs capitalize text-slate-600">{example.status} example{example.stale ? " · Earlier sources" : ""}</p><details className="mt-1"><summary className="cursor-pointer text-sm font-medium focus-visible:outline-2 focus-visible:outline-blue-600">Example {example.id}</summary><p className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap break-words text-sm leading-6">{example.body}</p></details><Button type="button" size="sm" variant="ghost" disabled={busy || !!draft.trim()} onClick={() => selectSuggestion(example.body)}>Edit this example</Button></li>)}
    </ul>{draft.trim() && <p className="mt-2 text-xs text-slate-600">Clear or insert your current text before selecting another suggestion.</p>}</details>}
    <div><label htmlFor="resume-experience-draft" className="mb-2 block text-sm font-medium">Editable experience draft</label><Textarea id="resume-experience-draft" value={draft} disabled={busy} maxLength={12000} rows={10} className="text-base sm:text-sm" onChange={(event) => { update({ text: event.target.value, reviewed: false }); setError(""); setStatus(""); }} placeholder="Draft a project entry or contribution bullets in Markdown…"/></div>
    <div><label htmlFor="resume-experience-target" className="mb-2 block text-sm font-medium">Insert into</label><Select value={destination} onValueChange={(value) => update({ destination: value })} disabled={busy}><SelectTrigger id="resume-experience-target" className="w-full"><SelectValue/></SelectTrigger><SelectContent className="personal-dashboard"><SelectItem value="__new__">New experience draft section</SelectItem>{sections.map((section) => <SelectItem key={section.key} value={section.key}>{section.title}</SelectItem>)}</SelectContent></Select></div>
    {draft && baseline !== body && <div className="space-y-2"><p className="text-xs leading-5 text-amber-900">The résumé has changed since this draft was started.</p><Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => { update({ baseline: body, reviewed: false }); setError(""); }}>Use current résumé as insertion target</Button></div>}
    <label className="flex items-start gap-2 text-sm leading-6"><input type="checkbox" className="mt-1.5 accent-blue-600" disabled={busy} checked={reviewed} onChange={(event) => update({ reviewed: event.target.checked })}/>I reviewed this wording and want to add it to my draft.</label>
    {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
    <p role="status" className="text-sm text-slate-700">{status}</p>
    <Button type="button" size="sm" disabled={busy || !draft.trim() || !reviewed || baseline !== body} onClick={insert}><Plus size={15}/>Insert into draft</Button>
  </section>;
}
