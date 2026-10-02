import { useEffect, useState } from "react";
import { ArrowRight, Archive, BriefcaseBusiness, Plus, Search, Users } from "lucide-react";
import { Button } from "../../personal-dashboard/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../personal-dashboard/ui/dialog";
import { Input } from "../../personal-dashboard/ui/input";
import { workflowApi, workflowRecords } from "./api";
import { EmptyState, Field, Panel, StatusNotice } from "./shared";

const blankClient = { name: "", organization: "", contact_name: "", email: "", phone: "", country: "", timezone_name: "", notes: "" };

export default function ClientsView({ csrf, navigate }) {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [archived, setArchived] = useState(false);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const load = async () => {
    setLoading(true); setError("");
    try { setClients(await workflowRecords("clients", { archived: String(archived), q: search.trim() }, csrf)); }
    catch (cause) { setError(cause.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { const timer = setTimeout(load, 200); return () => clearTimeout(timer); }, [archived, search, csrf]);
  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const client = await workflowApi("clients/", { method: "POST", body: draft }, csrf);
      setDraft(null); navigate(`clients/${client.id}`);
    } catch (cause) { setError(cause.message); }
    finally { setSaving(false); }
  };
  return <div className="space-y-5"><Panel title="Clients" description="Keep each relationship in one place; every engagement gets its own project." action={<Button onClick={() => { setError(""); setDraft({ ...blankClient }); }}><Plus size={16}/>Add client</Button>}>
    <div className="mb-4 flex flex-wrap gap-2"><label className="relative flex min-w-60 flex-1 items-center"><Search size={16} className="absolute left-3 text-slate-500"/><span className="sr-only">Search clients</span><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search clients or organizations" className="bg-white pl-9"/></label><Button variant={archived ? "outline" : "secondary"} onClick={() => setArchived(false)}>Active</Button><Button variant={archived ? "secondary" : "outline"} onClick={() => setArchived(true)}><Archive size={15}/>Archived</Button></div>
    <StatusNotice error={!draft && error}/>{loading ? <p className="py-8 text-sm text-slate-500">Loading clients…</p> : clients.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{clients.map((client) => <button type="button" key={client.id} onClick={() => navigate(`clients/${client.id}`)} className="group rounded-lg border border-slate-200 bg-white p-4 text-left transition-colors hover:border-blue-300 hover:bg-blue-50/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"><div className="flex items-start justify-between gap-3"><span className="grid size-9 place-items-center rounded-md bg-blue-50 text-blue-700"><Users size={17}/></span><ArrowRight size={16} className="text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-blue-700"/></div><h3 className="mt-3 font-semibold text-slate-950">{client.name}</h3><p className="mt-1 text-sm text-slate-500">{client.organization || client.contact_name || "Individual client"}</p><p className="mt-3 flex items-center gap-2 text-xs text-slate-500"><BriefcaseBusiness size={14}/>{client.project_count ?? 0} {client.project_count === 1 ? "project" : "projects"}</p></button>)}</div> : <EmptyState icon={Users} title={archived ? "No archived clients" : search ? "No matching clients" : "No clients yet"} description={archived ? "Archived relationships will appear here." : search ? "Try a different name or organization." : "Add your first client, then create a project to start the workflow."}/>}</Panel>
    <Dialog open={Boolean(draft)} onOpenChange={(open) => { if (!open && !saving) setDraft(null); }}><DialogContent className="personal-dashboard sm:max-w-2xl"><DialogHeader><DialogTitle>Add client</DialogTitle><DialogDescription>Contact information stays in your private Business workspace. Do not enter credentials here.</DialogDescription></DialogHeader>{draft && <form onSubmit={save} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><Field label="Client name" name="name" value={draft.name} onChange={(name, value) => setDraft({ ...draft, [name]: value })} required maxLength={160}/><Field label="Organization" name="organization" value={draft.organization} onChange={(name, value) => setDraft({ ...draft, [name]: value })}/><Field label="Contact person" name="contact_name" value={draft.contact_name} onChange={(name, value) => setDraft({ ...draft, [name]: value })}/><Field label="Email" name="email" type="email" value={draft.email} onChange={(name, value) => setDraft({ ...draft, [name]: value })}/><Field label="Phone" name="phone" value={draft.phone} onChange={(name, value) => setDraft({ ...draft, [name]: value })}/><Field label="Country" name="country" value={draft.country} onChange={(name, value) => setDraft({ ...draft, [name]: value })}/><Field label="Time zone" name="timezone_name" value={draft.timezone_name} onChange={(name, value) => setDraft({ ...draft, [name]: value })} placeholder="e.g. Asia/Manila"/></div><Field label="Private notes" name="notes" textarea rows={3} value={draft.notes} onChange={(name, value) => setDraft({ ...draft, [name]: value })}/><StatusNotice error={error}/><DialogFooter><Button type="button" variant="outline" onClick={() => setDraft(null)}>Cancel</Button><Button type="submit" disabled={saving}><Plus size={15}/>{saving ? "Saving…" : "Add client"}</Button></DialogFooter></form>}</DialogContent></Dialog>
  </div>;
}
