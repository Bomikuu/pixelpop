import { AlertCircle, Check, Copy, FileText, Printer } from "lucide-react";
import { Button } from "../../personal-dashboard/ui/button";
import { Input } from "../../personal-dashboard/ui/input";
import { Textarea } from "../../personal-dashboard/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../personal-dashboard/ui/select";

export const STAGES = [
  ["inquiry", "Inquiry"], ["discovery", "Discovery"], ["recap", "Recap"],
  ["proposal", "Proposal"], ["agreement", "Agreement & deposit"],
  ["access", "Access & kickoff"], ["build", "Build & review"],
  ["handover", "Handover"], ["support", "Support & close"],
];

export const STAGE_DOCUMENT = {
  discovery: "discovery", recap: "recap", proposal: "proposal", agreement: "agreement",
  access: "access", build: "update", handover: "handover",
};

export function Field({ label, name, value, onChange, textarea = false, type = "text", required = false, ...rest }) {
  const id = `client-workflow-${name}`;
  const Control = textarea ? Textarea : Input;
  return <div className="min-w-0"><label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-800">{label}</label><Control id={id} name={name} type={textarea ? undefined : type} value={value ?? ""} onChange={(event) => onChange(name, event.target.value)} required={required} className="w-full bg-white" {...rest}/></div>;
}

export function ChoiceField({ label, name, value, onChange, options }) {
  return <div className="min-w-0"><label htmlFor={`client-workflow-${name}`} className="mb-1.5 block text-sm font-medium text-slate-800">{label}</label><Select value={value} onValueChange={(next) => onChange(name, next)}><SelectTrigger id={`client-workflow-${name}`} className="w-full bg-white"><SelectValue/></SelectTrigger><SelectContent>{options.map(([key, text]) => <SelectItem key={key} value={key}>{text}</SelectItem>)}</SelectContent></Select></div>;
}

export function StatusNotice({ error, success }) {
  if (error) return <p role="alert" className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800"><AlertCircle size={17} className="mt-0.5 shrink-0"/>{error}</p>;
  if (success) return <p role="status" className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"><Check size={17}/>{success}</p>;
  return null;
}

export function EmptyState({ icon: Icon = FileText, title, description }) {
  return <div className="grid min-h-44 place-content-center justify-items-center gap-2 rounded-lg border border-dashed border-slate-200 bg-white px-6 py-8 text-center"><span className="grid size-10 place-items-center rounded-full bg-slate-100 text-slate-500"><Icon size={20}/></span><h3 className="text-sm font-semibold text-slate-900">{title}</h3><p className="max-w-md text-sm text-slate-500">{description}</p></div>;
}

export function Panel({ title, description, action, children, className = "" }) {
  return <section className={`rounded-lg border border-slate-200 bg-white p-4 sm:p-5 ${className}`}><div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-base font-semibold text-slate-950">{title}</h2>{description && <p className="mt-1 text-sm text-slate-500">{description}</p>}</div>{action}</div>{children}</section>;
}

export async function copyDocument(text, setMessage) {
  try { await navigator.clipboard.writeText(text); setMessage("Copied to clipboard."); }
  catch { setMessage("Clipboard unavailable. Select and copy the text manually."); }
}

export function DocumentActions({ title, body, onMessage, requiresReview = false, agreement = false }) {
  const confirmReview = () => !requiresReview || window.confirm(agreement ? "This agreement draft has unfilled placeholders and needs professional review. Continue with this draft?" : "This draft has unfilled placeholders. Continue with this draft?");
  return <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" size="sm" onClick={() => { if (confirmReview()) copyDocument(`${title}\n\n${body}`, onMessage); }}><Copy size={15}/>Copy</Button><Button type="button" variant="outline" size="sm" onClick={() => {
    if (!confirmReview()) return;
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) { onMessage("Allow pop-ups to print this draft."); return; }
    win.opener = null;
    const escape = (value) => String(value).replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" })[char]);
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escape(title)}</title><style>body{font:16px/1.6 system-ui;margin:40px auto;max-width:780px;padding:0 20px;color:#111827}pre{font:inherit;white-space:pre-wrap}small{color:#6b7280}</style></head><body><h1>${escape(title)}</h1>${title.toLowerCase().includes("agreement") ? "<small>Draft for professional review. Confirm terms and applicable law before use.</small>" : ""}<pre>${escape(body)}</pre></body></html>`);
    win.document.close();
    win.focus();
    win.print();
  }}><Printer size={15}/>Print / PDF</Button></div>;
}
