import { useState } from "react";
import { FolderKanban, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "../../personal-dashboard/ui/button";
import ProjectExperienceForm from "./ProjectExperienceForm";
import { fieldError } from "./api";

export default function ProjectExperienceEditor({ value = [], onChange, disabled, errors }) {
  const [editing, setEditing] = useState(null);
  function add() {
    const record = { id: crypto.randomUUID(), name: "", system_type: "", context: "independent", tools: [], contributions: "", outcomes: "", year: null, status: "unconfirmed" };
    onChange([...value, record]); setEditing(record.id);
  }
  return <section className="space-y-3 border-t pt-4" aria-labelledby="applicant-projects-title">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 id="applicant-projects-title" className="flex items-center gap-2 text-sm font-semibold"><FolderKanban size={17}/>Additional project experience</h3><Button type="button" size="sm" variant="outline" disabled={disabled || value.length >= 30} onClick={add}><Plus size={15}/>Add project</Button></div>
    <p className="text-xs leading-5 text-slate-600">Reuse real ASTA and independent contributions across postings. Unconfirmed projects stay out of generation evidence.</p>
    {!value.length && <p className="flex items-center gap-2 py-3 text-sm text-slate-600"><FolderKanban size={18}/>No additional projects yet. Your existing experience text is unchanged.</p>}
    <ul className="space-y-3">{value.map((record, index) => <li key={record.id} className="min-w-0">
      <div className="flex items-start gap-3 rounded-md border bg-white p-3"><FolderKanban size={18} className="mt-1 shrink-0 text-[var(--pd-primary)]"/><div className="min-w-0 flex-1"><p className="break-words text-sm font-medium">{record.name || "New project"}</p><p className="mt-1 text-xs text-slate-600">{record.system_type || "Choose a system type"} · {record.context}{record.year ? ` · ${record.year}` : ""}</p><span className={`mt-2 inline-block rounded-md px-2 py-1 text-xs ${record.status === "confirmed" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}>{record.status === "confirmed" ? "Confirmed by you" : "Unconfirmed"}</span>{record.contributions && <details className="mt-2 text-xs"><summary className="cursor-pointer text-slate-600">Contributions & tools</summary><p className="mt-2 whitespace-pre-wrap leading-5">{record.contributions}</p><p className="mt-2 text-slate-600">{record.tools.join(", ")}</p></details>}</div><Button type="button" size="icon-sm" variant="ghost" aria-label={`Edit ${record.name || "project"}`} disabled={disabled} onClick={() => setEditing(editing === record.id ? null : record.id)}><Pencil size={15}/></Button><Button type="button" size="icon-sm" variant="ghost" aria-label={`Remove ${record.name || "project"}`} disabled={disabled} onClick={() => { onChange(value.filter((item) => item.id !== record.id)); if (editing === record.id) setEditing(null); }}><Trash2 size={15}/></Button></div>
      {errors?.[index] && typeof errors[index] === "object" && Object.keys(errors[index]).length > 0 && <p role="alert" className="mt-2 text-sm text-red-800">{Object.entries(errors[index]).map(([key, message]) => `${key}: ${Array.isArray(message) ? message.join(" ") : message}`).join(" · ")}</p>}
      {editing === record.id && <div className="mt-3"><ProjectExperienceForm key={record.id} record={record} onChange={(updated) => onChange(value.map((item) => item.id === record.id ? updated : item))} onDone={() => setEditing(null)} disabled={disabled} validationErrors={errors?.[index]}/></div>}
    </li>)}</ul>
    {(typeof errors === "string" || Array.isArray(errors) && errors.every((item) => typeof item === "string")) && <p role="alert" className="text-sm text-red-800">{fieldError({ projects: errors }, "projects")}</p>}
  </section>;
}
