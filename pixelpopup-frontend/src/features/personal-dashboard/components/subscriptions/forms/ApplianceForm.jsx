import FormModalShell from "../../forms/FormModalShell";
import useServiceForm from "./useServiceForm";
import Fields, { text, numeric, select } from "./ServiceFormFields";
import { servicePath } from "../../../subscriptions/api";
import { option } from "../../../subscriptions/model";

export default function ApplianceForm({ service, record, dashboard, notify, onSaved, onCancel }) {
  const form = useServiceForm({ initial: { name: record?.name || "", watts: record?.watts ?? "", hours_per_day: record?.hours_per_day ?? "", days_used: String(record?.days_used ?? 30), quantity: String(record?.quantity ?? 1), active: record?.active === false ? "no" : "yes" }, dashboard, path: servicePath(service.id, `appliances/${record ? record.id + "/" : ""}`), notify, onSaved });
  return <FormModalShell title={record ? "Edit appliance" : "Add appliance"} description="A planning estimate, not measured consumption. Appliances never create meter readings or expenses." {...form} onCancel={onCancel} saveLabel="Save appliance" onSubmit={form.submit((v) => ({ ...v, days_used: Number(v.days_used), quantity: Number(v.quantity), active: v.active === "yes" }), ["name", "watts", "hours_per_day", "days_used", "quantity"])}><Fields form={form} fields={[text("name", "Appliance", { required: true }), numeric("watts", "Power (watts)", { required: true, step: "0.000001" }), numeric("hours_per_day", "Hours per day", { required: true, max: "24", step: "0.000001" }), numeric("days_used", "Days used in selected period", { required: true, step: "1" }), numeric("quantity", "Quantity", { required: true, step: "1", min: "1", max: "1000" }), select("active", "Include in estimates", [option("yes", "Yes"), option("no", "No")])]} /></FormModalShell>;
}
