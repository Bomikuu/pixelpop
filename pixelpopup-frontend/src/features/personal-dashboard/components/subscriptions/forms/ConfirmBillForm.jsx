import FormModalShell from "../../forms/FormModalShell";
import useServiceForm from "./useServiceForm";
import Fields, { numeric } from "./ServiceFormFields";
import { servicePath } from "../../../subscriptions/api";
import { money } from "../../../lib/format";

export default function ConfirmBillForm({ service, cycle, dashboard, notify, onSaved, onCancel }) {
  const form = useServiceForm({ initial: { actual_amount: cycle.actual_amount ?? cycle.bill_amount ?? "", reported_consumption: cycle.reported_consumption ?? "" }, dashboard, path: servicePath(service.id, `cycles/${cycle.id}/confirm/`), notify, onSaved, message: "Actual bill confirmed. No payment has been posted." });
  return <FormModalShell title="Confirm actual bill" description={`Due ${cycle.due_date}. Already paid: ${money(cycle.paid)}. Confirming a bill never charges an account. Zero means nothing due.`} {...form} onCancel={onCancel} saveLabel="Confirm bill" onSubmit={form.submit((v) => ({ ...v, reported_consumption: v.reported_consumption || null, expected_revision: cycle.revision }), ["actual_amount"])}><Fields form={form} fields={[numeric("actual_amount", "Actual billed amount (PHP)", { required: true }), numeric("reported_consumption", "Consumption shown on bill (optional)", { step: "0.000001" })]} /></FormModalShell>;
}
