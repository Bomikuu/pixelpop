import { BriefcaseBusiness, CalendarDays, Coffee, Palmtree, Sun } from "lucide-react";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import SelectableField from "../SelectableField";

const types = [
  { value: "workday", label: "Workday", icon: BriefcaseBusiness },
  { value: "day_off", label: "Day off", icon: Coffee },
  { value: "vacation", label: "Vacation", icon: Palmtree },
  { value: "holiday", label: "Holiday", icon: Sun },
];

function Field({ id, label, error, hint, children }) {
  return <div className="min-w-0"><Label htmlFor={id} className="mb-2 block">{label}</Label>{children}{hint && <p className="mt-1 text-xs leading-5 text-slate-600">{hint}</p>}{error && <p role="alert" className="mt-1 text-sm text-red-800">{error}</p>}</div>;
}

export default function EodEntryForm({ draft, onChange, errors, disabled, maxDate, groups }) {
  const set = (name) => (event) => onChange(name, event.target.value);
  return <div className="grid gap-4 sm:grid-cols-2">
    <Field id="eod-group" label="Group *" error={errors.group}>
      <Select value={String(draft.group || "")} onValueChange={(value) => onChange("group", value)} disabled={disabled}>
        <SelectTrigger id="eod-group" className="w-full" aria-invalid={!!errors.group}><SelectValue placeholder="Choose a group" /></SelectTrigger>
        <SelectContent className="personal-dashboard">{groups.map((group) => <SelectItem key={group.id} value={String(group.id)}><BriefcaseBusiness size={16} aria-hidden="true" />{group.name}</SelectItem>)}</SelectContent>
      </Select>
    </Field>
    <Field id="eod-date" label="Date *" error={errors.date}><Input id="eod-date" type="date" value={draft.date || ""} max={maxDate} onChange={set("date")} disabled={disabled} aria-invalid={!!errors.date} /></Field>
    <div className="sm:col-span-2"><SelectableField id="eod-type" label="Day type" options={types} value={draft.type} onChange={(value) => onChange("type", value)} disabled={disabled} invalid={!!errors.type} />{errors.type && <p role="alert" className="mt-1 text-sm text-red-800">{errors.type}</p>}</div>
    {draft.type === "workday" ? <>
      <div className="sm:col-span-2"><Field id="eod-title" label="Title *" error={errors.title}><Input id="eod-title" value={draft.title || ""} onChange={set("title")} maxLength={160} placeholder="What did you focus on?" disabled={disabled} aria-invalid={!!errors.title} /></Field></div>
      <div className="sm:col-span-2"><Field id="eod-summary" label="Summary *" error={errors.summary}><Textarea id="eod-summary" value={draft.summary || ""} onChange={set("summary")} maxLength={4000} rows={3} placeholder="The main outcome of your day" disabled={disabled} aria-invalid={!!errors.summary} /></Field></div>
      <div className="sm:col-span-2"><Field id="eod-items" label="Items completed" error={errors.items} hint="One item per line. This is also your bullet list and the default Slack recap."><Textarea id="eod-items" value={draft.items || ""} onChange={set("items")} rows={4} placeholder="Finished the validation fix\nReviewed the payment flow" disabled={disabled} /></Field></div>
      <div className="sm:col-span-2"><Field id="eod-in-progress" label="In progress" error={errors.in_progress} hint="One item per line. These appear after Done in the generated Slack recap."><Textarea id="eod-in-progress" value={draft.in_progress || ""} onChange={set("in_progress")} rows={3} placeholder="Finish payment flow testing\nDocument the follow-up" disabled={disabled} /></Field></div>
      <div className="sm:col-span-2"><Field id="eod-slack" label="Custom Slack message" error={errors.slack_message} hint="Optional. Leave blank to generate Done and In Progress sections from the items above."><Textarea id="eod-slack" value={draft.slack_message || ""} onChange={set("slack_message")} maxLength={8000} rows={4} disabled={disabled} /></Field></div>
    </> : <>
      <div className="sm:col-span-2"><Field id="eod-title" label="Label" error={errors.title} hint="Optional; defaults to the day type."><Input id="eod-title" value={draft.title || ""} onChange={set("title")} maxLength={160} disabled={disabled} /></Field></div>
      <div className="sm:col-span-2"><Field id="eod-summary" label="Note" error={errors.summary}><Textarea id="eod-summary" value={draft.summary || ""} onChange={set("summary")} maxLength={4000} rows={3} disabled={disabled} /></Field></div>
    </>}
    <p className="sm:col-span-2 flex items-center gap-1.5 text-xs text-slate-600"><CalendarDays size={13} aria-hidden="true" />One entry per group and date. Future dates are unavailable.</p>
  </div>;
}
