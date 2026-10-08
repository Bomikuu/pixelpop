import { useState } from "react";
import FormModalShell from "../../personal-dashboard/components/forms/FormModalShell";
import FormField from "../../personal-dashboard/components/forms/FormField";
import { jobApi, fieldError } from "./api";

export default function CostReconciliationForm({ applicationId, run, onSaved, onCancel }) {
  const initial = { amount_usd: run.reconciled_cost_usd ?? "", note: run.reconciliation_note || "" };
  const [draft, setDraft] = useState(initial), [busy, setBusy] = useState(false), [error, setError] = useState(""), [errors, setErrors] = useState({});
  async function submit(event) {
    event.preventDefault();
    const issues = {};
    if (!/^\d+(\.\d{1,6})?$/.test(draft.amount_usd)) issues.amount_usd = "Enter a nonnegative USD amount with up to six decimal places.";
    if (!draft.note.trim()) issues.note = "Explain the charge you confirmed with your provider.";
    setErrors(issues); if (Object.keys(issues).length) return;
    setBusy(true); setError("");
    try { await jobApi(`applications/${applicationId}/usage/${run.id}/reconcile/`, { method: "POST", body: { ...draft, expected_version: run.cost_version } }); onSaved(); }
    catch (issue) { setError(issue.message); setErrors(issue.fields || {}); }
    finally { setBusy(false); }
  }
  return <FormModalShell title="Reconcile provider charge" description="Check this request against provider billing. An explicit zero means you confirmed no charge. Returned token usage is kept separately; this amount controls the app allowance." busy={busy} error={error} dirty={JSON.stringify(draft) !== JSON.stringify(initial)} onSubmit={submit} onCancel={onCancel} saveLabel="Save reconciled cost">
    <p className="text-xs text-slate-600">{run.provider} / {run.model} · Request {run.id}{run.status === "running" && " · The stalled call could still finish; provider billing remains authoritative."}</p>
    {[{ name: "amount_usd", label: "Confirmed charge (USD)", required: true, inputMode: "decimal" }, { name: "note", label: "Reconciliation note", type: "textarea", required: true, maxLength: 2000 }].map((field) => <FormField key={field.name} field={field} values={draft} onChange={(name, value) => { if (name === "amount_usd" && !/^\d*(\.\d{0,6})?$/.test(value)) return; setDraft({ ...draft, [name]: value }); }} error={fieldError(errors, field.name)} disabled={busy} layout="plain" idPrefix="usage-reconcile"/>)}
  </FormModalShell>;
}
