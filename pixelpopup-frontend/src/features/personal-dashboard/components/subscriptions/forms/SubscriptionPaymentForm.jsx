import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import FormModalShell from "../../forms/FormModalShell";
import AccountBalancePreview, { accountChoiceOption, accountProjection } from "../../AccountBalancePreview";
import { useRecords } from "../../../hooks/useDashboardData";
import useServiceForm from "./useServiceForm";
import Fields, { date, numeric, select } from "./ServiceFormFields";
import { servicePath } from "../../../subscriptions/api";
import { money, today } from "../../../lib/format";
import { option } from "../../../subscriptions/model";
import { Button } from "../../../ui/button";

export default function SubscriptionPaymentForm({ service, cycle, dashboard, notify, onSaved, onCancel }) {
  const [candidatePage, setCandidatePage] = useState(1);
  const form = useServiceForm({ initial: { mode: "new", amount: cycle.remaining ?? "", account: service.account ? String(service.account) : "", date: today(), payment_method: service.payment_method || "bank", transaction: "", confirm_existing_transaction: "no" }, dashboard, expectedRevision: cycle.revision, path: servicePath(service.id, `cycles/${cycle.id}/pay/`), notify, onSaved, message: "Payment saved. The bill and account history are up to date." });
  const candidates = useRecords(servicePath(service.id, `cycles/${cycle.id}/payment-candidates/?page=${candidatePage}`), dashboard.request, dashboard.version);
  const account = dashboard.data.accounts.find((a) => String(a.id) === form.values.account);
  const blocked = cycle.needs_review || (form.values.mode === "new" && accountProjection(account, form.values.amount)?.blocked);
  const selected = candidates.data?.results.find((t) => String(t.id) === form.values.transaction);
  useEffect(() => { form.set("confirm_existing_transaction", "no"); }, [form.values.transaction]);
  return <FormModalShell title="Record bill payment" description={`Confirmed / fixed bill: ${money(cycle.bill_amount)} · Paid: ${money(cycle.paid)} · Remaining: ${money(cycle.remaining)}. Estimates are never charged.`} {...form} onCancel={onCancel} submitDisabled={blocked || (form.values.mode === "existing" && (!selected || form.values.confirm_existing_transaction !== "yes"))} saveLabel={form.values.mode === "existing" ? "Link existing expense" : "Save payment"} scrollBody onSubmit={form.submit((v) => v.mode === "existing" ? { transaction: Number(v.transaction), confirm_existing_transaction: v.confirm_existing_transaction === "yes", request_id: true } : { amount: v.amount, account: Number(v.account), date: v.date, payment_method: v.payment_method, request_id: true }, form.values.mode === "existing" ? ["transaction"] : ["amount", "account", "date"])}>
    <Fields form={form} fields={[select("mode", "Payment source", [option("new", "New payment"), option("existing", "Link recorded expense")])]} />
    {form.values.mode === "new" ? <>
      <Fields form={form} fields={[numeric("amount", "Amount to pay (PHP)", { required: true, min: "0.01", max: cycle.remaining }), date("date", "Payment date", { required: true, max: today() }), select("payment_method", "Payment method", ["cash", "bank", "credit_card", "debit_card", "gcash", "maya", "other"].map((v) => option(v, v.replaceAll("_", " ")))), select("account", "Pay from account", dashboard.data.accounts.filter((a) => a.active && a.kind !== "fund").map(accountChoiceOption), { required: true, source: "accounts" })]} />
      <AccountBalancePreview account={account} amount={form.values.amount} />
    </> : <>
      {candidates.loading ? <p role="status">Loading eligible expenses…</p> : candidates.error ? <p role="alert" className="text-red-800">{candidates.error}</p> : <>
        <Fields form={form} fields={[select("transaction", "Existing ordinary expense", [option("", "Select an expense"), ...candidates.data.results.map((t) => option(t.id, `${t.date} · ${t.name} · ${money(t.amount)} · ${t.account__name}`))], { required: true })]} />
        <div className="flex items-center justify-end gap-2"><Button type="button" variant="outline" disabled={candidatePage === 1 || form.busy} onClick={() => { setCandidatePage((p) => p - 1); form.set("transaction", ""); }}>Previous</Button><span className="text-xs">Page {candidatePage}</span><Button type="button" variant="outline" disabled={!candidates.data.next || form.busy} onClick={() => { setCandidatePage((p) => p + 1); form.set("transaction", ""); }}>Next</Button></div>
      </>}
      {selected && <p className="text-sm text-slate-700">{selected.name} · {selected.date} · {selected.account__name} · {selected.category__name || "Uncategorized"} · {money(selected.amount)}</p>}
      <Fields form={form} fields={[select("confirm_existing_transaction", "I reviewed the existing expense details", [option("no", "Not yet"), option("yes", "Yes, link without another charge")])]} />
      <p className="flex gap-2 text-sm text-slate-600"><Info size={16} className="shrink-0" />The whole expense is linked. Its original category, account, amount and date stay unchanged.</p>
    </>}
  </FormModalShell>;
}
