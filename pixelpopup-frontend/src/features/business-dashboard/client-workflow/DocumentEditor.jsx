import { useEffect, useState } from "react";
import { AlertTriangle, Save } from "lucide-react";
import { Button } from "../../personal-dashboard/ui/button";
import { workflowApi } from "./api";
import { DocumentActions, Field, Panel, StatusNotice } from "./shared";

export default function DocumentEditor({ document, resource, csrf, onSaved, onDirtyChange }) {
  const [draft, setDraft] = useState({ title: document.title, body: document.body });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => { setDraft({ title: document.title, body: document.body }); setError(""); setMessage(""); }, [document.id]);
  const dirty = draft.title !== document.title || draft.body !== document.body;
  useEffect(() => { onDirtyChange?.(dirty); return () => onDirtyChange?.(false); }, [dirty, onDirtyChange]);
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (event) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const placeholders = /\{\{[^}]+\}\}/.test(draft.body);
  const agreement = document.kind === "agreement";
  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    try { const saved = await workflowApi(`${resource}/${document.id}/`, { method: "PATCH", body: draft }, csrf); onSaved(saved); setMessage("Draft saved."); }
    catch (cause) { setError(cause.message); }
    finally { setSaving(false); }
  };
  return <Panel title={document.title} description={resource === "templates" ? "Master template · edits affect future projects only." : "Project-specific copy · edits do not change your master template."} action={<DocumentActions title={draft.title} body={draft.body} onMessage={setMessage} requiresReview={placeholders} agreement={agreement}/> }>
    {agreement && <p className="mb-4 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"><AlertTriangle size={17} className="mt-0.5 shrink-0"/>Draft for professional review. Verify terms, local law, and signatures before sharing.</p>}
    {placeholders && <p className="mb-4 text-sm text-amber-800">Unfilled placeholders remain. Review them before copying or printing.</p>}
    <form onSubmit={save} className="space-y-4"><Field label="Document title" name="title" value={draft.title} onChange={(name, value) => setDraft({ ...draft, [name]: value })} required maxLength={160}/><Field label="Document body" name="body" value={draft.body} onChange={(name, value) => setDraft({ ...draft, [name]: value })} textarea rows={22} required className="min-h-[30rem] w-full bg-white font-mono text-sm leading-6"/><StatusNotice error={error} success={message}/><div className="flex items-center justify-between gap-3"><span className="text-xs text-slate-500">{dirty ? "Unsaved changes" : `Saved · ${new Date(document.updated_at).toLocaleString()}`}</span><Button type="submit" disabled={!dirty || saving}><Save size={16}/>{saving ? "Saving…" : "Save draft"}</Button></div></form>
  </Panel>;
}
