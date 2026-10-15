import { useRef, useState } from "react";
import { Calculator, Copy } from "lucide-react";
import FormModalShell from "../../forms/FormModalShell";
import useServiceForm from "./useServiceForm";
import Fields, { date, numeric, text, select } from "./ServiceFormFields";
import { servicePath } from "../../../subscriptions/api";
import { option } from "../../../subscriptions/model";
import { money, today } from "../../../lib/format";
import { Button } from "../../../ui/button";

const example = { flat_rate: "11.000000", minimum_usage_charge: "0", charges: [{ name: "Fixed service fee", kind: "fixed", amount: "100", base: "subtotal" }] };
export default function TariffForm({ service, dashboard, notify, onSaved, onCancel }) {
  const form = useServiceForm({ initial: { name: "Utility rate", effective_date: today(), mode: "flat", flat_rate: "", fixed_fee: "", minimum: "", config: JSON.stringify(example, null, 2), preview_usage: "100" }, dashboard, path: servicePath(service.id, "tariffs/"), notify, onSaved, message: "Rate version saved. Apply it explicitly to an open billing period." });
  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState("");
  const [previewBusy, setPreviewBusy] = useState(false);
  const draft = useRef(""); draft.current = JSON.stringify(form.values);
  const config = (v) => v.mode === "advanced" ? JSON.parse(v.config) : { flat_rate: v.flat_rate, minimum_usage_charge: v.minimum || "0", charges: v.fixed_fee ? [{ name: "Fixed service fee", kind: "fixed", amount: v.fixed_fee, base: "subtotal" }] : [] };
  const calculate = async () => {
    const signature = draft.current;
    setPreviewBusy(true); setPreviewError(""); setPreview(null);
    try { const result = await dashboard.request(servicePath(service.id, "tariff-preview/"), { method: "POST", body: { usage: form.values.preview_usage, config: config(form.values) } }); if (draft.current === signature) setPreview({ signature, result }); }
    catch (error) { if (draft.current === signature) setPreviewError(error.message); }
    finally { setPreviewBusy(false); }
  };
  return <FormModalShell title="Add utility rate version" description="Use your provider's actual tariff. Fees are charged once per cycle. Saved versions remain unchanged in historical bills." {...form} onCancel={onCancel} saveLabel="Save rate version" scrollBody onSubmit={form.submit((v) => ({ name: v.name, effective_date: v.effective_date, config: config(v), expected_revision: service.revision }), ["name", "effective_date", ...(form.values.mode === "flat" ? ["flat_rate"] : ["config"])])}>
    <Fields form={form} fields={[text("name", "Rate name", { required: true }), date("effective_date", "Effective from", { required: true }), select("mode", "Rate setup", [option("flat", "Flat rate + fees"), option("advanced", "Tiered / advanced JSON")]), ...(form.values.mode === "flat" ? [numeric("flat_rate", "PHP per unit", { required: true, step: "0.000001" }), numeric("fixed_fee", "Fixed cycle fee (PHP)"), numeric("minimum", "Minimum usage charge (PHP)")] : [text("config", "Tariff JSON", { type: "textarea", maxLength: 20000, className: "min-h-48 font-mono", hint: 'Use flat_rate OR tiers: [{"up_to":"10","rate":"5"},{"up_to":null,"rate":"8"}]. Charges: kind fixed / per_unit / percent; percentage base usage / subtotal. Decimal values must be strings.' })])]} />
    {form.values.mode === "advanced" && <Button type="button" variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(form.values.config); notify("Tariff JSON copied."); } catch { notify("Clipboard unavailable. Select and copy the JSON.", { tone: "error" }); } }}><Copy size={15} />Copy JSON</Button>}
    <div className="flex flex-wrap items-end gap-3"><div className="max-w-60"><Fields form={form} fields={[numeric("preview_usage", "Preview consumption", { step: "0.000001" })]} /></div><Button type="button" variant="outline" disabled={previewBusy} onClick={calculate}><Calculator size={15} />{previewBusy ? "Calculating…" : "Preview rate"}</Button></div>
    {previewError && <p role="alert" className="text-red-800">{previewError}</p>}
    {preview?.signature === draft.current && <div role="status" className="space-y-2 rounded-md bg-slate-50 p-3 text-sm">{preview.result.lines?.map((line, index) => <p key={index}>{line.name || line.label || "Charge"}: {money(line.amount)}</p>)}<p>Total preview: {money(preview.result.total)} · no balances changed</p></div>}
  </FormModalShell>;
}
