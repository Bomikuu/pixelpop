import FormModalShell from "../../forms/FormModalShell";
import useServiceForm from "./useServiceForm";
import Fields, { numeric, text } from "./ServiceFormFields";
import { manilaNow, manilaInstant } from "../../../subscriptions/model";
import { servicePath } from "../../../subscriptions/api";

export default function MeterReadingForm({ service, meter, record, dashboard, notify, onSaved, onCancel }) {
  const local = record ? new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).format(new Date(record.recorded_at)).replace(" ", "T") : manilaNow();
  const form = useServiceForm({ initial: { value: record?.value ?? "", recorded_at: local, note: record?.note || "" }, dashboard, path: servicePath(service.id, `meters/${meter.id}/readings/${record ? record.id + "/" : ""}`), notify, onSaved, message: "Meter reading saved. Projections refreshed; recorded bills are unchanged." });
  return <FormModalShell title={record ? "Correct meter reading" : `Record ${meter.name}`} description={`Enter the cumulative meter value in ${meter.unit}, not consumption since last time. Dates and times use Asia/Manila.`} {...form} onCancel={onCancel} saveLabel="Save reading" onSubmit={form.submit((v) => ({ ...v, recorded_at: manilaInstant(v.recorded_at), request_id: true, ...(record ? { expected_revision: record.revision } : {}) }), ["value", "recorded_at"])} scrollBody><Fields form={form} fields={[numeric("value", `Meter value (${meter.unit})`, { required: true, step: "0.000001" }), text("recorded_at", "Date and time", { type: "datetime-local", max: manilaNow(), required: true }), text("note", "Reading note", { type: "textarea", maxLength: 1000 })]} /></FormModalShell>;
}
