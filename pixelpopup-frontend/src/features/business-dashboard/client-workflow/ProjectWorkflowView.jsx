import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, FileText, ListChecks, Pencil, Save } from "lucide-react";
import { Button } from "../../personal-dashboard/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../personal-dashboard/ui/dialog";
import { workflowApi, workflowRecords } from "./api";
import DocumentEditor from "./DocumentEditor";
import ProjectProgress from "./ProjectProgress";
import ProjectRecords from "./ProjectRecords";
import { ChoiceField, EmptyState, Field, Panel, STAGE_DOCUMENT, STAGES, StatusNotice } from "./shared";

const projectStates = [["lead", "Lead"], ["active", "Active"], ["on_hold", "On hold"], ["completed", "Completed"], ["cancelled", "Cancelled"]];

export default function ProjectWorkflowView({ clientId, projectId, csrf, navigate, onDirtyChange }) {
  const [project, setProject] = useState(null);
  const [stages, setStages] = useState([]);
  const [items, setItems] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [changes, setChanges] = useState([]);
  const [selectedStage, setSelectedStage] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [documentDirty, setDocumentDirty] = useState(false);
  const reportDirty = useCallback((value) => { setDocumentDirty(value); onDirtyChange?.(value); }, [onDirtyChange]);
  const load = async () => {
    setLoading(true); setError(""); setProject(null);
    try {
      const [record, stageData, itemData, docData, milestoneData, changeData] = await Promise.all([
        workflowApi(`projects/${projectId}/`, {}, csrf), workflowRecords("stages", { project: projectId }, csrf),
        workflowRecords("checklist-items", { project: projectId }, csrf), workflowRecords("documents", { project: projectId }, csrf),
        workflowRecords("payment-milestones", { project: projectId }, csrf), workflowRecords("change-requests", { project: projectId }, csrf),
      ]);
      if (record.client !== Number(clientId)) { setError("Project not found for this client."); return; }
      setProject(record); setStages(stageData); setItems(itemData); setDocuments(docData); setMilestones(milestoneData); setChanges(changeData);
      setSelectedStage((old) => old || record.current_stage);
    } catch (cause) { setError(cause.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [projectId, clientId, csrf]);
  const patchProject = async (event) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const body = { ...editing, quoted_amount: editing.quoted_amount || null, started_on: editing.started_on || null, target_on: editing.target_on || null, support_starts_on: editing.support_starts_on || null, support_ends_on: editing.support_ends_on || null };
      setProject(await workflowApi(`projects/${project.id}/`, { method: "PATCH", body }, csrf)); setEditing(null);
    } catch (cause) { setError(cause.message); }
    finally { setSaving(false); }
  };
  if (loading && !project) return <p className="text-sm text-slate-500">Loading project workflow…</p>;
  if (!project) return <StatusNotice error={error || "Project not found."}/>;
  const activeKey = selectedStage || project.current_stage;
  const stage = stages.find((item) => item.key === activeKey);
  const stageItems = items.filter((item) => item.stage === stage?.id);
  const current = stages.find((item) => item.key === project.current_stage);
  const nextAction = items.find((item) => item.stage === current?.id && !item.is_completed);
  const stageDocument = documents.find((item) => item.kind === STAGE_DOCUMENT[activeKey]);
  const activeDocument = documents.find((item) => item.id === selectedDocument) || stageDocument;
  const saveRecord = (type, record) => {
    const update = (old) => old.some((item) => item.id === record.id) ? old.map((item) => item.id === record.id ? record : item) : [...old, record];
    if (type === "milestones") setMilestones(update); else setChanges(update);
  };
  return <div className="space-y-5"><Panel title={project.title} description={<>{project.client_name} · {project.summary || "No request summary recorded"}</>} action={<div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => navigate(`clients/${clientId}`)}><ArrowLeft size={15}/>View client</Button><Button variant="outline" onClick={() => { setError(""); setEditing({ ...project }); }}><Pencil size={15}/>Edit project</Button></div>}>
    <div className="flex flex-wrap gap-2 text-xs"><span className="rounded border border-blue-200 bg-blue-50 px-2 py-1 text-blue-800">{project.state.replaceAll("_", " ")}</span><span className="rounded border border-slate-200 px-2 py-1 text-slate-700">Current: {STAGES.find(([key]) => key === project.current_stage)?.[1]}</span>{project.target_on && <span className="rounded border border-slate-200 px-2 py-1 text-slate-700">Target: {project.target_on}</span>}</div>
    {nextAction ? <button type="button" onClick={() => { setSelectedStage(project.current_stage); requestAnimationFrame(() => window.document.getElementById(`action-${nextAction.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })); }} className="group mt-4 flex w-full items-start gap-3 rounded-md border border-blue-100 bg-blue-50 p-3 text-left hover:border-blue-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"><ListChecks size={18} className="mt-0.5 shrink-0 text-blue-700"/><span className="min-w-0 flex-1"><strong className="block text-sm text-blue-900">Next action</strong><span className="text-sm text-slate-700">{nextAction.label}</span></span><ArrowRight size={16} className="shrink-0 text-blue-600 transition-transform group-hover:translate-x-1"/></button> : <p className="mt-4 rounded-md border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-900">No unchecked actions in the current stage. Choose another stage or add a project-specific action.</p>}
  </Panel><div className="grid gap-5 xl:grid-cols-[210px_minmax(0,1fr)]"><Panel title="Workflow stages" className="h-fit" ><nav aria-label="Project stages" className="flex flex-wrap gap-2 xl:flex-col">{STAGES.map(([key, label]) => { const record = stages.find((item) => item.key === key); const count = items.filter((item) => item.stage === record?.id && item.is_completed).length; const total = items.filter((item) => item.stage === record?.id).length; return <button type="button" key={key} onClick={() => { if (!documentDirty || window.confirm("Discard unsaved document changes?")) { setSelectedStage(key); setSelectedDocument(null); } }} aria-current={activeKey === key ? "step" : undefined} className={`rounded-md border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${activeKey === key ? "border-blue-300 bg-blue-50 text-blue-900" : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50"}`}><span className="block font-medium">{label}</span><span className="text-xs opacity-70">{count}/{total} · {record?.status.replaceAll("_", " ")}</span></button>; })}</nav></Panel><div className="min-w-0 space-y-5"><ProjectProgress key={stage?.id} project={project} stage={stage} items={stageItems} csrf={csrf} onStage={(saved) => setStages((old) => old.map((item) => item.id === saved.id ? saved : item))} onItem={(saved) => setItems((old) => old.some((item) => item.id === saved.id) ? old.map((item) => item.id === saved.id ? saved : item) : [...old, saved])} onProject={setProject}/><Panel title="Project documents" description="Choose a draft to edit, copy, or print. Each draft is independent of the master template."><div className="flex flex-wrap gap-2">{documents.map((item) => <Button type="button" size="sm" key={item.id} variant={activeDocument?.id === item.id ? "secondary" : "outline"} onClick={() => { if (!documentDirty || window.confirm("Discard unsaved document changes?")) setSelectedDocument(item.id); }}><FileText size={14}/>{item.title}</Button>)}</div></Panel>{activeDocument ? <DocumentEditor key={activeDocument.id} document={activeDocument} resource="documents" csrf={csrf} onDirtyChange={reportDirty} onSaved={(saved) => setDocuments((old) => old.map((item) => item.id === saved.id ? saved : item))}/> : <EmptyState icon={FileText} title="No draft for this stage" description="Choose another project document above."/>}</div></div><ProjectRecords project={project} milestones={milestones} changes={changes} csrf={csrf} onSaved={saveRecord}/>
    <Dialog open={Boolean(editing)} onOpenChange={(open) => { if (!open && !saving) setEditing(null); }}><DialogContent className="personal-dashboard max-h-[90vh] overflow-y-auto sm:max-w-3xl"><DialogHeader><DialogTitle>Edit project</DialogTitle><DialogDescription>Project terms are recorded for context. Editing them does not change your saved document drafts automatically.</DialogDescription></DialogHeader>{editing && <form onSubmit={patchProject} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><Field label="Project title" name="title" required value={editing.title} onChange={(name, value) => setEditing({ ...editing, [name]: value })}/><ChoiceField label="Project state" name="state" value={editing.state} onChange={(name, value) => setEditing({ ...editing, [name]: value })} options={projectStates}/><Field label="Client country" name="country" value={editing.country} onChange={(name, value) => setEditing({ ...editing, [name]: value })}/><Field label="Currency" name="currency" value={editing.currency} onChange={(name, value) => setEditing({ ...editing, [name]: value })} maxLength={3}/><Field label="Intended governing law" name="governing_law" value={editing.governing_law} onChange={(name, value) => setEditing({ ...editing, [name]: value })}/><Field label="Quoted amount" name="quoted_amount" type="number" min="0" step="0.01" value={editing.quoted_amount} onChange={(name, value) => setEditing({ ...editing, [name]: value })}/>{[["started_on", "Start date"], ["target_on", "Target date"], ["support_starts_on", "Support starts"], ["support_ends_on", "Support ends"]].map(([name, label]) => <Field key={name} label={label} name={name} type="date" value={editing[name]} onChange={(field, value) => setEditing({ ...editing, [field]: value })}/>)}</div><Field label="Request summary" name="summary" textarea rows={3} value={editing.summary} onChange={(name, value) => setEditing({ ...editing, [name]: value })}/><Field label="Private notes" name="notes" textarea rows={3} value={editing.notes} onChange={(name, value) => setEditing({ ...editing, [name]: value })}/><StatusNotice error={error}/><DialogFooter><Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button type="submit" disabled={saving}><Save size={15}/>{saving ? "Saving…" : "Save project"}</Button></DialogFooter></form>}</DialogContent></Dialog>
  </div>;
}
