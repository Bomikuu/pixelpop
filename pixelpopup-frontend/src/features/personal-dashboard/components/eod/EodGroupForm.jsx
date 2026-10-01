import { Input } from "../../ui/input";
import { Label } from "../../ui/label";

export default function EodGroupForm({ name, onChange, error, disabled }) {
  return <div><Label htmlFor="eod-group-name" className="mb-2 block">Group name *</Label><Input id="eod-group-name" value={name} onChange={(event) => onChange(event.target.value)} maxLength={120} placeholder="Company, client, or personal area" disabled={disabled} aria-invalid={!!error} />{error && <p role="alert" className="mt-1 text-sm text-red-800">{error}</p>}<p className="mt-2 text-xs leading-5 text-slate-600">Entries are separate for each group, even when they share a date.</p></div>;
}
