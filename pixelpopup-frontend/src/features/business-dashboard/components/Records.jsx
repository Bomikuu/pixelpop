import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as icons from "lucide-react";
import { allRecords, leadershipApi } from "../api";
import { delegationMilestones, reflectionQuestions, resourceConfigs } from "../config";
import { weeklyActionProgress } from "../progress";
import { Button } from "../../personal-dashboard/ui/button";
import { Input } from "../../personal-dashboard/ui/input";
import { Textarea } from "../../personal-dashboard/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../personal-dashboard/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../personal-dashboard/ui/dialog";
import { EmptyState, ErrorState, Panel } from "../../personal-dashboard/components/Panel";

const todayInManila = () => {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const get = (type) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
};
const NO_VALUE = "__none__";
const simpleLabel = (value) => String(value ?? "").replaceAll("_", " ");

function initialDraft(config, record, currentWeek) {
  if (record) return { ...record, evidence_urls: Array.isArray(record.evidence_urls) ? record.evidence_urls.join("\n") : "" };
  const draft = {};
  for (const field of config.fields) {
    if (field.type === "week") draft[field.key] = currentWeek || 1;
    else if (field.type === "checkbox") draft[field.key] = field.key === "important";
    else if (field.type === "multiRelation" || field.type === "milestones") draft[field.key] = [];
    else if (field.type === "reportChecklist" || field.type === "reflectionNotes") draft[field.key] = {};
    else if (field.type === "reflectionAnswers") draft[field.key] = {};
    else if (field.type === "date") draft[field.key] = field.required ? todayInManila() : "";
    else if (field.type === "month") draft[field.key] = todayInManila().slice(0, 7);
    else if (field.type === "select") draft[field.key] = field.defaultValue ?? null;
    else if (field.type === "relation" || field.type === "number" || field.type === "decimal") draft[field.key] = field.defaultValue ?? null;
    else draft[field.key] = "";
  }
  return draft;
}

function formatError(error) {
  return error?.message || "Please try again.";
}

const actionSpecs = {
  actions: { title: "Update action progress", fields: ["status", "notes", "leadership_result", "evidence_urls"] },
  goals: { title: "Record goal outcome", fields: ["outcome"] },
  "weekly-reviews": { title: "Record weekly reflection", fields: ["improved", "adopted", "did_not_work", "should_delegate", "became_independent", "process_change", "promotion_evidence"] },
  processes: { title: "Record process adoption", target: "process-observations", relation: "process", fields: ["week", "team_using", "checked", "eligible", "status", "recorded_on", "notes", "evidence_url"] },
  "process-observations": { title: "Update adoption observation", fields: ["team_using", "checked", "eligible", "status", "notes", "evidence_url"] },
  "metric-definitions": { title: "Record measurement", target: "metric-entries", relation: "definition", fields: ["week", "value", "numerator", "denominator", "movement_note", "next_action", "impact_note", "source_url"] },
  "metric-entries": { title: "Update measurement", fields: ["value", "numerator", "denominator", "movement_note", "next_action", "impact_note", "source_url"] },
  "quality-observations": { title: "Update quality observation", fields: ["checked", "eligible", "target_percent", "notes", "evidence_url"] },
  "pr-reviews": { title: "Record review outcome", fields: ["outcome", "coaching_note"] },
  "weekly-reports": { title: "Record weekly update", fields: ["wins", "metrics", "changed", "learned", "next_actions", "slack_url", "checklist"] },
  delegations: { title: "Update ownership transfer", fields: ["progress", "milestones", "took_work_back", "took_work_back_note", "notes", "evidence_url"] },
  knowledge: { title: "Update documentation and backup", fields: ["documentation_status", "documentation_url", "backup_owner", "backup_tested", "notes"] },
  "continuity-checks": { title: "Record absence-test result", fields: ["answer", "dependencies"] },
  friction: { title: "Record improvement", fields: ["status", "result"] },
  evidence: { title: "Record observed result", fields: ["result", "evidence_url"] },
  health: { title: "Update evidence assessment", fields: ["level", "rationale", "evidence"] },
  reflections: { title: "Record monthly reflection", fields: ["answers", "notes"] },
};

