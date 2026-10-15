import FormModalShell from "../../forms/FormModalShell";
import useServiceForm from "./useServiceForm";
import Fields, { date, select } from "./ServiceFormFields";
import { servicePath } from "../../../subscriptions/api";
import { option } from "../../../subscriptions/model";

export default function CyclePeriodForm({ service, cycle, dashboard, notify, onSaved, onCancel }) {
  const form = useServiceForm({ initial: { period_start: cycle.period_start || "", period_end: cycle.period_end || "", billing_date: cycle.billing_date || "", tariff: cycle.tariff_id ? String(cycle.tariff_id) : "" }, dashboard, path: servicePath(service.id, `cycles/${cycle.id}/configure/`), notify, onSaved });
  return <FormModalShell title="Set billing period and rate" description="Use the actual consumption dates, not an assumed calendar month. The end boundary is exclusive. Review this rate before applying it to an open bill." {...form} onCancel={onCancel} saveLabel="Save billing period" onSubmit={form.submit((v) => ({ ...v, billing_date: v.billing_date || null, tariff: v.tariff ? Number(v.tariff) : null, expected_revision: cycle.revision }), ["period_start", "period_end"])}><Fields form={form} fields={[date("period_start", "Consumption starts", { required: true }), date("period_end", "Consumption ends (exclusive)", { required: true }), date("billing_date", "Bill issued (optional)"), select("tariff", "Rate version", [option("", "Latest applicable rate"), ...service.tariffs.map((r) => option(r.id, `${r.name} · ${r.effective_date}`))])]} /></FormModalShell>;
}
