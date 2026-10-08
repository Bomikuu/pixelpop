import { useState } from "react";
import { today } from "../../personal-dashboard/lib/format";
import FormField from "../../personal-dashboard/components/forms/FormField";
import FormModalShell from "../../personal-dashboard/components/forms/FormModalShell";
import { fieldError, jobApi } from "./api";

export default function ApplicationActivityForm({ applicationId, onSaved, onCancel, notify }) {
  const initial = { kind: "response", occurred_on: today(), message: "" };
  const [draft, setDraft] = useState(initial), [busy, setBusy] = useState(false), [error, setError] = useState(""), [errors, setErrors] = useState({});
  async function submit(event) {
    event.preventDefault(); setError(""); setErrors({});
    if (!draft.message.trim()) { setErrors({ message: "Enter the response or note." }); return; }
    setBusy(true);
    try { await jobApi(`applications/${applicationId}/activity/`, { method: "POST", body: draft }); onSaved(); notify("Application activity recorded."); }
    catch (issue) { setError(issue.message); setErrors(issue.fields || {}); }
    finally { setBusy(false); }
  }
  return <FormModalShell title="Record response or activity" description="Add the actual employer reply, interview details, or your own follow-up notes." onSubmit={submit} onCancel={onCancel} busy={busy} error={error} dirty={JSON.stringify(draft) !== JSON.stringify(initial)} saveLabel="Save activity">
    <div className="grid gap-4 sm:grid-cols-2">{[{ name: "kind", label: "Activity type", type: "select" }, { name: "occurred_on", label: "Date", type: "date", required: true }, { name: "message", label: "Response or note", type: "textarea", required: true, maxLength: 8000, className: "min-h-40" }].map((field) => <div key={field.name} className={field.type === "textarea" ? "sm:col-span-2" : ""}><FormField field={field} values={draft} onChange={(name, value) => setDraft((previous) => ({ ...previous, [name]: value }))} error={fieldError(errors, field.name)} disabled={busy} layout="plain" idPrefix="application-activity" options={[{ value: "response", label: "Employer response" }, { value: "note", label: "Note" }, { value: "follow_up", label: "Follow-up" }, { value: "interview", label: "Interview" }]}/></div>)}</div>
  </FormModalShell>;
}
