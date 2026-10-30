import { useEffect, useRef, useState } from "react";
import { Copy, FileUp } from "lucide-react";
import { Button } from "../../personal-dashboard/ui/button";
import { Textarea } from "../../personal-dashboard/ui/textarea";
import FormModalShell from "../../personal-dashboard/components/forms/FormModalShell";
import { externalResumePrompt, parseResumeJSON, RESUME_JSON_LIMIT } from "./resumeJSON";
import { confirmedResumeProjects, resumePriorities, resumePromptDefaults } from "./resumePriorities";

export default function ResumeJSONDialog({ mode, body, record, profile, reviewed, busy, onCancel, onApply, exploratory = false, assessmentDirty = false }) {
  const [baseline] = useState(body);
  const [text, setText] = useState("");
  const [preview, setPreview] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);
  const [status, setStatus] = useState("");
  const [options, setOptions] = useState(() => ({ ...resumePromptDefaults(record, profile, assessmentDirty), experience: exploratory ? "exploratory" : "confirmed" }));
  const input = useRef(null), textarea = useRef(null), reviewHeading = useRef(null), sequence = useRef(0);
  const promptMode = mode === "prompt";
  const prompt = promptMode && profile?.sources_confirmed ? externalResumePrompt({ record, profile, body, reviewed, options, assessmentDirty }) : "";
  const projects = confirmedResumeProjects(profile);
  const { stale } = resumePriorities(record, assessmentDirty);
  useEffect(() => () => { sequence.current += 1; }, []);
  useEffect(() => { if (preview) reviewHeading.current?.focus(); }, [preview]);
  async function readFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const operation = ++sequence.current;
    setError("");
    setReading(false);
    if (file.size > RESUME_JSON_LIMIT) { setError("Choose a JSON file smaller than 256 KB."); return; }
    setReading(true);
    try {
      const next = await file.text();
      if (operation !== sequence.current) return;
      setText(next); setPreview(null); setConfirmed(false);
    } catch { if (operation === sequence.current) setError("Could not read this file. Paste its JSON instead."); }
    finally { if (operation === sequence.current) setReading(false); }
  }
  function submit(event) {
    event.preventDefault();
    if (promptMode) return;
    if (busy || reading) return;
    setError("");
    if (!preview) {
      try { setPreview(parseResumeJSON(text)); setConfirmed(false); }
      catch (issue) { setError(issue.message); textarea.current?.focus(); }
      return;
    }
    if (body !== baseline) { setError("Your résumé changed while this import was open. Close and reopen Import JSON to review it against the current draft. Your newer text was kept."); return; }
    if (!confirmed) { setError("Review the full replacement and confirm before applying."); return; }
    onApply(preview);
  }
  async function copyPrompt() {
    try { await navigator.clipboard.writeText(prompt); setStatus("Full résumé prompt copied. Paste it into your chosen AI."); }
    catch { textarea.current?.focus(); textarea.current?.select(); setStatus("Clipboard unavailable. The prompt is selected; copy it manually."); }
  }
  return <FormModalShell title={promptMode ? "External AI prompt" : preview ? "Review the full résumé import" : "Import résumé JSON"}
    description={promptMode ? "Copy the prompt, run it in your chosen AI, then import the complete JSON response here." : "Review a full replacement before applying it to your unsaved draft."}
    scrollBody onCancel={onCancel} onSubmit={submit} busy={reading} dirty={!promptMode && !!text.trim()} error={error} errorId="resume-json-error"
    submitDisabled={busy || !text.trim() || !!preview && !confirmed} saveLabel={preview ? "Replace draft" : "Preview import"}
    footer={promptMode ? <div className="flex flex-wrap justify-end gap-2 border-t bg-white px-4 py-3 sm:px-6"><Button type="button" variant="outline" onClick={onCancel}>Close</Button><Button type="button" disabled={!prompt} onClick={copyPrompt}><Copy size={15}/>Copy whole résumé prompt</Button></div> : undefined}>
    {promptMode ? <>
      <p className="text-sm leading-6 text-slate-700">{profile?.sources_confirmed ? "Includes this posting, your confirmed profile/project facts and the current résumé. Nothing is sent to an AI automatically." : "Review and confirm your applicant profile sources before preparing this prompt."}</p>
      <div className="grid gap-3 sm:grid-cols-3">{[
        ["emphasis", "Emphasis", [["strong", "Strong"], ["balanced", "Balanced"]]],
        ["detail", "Detail", [["compact", "Compact bullets"], ["expanded", "Expanded contributions"]]],
        ["experience", "Experience drafting", [["confirmed", "Confirmed facts"], ["exploratory", "Exploratory draft ideas"]]],
      ].map(([name, label, choices]) => <div key={name}><label htmlFor={`resume-prompt-${name}`} className="mb-1.5 block text-sm font-medium">{label}</label><select id={`resume-prompt-${name}`} value={options[name]} onChange={(event) => setOptions((previous) => ({ ...previous, [name]: event.target.value }))} className="min-h-11 w-full rounded-md border border-[var(--pd-border)] bg-white px-3 text-base focus-visible:outline-2 focus-visible:outline-blue-600 sm:text-sm">{choices.map(([value, title]) => <option key={value} value={value}>{title}</option>)}</select></div>)}</div>
      <div><label htmlFor="resume-prompt-focus" className="mb-1.5 block text-sm font-medium">Focus for this generation (optional)</label><Textarea id="resume-prompt-focus" value={options.focus} maxLength={600} rows={2} onChange={(event) => setOptions((previous) => ({ ...previous, focus: event.target.value }))} placeholder="For example: emphasize frontend architecture, integrations and project ownership."/></div>
      <p className="text-xs leading-5 text-slate-600">{stale ? "The assessment needs refreshing; earlier gaps are excluded from automatic focus. The prompt still includes the current posting and confirmed sources." : "Focus starts with up to three assessment gaps, with required criteria first. Edit it for this generation."}</p>
      {!!projects.length && <fieldset className="space-y-2 border-t pt-3"><legend className="text-sm font-medium">Projects to emphasize</legend><p className="text-xs leading-5 text-slate-600">Up to three start selected by matching posting terms to project names, system types and tools. Adjust as needed; selection does not establish a requirement match.</p><div className="max-h-48 space-y-2 overflow-y-auto overscroll-contain">{projects.map(({ key, project }) => <label key={key} className="flex cursor-pointer items-start gap-2 py-1 text-sm leading-6"><input type="checkbox" checked={options.projectKeys.includes(key)} className="mt-1.5 accent-blue-600" onChange={(event) => setOptions((previous) => ({ ...previous, projectKeys: event.target.checked ? [...previous.projectKeys, key] : previous.projectKeys.filter((item) => item !== key) }))}/><span className="min-w-0 break-words">{project.name}<span className="block text-xs text-slate-600">{[project.system_type, ...(project.tools || [])].filter(Boolean).join(" · ")}</span></span></label>)}</div><p className="text-xs leading-5 text-slate-600">All confirmed projects remain available as sources. These selections guide emphasis only.</p></fieldset>}
      {options.experience === "exploratory" && <p className="text-xs leading-5 text-slate-600">Invented suggestions are returned as review notes. Use the editor’s Experience drafts panel to edit and insert the text you choose.</p>}
      {!!prompt && <><label htmlFor="external-resume-prompt" className="block text-sm font-medium">Complete prompt</label><Textarea ref={textarea} id="external-resume-prompt" readOnly value={prompt} className="min-h-72 font-mono text-base sm:text-xs"/></>}
      <p role="status" className="text-sm text-slate-700">{status}</p>
    </> : preview ? <>
      <h3 ref={reviewHeading} tabIndex={-1} className="text-sm font-semibold focus:outline-none">{preview.sections.length} sections · {preview.body.length.toLocaleString()} characters</h3>
      <p className="text-sm leading-6 text-slate-700">This replaces the entire current draft, including unsaved edits. It does not save or mark the résumé reviewed. Undo import is available until you edit or save the replacement.</p>
      <div className="grid min-w-0 gap-4 lg:grid-cols-2">{[["Current draft", body], ["Imported résumé", preview.body]].map(([label, content]) => <section key={label} className="min-w-0"><h4 className="mb-2 text-sm font-medium">{label}</h4><pre tabIndex={0} className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-md border bg-slate-50 p-3 font-sans text-sm leading-6 focus-visible:outline-2 focus-visible:outline-blue-600">{content || "Empty draft"}</pre></section>)}</div>
      {preview.reviewNotes.length > 0 && <section className="space-y-2 border-t pt-3"><h4 className="text-sm font-medium">Details to verify ({preview.reviewNotes.length})</h4><p className="text-xs leading-5 text-slate-600">These notes are excluded from résumé text. They remain available in this editor and JSON export during this editing session; they are not saved as profile facts.</p><ul className="list-disc space-y-2 pl-5 text-sm leading-6">{preview.reviewNotes.map((note, index) => <li key={index} className="break-words">{note}</li>)}</ul></section>}
      <label className="flex items-start gap-2 text-sm leading-6"><input type="checkbox" className="mt-1.5 accent-blue-600" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)}/>I reviewed the complete replacement and want to apply it to my draft.</label>
      <Button type="button" variant="outline" size="sm" onClick={() => { setPreview(null); setConfirmed(false); requestAnimationFrame(() => textarea.current?.focus()); }}>Back to JSON</Button>
    </> : <>
      <p className="text-sm leading-6 text-slate-700">Use the format from External AI prompt or Export JSON. Only résumé text is imported; contact details remain in your applicant profile.</p>
      <input ref={input} type="file" accept="application/json,.json" className="hidden" onChange={readFile} disabled={busy || reading}/>
      <Button type="button" variant="outline" disabled={busy || reading} onClick={() => input.current?.click()}><FileUp size={16}/>{reading ? "Reading JSON…" : "Choose JSON file"}</Button>
      <label htmlFor="resume-json-input" className="block text-sm font-medium">Or paste the complete JSON</label>
      <Textarea ref={textarea} id="resume-json-input" value={text} disabled={reading || busy} onChange={(event) => { setText(event.target.value); setError(""); }} maxLength={RESUME_JSON_LIMIT} className="min-h-64 font-mono text-base sm:text-xs" spellCheck={false} aria-invalid={!!error} aria-describedby={error ? "resume-json-error" : undefined}/>
      <p className="text-xs leading-5 text-slate-600">Version 1 · header + sections + optional reviewNotes · 256 KB JSON limit · 30,000 résumé characters</p>
    </>}
  </FormModalShell>;
}
