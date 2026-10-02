import { useState } from "react";
import { CreditCard, Pencil, Plus, Waypoints } from "lucide-react";
import { Button } from "../../personal-dashboard/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../personal-dashboard/ui/dialog";
import { workflowApi } from "./api";
import { ChoiceField, EmptyState, Field, Panel, StatusNotice } from "./shared";

const paymentStatus = [["planned", "Planned"], ["invoiced", "Invoiced"], ["reported_received", "Reported received"]];
const changeStatus = [["proposed", "Proposed"], ["approved", "Approved"], ["declined", "Declined"], ["completed", "Completed"]];
const blankPayment = { description: "", amount: "", due_on: "", status: "planned", received_on: "", notes: "" };
const blankChange = { description: "", price_impact: "", timeline_impact: "", status: "proposed", notes: "" };

function RecordSection({ project, csrf, type, records, onSaved }) {
  const payment = type === "milestones";
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const title = payment ? "Payment milestones" : "Change requests";
  const open = (record = null) => { setError(""); setDraft(record ? { ...record } : { ...(payment ? blankPayment : blankChange) }); };
  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError("");
    const body = payment ? { ...draft, project: project.id, due_on: draft.due_on || null, received_on: draft.status === "reported_received" ? draft.received_on || null : null } : { ...draft, project: project.id, price_impact: draft.price_impact || null };
    const resource = payment ? "payment-milestones" : "change-requests";
    try { const saved = await workflowApi(`${resource}/${draft.id ? `${draft.id}/` : ""}`, { method: draft.id ? "PATCH" : "POST", body }, csrf); onSaved(type, saved); setDraft(null); }
    catch (cause) { setError(cause.message); }
    finally { setSaving(false); }
  };
  return <><Panel title={title} description={payment ? "Manual record only. ‘Reported received’ is not payment verification." : "Agree on out-of-scope work before you begin it."} action={<Button onClick={() => open()}><Plus size={15}/>{payment ? "Add milestone" : "Add request"}</Button>}>
    {records.length ? <ul className="divide-y divide-slate-100">{records.map((record) => <li key={record.id} className="flex flex-wrap items-start justify-between gap-3 py-3"><div className="min-w-0 flex-1"><h3 className="text-sm font-medium text-slate-900">{record.description}</h3><p className="mt-1 text-xs text-slate-500">{payment ? `${project.currency} ${Number(record.amount).toLocaleString()}${record.due_on ? ` · Due ${record.due_on}` : ""}` : [record.price_impact != null ? `${project.currency} ${Number(record.price_impact).toLocaleString()} impact` : "", record.timeline_impact].filter(Boolean).join(" · ") || "No estimate recorded"}</p><span className="mt-2 inline-block rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600">{record.status.replaceAll("_", " ")}</span></div><Button size="sm" variant="outline" onClick={() => open(record)} aria-label={`Edit ${record.description}`}><Pencil size={14}/>Edit</Button></li>)}</ul> : <EmptyState icon={payment ? CreditCard : Waypoints} title={payment ? "No milestones recorded" : "No change requests"} description={payment ? "Add proposed milestones, then manually record invoices and payment reports." : "Record changes and their impact before agreeing to new scope."}/>}</Panel>
    <Dialog open={Boolean(draft)} onOpenChange={(next) => { if (!next && !saving) setDraft(null); }}><DialogContent className="personal-dashboard max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{draft?.id ? `Edit ${payment ? "milestone" : "change request"}` : `Add ${payment ? "milestone" : "change request"}`}</DialogTitle><DialogDescription>{payment ? "This is a private manual log, not an invoice or payment processor." : "Approval status is recorded manually and does not send a client notification."}</DialogDescription></DialogHeader>{draft && <form onSubmit={save} className="space-y-4"><Field label={payment ? "Milestone" : "Requested change"} name="description" value={draft.description} textarea={!payment} rows={3} required onChange={(name, value) => setDraft({ ...draft, [name]: value })}/><div className="grid gap-4 sm:grid-cols-2">{payment ? <><Field label={`Amount (${project.currency})`} name="amount" type="number" min="0" step="0.01" required value={draft.amount} onChange={(name, value) => setDraft({ ...draft, [name]: value })}/><Field label="Due date" name="due_on" type="date" value={draft.due_on} onChange={(name, value) => setDraft({ ...draft, [name]: value })}/></> : <><Field label={`Price impact (${project.currency})`} name="price_impact" type="number" step="0.01" value={draft.price_impact} onChange={(name, value) => setDraft({ ...draft, [name]: value })}/><Field label="Timeline impact" name="timeline_impact" value={draft.timeline_impact} onChange={(name, value) => setDraft({ ...draft, [name]: value })}/></>}<ChoiceField label="Status" name="status" value={draft.status} onChange={(name, value) => setDraft({ ...draft, [name]: value })} options={payment ? paymentStatus : changeStatus}/>{payment && draft.status === "reported_received" && <Field label="Reported received on" name="received_on" type="date" value={draft.received_on} onChange={(name, value) => setDraft({ ...draft, [name]: value })}/>}</div><Field label="Notes" name="notes" textarea rows={3} value={draft.notes} onChange={(name, value) => setDraft({ ...draft, [name]: value })}/><StatusNotice error={error}/><DialogFooter><Button type="button" variant="outline" onClick={() => setDraft(null)}>Cancel</Button><Button type="submit" disabled={saving}><Plus size={15}/>{saving ? "Saving…" : "Save record"}</Button></DialogFooter></form>}</DialogContent></Dialog>
  </>;
}

export default function ProjectRecords({ project, milestones, changes, csrf, onSaved }) {
  return <div className="grid gap-5 xl:grid-cols-2"><RecordSection project={project} csrf={csrf} type="milestones" records={milestones} onSaved={onSaved}/><RecordSection project={project} csrf={csrf} type="changes" records={changes} onSaved={onSaved}/></div>;
}
