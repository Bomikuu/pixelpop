import { CircleAlert, CircleCheck, FileJson2, Info } from "lucide-react";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { today } from "../../lib/format";
import { eodAiFormat } from "../../lib/aiJsonFormats";
import CopyAiFormatButton from "../forms/CopyAiFormatButton";

export default function EodImportForm({ rawJson, onChange, preview, disabled, groupName }) {
  return <div className="space-y-4">
    <div className="flex gap-2 border border-blue-100 bg-blue-50 p-3 text-sm leading-6 text-blue-900"><Info className="mt-0.5 shrink-0" size={16} aria-hidden="true" /><p>Entries without a group use <strong>{groupName}</strong>. Add a top-level <code>group</code> or an entry-level <code>group</code> name to override it. Create new groups before importing.</p></div>
    <div><div className="mb-2 flex flex-wrap items-center justify-between gap-2"><Label htmlFor="eod-json">EOD JSON</Label><CopyAiFormatButton prompt={eodAiFormat(groupName, today())} disabled={disabled} /></div><Textarea id="eod-json" rows={12} value={rawJson} onChange={(event) => onChange(event.target.value)} spellCheck={false} disabled={disabled} placeholder={'{"group":"Personal","entries":[{"date":"2026-09-30","type":"workday","title":"Daily recap","summary":"Finished the planned work.","items":["Reviewed changes"],"in_progress":["Document the follow-up"]}]}'} className="font-mono text-xs" /></div>
    {preview && <section aria-live="polite" className="border border-slate-200 bg-slate-50 p-4"><h3 className="flex items-center gap-2 text-sm font-semibold text-slate-950"><FileJson2 size={16} aria-hidden="true" /> Preview</h3><p className="mt-2 text-xs text-slate-700">{preview.counts.create} to add · {preview.counts.skip} already saved · {preview.counts.error} errors</p>
      {preview.errors?.map((error, index) => <p key={index} className="mt-2 flex gap-2 text-xs text-red-800"><CircleAlert size={14} className="shrink-0" aria-hidden="true" />{error}</p>)}
      <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto">{preview.rows?.map((row, index) => <li key={index} className="flex gap-2 border-t border-slate-200 py-2 text-xs text-slate-700">{row.action === "error" ? <CircleAlert size={14} className="shrink-0 text-red-700" aria-hidden="true" /> : <CircleCheck size={14} className="shrink-0 text-blue-700" aria-hidden="true" />}<span><strong>{row.group || "Unknown group"} · {row.date || "No date"}</strong> — {row.action === "create" ? "Add" : row.action === "skip" ? "Already saved" : "Needs a fix"}{row.errors?.length > 0 && <span className="block text-red-800">{row.errors.join(" · ")}</span>}</span></li>)}</ul>
    </section>}
  </div>;
}
