import { useState } from "react";
import { Check, Circle, ListChecks, Pencil, Plus, Save } from "lucide-react";
import { Button } from "../../personal-dashboard/ui/button";
import { Input } from "../../personal-dashboard/ui/input";
import { Textarea } from "../../personal-dashboard/ui/textarea";
import { workflowApi } from "./api";
import { ChoiceField, EmptyState, Panel, STAGES, StatusNotice } from "./shared";

const statusOptions = [["not_started", "Not started"], ["in_progress", "In progress"], ["waiting_on_client", "Waiting on client"], ["complete", "Complete"]];

export default function ProjectProgress({ project, stage, items, csrf, onStage, onItem, onProject }) {
  const [notes, setNotes] = useState(stage?.notes || "");
  const [newItem, setNewItem] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  if (!stage) return <EmptyState icon={ListChecks} title="Stage unavailable" description="Reload the project to see its workflow stages."/>;
  const updateStage = async (body) => {
    setBusy(true); setError(""); setMessage("");
    try { const saved = await workflowApi(`stages/${stage.id}/`, { method: "PATCH", body }, csrf); onStage(saved); setMessage("Stage updated."); }
    catch (cause) { setError(cause.message); }
    finally { setBusy(false); }
  };
  const toggle = async (item) => {
    setError("");
    try { onItem(await workflowApi(`checklist-items/${item.id}/`, { method: "PATCH", body: { is_completed: !item.is_completed } }, csrf)); }
    catch (cause) { setError(cause.message); }
  };
  const addItem = async (event) => {
    event.preventDefault(); if (!newItem.trim()) return; setBusy(true); setError("");
    try { onItem(await workflowApi("checklist-items/", { method: "POST", body: { stage: stage.id, label: newItem.trim(), position: items.length } }, csrf)); setNewItem(""); }
    catch (cause) { setError(cause.message); }
    finally { setBusy(false); }
  };
  const saveItem = async (event) => {
    event.preventDefault(); if (!editingItem?.label.trim()) return; setBusy(true); setError("");
    try { onItem(await workflowApi(`checklist-items/${editingItem.id}/`, { method: "PATCH", body: { label: editingItem.label.trim() } }, csrf)); setEditingItem(null); }
    catch (cause) { setError(cause.message); }
    finally { setBusy(false); }
  };
  return <Panel title={STAGES.find(([key]) => key === stage.key)?.[1] || stage.key} description={`${items.filter((item) => item.is_completed).length} of ${items.length} actions complete`} action={<div className="w-full sm:w-44"><ChoiceField label="Stage status" name="status" value={stage.status} onChange={(_, value) => updateStage({ status: value })} options={statusOptions}/></div>}>
    <ul className="divide-y divide-slate-100">{items.map((item) => <li key={item.id} id={`action-${item.id}`} className="flex items-start gap-3 py-3"><button type="button" aria-label={`${item.is_completed ? "Mark incomplete" : "Complete"}: ${item.label}`} aria-pressed={item.is_completed} onClick={() => toggle(item)} className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${item.is_completed ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-300 bg-white text-slate-400 hover:border-blue-400 hover:text-blue-700"}`}>{item.is_completed ? <Check size={15}/> : <Circle size={14}/>}</button>{editingItem?.id === item.id ? <form onSubmit={saveItem} className="flex min-w-0 flex-1 flex-wrap gap-2"><label htmlFor={`edit-action-${item.id}`} className="sr-only">Edit action</label><Input id={`edit-action-${item.id}`} value={editingItem.label} onChange={(event) => setEditingItem({ ...editingItem, label: event.target.value })} maxLength={300} className="min-w-40 flex-1 bg-white"/><Button size="sm" type="submit" disabled={busy || !editingItem.label.trim()}><Save size={14}/>Save</Button><Button size="sm" type="button" variant="outline" onClick={() => setEditingItem(null)}>Cancel</Button></form> : <><span className={`min-w-0 flex-1 pt-1 text-sm ${item.is_completed ? "text-slate-500 line-through" : "text-slate-800"}`}>{item.label}</span><Button type="button" size="icon-sm" variant="ghost" onClick={() => setEditingItem({ id: item.id, label: item.label })} aria-label={`Edit ${item.label}`}><Pencil size={14}/></Button></>}</li>)}</ul>
    <form onSubmit={addItem} className="mt-3 flex flex-wrap gap-2"><label htmlFor="new-stage-action" className="sr-only">New checklist action</label><Input id="new-stage-action" value={newItem} onChange={(event) => setNewItem(event.target.value)} placeholder="Add a project-specific action" maxLength={300} className="min-w-44 flex-1 bg-white"/><Button type="submit" variant="outline" disabled={busy || !newItem.trim()}><Plus size={15}/>Add action</Button></form>
    <div className="mt-5 border-t pt-4"><label htmlFor="stage-notes" className="mb-1.5 block text-sm font-medium text-slate-800">Stage notes</label><Textarea id="stage-notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} className="w-full bg-white" placeholder="Decisions, blockers, and follow-up notes"/><div className="mt-2 flex justify-end"><Button type="button" variant="outline" disabled={busy || notes === stage.notes} onClick={() => updateStage({ notes })}><Save size={15}/>Save notes</Button></div></div>
    {project.current_stage !== stage.key && <Button type="button" variant="outline" className="mt-4" onClick={async () => { try { onProject(await workflowApi(`projects/${project.id}/`, { method: "PATCH", body: { current_stage: stage.key } }, csrf)); setMessage("Current stage changed."); } catch (cause) { setError(cause.message); } }}><ListChecks size={15}/>Set as current stage</Button>}
    <div className="mt-3"><StatusNotice error={error} success={message}/></div>
  </Panel>;
}
