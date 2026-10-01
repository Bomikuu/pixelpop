import { useState } from "react";
import { Bike, Dumbbell, FileJson, Footprints, Info, Save, Waves, Activity, PencilLine } from "lucide-react";
import { Button } from "../../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import SelectableField from "../SelectableField";
import CopyAiFormatButton from "../forms/CopyAiFormatButton";
import { activityAiFormat } from "../../lib/aiJsonFormats";
import { today } from "../../lib/format";

const activities = [
  { value: "walking", label: "Moderate walking", icon: Footprints, met: 3.8 },
  { value: "running", label: "Running · 5 mph", icon: Activity, met: 8.5 },
  { value: "cycling", label: "Leisure cycling", icon: Bike, met: 4.0 },
  { value: "swimming", label: "Recreational swimming", icon: Waves, met: 5.8 },
  { value: "strength", label: "Resistance training", icon: Dumbbell, met: 3.5 },
  { value: "other", label: "Other activity", icon: PencilLine },
];
const modes = [
  { value: "estimated", label: "Estimate burn", description: "Use activity, time, and your last recorded weight.", icon: Activity },
  { value: "manual", label: "Enter manually", description: "Enter active calories from your own estimate or device.", icon: PencilLine },
];
const number = (value) => Number(value).toLocaleString("en-PH", { maximumFractionDigits: 2 });

function parseActivityJson(text, fallbackDate) {
  let value;
  try { value = JSON.parse(text); } catch { throw new Error("Paste valid JSON without comments or Markdown fences."); }
  if (!value || Array.isArray(value) || typeof value !== "object") throw new Error("Activity JSON must be one object.");
  const activity = activities.find((item) => item.value === value.activity_type);
  if (!activity) throw new Error("activity_type must be walking, running, cycling, swimming, strength, or other.");
  const date = value.date ?? fallbackDate;
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) || new Date(Date.UTC(...date.split("-").map((part, index) => Number(part) - (index === 1 ? 1 : 0)))).toISOString().slice(0, 10) !== date) throw new Error("date must be a valid YYYY-MM-DD date.");
  if (date > today()) throw new Error("Choose today or an earlier activity date.");
  const source = value.source ?? (activity.value === "other" ? "manual" : "estimated");
  if (!["estimated", "manual"].includes(source)) throw new Error("source must be estimated or manual.");
  if (activity.value === "other" && source === "estimated") throw new Error("Other activities need manually entered active calories.");
  if (activity.value === "other" && (typeof value.name !== "string" || !value.name.trim() || value.name.trim().length > 120)) throw new Error("name is required for other activities (up to 120 characters).");
  const steps = value.steps == null ? "" : String(value.steps);
  const duration = value.duration_minutes == null ? "" : String(value.duration_minutes);
  const kcal = value.active_kcal == null ? "" : String(value.active_kcal);
  if (steps && (activity.value !== "walking" || !Number.isInteger(value.steps) || value.steps < 1 || value.steps > 100000)) throw new Error("steps must be 1–100,000 whole steps from a walking session.");
  if (duration && (typeof value.duration_minutes !== "number" || value.duration_minutes < 1 || value.duration_minutes > 1440)) throw new Error("duration_minutes must be 1–1,440 minutes.");
  if (source === "estimated" && !duration && !steps) throw new Error("Estimated activity needs a duration or walking-session steps.");
  if (source === "estimated" && kcal) throw new Error("Omit active_kcal for an estimated activity; the app calculates it.");
  if (source === "manual" && (typeof value.active_kcal !== "number" || value.active_kcal < 0.01 || value.active_kcal > 10000)) throw new Error("Manual activity needs active_kcal between 0.01 and 10,000.");
  return { date, activity_type: activity.value, name: activity.value === "other" ? value.name.trim() : "", source, steps, duration_minutes: duration, active_kcal: kcal };
}

