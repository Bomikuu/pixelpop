import { useState } from "react";
import { Check, ChevronDown, Plus } from "lucide-react";
import { Button } from "../../personal-dashboard/ui/button";
import { Input } from "../../personal-dashboard/ui/input";
import { Label } from "../../personal-dashboard/ui/label";
import { skillGroups } from "./skillCatalog";

export default function SkillTagPicker({ id, value, onChange, disabled, error }) {
  const [custom, setCustom] = useState("");
  const groups = skillGroups.filter((group) => group.label !== "System types");
  const toggle = (tool) => onChange(value.includes(tool) ? value.filter((item) => item !== tool) : [...value, tool]);
  function add() {
    const tool = custom.trim();
    if (!tool || tool.length > 80 || value.length >= 40) return;
    if (!value.includes(tool)) onChange([...value, tool]);
    setCustom("");
  }
  return <fieldset id={id} className="min-w-0 space-y-3" aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined}>
    <legend className="mb-2 text-sm font-medium">Tools & technologies</legend>
    {value.length > 0 && <div className="flex flex-wrap gap-2" role="group" aria-label="Selected tools">{value.map((tool) => <Button key={tool} type="button" variant="outline" size="sm" aria-pressed disabled={disabled} onClick={() => toggle(tool)} className="border-[var(--pd-primary)] bg-[var(--pd-soft)] text-[var(--pd-primary)]"><Check size={14}/>{tool}<span className="sr-only"> — remove</span></Button>)}</div>}
    <div className="divide-y rounded-md border bg-white">{groups.map(({ label, icon: Icon, options }) => <details key={label} className="group/tools">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md p-3 text-sm hover:bg-[var(--pd-soft)] focus-visible:outline-2 focus-visible:outline-[var(--pd-primary)] [&::-webkit-details-marker]:hidden"><Icon size={16} aria-hidden="true"/>{label} suggestions<ChevronDown size={16} className="ml-auto group-open/tools:rotate-180" aria-hidden="true"/></summary>
      <div className="flex flex-wrap gap-2 px-3 pb-3">{options.map((tool) => <Button key={tool} type="button" variant={value.includes(tool) ? "secondary" : "outline"} size="sm" aria-pressed={value.includes(tool)} disabled={disabled || (!value.includes(tool) && value.length >= 40)} onClick={() => toggle(tool)}>{value.includes(tool) ? <Check size={14}/> : <Plus size={14}/>}{tool}</Button>)}</div>
    </details>)}</div>
    <div><Label htmlFor={`${id}-custom`} className="mb-2 block text-xs">Other tool</Label><div className="flex gap-2"><Input id={`${id}-custom`} maxLength={80} value={custom} disabled={disabled || value.length >= 40} placeholder="Add a tool not listed" onChange={(event) => setCustom(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); add(); } }}/><Button type="button" size="sm" variant="outline" disabled={disabled || !custom.trim() || value.length >= 40} onClick={add}><Plus size={15}/>Add</Button></div></div>
    {error && <p id={`${id}-error`} role="alert" className="text-sm text-red-800">{error}</p>}
  </fieldset>;
}
