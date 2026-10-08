import { useState } from "react";
import { Info } from "lucide-react";
import FormField from "../../personal-dashboard/components/forms/FormField";
import FormModalShell from "../../personal-dashboard/components/forms/FormModalShell";
import { today } from "../../personal-dashboard/lib/format";
import { fieldError, focusInvalidField, jobApi } from "./api";

export default function FollowUpForm({ record, mode = "record", onCancel, onSaved, notify }) {
  const [initial] = useState(() => ({ message: "", occurred_on: today(), next_date: mode === "reschedule" ? record.follow_up_on || "" : "", empty_date_action: "keep" }));
  const [expectedUpdatedAt] = useState(record.updated_at);
  const [draft, setDraft] = useState(initial), [busy, setBusy] = useState(false), [saved, setSaved] = useState(false);
  const [error, setError] = useState(""), [errors, setErrors] = useState({}), [attempt, setAttempt] = useState(null);
  const set = (name, value) => { setDraft((previous) => ({ ...previous, [name]: value })); setAttempt(null); };
  async function submit(event) {
    event.preventDefault(); if (busy || saved) return; const form = event.currentTarget; setError(""); setErrors({});
    const invalid = {};
    if (mode === "record" && !draft.message.trim()) invalid.message = "Record what actually happened.";
    if (mode === "record" && !draft.occurred_on) invalid.occurred_on = "Choose the actual date.";
    if (mode === "reschedule" && !draft.next_date && draft.empty_date_action !== "clear") invalid.next_date = "Choose a date or Clear reminder.";
    if (Object.keys(invalid).length) { setErrors(invalid); focusInvalidField(form); return; }
    const payload = attempt || { ...draft, action: mode, next_date: draft.next_date || null, expected_updated_at: expectedUpdatedAt, request_id: crypto.randomUUID() };
    setAttempt(payload); setBusy(true);
    try {
      await jobApi(`applications/${record.id}/follow-up/`, { method: "POST", body: payload });
      setSaved(true); notify(mode === "record" ? "Follow-up recorded and reminder updated." : "Follow-up reminder updated."); await onSaved();
    } catch (issue) { setError(issue.message); setErrors(issue.fields || {}); focusInvalidField(form); }
    finally { setBusy(false); }
  }
  return <FormModalShell title={mode === "record" ? "Record follow-up" : "Reschedule follow-up"} description={`${record.role} · ${record.company}. This records your work; it does not send a message.`} onSubmit={submit} onCancel={onCancel} busy={busy} submitDisabled={saved} dirty={!saved && JSON.stringify(draft) !== JSON.stringify(initial)} error={error} saveLabel={mode === "record" ? "Save follow-up" : "Save reminder"}>
    <p className="flex items-start gap-2 text-xs leading-5 text-slate-600"><Info size={16} className="shrink-0"/>Current reminder: {record.follow_up_on || "Not scheduled"}.{record.status === "ready" && " This is a pre-submission next action; no submission is assumed."}</p>
    <div className="grid gap-4 sm:grid-cols-2">
      {mode === "record" && <FormField field={{ name: "occurred_on", label: "Actual follow-up date", type: "date", required: true }} values={draft} onChange={set} layout="plain" disabled={busy || saved} idPrefix="follow-up" error={fieldError(errors, "occurred_on")}/>}
      <FormField field={{ name: "next_date", label: "Next reminder date", type: "date", required: mode === "reschedule" && draft.empty_date_action !== "clear" }} values={draft} onChange={set} layout="plain" disabled={busy || saved} idPrefix="follow-up" error={fieldError(errors, "next_date")}/>
      {!draft.next_date && <FormField field={{ name: "empty_date_action", label: "Without a next date", type: "select", required: true }} values={draft} onChange={set} layout="plain" disabled={busy || saved} idPrefix="follow-up" error={fieldError(errors, "empty_date_action")} options={[{ value: "keep", label: "Keep current reminder", description: "Do not change the scheduled date." }, { value: "clear", label: "Clear reminder", description: "Remove the reminder after this action." }]}/>}</div>
    {mode === "record" && <FormField field={{ name: "message", label: "Follow-up note", type: "textarea", required: true, maxLength: 8000, className: "min-h-36" }} values={draft} onChange={set} layout="plain" disabled={busy || saved} idPrefix="follow-up" error={fieldError(errors, "message")}/>} 
    {saved && <p role="status" className="text-sm text-emerald-800">Saved. Close and refresh if the updated list could not load.</p>}
  </FormModalShell>;
}
