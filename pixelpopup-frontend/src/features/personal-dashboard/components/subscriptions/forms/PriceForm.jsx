import FormModalShell from "../../forms/FormModalShell";
import useServiceForm from "./useServiceForm";
import Fields, { date, numeric } from "./ServiceFormFields";
import { servicePath } from "../../../subscriptions/api";
import { today } from "../../../lib/format";

export default function PriceForm({ service, dashboard, notify, onSaved, onCancel }) {
  const form = useServiceForm({ initial: { amount: service.amount || "", effective_date: today() }, dashboard, path: servicePath(service.id, "prices/"), notify, onSaved });
  return <FormModalShell title="Record a price change" description="Only open, unpaid future renewals use the new applicable price. Confirmed bills and past payments stay unchanged." {...form} onCancel={onCancel} saveLabel="Save price version" onSubmit={form.submit((v) => ({ ...v, expected_revision: service.revision }), ["amount", "effective_date"])}><Fields form={form} fields={[numeric("amount", "New fixed price (PHP)", { required: true, min: "0.01" }), date("effective_date", "Effective from", { required: true })]} /></FormModalShell>;
}