function fieldValue(field, value) {
  if (field.type === "urls") return String(value || "").split("\n").map((url) => url.trim()).filter(Boolean);
  if (field.type === "number" || field.type === "decimal") return value === "" || value === null ? null : Number(value);
  if (field.type === "date" || field.type === "relation") return value || null;
  return value;
}

function RecordField({ field, value, setValue, options, checklist }) {
  const id = `business-${field.key}`;
  if (field.type === "checkbox") return (
    <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
      <input type="checkbox" checked={Boolean(value)} onChange={(event) => setValue(event.target.checked)} className="size-4 accent-blue-600" />
      {field.label}
    </label>
  );
  if (field.type === "milestones" || field.type === "reportChecklist") {
    const entries = field.type === "milestones" ? delegationMilestones : checklist;
    return <fieldset className="space-y-2"><legend className="mb-2 text-sm font-medium text-slate-700">{field.label}</legend>
      {entries.map((entry) => <label key={entry} className="flex items-start gap-2 rounded-md border bg-slate-50 p-2 text-sm text-slate-700">
        <input type="checkbox" checked={field.type === "milestones" ? (value || []).includes(entry) : Boolean(value?.[entry])} onChange={(event) => setValue(field.type === "milestones" ? (event.target.checked ? [...(value || []), entry] : (value || []).filter((item) => item !== entry)) : { ...value, [entry]: event.target.checked })} className="mt-0.5 size-4 accent-blue-600" />
        {entry}
      </label>)}
    </fieldset>;
  }
  if (field.type === "reflectionAnswers" || field.type === "reflectionNotes") return (
    <fieldset className="space-y-3"><legend className="text-sm font-medium text-slate-700">{field.label}</legend>
      {reflectionQuestions.map(([key, label]) => <div key={key} className="space-y-1.5"><label htmlFor={`${id}-${key}`} className="block text-sm text-slate-600">{label}</label>
        {field.type === "reflectionAnswers" ? <Select value={value?.[key] || ""} onValueChange={(next) => setValue({ ...value, [key]: next })}><SelectTrigger id={`${id}-${key}`} className="w-full"><SelectValue placeholder="Choose an answer" /></SelectTrigger><SelectContent className="personal-dashboard">{[["yes", "Yes"], ["partially", "Partially"], ["no", "No"]].map(([keyValue, title]) => <SelectItem key={keyValue} value={keyValue}>{title}</SelectItem>)}</SelectContent></Select>
          : <Textarea id={`${id}-${key}`} value={value?.[key] || ""} onChange={(event) => setValue({ ...value, [key]: event.target.value })} rows={2} />}
      </div>)}
    </fieldset>
  );
  if (field.type === "multiRelation") return <fieldset className="space-y-2"><legend className="text-sm font-medium text-slate-700">{field.label}</legend><div className="max-h-44 space-y-1 overflow-auto rounded-md border p-2">
    {options.length ? options.map((option) => <label key={option.id} className="flex items-center gap-2 rounded px-1 py-1 text-sm hover:bg-blue-50"><input type="checkbox" checked={(value || []).includes(option.id)} onChange={(event) => setValue(event.target.checked ? [...(value || []), option.id] : (value || []).filter((idValue) => idValue !== option.id))} className="size-4 accent-blue-600" />{option.label}</label>) : <p className="text-sm text-slate-500">No records available yet.</p>}
  </div></fieldset>;
  return <div className="space-y-1.5"><label htmlFor={id} className="block text-sm font-medium text-slate-700">{field.label}{field.required && <span className="text-rose-700"> *</span>}</label>
    {field.type === "textarea" || field.type === "urls" ? <Textarea id={id} value={value ?? ""} onChange={(event) => setValue(event.target.value)} rows={field.type === "urls" ? 2 : 3} required={field.required} />
      : field.type === "relation" || field.type === "select" || field.type === "week" ? <Select value={value === null || value === undefined || value === "" ? "" : String(value)} onValueChange={(next) => setValue(next === NO_VALUE ? null : field.type === "week" || field.type === "relation" ? Number(next) : next)}><SelectTrigger id={id} className="w-full"><SelectValue placeholder={`Select ${field.label.toLowerCase()}`} /></SelectTrigger><SelectContent className="personal-dashboard">{!field.required && <SelectItem value={NO_VALUE}>None</SelectItem>}{(field.type === "week" ? Array.from({ length: 12 }, (_, index) => ({ id: index + 1, label: `Week ${index + 1}` })) : field.type === "select" ? field.options.map(([key, label]) => ({ id: key, label })) : options).map((option) => <SelectItem key={option.id} value={String(option.id)}>{option.label}</SelectItem>)}</SelectContent></Select>
      : <Input id={id} type={field.type === "decimal" || field.type === "number" ? "number" : field.type} step={field.type === "decimal" ? "0.001" : undefined} min={field.type === "number" ? 0 : undefined} value={value ?? ""} onChange={(event) => setValue(event.target.value)} required={field.required} />}
  </div>;
}

