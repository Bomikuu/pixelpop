import FormField from "../../forms/FormField";
import { Button } from "../../../ui/button";

export default function ServiceFormFields({ form, fields }) {
  return <><div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
    {fields.map((field) => <FormField key={field.name} field={field} values={form.values} options={field.options || []} error={form.errors[field.name]} disabled={form.busy} onChange={form.set} idPrefix="service" />)}
  </div>{form.conflict && <div className="space-y-2 text-sm"><p>Your unsaved values are kept. Review the newer saved record before trying again.</p><Button variant="outline" type="button" onClick={form.refreshSaved}>Copy draft & refresh saved data</Button></div>}</>;
}
export const text = (name, label, extra = {}) => ({ name, label, type: "text", ...extra });
export const numeric = (name, label, extra = {}) => ({ name, label, type: "number", min: "0", step: "0.01", ...extra });
export const date = (name, label, extra = {}) => ({ name, label, type: "date", ...extra });
export const select = (name, label, options, extra = {}) => ({ name, label, type: "select", options, ...extra });
