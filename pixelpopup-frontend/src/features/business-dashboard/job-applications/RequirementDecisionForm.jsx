import { useState } from "react";
import { Info, FilePenLine, FileSearch, TriangleAlert } from "lucide-react";
import { Button } from "../../personal-dashboard/ui/button";
import FormField from "../../personal-dashboard/components/forms/FormField";
import FormModalShell from "../../personal-dashboard/components/forms/FormModalShell";
import { fieldError, focusInvalidField, jobApi } from "./api";

export default function RequirementDecisionForm({ record, row, profile, onCancel, onSaved, notify }) {
  const [initial] = useState(() => ({ decision: row.applicant_decision?.stale ? "needs_review" : row.applicant_decision?.decision || "needs_review", note: row.applicant_decision?.note || "", append_to_profile: false, accuracy_confirmed: false }));
  const [baseline] = useState(() => ({ requirement_key: row.requirement_key, assessment_revision: record.artifacts.find((item) => item.kind === "assessment")?.revision, source_digest: record.source_digest, expected_version: row.applicant_decision?.version || 0, expected_profile_updated_at: profile?.updated_at }));
  const [draft, setDraft] = useState(initial), [busy, setBusy] = useState(false), [saved, setSaved] = useState(false);
  const [error, setError] = useState(""), [errors, setErrors] = useState({});
  const set = (name, value) => setDraft((previous) => ({ ...previous, [name]: value, ...(name === "decision" ? { append_to_profile: false, accuracy_confirmed: false } : {}) }));
  function startEvidenceNote() {
    const excerpts = [...new Set((row.sources || []).map((source) => source.excerpt).filter(Boolean))];
    const note = excerpts.length
      ? `Draft for review — recorded source excerpts:\n${excerpts.join("\n\n")}\n\nMy contribution: [Confirm what I personally did.]\nOutcome: [Add a real result, or leave this out.]`
      : `Draft for review\nRequirement: ${row.text}\nProject or task: [Name a real example.]\nMy contribution: [Describe what I personally did.]\nOutcome: [Add a real result, or leave this out.]`;
    setDraft({ decision: "needs_review", note: note.slice(0, 4000), append_to_profile: false, accuracy_confirmed: false });
  }
  async function submit(event) {
    event.preventDefault(); if (busy || saved) return; const form = event.currentTarget; setError(""); setErrors({});
    const invalid = {};
    if (draft.decision !== "needs_review" && !draft.note.trim()) invalid.note = "Add a factual example or explain this limitation.";
    if (draft.append_to_profile && !draft.accuracy_confirmed) invalid.accuracy_confirmed = "Confirm this example is accurate.";
    if (Object.keys(invalid).length) { setErrors(invalid); focusInvalidField(form); return; }
    setBusy(true);
    try {
      const result = await jobApi(`applications/${record.id}/requirement-decision/`, { method: "POST", body: {
        ...draft, ...baseline,
      } });
      setSaved(true); notify(result.profile_changed ? "Example added. Review and confirm your shared profile before reassessing." : "Requirement decision saved. AI evidence status was not changed.");
      await onSaved(result);
    } catch (issue) { setError(issue.message); setErrors(issue.fields || {}); focusInvalidField(form); }
    finally { setBusy(false); }
  }
  return <FormModalShell title="Resolve requirement gap" description="Record a truthful decision. Saving a note does not change AI evidence coverage or call an AI provider." onSubmit={submit} onCancel={onCancel} busy={busy} submitDisabled={saved} dirty={!saved && JSON.stringify(draft) !== JSON.stringify(initial)} error={error} saveLabel="Save decision">
    <section className="space-y-2 border-b pb-4"><h3 className="flex items-start gap-2 text-sm font-medium"><FileSearch size={18} className="shrink-0"/>{row.text}</h3><p className="text-xs capitalize text-slate-600">{row.importance} · AI evidence: {row.status.replaceAll("_", " ")}</p><blockquote className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{row.posting_excerpt}</blockquote>{row.sources?.map((source, index) => <p key={index} className="text-xs leading-6 text-slate-600">{source.source}: {source.excerpt}</p>)}{row.evidence_warning && <p className="flex gap-2 text-sm text-amber-900"><TriangleAlert size={16} className="shrink-0"/>{row.evidence_warning}</p>}</section>
    {row.applicant_decision?.stale && <p className="flex gap-2 text-sm text-amber-900"><Info size={17} className="shrink-0"/>An earlier note is retained below. Review it against the new sources before confirming a decision.</p>}
    <FormField field={{ name: "decision", label: "Your decision", type: "select", required: true }} values={draft} onChange={set} options={[{ value: "needs_review", label: "Needs review" }, { value: "evidence_added", label: "Evidence added" }, { value: "not_met", label: "Not met" }]} layout="plain" idPrefix="requirement-decision" disabled={busy || saved} error={fieldError(errors, "decision")}/>
    <FormField field={{ name: "note", label: "Example or explanation", type: "textarea", required: draft.decision !== "needs_review", maxLength: 4000, className: "min-h-36" }} values={draft} onChange={set} layout="plain" idPrefix="requirement-decision" disabled={busy || saved} error={fieldError(errors, "note")}/>
    <div className="flex flex-wrap items-center gap-3"><Button type="button" size="sm" variant="outline" disabled={busy || saved || !!draft.note.trim()} onClick={startEvidenceNote}><FilePenLine size={15}/>Start evidence note</Button><p className="text-xs leading-5 text-slate-600">Uses recorded excerpts or placeholders. Review and replace placeholders yourself; no AI call or automatic approval.</p></div>
    {draft.decision === "evidence_added" && <section className="space-y-3 rounded-md border bg-blue-50 p-3 text-sm">
      <label className="flex items-start gap-2"><input type="checkbox" className="mt-1 accent-blue-600" disabled={busy || saved || !baseline.expected_profile_updated_at} checked={draft.append_to_profile} onChange={(event) => set("append_to_profile", event.target.checked)}/><span>Add this example to my shared profile</span></label>
      <p className="flex items-start gap-2 text-xs leading-5 text-slate-700"><Info size={16} className="shrink-0"/>Unchecked: this is a private application note, not a résumé fact. Adding it changes your shared profile and can make other assessments stale. You must review, confirm and save the profile again.</p>
      {!baseline.expected_profile_updated_at && <p className="text-xs text-amber-900">Your profile has not loaded. Close this form and refresh before adding shared evidence.</p>}
      {draft.append_to_profile && <><label className="flex items-start gap-2"><input type="checkbox" className="mt-1 accent-blue-600" checked={draft.accuracy_confirmed} disabled={busy || saved} aria-invalid={!!errors.accuracy_confirmed} aria-describedby={errors.accuracy_confirmed ? "requirement-accuracy-error" : undefined} onChange={(event) => set("accuracy_confirmed", event.target.checked)}/><span>I confirm this example is accurate. *</span></label>{errors.accuracy_confirmed && <p id="requirement-accuracy-error" role="alert" className="text-sm text-red-800">{fieldError(errors, "accuracy_confirmed")}</p>}</>}
    </section>}
    {draft.decision === "not_met" && <p className="flex gap-2 text-xs leading-5 text-slate-600"><Info size={16} className="shrink-0"/>This records a limitation. It does not improve coverage or remove a requirement. Required limitations remain in Needs attention.</p>}
    {saved && <p role="status" className="text-sm text-emerald-800">Saved. If the refresh failed, close and refresh the application before another change.</p>}
  </FormModalShell>;
}