function recordLabel(record, config, relations) {
  const field = config.display;
  const value = record[field];
  const schema = config.fields.find((item) => item.key === field);
  if (schema?.type === "relation") return relations[schema.resource]?.find((item) => item.id === value)?.label || `${config.prefix || "#"}${value}`;
  if (schema?.type === "select") return schema.options.find(([key]) => key === value)?.[1] || simpleLabel(value);
  return `${config.prefix || ""}${value || "Untitled"}`;
}

function RecordDetails({ record, config, relations }) {
  return <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">{config.fields.map((field) => {
    const value = record[field.key];
    if (value === null || value === undefined || value === "" || (Array.isArray(value) && !value.length)) return null;
    const related = field.resource && relations[field.resource];
    const shown = field.type === "relation" ? related?.find((item) => item.id === value)?.label || `#${value}` : field.type === "multiRelation" ? value.map((idValue) => related?.find((item) => item.id === idValue)?.label || `#${idValue}`).join(", ") : field.type === "checkbox" ? value ? "Yes" : "No" : field.type === "select" ? field.options.find(([key]) => key === value)?.[1] || simpleLabel(value) : field.type === "urls" ? value.join(", ") : typeof value === "object" ? JSON.stringify(value) : String(value);
    return <div key={field.key} className="min-w-0"><dt className="text-xs font-medium text-slate-500">{field.label}</dt><dd className="mt-1 break-words text-slate-800">{field.type === "url" && /^https?:\/\//i.test(String(value)) ? <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">Open link</a> : field.type === "urls" ? value.filter((url) => /^https?:\/\//i.test(url)).map((url, index) => <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="mr-3 text-blue-700 underline">Evidence {index + 1}</a>) : shown}</dd></div>;
  })}{record.updated_at && <div><dt className="text-xs font-medium text-slate-500">Last updated</dt><dd className="mt-1 text-slate-800"><time dateTime={record.updated_at}>{new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date(record.updated_at))}</time></dd></div>}</dl>;
}

