import { useEffect, useState } from "react";
import { Archive, ArrowRight, BriefcaseBusiness, Pencil, Plus, Users } from "lucide-react";
import { Button } from "../../personal-dashboard/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../personal-dashboard/ui/dialog";
import { workflowApi, workflowRecords } from "./api";
import { EmptyState, Field, Panel, STAGES, StatusNotice } from "./shared";

const initialProject = { title: "", summary: "", country: "", currency: "USD", governing_law: "", quoted_amount: "", target_on: "", notes: "" };

export default function ClientDetailView({ clientId, csrf, navigate }) {
  const [client, setClient] = useState(null);
  const [projects, setProjects] = useState([]);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const load = async () => {
    setLoading(true); setError("");
    try { const [record, items] = await Promise.all([workflowApi(`clients/${clientId}/`, {}, csrf), workflowRecords("projects", { client: clientId }, csrf)]); setClient(record); setProjects(items); }
    catch (cause) { setError(cause.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [clientId, csrf]);
  const saveClient = async (event) => {
    event.preventDefault(); setSaving(true); setError("");
    try { const body = { ...draft }; delete body.kind; await workflowApi(`clients/${clientId}/`, { method: "PATCH", body }, csrf); setDraft(null); await load(); }
    catch (cause) { setError(cause.message); }
    finally { setSaving(false); }
  };
  const saveProject = async (event) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const fields = { ...draft }; delete fields.kind;
      const project = await workflowApi("projects/", { method: "POST", body: { ...fields, client: Number(clientId), quoted_amount: draft.quoted_amount || null, target_on: draft.target_on || null } }, csrf);
      setDraft(null); navigate(`clients/${clientId}/projects/${project.id}`);
    } catch (cause) { setError(cause.message); }
    finally { setSaving(false); }
  };
  if (loading && !client) return <p className="text-sm text-slate-500">Loading client…</p>;
  if (!client) return <StatusNotice error={error || "Client not found."}/>;
  const editingClient = draft?.kind === "client";
  return <div className="space-y-5"><Panel title={client.name} description={client.organization || "Client relationship"} action={<div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => { setError(""); setDraft({ kind: "client", ...client }); }}><Pencil size={15}/>Edit</Button><Button variant="outline" onClick={async () => { try { await workflowApi(`clients/${clientId}/`, { method: "PATCH", body: { is_archived: !client.is_archived } }, csrf); await load(); } catch (cause) { setError(cause.message); } }}><Archive size={15}/>{client.is_archived ? "Restore" : "Archive"}</Button></div>}>
    <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">{[["Contact", client.contact_name], ["Email", client.email], ["Phone", client.phone], ["Location", [client.country, client.timezone_name].filter(Boolean).join(" · ")]].map(([label, value]) => <div key={label}><dt className="text-slate-500">{label}</dt><dd className="mt-1 break-words text-slate-900">{value || "Not recorded"}</dd></div>)}</dl>{client.notes && <p className="mt-4 whitespace-pre-wrap border-t pt-4 text-sm text-slate-600">{client.notes}</p>}
  </Panel><Panel title="Projects" description="Each engagement has an independent checklist, draft set, and payment log." action={<Button onClick={() => { setError(""); setDraft({ kind: "project", ...initialProject }); }}><Plus size={16}/>New project</Button>}><StatusNotice error={!draft && error}/>{projects.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{projects.map((project) => <button type="button" key={project.id} onClick={() => navigate(`clients/${clientId}/projects/${project.id}`)} className="group rounded-lg border border-slate-200 p-4 text-left transition-colors hover:border-blue-300 hover:bg-blue-50/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"><div className="flex items-start justify-between gap-3"><BriefcaseBusiness size={19} className="text-blue-700"/><ArrowRight size={16} className="text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-blue-700"/></div><h3 className="mt-3 font-semibold text-slate-950">{project.title}</h3><p className="mt-1 line-clamp-2 text-sm text-slate-500">{project.summary || "No summary yet"}</p><div className="mt-4 flex flex-wrap gap-2 text-xs"><span className="rounded border border-slate-200 px-2 py-1 text-slate-600">{project.state.replaceAll("_", " ")}</span><span className="rounded border border-blue-100 bg-blue-50 px-2 py-1 text-blue-700">{STAGES.find(([key]) => key === project.current_stage)?.[1] || "Inquiry"}</span></div></button>)}</div> : <EmptyState icon={Users} title="No projects for this client" description="Create an engagement to get its own workflow and editable document drafts."/>}</Panel>
    <Dialog open={Boolean(draft)} onOpenChange={(open) => { if (!open && !saving) setDraft(null); }}><DialogContent className="personal-dashboard max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{editingClient ? "Edit client" : "New project"}</DialogTitle><DialogDescription>{editingClient ? "Update the private contact and relationship details." : "Creates an independent nine-stage checklist and copies your current templates into this project."}</DialogDescription></DialogHeader>{draft && <form onSubmit={editingClient ? saveClient : saveProject} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2">{(editingClient ? [["name", "Client name"], ["organization", "Organization"], ["contact_name", "Contact person"], ["email", "Email"], ["phone", "Phone"], ["country", "Country"], ["timezone_name", "Time zone"]] : [["title", "Project title"], ["country", "Client country"], ["currency", "Currency (ISO code)"], ["governing_law", "Intended governing law"], ["quoted_amount", "Quoted amount"], ["target_on", "Target date"]]).map(([name, label]) => <Field key={name} label={label} name={name} type={name === "email" ? "email" : name === "target_on" ? "date" : name === "quoted_amount" ? "number" : "text"} min={name === "quoted_amount" ? "0" : undefined} step={name === "quoted_amount" ? "0.01" : undefined} required={name === "name" || name === "title"} value={draft[name]} onChange={(field, value) => setDraft({ ...draft, [field]: value })}/>)}</div>{!editingClient && <Field label="Request summary" name="summary" textarea rows={3} value={draft.summary} onChange={(field, value) => setDraft({ ...draft, [field]: value })}/>}<Field label="Private notes" name="notes" textarea rows={3} value={draft.notes} onChange={(field, value) => setDraft({ ...draft, [field]: value })}/><StatusNotice error={error}/><DialogFooter><Button type="button" variant="outline" onClick={() => setDraft(null)}>Cancel</Button><Button type="submit" disabled={saving}><Plus size={15}/>{saving ? "Saving…" : editingClient ? "Save client" : "Create project"}</Button></DialogFooter></form>}</DialogContent></Dialog>
  </div>;
}