export default function ActivityDialog({ activity, date, weights = [], onSave, onClose, restoreFocus }) {
  const [draft, setDraft] = useState(() => ({
    date: activity?.date || date,
    activity_type: activity?.activity_type || "walking",
    name: activity?.name || "",
    source: activity?.source || "estimated",
    steps: activity?.steps == null ? "" : String(activity.steps),
    duration_minutes: activity?.duration_assumed ? "" : activity?.duration_minutes == null ? "" : String(activity.duration_minutes),
    active_kcal: activity ? String(activity.active_kcal) : "",
  }));
  const [entryMode, setEntryMode] = useState("manual");
  const [jsonText, setJsonText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const selected = activities.find((item) => item.value === draft.activity_type);
  const estimated = draft.source === "estimated" && draft.activity_type !== "other";
  const unchangedEstimate = estimated && activity?.source === "estimated" &&
    draft.date === activity.date && draft.activity_type === activity.activity_type &&
    draft.steps === String(activity.steps ?? "") &&
    draft.duration_minutes === (activity.duration_assumed ? "" : String(activity.duration_minutes ?? ""));
  const latestWeight = [...weights].reverse().find((entry) => entry.date <= draft.date)?.weight_kg;
  const estimateWeight = unchangedEstimate ? activity.weight_kg_used : latestWeight;
  const minutes = Number(draft.duration_minutes || (draft.activity_type === "walking" ? Number(draft.steps) / 100 : 0));
  const preview = unchangedEstimate ? Number(activity.active_kcal) : estimated && Number(estimateWeight) > 0 && minutes > 0
    ? Math.round((selected.met - 1) * Number(estimateWeight) * minutes / 60 * 100) / 100
    : null;

  function change(name, value) {
    setDraft((current) => ({ ...current, [name]: value }));
    setError("");
  }

  function applyJson() {
    try {
      setDraft(parseActivityJson(jsonText, draft.date));
      setEntryMode("manual");
      setError("");
    } catch (issue) {
      setError(issue.message);
    }
  }

  async function save(event) {
    event.preventDefault();
    if (saving) return;
    if (entryMode === "json") return setError("Use the pasted JSON in the form before saving.");
    if (!draft.date || draft.date > today()) return setError("Choose today or an earlier date.");
    if (estimated && !estimateWeight) return setError("Log a weight on or before this date, or enter active calories manually.");
    if (estimated && (!minutes || minutes < 1 || minutes > 1440)) return setError("Enter 1–1,440 minutes, or enough walking steps for at least one minute.");
    if (draft.steps && (!Number.isInteger(Number(draft.steps)) || Number(draft.steps) < 1 || Number(draft.steps) > 100000)) return setError("Enter 1–100,000 walking-session steps.");
    if (draft.duration_minutes && (Number(draft.duration_minutes) < 1 || Number(draft.duration_minutes) > 1440)) return setError("Enter 1–1,440 minutes.");
    if (!estimated && (!Number(draft.active_kcal) || Number(draft.active_kcal) < 0.01 || Number(draft.active_kcal) > 10000)) return setError("Enter 0.01–10,000 active kcal.");
    if (draft.activity_type === "other" && !draft.name.trim()) return setError("Name the activity.");
    setSaving(true);
    setError("");
    try {
      const body = {
        date: draft.date,
        activity_type: draft.activity_type,
        name: draft.activity_type === "other" ? draft.name.trim() : selected.label,
        source: estimated ? "estimated" : "manual",
        steps: draft.activity_type === "walking" && draft.steps ? Number(draft.steps) : null,
        duration_minutes: draft.duration_minutes
          ? Number(draft.duration_minutes)
          : !estimated && activity?.duration_assumed && activity.activity_type === draft.activity_type && String(activity.steps ?? "") === draft.steps
            ? Number(activity.duration_minutes)
            : null,
        ...(!estimated ? { active_kcal: Number(draft.active_kcal) } : {}),
      };
      await onSave(body, activity?.id);
      onClose();
    } catch (issue) {
      setError(issue.message || "Could not save this activity.");
    } finally {
      setSaving(false);
    }
  }

  return <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose(); }}>
    <DialogContent className="personal-dashboard max-h-[90vh] overflow-y-auto sm:max-w-2xl" onCloseAutoFocus={restoreFocus}>
      <DialogHeader>
        <DialogTitle>{activity ? "Edit activity" : "Add activity"}</DialogTitle>
        <DialogDescription>Record one activity session. Active burn is estimated unless you enter it manually.</DialogDescription>
      </DialogHeader>
      <form noValidate onSubmit={save} className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="w-full space-y-1.5 sm:w-44"><Label htmlFor="nutrition-activity-date">Date</Label><Input id="nutrition-activity-date" type="date" value={draft.date} max={today()} onChange={(event) => change("date", event.target.value)} disabled={saving} required /></div>
          <div className="inline-flex rounded-md border border-[var(--pd-border)] bg-slate-50 p-1" aria-label="Entry method">
            {["manual", "json"].map((mode) => <button key={mode} type="button" aria-pressed={entryMode === mode} className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pd-primary)] ${entryMode === mode ? "bg-white text-[var(--pd-primary)] shadow-sm" : "text-slate-600 hover:text-slate-950"}`} onClick={() => { setEntryMode(mode); setError(""); }}>{mode === "manual" ? <PencilLine className="size-4" aria-hidden="true" /> : <FileJson className="size-4" aria-hidden="true" />}{mode === "manual" ? "Manual entry" : "Paste JSON"}</button>)}
          </div>
        </div>
        {entryMode === "json" ? <div className="space-y-3">
          <div className="space-y-1.5"><div className="flex flex-wrap items-center justify-between gap-2"><Label htmlFor="nutrition-activity-json">Activity JSON</Label><CopyAiFormatButton prompt={activityAiFormat(draft.date)} disabled={saving} /></div><Textarea id="nutrition-activity-json" value={jsonText} onChange={(event) => { setJsonText(event.target.value); setError(""); }} placeholder={JSON.stringify({ date: draft.date, activity_type: "walking", source: "estimated", steps: 3000, duration_minutes: 30 }, null, 2)} className="min-h-44 resize-y font-mono text-xs" aria-invalid={Boolean(error)} aria-describedby={error ? "nutrition-activity-error" : undefined} /></div>
          <p className="text-xs text-slate-600">The JSON date replaces the selected date. If omitted, the date above is used. Apply the JSON, review the populated fields, then save.</p>
          <Button type="button" variant="outline" onClick={applyJson} disabled={!jsonText.trim()}><FileJson className="size-4" aria-hidden="true" />Use JSON in form</Button>
        </div> : <>
          <div className="space-y-1.5"><Label htmlFor="nutrition-activity-type">Activity</Label><SelectableField id="nutrition-activity-type" label="Activity" options={activities} value={draft.activity_type} onChange={(value) => { setDraft((current) => ({ ...current, activity_type: value, source: value === "other" ? "manual" : current.source, name: value === "other" && value !== current.activity_type ? "" : current.name, steps: value === current.activity_type ? current.steps : "", duration_minutes: value === current.activity_type ? current.duration_minutes : "" })); setError(""); }} disabled={saving} required /></div>
          {draft.activity_type !== "other" && <div className="space-y-1.5 sm:[&_fieldset>div]:grid-cols-2"><Label>Burn calculation</Label><SelectableField id="nutrition-activity-source" label="Burn calculation" options={modes} value={draft.source} onChange={(value) => change("source", value)} disabled={saving} required /></div>}
          {draft.activity_type === "other" && <div className="space-y-1.5"><Label htmlFor="nutrition-activity-name">Activity name *</Label><Input id="nutrition-activity-name" maxLength={120} value={draft.name} onChange={(event) => change("name", event.target.value)} disabled={saving} required /></div>}
          <div className="grid gap-4 sm:grid-cols-2">
            {draft.activity_type === "walking" && <div className="space-y-1.5"><Label htmlFor="nutrition-activity-steps">Steps in this walk</Label><Input id="nutrition-activity-steps" type="number" min="1" max="100000" step="1" value={draft.steps} onChange={(event) => change("steps", event.target.value)} disabled={saving} /><p className="text-xs text-slate-600">Not your phone’s all-day step count.</p></div>}
            {draft.activity_type !== "other" && <div className="space-y-1.5"><Label htmlFor="nutrition-activity-duration">Duration (minutes){draft.activity_type === "walking" || !estimated ? " · optional" : " *"}</Label><Input id="nutrition-activity-duration" type="number" min="1" max="1440" step="0.01" value={draft.duration_minutes} onChange={(event) => change("duration_minutes", event.target.value)} disabled={saving} /><p className="text-xs text-slate-600">{draft.activity_type === "walking" ? "If blank, estimate 100 steps per minute." : "Use the active part of the session."}</p></div>}
            {!estimated && <div className="space-y-1.5"><Label htmlFor="nutrition-activity-kcal">Active calories burned (kcal) *</Label><Input id="nutrition-activity-kcal" type="number" min="0.01" max="10000" step="0.01" value={draft.active_kcal} onChange={(event) => change("active_kcal", event.target.value)} disabled={saving} required /></div>}
          </div>
          {estimated && <div className="flex items-start gap-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-2.5 text-sm text-slate-800" role="status"><Info className="mt-0.5 size-4 shrink-0 text-[var(--pd-primary)]" aria-hidden="true" /><span>{estimateWeight ? preview != null ? <>{unchangedEstimate ? "Saved estimate" : "Estimated active burn"}: <strong className="tabular-nums">{number(preview)} kcal</strong> using {number(estimateWeight)} kg{!draft.duration_minutes && draft.activity_type === "walking" ? " and 100 steps/minute" : ""}. {unchangedEstimate ? "Changing the activity inputs recalculates it." : "The saved value is calculated by the server."}</> : "Enter a duration or walking-session steps to preview the estimate." : "No weight reading on or before this date. Log one first, or enter active calories manually."}</span></div>}
        </>}
        {error && <p id="nutrition-activity-error" role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">{error}</p>}
        <DialogFooter><Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button><Button type="submit" disabled={saving || entryMode === "json"}><Save className="size-4" aria-hidden="true" />{saving ? "Saving…" : "Save activity"}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