export default function Records({ resource, csrf, currentWeek, checklist = [], notify, refresh, filterWeek = null, compact = false, focusRecordId = null, focusCreateValues = null, onFocused }) {
  const navigate = useNavigate();
  const config = resourceConfigs[resource];
  const actionSpec = actionSpecs[resource];
  const [records, setRecords] = useState([]);
  const [relations, setRelations] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [version, setVersion] = useState(0);
  const [detailRecord, setDetailRecord] = useState(null);
  const [actionRecord, setActionRecord] = useState(null);
  const [actionDraft, setActionDraft] = useState(null);
  const [actionError, setActionError] = useState("");
  const editFields = editing && actionSpec && !actionSpec.target ? config.fields.filter((field) => !actionSpec.fields.includes(field.key) && !(resource === "actions" && field.key === "planned_week")) : config.fields;

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const required = [...new Set(config.fields.filter((field) => field.resource).map((field) => field.resource))];
      const [items, ...lookups] = await Promise.all([allRecords(resource, csrf), ...required.map((name) => allRecords(name, csrf))]);
      setRecords(items);
      setRelations(Object.fromEntries(required.map((name, index) => [name, lookups[index].map((record) => ({ id: record.id, label: record[resourceConfigs[name].display] || `#${record.id}` }))])));
    } catch (cause) { setError(formatError(cause)); }
    finally { setLoading(false); }
  }, [config.fields, resource, csrf]);

  useEffect(() => { load(); }, [load, version, refresh]);
  useEffect(() => {
    if (!focusRecordId || loading || error) return;
    const record = records.find((item) => item.id === focusRecordId && (!filterWeek || (item.current_week || item.week) === filterWeek));
    if (record) { setDetailRecord(record); onFocused?.(); }
  }, [focusRecordId, records, filterWeek, loading, error, onFocused]);
  const displayed = useMemo(() => records.filter((record) => {
    if (filterWeek && (record.current_week || record.week) !== filterWeek) return false;
    if (!query.trim()) return true;
    return JSON.stringify(record).toLowerCase().includes(query.trim().toLowerCase());
  }), [records, filterWeek, query]);
  const visible = displayed.slice((page - 1) * 20, page * 20);
  const weekProgress = resource === "actions" && filterWeek ? weeklyActionProgress(records, filterWeek) : null;
  const open = (record = null) => { setEditing(record); setDraft(initialDraft(config, record, currentWeek)); setFormError(""); };
  useEffect(() => {
    if (!focusCreateValues || loading || error) return;
    setEditing(null);
    setDraft({ ...initialDraft(config, null, currentWeek), ...focusCreateValues });
    setFormError("");
    onFocused?.();
  }, [focusCreateValues, loading, error, config, currentWeek, onFocused]);
  const openAction = (record) => {
    const targetConfig = resourceConfigs[actionSpec.target || resource];
    setActionRecord(record);
    setActionDraft(initialDraft(targetConfig, actionSpec.target ? null : record, currentWeek));
    setActionError("");
  };
  const saveAction = async (event) => {
    event.preventDefault(); setSaving(true); setActionError("");
    try {
      const target = actionSpec.target || resource;
      const targetConfig = resourceConfigs[target];
      const payload = actionSpec.target ? { [actionSpec.relation]: actionRecord.id } : {};
      for (const key of actionSpec.fields) {
        const field = targetConfig.fields.find((item) => item.key === key);
        const value = fieldValue(field, actionDraft[key]);
        if (field.required && (value === "" || value === null || value === undefined)) {
          setActionError(`${field.label} is required.`); return;
        }
        payload[key] = value;
      }
      await leadershipApi(`${target}/${actionSpec.target ? "" : `${actionRecord.id}/`}`, { method: actionSpec.target ? "POST" : "PATCH", body: payload }, csrf);
      setActionDraft(null); setActionRecord(null); setVersion((old) => old + 1); notify(`${actionSpec.title} saved.`); refresh?.();
    } catch (cause) { setActionError(formatError(cause)); }
    finally { setSaving(false); }
  };
  const close = () => { if (draft && JSON.stringify(draft) !== JSON.stringify(initialDraft(config, editing, currentWeek)) && !window.confirm("Discard your unsaved changes?")) return; setDraft(null); };
  const save = async (event) => {
    event.preventDefault(); setSaving(true); setFormError("");
    try {
      const payload = {};
      for (const field of editFields) {
        let value = fieldValue(field, draft[field.key]);
        if (field.type === "week" && !value) { setFormError(`${field.label} is required.`); setSaving(false); return; }
        if (field.required && (value === "" || value === null || value === undefined)) { setFormError(`${field.label} is required.`); setSaving(false); return; }
        if (editing && resource === "actions" && field.key === "planned_week") continue;
        payload[field.key] = value;
      }
      await leadershipApi(`${resource}/${editing ? `${editing.id}/` : ""}`, { method: editing ? "PATCH" : "POST", body: payload }, csrf);
      setDraft(null); setVersion((old) => old + 1); notify(`${config.singular} saved.`); refresh?.();
    } catch (cause) { setFormError(formatError(cause)); }
    finally { setSaving(false); }
  };
  const remove = async (record) => {
    const relatedWarning = resource === "processes" ? " Its adoption observations will also be removed." : resource === "metric-definitions" ? " Its weekly measurements will also be removed." : "";
    if (!window.confirm(`Delete this ${config.singular}?${relatedWarning} This cannot be undone.`)) return;
    try { await leadershipApi(`${resource}/${record.id}/`, { method: "DELETE" }, csrf); setVersion((old) => old + 1); notify(`${config.singular} deleted.`); refresh?.(); }
    catch (cause) { notify(formatError(cause), true); }
  };
  const submit = async (record) => {
    try { await leadershipApi(`${resource}/${record.id}/submit/`, { method: "POST" }, csrf); setVersion((old) => old + 1); notify(`${config.singular} submitted.`); refresh?.(); }
    catch (cause) { notify(formatError(cause), true); }
  };
  const carry = async (record) => {
    if (!window.confirm(`Carry “${record.title}” into Week ${record.current_week + 1}? The original entry will remain in its history.`)) return;
    try { await leadershipApi(`actions/${record.id}/carry/`, { method: "POST" }, csrf); setVersion((old) => old + 1); notify("Action carried to next week."); refresh?.(); }
    catch (cause) { notify(formatError(cause), true); }
  };
  const toggleComplete = async (record) => {
    try {
      const next = record.status === "completed" ? "not_started" : "completed";
      await leadershipApi(`actions/${record.id}/`, { method: "PATCH", body: { status: next } }, csrf);
      setVersion((old) => old + 1); notify(next === "completed" ? "Action completed." : "Action reopened."); refresh?.();
    } catch (cause) { notify(formatError(cause), true); }
  };
  const markSelf = async (record) => {
    if (!window.confirm(`Mark ${record.name} as “This is me”? Existing dated check-ins stay with the person originally recorded.`)) return;
    try {
      await leadershipApi(`team-members/${record.id}/mark-self/`, { method: "POST" }, csrf);
      setVersion((old) => old + 1); notify(`${record.name} is now marked as you.`); refresh?.();
    } catch (cause) { notify(formatError(cause), true); }
  };
  const Icon = icons[config.icon] || icons.FileText;
  return <>
    <Panel title={config.title} description={`${records.length} recorded · ${config.submit ? "Save a draft, then submit when ready." : "Open details or record progress as work happens."}`} action={<Button onClick={() => open()}><icons.Plus size={16} /> Add {config.singular}</Button>}>
      {loading ? <div className="space-y-2" aria-busy="true">{[0, 1, 2].map((index) => <div key={index} className="h-16 animate-pulse rounded-md bg-slate-100" />)}</div> : error ? <ErrorState message={error} retry={load} /> : <>
        {weekProgress && <div className={`mb-4 rounded-md border px-4 py-3 ${weekProgress.total && weekProgress.completed === weekProgress.total ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-slate-50 text-slate-800"}`}>
          <div className="flex items-center justify-between gap-3 text-sm font-medium"><span className="flex items-center gap-2">{weekProgress.total && weekProgress.completed === weekProgress.total ? <icons.CheckCircle2 size={17} aria-hidden="true"/> : <icons.ListChecks size={17} aria-hidden="true"/>}{weekProgress.total ? `${weekProgress.completed} of ${weekProgress.total} actions completed` : "No actions to track"}</span><span className="tabular-nums">{weekProgress.total ? `${weekProgress.percent}%` : ""}</span></div>
          {weekProgress.total > 0 && <div role="progressbar" aria-label={`Week ${filterWeek} action completion`} aria-valuenow={weekProgress.percent} aria-valuemin={0} aria-valuemax={100} className="mt-2 h-2 overflow-hidden rounded-full bg-white/80"><div className={`h-full transition-[width] duration-300 motion-reduce:transition-none ${weekProgress.percent === 100 ? "bg-emerald-600" : "bg-blue-600"}`} style={{ width: `${weekProgress.percent}%` }}/></div>}
          {weekProgress.total > 0 && weekProgress.percent === 100 && <p className="mt-2 flex items-center gap-1.5 text-xs font-medium"><icons.Sparkles size={14} aria-hidden="true"/> Week complete — great work closing every action.</p>}
        </div>}
        {(records.length > 5 || query) && <div className="mb-4 flex items-center gap-2"><icons.Search size={16} className="text-slate-500" /><Input aria-label={`Search ${config.title}`} placeholder={`Search ${config.title.toLowerCase()}…`} value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} className="max-w-sm bg-white" /></div>}
        {!displayed.length ? <EmptyState title={records.length ? "No matching records" : `No ${config.title.toLowerCase()} yet`} message={records.length ? "Try a different search." : `Add your first ${config.singular} when it is ready to record.`} icon={Icon} /> : <div className="divide-y rounded-md border bg-white">
          {visible.map((record) => <article key={record.id} className="group flex flex-wrap items-center gap-3 p-3 transition-colors hover:bg-blue-50/50">
            {resource === "actions" && record.status !== "moved" ? <button type="button" role="checkbox" aria-checked={record.status === "completed"} aria-label={`${record.status === "completed" ? "Reopen" : "Complete"} ${record.title}`} onClick={() => toggleComplete(record)} className={`grid size-9 shrink-0 place-items-center rounded-full border transition-colors ${record.status === "completed" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"}`}>{record.status === "completed" ? <icons.Check size={17}/> : <Icon size={17}/>}</button> : <span className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700"><Icon size={17} aria-hidden="true" /></span>}
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-950">{resource === "team-members" ? <a href={`/business/team/${record.id}`} onClick={(event) => { if (!event.metaKey && !event.ctrlKey) { event.preventDefault(); navigate(`/business/team/${record.id}`); } }} className="rounded-sm text-blue-700 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">{recordLabel(record, config, relations)}</a> : recordLabel(record, config, relations)}</p><p className="mt-0.5 line-clamp-2 text-xs text-slate-600">{record[config.subtitle] || (record.week || record.current_week ? `Week ${record.week || record.current_week}` : `Record #${record.id}`)}</p></div>
            {resource === "team-members" && record.is_self && <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-800">You</span>}
            {record.status && <span className="rounded-md border bg-slate-50 px-2 py-1 text-xs capitalize text-slate-700">{simpleLabel(record.status)}</span>}
            {record.source_action && <span className="rounded-md border border-blue-100 bg-blue-50 px-2 py-1 text-xs text-blue-800">Carried from action #{record.source_action}</span>}
            {record.submitted_at && <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs text-emerald-800">Submitted</span>}
            <div className="ml-auto flex items-center gap-1"><Button variant="ghost" size="sm" onClick={() => setDetailRecord(record)}><icons.Eye size={14} /> Details</Button>{resource === "team-members" ? <>{!record.is_self && <Button variant="outline" size="sm" onClick={() => markSelf(record)}><icons.UserRoundCheck size={14} /> Mark as me</Button>}<Button variant="outline" size="sm" onClick={() => navigate(`/business/team/${record.id}`)}><icons.ArrowRight size={14} /> View page</Button></> : actionSpec && !(resource === "actions" && record.status === "moved") ? <Button variant="outline" size="sm" onClick={() => openAction(record)}><icons.CirclePlay size={14} /> Take action</Button> : null}{resource === "actions" && record.current_week < 12 && !["completed", "moved"].includes(record.status) && <Button variant="outline" size="sm" onClick={() => carry(record)}><icons.ArrowRight size={14} /> Carry</Button>}{config.submit && !record.submitted_at && <Button variant="outline" size="sm" onClick={() => submit(record)}><icons.Send size={14} /> Submit</Button>}</div>
          </article>)}
        </div>}
        {displayed.length > 20 && <div className="mt-4 flex items-center justify-end gap-3 text-sm"><Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((old) => old - 1)}>Previous</Button><span>{page} / {Math.ceil(displayed.length / 20)}</span><Button variant="outline" size="sm" disabled={page >= Math.ceil(displayed.length / 20)} onClick={() => setPage((old) => old + 1)}>Next</Button></div>}
      </>}
    </Panel>
    <Dialog open={Boolean(detailRecord)} onOpenChange={(value) => { if (!value) setDetailRecord(null); }}><DialogContent className="personal-dashboard max-h-[85dvh] overflow-y-auto sm:max-w-[min(75vw,760px)]"><DialogHeader><DialogTitle>{detailRecord && recordLabel(detailRecord, config, relations)}</DialogTitle><DialogDescription>Recorded details for this {config.singular}.</DialogDescription></DialogHeader>
      {detailRecord && <><RecordDetails record={detailRecord} config={config} relations={relations}/><DialogFooter><Button variant="ghost" onClick={() => { const selected = detailRecord; setDetailRecord(null); remove(selected); }}><icons.Trash2 size={15}/> Delete</Button><Button variant="outline" onClick={() => { const selected = detailRecord; setDetailRecord(null); open(selected); }}><icons.Pencil size={15}/> Edit details</Button></DialogFooter></>}
    </DialogContent></Dialog>
    <Dialog open={Boolean(actionDraft)} onOpenChange={(value) => { if (!value && !saving) { setActionDraft(null); setActionRecord(null); } }}><DialogContent className="personal-dashboard max-h-[90dvh] overflow-y-auto sm:max-w-[min(75vw,760px)]"><DialogHeader><DialogTitle>{actionSpec?.title}</DialogTitle><DialogDescription>{actionRecord && recordLabel(actionRecord, config, relations)} · Record what actually happened. Identity and ownership stay under Details.</DialogDescription></DialogHeader>
      {actionDraft && <form onSubmit={saveAction} className="space-y-4"><div className="grid gap-4 md:grid-cols-2">{actionSpec.fields.map((key) => { const field = resourceConfigs[actionSpec.target || resource].fields.find((item) => item.key === key); return <div key={key} className={["textarea", "urls", "milestones", "reportChecklist", "reflectionAnswers", "reflectionNotes", "multiRelation"].includes(field.type) ? "md:col-span-2" : ""}><RecordField field={field} value={actionDraft[key]} setValue={(value) => setActionDraft((old) => ({ ...old, [key]: value }))} options={relations[field.resource] || []} checklist={checklist}/></div>; })}</div>{actionError && <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{actionError}</p>}<DialogFooter><Button type="button" variant="outline" onClick={() => { setActionDraft(null); setActionRecord(null); }}>Cancel</Button><Button type="submit" disabled={saving}><icons.Save size={16}/>{saving ? "Saving…" : "Save progress"}</Button></DialogFooter></form>}
    </DialogContent></Dialog>
    <Dialog open={Boolean(draft)} onOpenChange={(value) => { if (!value) close(); }}><DialogContent className="personal-dashboard max-h-[90dvh] overflow-y-auto sm:max-w-[min(75vw,850px)]"><DialogHeader><DialogTitle>{editing ? `Edit ${config.singular}` : `Add ${config.singular}`}</DialogTitle><DialogDescription>Record only what has happened. Empty outcomes stay empty until there is evidence.</DialogDescription></DialogHeader>
      {draft && <form onSubmit={save} className="space-y-4"><div className="grid gap-4 md:grid-cols-2">{editFields.map((field) => <div key={field.key} className={field.type === "textarea" || field.type === "reportChecklist" || field.type === "reflectionAnswers" || field.type === "reflectionNotes" || field.type === "milestones" || field.type === "multiRelation" ? "md:col-span-2" : ""}><RecordField field={field} value={draft[field.key]} setValue={(value) => setDraft((old) => ({ ...old, [field.key]: value }))} options={relations[field.resource] || []} checklist={checklist} /></div>)}</div>{formError && <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{formError}</p>}<DialogFooter><Button type="button" variant="outline" onClick={close}>Cancel</Button><Button type="submit" disabled={saving}><icons.Save size={16} />{saving ? "Saving…" : `Save ${config.singular}`}</Button></DialogFooter></form>}
    </DialogContent></Dialog>
  </>;
}
