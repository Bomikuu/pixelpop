import { useEffect, useState } from "react";
import { ArrowRight, Archive, BriefcaseBusiness, Plus, Search, Users } from "lucide-react";
import { Button } from "../../personal-dashboard/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../personal-dashboard/ui/dialog";
import { Input } from "../../personal-dashboard/ui/input";
import { workflowApi, workflowRecords } from "./api";
import { ClientPhoneField, ClientTimeZoneField, phoneDigits } from "./ClientContactFields";
import { ClientCountryField } from "./ClientLocationFields";
import { EmptyState, Field, Panel, StatusNotice } from "./shared";

const blankClient = { name: "", organization: "", contact_name: "", email: "", phone: "", country: "", timezone_name: "", notes: "" };
const clientFieldNames = new Set(Object.keys(blankClient));

function validateClient(draft) {
  const errors = {};
  if (!draft.name.trim()) errors.name = "Enter a client name.";
  for (const [name, max] of [["name", 160], ["organization", 160], ["contact_name", 160], ["country", 100]]) {
    if (draft[name].trim().length > max) errors[name] = `Use ${max} characters or fewer.`;
  }
  if (draft.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
    errors.email = "Enter a valid email address.";
  } else if (draft.email.trim().length > 254) {
    errors.email = "Use 254 characters or fewer.";
  }
  const phoneLength = phoneDigits(draft.phone).length;
  if (phoneLength > 0 && phoneLength < 7) errors.phone = "Enter at least 7 digits, or leave phone blank.";
  if (phoneLength > 15) errors.phone = "Use 15 digits or fewer, including the country code.";
  return errors;
}

function focusField(name) {
  document.getElementById(`client-workflow-${name}`)?.focus();
}

export default function ClientsView({ csrf, navigate }) {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [archived, setArchived] = useState(false);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const updateDraft = (name, value) => {
    setDraft((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
    setError("");
  };
  const load = async () => {
    setLoading(true); setError("");
    try { setClients(await workflowRecords("clients", { archived: String(archived), q: search.trim() }, csrf)); }
    catch (cause) { setError(cause.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { const timer = setTimeout(load, 200); return () => clearTimeout(timer); }, [archived, search, csrf]);
  const save = async (event) => {
    event.preventDefault();
    const errors = validateClient(draft);
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      focusField(Object.keys(errors)[0]);
      return;
    }
    setSaving(true); setError("");
    try {
      const client = await workflowApi("clients/", { method: "POST", body: { ...draft, name: draft.name.trim(), email: draft.email.trim(), phone: phoneDigits(draft.phone) } }, csrf);
      setDraft(null); navigate(`clients/${client.id}`);
    } catch (cause) {
      const serverErrors = Object.fromEntries(Object.entries(cause.data || {})
        .filter(([name]) => clientFieldNames.has(name))
        .map(([name, messages]) => [name, Array.isArray(messages) ? messages.join(" ") : String(messages)]));
      setFieldErrors(serverErrors);
      if (Object.keys(serverErrors).length) focusField(Object.keys(serverErrors)[0]);
      setError(Object.keys(serverErrors).length ? "" : cause.message);
    }
    finally { setSaving(false); }
  };
  return <div className="space-y-5"><Panel title="Clients" description="Keep each relationship in one place; every engagement gets its own project." action={<Button onClick={() => { setError(""); setFieldErrors({}); setDraft({ ...blankClient }); }}><Plus size={16}/>Add client</Button>}>
    <div className="mb-4 flex flex-wrap gap-2"><label className="relative flex min-w-60 flex-1 items-center"><Search size={16} className="absolute left-3 text-slate-500"/><span className="sr-only">Search clients</span><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search clients or organizations" className="bg-white pl-9"/></label><Button variant={archived ? "outline" : "secondary"} onClick={() => setArchived(false)}>Active</Button><Button variant={archived ? "secondary" : "outline"} onClick={() => setArchived(true)}><Archive size={15}/>Archived</Button></div>
    <StatusNotice error={!draft && error}/>{loading ? <p className="py-8 text-sm text-slate-500">Loading clients…</p> : clients.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{clients.map((client) => <button type="button" key={client.id} onClick={() => navigate(`clients/${client.id}`)} className="group rounded-lg border border-slate-200 bg-white p-4 text-left transition-colors hover:border-blue-300 hover:bg-blue-50/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"><div className="flex items-start justify-between gap-3"><span className="grid size-9 place-items-center rounded-md bg-blue-50 text-blue-700"><Users size={17}/></span><ArrowRight size={16} className="text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-blue-700"/></div><h3 className="mt-3 font-semibold text-slate-950">{client.name}</h3><p className="mt-1 text-sm text-slate-500">{client.organization || client.contact_name || "Individual client"}</p><p className="mt-3 flex items-center gap-2 text-xs text-slate-500"><BriefcaseBusiness size={14}/>{client.project_count ?? 0} {client.project_count === 1 ? "project" : "projects"}</p></button>)}</div> : <EmptyState icon={Users} title={archived ? "No archived clients" : search ? "No matching clients" : "No clients yet"} description={archived ? "Archived relationships will appear here." : search ? "Try a different name or organization." : "Add your first client, then create a project to start the workflow."}/>}</Panel>
    <Dialog open={Boolean(draft)} onOpenChange={(open) => { if (!open && !saving) setDraft(null); }}>
      <DialogContent className="personal-dashboard max-h-[90dvh] overflow-y-auto bg-white sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add client</DialogTitle>
          <DialogDescription>Contact information stays in your private Business workspace. Do not enter credentials here. Fields marked * are required.</DialogDescription>
        </DialogHeader>
        {draft && <form noValidate onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Client name" name="name" value={draft.name} onChange={updateDraft} required error={fieldErrors.name}/>
            <Field label="Organization" name="organization" value={draft.organization} onChange={updateDraft} error={fieldErrors.organization}/>
            <Field label="Contact person" name="contact_name" value={draft.contact_name} onChange={updateDraft} error={fieldErrors.contact_name}/>
            <Field label="Email" name="email" type="email" value={draft.email} onChange={updateDraft} error={fieldErrors.email}/>
            <ClientPhoneField value={draft.phone} onChange={updateDraft} error={fieldErrors.phone}/>
            <ClientCountryField value={draft.country} onChange={updateDraft} error={fieldErrors.country}/>
            <ClientTimeZoneField value={draft.timezone_name} onChange={updateDraft} error={fieldErrors.timezone_name}/>
          </div>
          <Field label="Private notes" name="notes" textarea rows={3} value={draft.notes} onChange={updateDraft} error={fieldErrors.notes}/>
          <StatusNotice error={error}/>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDraft(null)}>Cancel</Button>
            <Button type="submit" disabled={saving}><Plus size={15}/>{saving ? "Saving…" : "Add client"}</Button>
          </DialogFooter>
        </form>}
      </DialogContent>
    </Dialog>
  </div>;
}
