import { useEffect, useMemo, useRef, useState } from "react";
import { Info, Search, UserPlus, Users, X } from "lucide-react";
import { Field, ChoiceField } from "../client-workflow/shared";
import { ClientPhoneField, ClientTimeZoneField, phoneDigits } from "../client-workflow/ClientContactFields";
import { ClientCountryField, ProjectCurrencyField } from "../client-workflow/ClientLocationFields";
import { workflowApi } from "../client-workflow/api";
import ChoiceTiles from "../../personal-dashboard/components/ChoiceTiles";
import FormModalShell from "../../personal-dashboard/components/forms/FormModalShell";
import { Input } from "../../personal-dashboard/ui/input";
import { ErrorState } from "../../personal-dashboard/components/Panel";
import WorkflowPages from "./WorkflowPages";
import { jobApi, fieldError } from "./api";

const states = [["lead", "Lead"], ["active", "Active"], ["on_hold", "On hold"], ["completed", "Completed"], ["cancelled", "Cancelled"]];

export default function ApplicationConversionForm({ record, onSaved, onCancel, notify }) {
  const initial = useMemo(() => ({
    client: { name: record.company, organization: record.company, contact_name: "", email: "", phone: "", country: "", timezone_name: "", notes: "" },
    project: { title: record.role, summary: record.posting, state: "lead", currency: "USD", quoted_amount: "", started_on: "", target_on: "", notes: record.url ? `Application source: ${record.url}` : "" },
  }), [record]);
  const [client, setClient] = useState(initial.client), [project, setProject] = useState(initial.project), [mode, setMode] = useState("new"), [clientId, setClientId] = useState("");
  const [clients, setClients] = useState(null), [query, setQuery] = useState(""), [committedQuery, setCommittedQuery] = useState(""), [page, setPage] = useState(1), [retry, setRetry] = useState(0), [loading, setLoading] = useState(false), [clientError, setClientError] = useState("");
  const [errors, setErrors] = useState({}), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null), [composing, setComposing] = useState(false);
  const searchRef = useRef(null);
  const clientOptions = [...(selectedClient && !clients?.results?.some((item) => item.id === selectedClient.id) ? [selectedClient] : []), ...(clients?.results || [])];
  useEffect(() => { if (composing) return; const timer = setTimeout(() => { setCommittedQuery(query); setPage(1); }, query ? 300 : 0); return () => clearTimeout(timer); }, [query, composing]);
  useEffect(() => {
    if (mode !== "existing") return;
    const controller = new AbortController(); setLoading(true); setClientError("");
    workflowApi(`clients/?archived=false&q=${encodeURIComponent(committedQuery)}&page=${page}&page_size=20`, { signal: controller.signal }).then((result) => { if (!controller.signal.aborted) { setClients(result); setLoading(false); } }).catch((issue) => { if (!controller.signal.aborted) { setClientError(issue.message); setLoading(false); } });
    return () => controller.abort();
  }, [mode, committedQuery, page, retry]);
  const changeClient = (name, value) => { setClient((previous) => ({ ...previous, [name]: value })); setErrors((previous) => ({ ...previous, new_client: { ...previous.new_client, [name]: "" } })); };
  const changeProject = (name, value) => { setProject((previous) => ({ ...previous, [name]: value })); setErrors((previous) => ({ ...previous, project: { ...previous.project, [name]: "" } })); };
  const selectClient = (_, value) => {
    setClientId(value === "not-selected" ? "" : value);
    setSelectedClient(clientOptions.find((item) => String(item.id) === value) || null);
    setErrors((previous) => ({ ...previous, client_id: "" }));
  };
  const dirty = mode !== "new" || !!clientId || JSON.stringify(client) !== JSON.stringify(initial.client) || JSON.stringify(project) !== JSON.stringify(initial.project);
  async function submit(event) {
    event.preventDefault(); setError("");
    const issues = { project: {}, new_client: {} };
    if (!project.title.trim()) issues.project.title = "Enter the project title.";
    if (project.title.length > 200) issues.project.title = "Use at most 200 characters.";
    if (project.summary.length > 30000) issues.project.summary = "Use at most 30,000 characters.";
    if (project.notes.length > 8000) issues.project.notes = "Use at most 8,000 characters.";
    if (project.quoted_amount && !/^\d+(\.\d{1,2})?$/.test(project.quoted_amount)) issues.project.quoted_amount = "Enter an amount using digits and up to two decimal places.";
    if (mode === "existing" && !clientId) issues.client_id = "Select an active client.";
    if (mode === "new") {
      if (!client.name.trim()) issues.new_client.name = "Enter the client name.";
      for (const name of ["name", "organization", "contact_name"]) if (client[name].length > 160) issues.new_client[name] = "Use at most 160 characters; this prefilled value is editable.";
      if (client.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.email)) issues.new_client.email = "Enter a valid client email.";
      if (client.phone && !/^[0-9]{7,15}$/.test(phoneDigits(client.phone))) issues.new_client.phone = "Use 7–15 digits.";
    }
    setErrors(issues);
    if (issues.client_id || Object.keys(issues.project).length || Object.keys(issues.new_client).length) return;
    setBusy(true);
    const fields = { ...project, quoted_amount: project.quoted_amount || null, started_on: project.started_on || null, target_on: project.target_on || null };
    try {
      await jobApi(`applications/${record.id}/convert/`, { method: "POST", body: { project: fields, ...(mode === "new" ? { new_client: client } : { client_id: Number(clientId) }) } });
      onSaved(); notify("Client project linked. Workflow stages and templates are ready.");
    } catch (issue) { setError(issue.message); setErrors(issue.fields || {}); }
    finally { setBusy(false); }
  }
  return <FormModalShell title="Create linked client/project" description="Review the prefilled company, project and posting. Everything is editable. This creates client work, not a payment, and keeps your original application." busy={busy} error={error} dirty={dirty} onSubmit={submit} onCancel={onCancel} saveLabel="Create linked project">
    <fieldset disabled={busy} className="space-y-5">
      <ChoiceTiles id="conversion-client-mode" label="Client destination" value={mode} onChange={setMode} disabled={busy} options={[{ value: "new", label: "New client", icon: UserPlus, description: "Create an editable client record from this company." }, { value: "existing", label: "Existing client", icon: Users, description: "Link the project to one of your active clients." }]}/>
      {mode === "existing" ? <section className="space-y-3"><h3 className="text-sm font-medium">Choose a client *</h3><div className="relative"><Search size={16} className="absolute left-3 top-2.5 text-slate-500"/><Input ref={searchRef} aria-label="Search active clients" placeholder="Search active clients…" className="pl-9 pr-9" maxLength={160} value={query} onCompositionStart={() => setComposing(true)} onCompositionEnd={(event) => { setComposing(false); setQuery(event.currentTarget.value); }} onChange={(event) => setQuery(event.target.value)}/>{query && <button type="button" aria-label="Clear client search" className="absolute right-2 top-2 rounded p-1 text-slate-600 hover:bg-slate-100 focus-visible:outline-blue-600" onClick={() => { setQuery(""); setCommittedQuery(""); setPage(1); searchRef.current?.focus(); }}><X size={15}/></button>}</div>{clientError && <ErrorState message={clientError} retry={() => setRetry(retry + 1)}/>}<ChoiceField label="Client" name="client_id" required value={clientId || "not-selected"} onChange={selectClient} options={[["not-selected", loading ? "Loading clients…" : "Select a client"], ...clientOptions.map((item) => [String(item.id), item.name])]} error={fieldError(errors, "client_id")}/><WorkflowPages data={clients} page={page} onPage={setPage} busy={loading}/></section> : <section className="space-y-3"><h3 className="text-sm font-medium">Client details</h3><div className="grid gap-4 sm:grid-cols-2">
        {[{ name: "name", label: "Client name", required: true }, { name: "organization", label: "Organization" }, { name: "contact_name", label: "Client contact name" }, { name: "email", label: "Client email", type: "email" }].map((field) => <Field key={field.name} {...field} maxLength={field.name === "email" ? 254 : 160} value={client[field.name]} onChange={changeClient} error={fieldError(errors.new_client, field.name)}/>)}
        <ClientPhoneField value={client.phone} onChange={changeClient} error={fieldError(errors.new_client, "phone")}/><ClientTimeZoneField value={client.timezone_name} onChange={changeClient} error={fieldError(errors.new_client, "timezone_name")}/><ClientCountryField value={client.country} onChange={changeClient} error={fieldError(errors.new_client, "country")}/>
      </div><p className="flex items-center gap-2 text-xs text-slate-600"><Info size={15}/>Unknown client contacts stay blank. Your applicant contact details are not copied.</p></section>}
      <section className="space-y-3 border-t pt-4"><h3 className="text-sm font-medium">Project details</h3><div className="grid gap-4 sm:grid-cols-2">
        <Field label="Project title" name="title" required maxLength={200} value={project.title} onChange={changeProject} error={fieldError(errors.project, "title")}/><ChoiceField label="Project state" name="state" required value={project.state} onChange={changeProject} options={states} error={fieldError(errors.project, "state")}/>
        <ProjectCurrencyField value={project.currency} onChange={changeProject} error={fieldError(errors.project, "currency")}/><Field label="Agreed fee (optional)" name="quoted_amount" type="money" value={project.quoted_amount} onChange={changeProject} error={fieldError(errors.project, "quoted_amount")}/>
        <Field label="Start date (optional)" name="started_on" type="date" value={project.started_on} onChange={changeProject} error={fieldError(errors.project, "started_on")}/><Field label="Target date (optional)" name="target_on" type="date" value={project.target_on} onChange={changeProject} error={fieldError(errors.project, "target_on")}/>
        <div className="sm:col-span-2"><Field label="Project summary" name="summary" textarea className="min-h-40 resize-none bg-white" maxLength={30000} value={project.summary} onChange={changeProject} error={fieldError(errors.project, "summary")}/></div><div className="sm:col-span-2"><Field label="Project notes / source" name="notes" textarea className="resize-none bg-white" maxLength={8000} value={project.notes} onChange={changeProject} error={fieldError(errors.project, "notes")}/></div>
      </div></section>
    </fieldset>
  </FormModalShell>;
}
