import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Eye, EyeOff, FileText, Info, Save } from "lucide-react";
import { Button } from "../../personal-dashboard/ui/button";
import { workflowApi } from "./api";
import DocumentPage from "./DocumentPage";
import DocumentSharing from "./DocumentSharing";
import MarkdownEditor from "./MarkdownEditor";
import { DocumentActions, Field, Panel, StatusNotice } from "./shared";

function suggestedDraft(document, project, client) {
  const amount = project?.quoted_amount;
  const targetDate = project?.target_on;
  const values = {
    client_name: client?.name || project?.client_name,
    contact_name: client?.contact_name,
    client_notice_email: client?.email,
    project_title: project?.title,
    currency: project?.currency,
    project_price: amount != null && amount !== "" ? Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "",
    project_fee: amount != null && amount !== "" ? Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "",
    target_date: targetDate ? new Date(`${targetDate}T12:00:00`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "",
    governing_law: project?.governing_law,
  };
  let filledCount = 0;
  const body = project ? document.body.replace(/\{\{([a-z_]+)\}\}/g, (placeholder, key) => {
    const value = values[key];
    if (!value) return placeholder;
    filledCount += 1;
    return value;
  }) : document.body;
  return { draft: { title: document.title, body }, filledCount };
}

const defaultPreviewOpen = () => typeof window === "undefined" || window.matchMedia("(min-width: 1280px)").matches;

export default function DocumentEditor({ document, project, client, resource, csrf, onSaved, onDirtyChange }) {
  const [draft, setDraft] = useState(() => suggestedDraft(document, project, client).draft);
  const [prefilledCount, setPrefilledCount] = useState(() => suggestedDraft(document, project, client).filledCount);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [previewOpen, setPreviewOpen] = useState(defaultPreviewOpen);
  const pageRef = useRef(null);
  useEffect(() => {
    const suggested = suggestedDraft(document, project, client);
    setDraft(suggested.draft); setPrefilledCount(suggested.filledCount);
    setError(""); setMessage(""); setPreviewOpen(defaultPreviewOpen());
  }, [document.id]);
  const dirty = draft.title !== document.title || draft.body !== document.body;
  useEffect(() => { onDirtyChange?.(dirty); return () => onDirtyChange?.(false); }, [dirty, onDirtyChange]);
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (event) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const placeholders = /\{\{[^}]+\}\}/.test(`${draft.title}\n${draft.body}`);
  const agreement = document.kind === "agreement";
  const fullExampleAvailable = ["agreement", "proposal"].includes(document.kind) && document.starter_body && draft.body !== document.starter_body;
  const loadExample = () => {
    if (!window.confirm("Replace this draft with the complete example? Your saved document will not change until you select Save draft.")) return;
    const suggested = suggestedDraft({ title: document.starter_title, body: document.starter_body }, project, client);
    setDraft(suggested.draft); setPrefilledCount(suggested.filledCount);
    setPreviewOpen(true);
    setMessage("Complete example loaded. Review and save it when ready.");
  };
  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    try { const saved = await workflowApi(`${resource}/${document.id}/`, { method: "PATCH", body: draft }, csrf); onSaved(saved); setPrefilledCount(0); setMessage("Draft saved."); }
    catch (cause) { setError(cause.message); }
    finally { setSaving(false); }
  };
  return <Panel title={document.title} description={resource === "templates" ? "Master template · edits affect future projects only." : "Project-specific copy · edits do not change your master template."} action={<DocumentActions title={draft.title} body={draft.body} pageRef={pageRef} onMessage={setMessage} requiresReview={placeholders} agreement={agreement}/> }>
    {agreement && <p className="mb-4 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"><AlertTriangle size={17} className="mt-0.5 shrink-0"/>Draft for professional review. Verify terms, local law, and signatures before sharing.</p>}
    {prefilledCount > 0 && <p role="status" className="mb-4 flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900"><Info size={17} className="mt-0.5 shrink-0"/>{prefilledCount} known {prefilledCount === 1 ? "detail was" : "details were"} suggested from the saved client and project. You can change any of them; review and save this draft before sharing.</p>}
    {placeholders && <p className="mb-4 text-sm text-amber-800">Unfilled placeholders remain. Review them before copying or printing.</p>}
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-slate-600">Select text and use the toolbar to format it. The Markdown stays editable, with a formatted preview alongside it.</p>
      <div className="flex flex-wrap items-center gap-2">
        {fullExampleAvailable && <Button type="button" variant="outline" size="sm" onClick={loadExample}><FileText size={15}/>Use full example</Button>}
        <Button type="button" variant="outline" size="sm" aria-expanded={previewOpen} aria-controls={`document-preview-${document.id}`} onClick={() => setPreviewOpen((open) => !open)}>{previewOpen ? <EyeOff size={15}/> : <Eye size={15}/>} {previewOpen ? "Hide preview" : "Show preview"}</Button>
      </div>
    </div>
    {(error || message) && <div className="mb-4"><StatusNotice error={error} success={message}/></div>}
    <div className={`grid min-w-0 gap-5 ${previewOpen ? "xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]" : "xl:grid-cols-1"}`}>
      <form onSubmit={save} className="min-w-0 space-y-4"><Field label="Document title" name="title" value={draft.title} onChange={(name, value) => setDraft({ ...draft, [name]: value })} required maxLength={160}/><MarkdownEditor id={`document-body-${document.id}`} value={draft.body} onChange={(body) => setDraft((current) => ({ ...current, body }))}/><div className="flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-slate-500">{dirty ? "Unsaved changes" : `Saved · ${new Date(document.updated_at).toLocaleString()}`}</span><Button type="submit" disabled={!dirty || saving}><Save size={16}/>{saving ? "Saving…" : "Save draft"}</Button></div></form>
      <section id={`document-preview-${document.id}`} aria-label="Live document preview" className={`min-w-0 overflow-hidden border border-slate-200 bg-slate-100/70 p-2 sm:p-4 ${previewOpen ? "block" : "hidden"}`}><DocumentPage body={draft.body} pageRef={pageRef}/></section>
    </div>
    {resource === "documents" && <DocumentSharing document={document} csrf={csrf} dirty={dirty} onSaved={onSaved}/>}
  </Panel>;
}
