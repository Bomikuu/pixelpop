import FormField from "../../forms/FormField";
import CopyAiFormatButton from "../../forms/CopyAiFormatButton";
import { brainstormAiFormat } from "../../../lib/aiJsonFormats";

export default function ImportForm({ rawJson, onChange, preview, busy }) {
  return <div className="space-y-4">
    <FormField layout="plain" idPrefix="brainstorm"
      field={{ name: "json", label: "Brainstorm JSON", type: "textarea", maxLength: null, className: "min-h-64 font-mono text-xs", placeholder: '{ "boards": [ ... ] }' }}
      values={{ json: rawJson }} onChange={(_, value) => onChange(value)} disabled={busy}
      labelAction={<CopyAiFormatButton prompt={brainstormAiFormat()} disabled={busy} />} />
    <p className="text-xs text-slate-600">Existing ideas are never overwritten. Matching titles on the same board are skipped.</p>
    {preview && <div className="border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950">
      <p className="font-medium">Preview: {preview.boards} board(s), {preview.groups} group(s)</p>
      <p className="mt-1">{preview.created} new ideas · {preview.duplicates_skipped} duplicates skipped · {preview.invalid} invalid</p>
      {!!preview.errors?.length && <ul className="mt-2 max-h-32 list-disc overflow-y-auto pl-5 text-xs">
        {preview.errors.map((item, index) => <li key={index}>{item.location}: {item.reason}</li>)}
      </ul>}
    </div>}
  </div>;
}
