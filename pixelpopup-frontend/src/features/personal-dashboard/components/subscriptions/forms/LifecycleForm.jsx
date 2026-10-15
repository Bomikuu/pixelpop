import FormModalShell from "../../forms/FormModalShell";
import useServiceForm from "./useServiceForm";
import Fields, { date } from "./ServiceFormFields";
import { servicePath } from "../../../subscriptions/api";
import { titleCase } from "../../../subscriptions/model";
import { today } from "../../../lib/format";

export default function LifecycleForm({ service, ids, action, dashboard, notify, onSaved, onCancel }) {
  const form = useServiceForm({ initial: { effective_date: today(), next_start: today() }, dashboard, path: ids ? "subscriptions/bulk-lifecycle/" : servicePath(service.id, "lifecycle/"), notify, onSaved });
  return <FormModalShell title={`${titleCase(action)} ${ids ? ids.length + " selected services" : service.title}?`} description="Previously confirmed bills and payments remain available. Pause / cancel excludes only unconfirmed, unpaid future obligations. Archive changes list visibility only. Resume uses the next renewal date without billing the paused gap." {...form} onCancel={onCancel} saveLabel={`Confirm ${action}`} onSubmit={form.submit((v) => ({ action, effective_date: v.effective_date, ...(action === "resume" ? { next_start: v.next_start } : {}), ...(ids ? { ids } : {}), request_id: true }), [action === "resume" ? "next_start" : "effective_date"])}><Fields form={form} fields={[action === "resume" ? date("next_start", "Next renewal date", { required: true, min: today() }) : date("effective_date", "Effective date", { required: true, max: today() })]} /></FormModalShell>;
}
