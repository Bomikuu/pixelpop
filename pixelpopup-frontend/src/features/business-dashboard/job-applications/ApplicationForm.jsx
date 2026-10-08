import { useState } from "react";
import { AlertCircle, CheckCircle2, Download, Info } from "lucide-react";
import { Button } from "../../personal-dashboard/ui/button";
import FormField from "../../personal-dashboard/components/forms/FormField";
import FormModalShell from "../../personal-dashboard/components/forms/FormModalShell";
import { jobApi, fieldError, statuses } from "./api";
import PostingHighlights from "./PostingHighlights";

export default function ApplicationForm({ record, onCancel, onSaved, notify }) {
  const initial = record ? { ...record, questions: record.questions.join("\n"), applied_on: record.applied_on || "", follow_up_on: record.follow_up_on || "" } : { url: "", role: "", company: "", platform: "", posting: "", questions: "", status: "draft", applied_on: "", follow_up_on: "" };
  const [draft, setDraft] = useState(initial), [busy, setBusy] = useState(false), [importing, setImporting] = useState(false), [error, setError] = useState(""), [errors, setErrors] = useState({}), [importMessage, setImportMessage] = useState("");
  const [importSucceeded, setImportSucceeded] = useState(null);
  const ImportIcon = importSucceeded === false ? AlertCircle : importSucceeded === true ? CheckCircle2 : Info;
  const set = (name, value) => { setDraft((previous) => ({ ...previous, [name]: value })); setErrors((previous) => ({ ...previous, [name]: null })); setError(""); if (name === "url") { setImportMessage(""); setImportSucceeded(null); } };
  async function importPosting() {
    if (draft.posting.trim()) { setImportSucceeded(null); setImportMessage("The posting already has text. Clear it first if you want to replace it with an import."); return; }
    setImporting(true); setError(""); setImportMessage(""); setImportSucceeded(null);
    try {
      const result = await jobApi("import-posting/", { method: "POST", body: { url: draft.url } });
      setImportMessage(result.message);
      setImportSucceeded(Boolean(result.imported));
      if (result.imported) set("posting", result.posting);
    } catch (issue) { setErrors(issue.fields || {}); setImportMessage(fieldError(issue.fields, "url") || issue.message); setImportSucceeded(false); }
    finally { setImporting(false); }
  }
  async function save(event) {
    event.preventDefault(); setError(""); setErrors({});
    const required = Object.fromEntries(["role", "company", "posting"].filter((key) => !draft[key].trim()).map((key) => [key, "This field is required."]));
    if (Object.keys(required).length) { setErrors(required); return; }
    setBusy(true);
    try {
      const body = Object.fromEntries(["role", "company", "url", "platform", "posting", "status"].map((key) => [key, draft[key].trim()]));
      body.questions = draft.questions.split("\n").map((line) => line.trim()).filter(Boolean);
      body.applied_on = draft.applied_on || null; body.follow_up_on = draft.follow_up_on || null;
      const saved = await jobApi(`applications/${record ? `${record.id}/` : ""}`, { method: record ? "PATCH" : "POST", body });
      onSaved(saved); notify(record ? "Application details updated." : "Application added.");
    } catch (issue) { setErrors(issue.fields || {}); setError(issue.message); }
    finally { setBusy(false); }
  }
  const fields = [{ name: "url", label: "Job posting link", type: "url", maxLength: 2000 }, { name: "role", label: "Job title", type: "text", required: true, maxLength: 200 }, { name: "company", label: "Company", type: "text", required: true, maxLength: 200 }, { name: "platform", label: "Platform", type: "text", maxLength: 100, placeholder: "LinkedIn, OnlineJobs.ph, Indeed…" },
    { name: "status", label: "Application status", type: "select" }, { name: "applied_on", label: "Submitted on", type: "date" }, { name: "follow_up_on", label: "Follow-up date", type: "date" },
    { name: "posting", label: "Job description & requirements", type: "textarea", required: true, maxLength: 30000, className: "min-h-52", hint: "Paste the actual posting if the site cannot be read. Review imported text before generation." },
    { name: "questions", label: "Screening questions", type: "textarea", maxLength: 30000, className: "min-h-28", hint: "One question per line. Leave empty when there are no screening questions." }];
  return <FormModalShell title={record ? "Application details" : "Add job application"} description="Start with a posting link or paste the description. Fields marked * are required." error={error} busy={busy || importing} dirty={JSON.stringify(draft) !== JSON.stringify(initial)} saveLabel="Save application" onSubmit={save} onCancel={onCancel}>
    <div className="grid gap-4 sm:grid-cols-2">{fields.map((field) => <div key={field.name} className={["url", "posting", "questions"].includes(field.name) ? "sm:col-span-2" : ""}><FormField field={field} values={draft} onChange={set} layout="plain" idPrefix="job" disabled={busy || importing} error={fieldError(errors, field.name)} options={field.name === "status" ? statuses.map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) })) : []}/>{field.name === "url" && <div className="mt-2 space-y-2"><Button type="button" size="sm" variant="outline" disabled={!draft.url || importing || busy} onClick={importPosting}><Download size={15}/>{importing ? "Reading posting…" : "Try importing posting"}</Button>{importMessage && <p role={importSucceeded === false ? "alert" : "status"} className={`flex items-start gap-2 rounded-md border p-3 text-sm leading-6 ${importSucceeded === false ? "border-amber-200 bg-amber-50 text-amber-900" : importSucceeded === true ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-white text-slate-700"}`}><ImportIcon size={18} className="mt-0.5 shrink-0" aria-hidden="true"/><span className="min-w-0 break-words">{importMessage}</span></p>}</div>}{field.name === "posting" && draft.posting.trim() && <div className="mt-3"><PostingHighlights posting={draft.posting} compact/></div>}</div>)}</div>
  </FormModalShell>;
}
