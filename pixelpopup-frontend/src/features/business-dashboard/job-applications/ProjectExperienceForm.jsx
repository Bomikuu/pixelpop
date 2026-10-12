import { useState } from "react";
import { Check, Info } from "lucide-react";
import { Button } from "../../personal-dashboard/ui/button";
import FormField from "../../personal-dashboard/components/forms/FormField";
import SkillTagPicker from "./SkillTagPicker";
import { skillGroups } from "./skillCatalog";
import { fieldError } from "./api";

export default function ProjectExperienceForm({ record, onChange, onDone, disabled, validationErrors }) {
  const [errors, setErrors] = useState({});
  const set = (name, value) => { onChange({ ...record, [name]: name === "year" ? value === "" ? null : Number(value) : value, ...(name !== "status" ? { status: "unconfirmed" } : {}) }); setErrors({}); };
  function done() {
    const invalid = {};
    if (!record.name.trim()) invalid.name = "Enter a descriptive project name.";
    if (!record.system_type) invalid.system_type = "Choose a system type.";
    if (record.status === "confirmed" && !record.contributions.trim()) invalid.contributions = "Describe your actual contribution before confirming.";
    if (record.year !== null && (!Number.isInteger(record.year) || record.year < 1900 || record.year > Number(new Intl.DateTimeFormat("en", { timeZone: "Asia/Manila", year: "numeric" }).format(new Date())))) invalid.year = "Enter a past/current year, or leave it blank.";
    setErrors(invalid); if (!Object.keys(invalid).length) onDone();
  }
  const fields = [{ name: "name", label: "Project / system name", type: "text", maxLength: 160, required: true }, { name: "system_type", label: "System type", type: "select", required: true }, { name: "context", label: "Work context", type: "select", required: true }, { name: "year", label: "Year (optional)", type: "number", min: 1900, step: 1 }, { name: "contributions", label: "What I personally contributed", type: "textarea", maxLength: 4000, required: record.status === "confirmed", hint: "Describe real implementation decisions and responsibilities. A tool list alone does not establish experience." }, { name: "outcomes", label: "Recorded outcomes (optional)", type: "textarea", maxLength: 2000, hint: "Leave blank if you do not have a recorded result. Do not estimate achievements." }, { name: "status", label: "Experience status", type: "select", required: true }];
  const options = { system_type: skillGroups.find((group) => group.label === "System types").options.map((label) => ({ value: label, label })), context: [{ value: "asta", label: "ASTA" }, { value: "independent", label: "Independent" }, { value: "client", label: "Client work" }], status: [{ value: "unconfirmed", label: "Unconfirmed", description: "Keep as editable notes, not generation evidence." }, { value: "confirmed", label: "Confirmed by me", description: "These details describe work I actually did." }] };
  return <fieldset disabled={disabled} className="space-y-4 rounded-md border bg-white p-4">
    <legend className="px-2 text-sm font-medium">Edit project experience</legend>
    <div className="grid gap-4 sm:grid-cols-2">{fields.map((field) => <div key={field.name} className={field.type === "textarea" || field.name === "status" ? "sm:col-span-2" : ""}><FormField field={field} values={record} options={options[field.name]} onChange={set} layout="plain" idPrefix={`project-${record.id}`} disabled={disabled} error={errors[field.name] || fieldError(validationErrors, field.name)}/></div>)}</div>
    <SkillTagPicker id={`project-tools-${record.id}`} value={record.tools} onChange={(tools) => set("tools", tools)} disabled={disabled}/>
    <p className="flex items-start gap-2 text-xs leading-5 text-slate-600"><Info size={15} className="shrink-0"/>Edits reset this project's confirmation. No customer name or year is required. Changes save only when you save the profile.</p>
    <div className="flex justify-end"><Button type="button" variant="outline" size="sm" onClick={done} disabled={disabled}><Check size={15}/>Done editing</Button></div>
  </fieldset>;
}
