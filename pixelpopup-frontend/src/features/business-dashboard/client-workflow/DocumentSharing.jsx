import { useState } from "react";
import { Copy, Download, Link2, RefreshCw, Share2, X } from "lucide-react";
import { Button } from "../../personal-dashboard/ui/button";
import { workflowApi } from "./api";
import { ChoiceField, StatusNotice } from "./shared";

const expiryOptions = [["7", "7 days"], ["30", "30 days"], ["never", "No expiry"]];

export default function DocumentSharing({ document, csrf, dirty, onSaved }) {
  const [expiry, setExpiry] = useState("30");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const link = document.share_token ? `${window.location.origin}/documents/share/${document.share_token}` : "";
  const hasPlaceholders = /\{\{[^{}]*\}\}/.test(`${document.title}\n${document.body}`);
  const canPublish = !dirty && !busy && !hasPlaceholders && Boolean(document.title.trim() && document.body.trim());
  const update = async (kind) => {
    if (kind === "publish" && document.share_token && !window.confirm("Republish this saved document? The old link will stop working.")) return;
    if (kind === "revoke" && !window.confirm("Revoke this link? Anyone using it will lose access.")) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const saved = await workflowApi(`documents/${document.id}/${kind}/`, { method: "POST", ...(kind === "publish" ? { body: { expiry } } : {}) }, csrf);
      onSaved(saved);
      setMessage(kind === "publish" ? "Saved snapshot published. Copy the new link to share it." : "Public link revoked.");
    } catch (cause) { setError(cause.message); }
    finally { setBusy(false); }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setMessage("Public link copied."); setError(""); }
    catch { setError("Clipboard unavailable. Select and copy the link below."); }
  };
  return <section aria-label="Document sharing" className="mt-5 border-t border-slate-200 pt-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-sm font-semibold text-slate-950">Share a read-only copy</h3><p className="mt-1 max-w-2xl text-sm text-slate-600">Publish a snapshot of the saved draft. Later edits stay private until you republish. Recipients can view, print, or download a Word copy. You can also upload the Word file to Google Drive.</p></div><a href={`/api/v1/client-workflow/documents/${document.id}/docx/`} className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"><Download size={15}/>Download saved Word</a></div>
    <div className="mt-4 flex flex-wrap items-end gap-3"><div className="w-44"><ChoiceField label="Link expiry" name="expiry" value={expiry} onChange={(_, value) => setExpiry(value)} options={expiryOptions}/></div><Button type="button" disabled={!canPublish} onClick={() => update("publish")}>{document.share_token ? <RefreshCw size={15}/> : <Share2 size={15}/>} {busy ? "Working…" : document.share_token ? "Republish" : "Publish link"}</Button>{document.share_token && <Button type="button" variant="outline" disabled={busy} onClick={() => update("revoke")}><X size={15}/>Revoke</Button>}</div>
    {dirty && <p className="mt-2 text-xs text-amber-800">Save your changes before publishing.</p>}
    {!dirty && hasPlaceholders && <p className="mt-2 text-xs text-amber-800">Replace all document placeholders before publishing.</p>}
    {document.share_token && <div className="mt-4 flex flex-wrap items-end gap-2"><div className="min-w-0 flex-1"><label htmlFor={`document-share-${document.id}`} className="mb-1 block text-xs font-medium text-slate-700">{document.is_share_active ? "Active public link" : "Expired public link"}</label><input id={`document-share-${document.id}`} className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700" value={link} readOnly onFocus={(event) => event.target.select()}/></div><Button type="button" variant="outline" disabled={!document.is_share_active} onClick={copy}><Copy size={15}/>Copy link</Button>{document.is_share_active && <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"><Link2 size={15}/>Open</a>}</div>}
    {document.published_at && <p className="mt-2 text-xs text-slate-500">Published {new Date(document.published_at).toLocaleString()}{document.share_expires_at ? ` · Expires ${new Date(document.share_expires_at).toLocaleString()}` : " · No expiry"}</p>}
    {(error || message) && <div className="mt-3"><StatusNotice error={error} success={message}/></div>}
  </section>;
}
