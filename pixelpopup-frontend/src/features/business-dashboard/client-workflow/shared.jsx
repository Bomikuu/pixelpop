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

export function Field({ label, name, value, onChange, textarea = false, type = "text", required = false, error, ...rest }) {
  const id = `client-workflow-${name}`;
  const Control = textarea ? Textarea : Input;
  const money = type === "money";
  const signed = money && name === "price_impact";
  const update = (event) => {
    const next = event.target.value;
    if (money && !(signed ? /^-?(?:\d+)?(?:\.\d{0,2})?$/ : /^(?:\d+)?(?:\.\d{0,2})?$/).test(next)) return;
    onChange(name, next, event);
  };
  return <div className="min-w-0"><label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-800">{label}{required && <><span aria-hidden="true" className="ml-1 text-rose-700">*</span><span className="sr-only"> required</span></>}</label><Control id={id} name={name} type={textarea || money ? "text" : type} inputMode={money ? "decimal" : undefined} pattern={money ? signed ? "-?[0-9]+(\\.[0-9]{1,2})?" : "[0-9]+(\\.[0-9]{1,2})?" : undefined} title={money ? "Enter an amount using digits and up to two decimal places." : undefined} value={value ?? ""} onChange={update} required={required} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} className="w-full bg-white" {...rest}/>{error && <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-rose-700">{error}</p>}</div>;
}

export function ChoiceField({ label, name, value, onChange, options, required = false, error }) {
  const id = `client-workflow-${name}`;
  return <div className="min-w-0"><label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-800">{label}{required && <><span aria-hidden="true" className="ml-1 text-rose-700">*</span><span className="sr-only"> required</span></>}</label><Select value={value} onValueChange={(next) => onChange(name, next)}><SelectTrigger id={id} aria-required={required} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} className="w-full bg-white"><SelectValue/></SelectTrigger><SelectContent>{options.map(([key, text]) => <SelectItem key={key} value={key}>{text}</SelectItem>)}</SelectContent></Select>{error && <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-rose-700">{error}</p>}</div>;
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

export function DocumentActions({ title, body, pageRef, onMessage, requiresReview = false, agreement = false }) {
  const confirmReview = () => !requiresReview || window.confirm(agreement ? "This agreement draft has unfilled placeholders and needs professional review. Continue with this draft?" : "This draft has unfilled placeholders. Continue with this draft?");
  return <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" size="sm" onClick={() => { if (confirmReview()) copyDocument(`${title}\n\n${body}`, onMessage); }}><Copy size={15}/>Copy</Button><Button type="button" variant="outline" size="sm" onClick={() => {
    if (!confirmReview()) return;
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) { onMessage("Allow pop-ups to print this draft."); return; }
    win.opener = null;
    const escape = (value) => String(value).replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" })[char]);
    const content = pageRef?.current?.innerHTML || `<pre>${escape(body)}</pre>`;
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escape(title)}</title><style>
      @page { size: A4; margin: 20mm 18mm; @bottom-right { content: "Page " counter(page) " of " counter(pages); font: 9pt Arial, Helvetica, sans-serif; color: #555; } }
      * { box-sizing: border-box; }
      body { margin: 0; color: #111; background: #fff; font: 11pt/1.55 Arial, Helvetica, sans-serif; }
      .workflow-document { max-width: 100%; }
      h1 { margin: 0 0 28px; border-bottom: 3px solid #111; padding: 0 0 12px; text-align: center; text-transform: uppercase; font-size: 18pt; line-height: 1.2; }
      h2 { margin: 28px 0 8px; font-size: 11pt; text-transform: uppercase; break-after: avoid; }
      h3 { margin: 18px 0 7px; font-size: 11pt; break-after: avoid; }
      p { margin: 0 0 13px; white-space: pre-line; }
      ul, ol { margin: 0 0 16px; padding-left: 25px; }
      li { margin-bottom: 4px; }
      table { width: 100%; border-collapse: collapse; margin: 0 0 18px; font-size: 10pt; text-align: left; }
      th, td { padding: 7px 9px; border-bottom: 1px solid #d1d5db; vertical-align: top; }
      th { border-bottom-color: #333; }
      hr { border: 0; border-top: 1px solid #aaa; margin: 24px 0; }
      pre { white-space: pre-wrap; font: inherit; }
      code { font-family: monospace; font-size: 0.9em; }
      tr, blockquote { break-inside: avoid; }
    </style></head><body><article class="workflow-document">${content}</article></body></html>`);
    win.document.close();
    win.focus();
    win.print();
  }}><Printer size={15}/>Print / PDF</Button></div>;
}
