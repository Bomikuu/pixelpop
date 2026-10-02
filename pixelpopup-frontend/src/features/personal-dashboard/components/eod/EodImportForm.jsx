import { CircleAlert, CircleCheck, FileJson2, Info, RefreshCw, ShieldCheck } from "lucide-react";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { today } from "../../lib/format";
import { eodAiFormat } from "../../lib/aiJsonFormats";
import CopyAiFormatButton from "../forms/CopyAiFormatButton";

export default function EodImportForm({ rawJson, onChange, preview, disabled, groupName, replaceRows, onResolutionChange }) {
  const replacing = replaceRows.length;
  const retaining = (preview?.counts.skip || 0) - replacing;

  return <div className="space-y-4">
    <div className="flex gap-2 border border-blue-100 bg-blue-50 p-3 text-sm leading-6 text-blue-900"><Info className="mt-0.5 shrink-0" size={16} aria-hidden="true" /><p>Entries without a group use <strong>{groupName}</strong>. Add a top-level <code>group</code> or an entry-level <code>group</code> name to override it. Create new groups before importing.</p></div>
    <div><div className="mb-2 flex flex-wrap items-center justify-between gap-2"><Label htmlFor="eod-json">EOD JSON</Label><CopyAiFormatButton prompt={eodAiFormat(groupName, today())} disabled={disabled} /></div><Textarea id="eod-json" rows={12} value={rawJson} onChange={(event) => onChange(event.target.value)} spellCheck={false} disabled={disabled} placeholder={'{"group":"Personal","entries":[{"date":"2026-09-30","type":"workday","title":"Daily recap","summary":"Finished the planned work.","items":["Reviewed changes"],"in_progress":["Document the follow-up"]}]}'} className="font-mono text-xs" /></div>
    {preview && <section className="border border-slate-200 bg-slate-50 p-4"><h3 className="flex items-center gap-2 text-sm font-semibold text-slate-950"><FileJson2 size={16} aria-hidden="true" /> Preview</h3><p aria-live="polite" className="mt-2 text-xs text-slate-700">{preview.counts.create} to add · {replacing} to replace · {retaining} to retain · {preview.counts.error} errors</p>
      {preview.counts.skip > 0 && <p className="mt-2 text-xs leading-5 text-slate-700">Existing dates default to Retain. Replace uses the pasted JSON; omitted optional fields become empty.</p>}
      {preview.errors?.map((error, index) => <p key={index} className="mt-2 flex gap-2 text-xs text-red-800"><CircleAlert size={14} className="shrink-0" aria-hidden="true" />{error}</p>)}
      <ul className="mt-3 max-h-64 space-y-1 overflow-y-auto">{preview.rows?.map((row, index) => <li key={index} className="flex min-w-0 gap-2 border-t border-slate-200 py-2 text-xs text-slate-700">
        {row.action === "error" ? <CircleAlert size={14} className="mt-0.5 shrink-0 text-red-700" aria-hidden="true" /> : <CircleCheck size={14} className="mt-0.5 shrink-0 text-blue-700" aria-hidden="true" />}
        <div className="min-w-0 flex-1"><p className="break-words"><strong>{row.group || "Unknown group"} · {row.date || "No date"}</strong> — {row.action === "create" ? "Add" : row.action === "skip" ? "Already saved" : "Needs a fix"}</p>
          {row.errors?.length > 0 && <p className="mt-1 text-red-800">{row.errors.join(" · ")}</p>}
          {row.action === "skip" && <fieldset className="mt-2 flex flex-wrap gap-2"><legend className="sr-only">Choose whether to retain or replace {row.group} on {row.date}</legend>
            <label className={`inline-flex min-h-9 cursor-pointer items-center gap-1.5 border px-2.5 text-xs font-medium ${!replaceRows.includes(index) ? "border-blue-500 bg-blue-50 text-blue-900" : "border-slate-200 bg-white text-slate-700"}`}><input type="radio" name={`eod-resolution-${index}`} checked={!replaceRows.includes(index)} onChange={() => onResolutionChange(index, false)} disabled={disabled} className="accent-blue-600" /><ShieldCheck size={14} aria-hidden="true" />Retain saved</label>
            <label className={`inline-flex min-h-9 cursor-pointer items-center gap-1.5 border px-2.5 text-xs font-medium ${replaceRows.includes(index) ? "border-blue-500 bg-blue-50 text-blue-900" : "border-slate-200 bg-white text-slate-700"}`}><input type="radio" name={`eod-resolution-${index}`} checked={replaceRows.includes(index)} onChange={() => onResolutionChange(index, true)} disabled={disabled} className="accent-blue-600" /><RefreshCw size={14} aria-hidden="true" />Replace with JSON</label>
          </fieldset>}
        </div>
      </li>)}</ul>
    </section>}
  </div>;
}
