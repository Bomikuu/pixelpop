import { useEffect, useState } from "react";
import { Archive, ArrowRight, BriefcaseBusiness, Pencil, Plus, Users } from "lucide-react";
import { Button } from "../../personal-dashboard/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../personal-dashboard/ui/dialog";
import { workflowApi, workflowRecords } from "./api";
import { ClientPhoneField, ClientTimeZoneField, phoneDigits } from "./ClientContactFields";
import { ClientCountryField, ProjectCurrencyField } from "./ClientLocationFields";
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
    try { const body = { ...draft, phone: phoneDigits(draft.phone) }; delete body.kind; await workflowApi(`clients/${clientId}/`, { method: "PATCH", body }, csrf); setDraft(null); await load(); }
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
  </Panel><Panel title="Projects" description="Each engagement has an independent checklist, draft set, and payment log." action={<Button onClick={() => { setError(""); setDraft({ kind: "project", ...initialProject, country: client.country || "" }); }}><Plus size={16}/>New project</Button>}><StatusNotice error={!draft && error}/>{projects.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{projects.map((project) => <button type="button" key={project.id} onClick={() => navigate(`clients/${clientId}/projects/${project.id}`)} className="group rounded-lg border border-slate-200 p-4 text-left transition-colors hover:border-blue-300 hover:bg-blue-50/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"><div className="flex items-start justify-between gap-3"><BriefcaseBusiness size={19} className="text-blue-700"/><ArrowRight size={16} className="text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-blue-700"/></div><h3 className="mt-3 font-semibold text-slate-950">{project.title}</h3><p className="mt-1 line-clamp-2 text-sm text-slate-500">{project.summary || "No summary yet"}</p><div className="mt-4 flex flex-wrap gap-2 text-xs"><span className="rounded border border-slate-200 px-2 py-1 text-slate-600">{project.state.replaceAll("_", " ")}</span><span className="rounded border border-blue-100 bg-blue-50 px-2 py-1 text-blue-700">{STAGES.find(([key]) => key === project.current_stage)?.[1] || "Inquiry"}</span></div></button>)}</div> : <EmptyState icon={Users} title="No projects for this client" description="Create an engagement to get its own workflow and editable document drafts."/>}</Panel>
    <Dialog open={Boolean(draft)} onOpenChange={(open) => { if (!open && !saving) setDraft(null); }}>
      <DialogContent className="personal-dashboard max-h-[90dvh] overflow-y-auto bg-white sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingClient ? "Edit client" : "New project"}</DialogTitle>
          <DialogDescription>{editingClient ? "Update the private contact and relationship details." : "Creates an independent nine-stage checklist and copies your current templates into this project."} Fields marked * are required.</DialogDescription>
        </DialogHeader>
        {draft && <form onSubmit={editingClient ? saveClient : saveProject} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {editingClient ? <>
              <Field label="Client name" name="name" required value={draft.name} onChange={(name, value) => setDraft({ ...draft, [name]: value })}/>
              <Field label="Organization" name="organization" value={draft.organization} onChange={(name, value) => setDraft({ ...draft, [name]: value })}/>
              <Field label="Contact person" name="contact_name" value={draft.contact_name} onChange={(name, value) => setDraft({ ...draft, [name]: value })}/>
              <Field label="Email" name="email" type="email" value={draft.email} onChange={(name, value) => setDraft({ ...draft, [name]: value })}/>
              <ClientPhoneField value={draft.phone} onChange={(name, value) => setDraft({ ...draft, [name]: value })}/>
              <ClientCountryField value={draft.country} onChange={(name, value) => setDraft({ ...draft, [name]: value })}/>
              <ClientTimeZoneField value={draft.timezone_name} onChange={(name, value) => setDraft({ ...draft, [name]: value })}/>
            </> : <>
              <Field label="Project title" name="title" required value={draft.title} onChange={(name, value) => setDraft({ ...draft, [name]: value })}/>
              <ClientCountryField label="Client country" value={draft.country} onChange={(name, value) => setDraft({ ...draft, [name]: value })}/>
              <ProjectCurrencyField value={draft.currency} onChange={(name, value) => setDraft({ ...draft, [name]: value })}/>
              <Field label="Intended governing law" name="governing_law" value={draft.governing_law} onChange={(name, value) => setDraft({ ...draft, [name]: value })}/>
              <Field label="Quoted amount" name="quoted_amount" type="money" value={draft.quoted_amount} onChange={(name, value) => setDraft({ ...draft, [name]: value })}/>
              <Field label="Target date" name="target_on" type="date" value={draft.target_on} onChange={(name, value) => setDraft({ ...draft, [name]: value })}/>
            </>}
          </div>
          {!editingClient && <Field label="Request summary" name="summary" textarea rows={3} value={draft.summary} onChange={(name, value) => setDraft({ ...draft, [name]: value })}/>}
          <Field label="Private notes" name="notes" textarea rows={3} value={draft.notes} onChange={(name, value) => setDraft({ ...draft, [name]: value })}/>
          <StatusNotice error={error}/>
          <DialogFooter><Button type="button" variant="outline" onClick={() => setDraft(null)}>Cancel</Button><Button type="submit" disabled={saving}><Plus size={15}/>{saving ? "Saving…" : editingClient ? "Save client" : "Create project"}</Button></DialogFooter>
        </form>}
      </DialogContent>
    </Dialog>
  </div>;
}
