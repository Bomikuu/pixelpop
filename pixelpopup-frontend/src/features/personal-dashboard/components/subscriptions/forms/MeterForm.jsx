import FormModalShell from "../../forms/FormModalShell";
import useServiceForm from "./useServiceForm";
import Fields, { date, numeric, text } from "./ServiceFormFields";
import { servicePath } from "../../../subscriptions/api";

export default function MeterForm({ service, record, dashboard, notify, onSaved, onCancel }) {
  const form = useServiceForm({ initial: { name: record?.name || "", unit: record?.unit || (service.service_type === "water" ? "m³" : service.service_type === "electricity" ? "kWh" : "units"), rollover_modulus: record?.rollover_modulus || "", active_from: record?.active_from || "", active_until: record?.active_until || "" }, dashboard, path: servicePath(service.id, `meters/${record ? record.id + "/" : ""}`), notify, onSaved });
  return <FormModalShell title={record ? "Edit meter" : "Add meter"} description="Create separate meters for different devices. A reset or replacement is recorded explicitly, not as negative consumption." {...form} onCancel={onCancel} saveLabel="Save meter" onSubmit={form.submit((v) => ({ ...v, rollover_modulus: v.rollover_modulus || null, active_from: v.active_from || null, active_until: v.active_until || null, ...(record ? { expected_revision: record.revision } : {}) }), ["name", "unit"])}><Fields form={form} fields={[text("name", "Meter name", { required: true }), text("unit", "Unit", { required: true, maxLength: 20 }), numeric("rollover_modulus", "Rollover modulus (optional)", { step: "0.000001", hint: "The value at which the display resets to zero." }), date("active_from", "Active from (optional)"), date("active_until", "Active until (optional)")]} /></FormModalShell>;
}
