import { useState } from "react";
import { Info, Receipt } from "lucide-react";
import FormModalShell from "../components/forms/FormModalShell";
import FormField from "../components/forms/FormField";
import AccountBalancePreview, { accountChoiceOption, accountProjection } from "../components/AccountBalancePreview";
import { useRecords } from "../hooks/useDashboardData";
import { dateLabel, money, today } from "../lib/format";
import { decimalAmount, toMinorUnits, formatMinorUnits } from "../quick-entry/money";
import { fieldMessage, useLoanWrite } from "./api";
import CashLoanAccountEffects from "./CashLoanAccountEffects";

export default function CashLoanPaymentDialog({ loan, installment, accounts, request, onSaved, onClose }) {
  const candidates = useRecords(`cash-loans/${loan.id}/payment-candidates/`, request, 0);
  const first = installment || loan.next_installment;
  const [values, setValues] = useState({ mode: "new", installment_id: first ? String(first.id) : "fee", movement_id: "", source_account_id: "", date: today(), amount: first?.remaining_due || loan.separate_fee_remaining, principal: first?.remaining.principal || "0", interest: first?.remaining.interest || "0", fees: first?.remaining.fees || loan.separate_fee_remaining });
  const [confirmPosting, setConfirmPosting] = useState(false);
  const write = useLoanWrite(request, onSaved);
  const item = loan.schedule.find((row) => String(row.id) === values.installment_id);
  const remaining = item?.remaining || { principal: "0", interest: "0", fees: loan.separate_fee_remaining };
  const payer = accounts.find((account) => String(account.id) === values.source_account_id);
  const card = accounts.find((account) => account.id === loan.card_id);
  const selectedPayment = candidates.data?.payments.find((row) => String(row.id) === values.movement_id);
  const change = (name, value) => {
    if (name === "installment_id") {
      const row = loan.schedule.find((record) => String(record.id) === value);
      setValues((old) => ({ ...old, installment_id: value, amount: row?.remaining_due || loan.separate_fee_remaining, principal: row?.remaining.principal || "0", interest: row?.remaining.interest || "0", fees: row?.remaining.fees || loan.separate_fee_remaining }));
      setConfirmPosting(false);
    } else setValues((old) => ({ ...old, [name]: value }));
  };
  let total = 0n, valid = true, posting = { interest: "0", fees: "0" }, needsPosting = false, paymentEffect = null;
  try {
    for (const key of ["principal", "interest", "fees"]) {
      const amount = toMinorUnits(values[key]); total += amount;
      if (amount < 0n || amount > toMinorUnits(remaining[key])) valid = false;
      if (item && key !== "principal") {
        const alreadyPosted = toMinorUnits(remaining[key]) - toMinorUnits(item.unposted[key]);
        const needed = amount > alreadyPosted ? amount - alreadyPosted : 0n;
        posting[key] = decimalAmount(needed);
        if (needed > 0n) needsPosting = true;
      }
    }
    const capacity = values.mode === "existing" ? toMinorUnits(selectedPayment?.available) : toMinorUnits(values.amount);
    if (total <= 0n || total > capacity) valid = false;
    const charges = confirmPosting ? toMinorUnits(posting.interest) + toMinorUnits(posting.fees) : 0n;
    paymentEffect = { debtChange: charges - (values.mode === "new" ? capacity : 0n), reservationChange: loan.terms.credit_policy === "full_installments" ? -charges : 0n };
  } catch { valid = false; }
  const blocked = values.mode === "new" && (!payer || accountProjection(payer, values.amount)?.blocked);
  const field = (definition, options = []) => <FormField key={definition.name} layout="plain" idPrefix="cash-payment" field={definition} values={values} options={options} disabled={write.locked} error={fieldMessage(write.fields[definition.name])} onChange={change} />;
  const submit = (event) => {
    event.preventDefault();
    if (!write.uncertain && (!valid || blocked || (needsPosting && !confirmPosting))) return;
    const body = { allocations: [{ installment_id: item?.id || null, principal: values.principal, interest: values.interest, fees: values.fees }], postings: needsPosting ? [{ installment_id: item.id, ...posting }] : [], ...(values.mode === "existing" ? { movement_id: Number(values.movement_id) } : { source_account_id: Number(values.source_account_id), amount: values.amount, date: values.date }) };
    write.save(`cash-loans/${loan.id}/payments/`, body);
  };
  return <FormModalShell title="Record loan repayment" description="Pay the card once, then explicitly allocate that payment. Linking an existing payment never deducts cash again."
    scrollBody dirty={!write.uncertain} busy={write.busy} error={write.error} saveLabel={write.uncertain ? "Retry same payment" : values.mode === "existing" ? "Link payment" : "Save repayment"}
    submitDisabled={!write.uncertain && (!valid || blocked || (needsPosting && !confirmPosting))} onSubmit={submit} onCancel={() => write.close(onClose)}>
    {write.uncertain && <p className="flex gap-2 text-sm text-amber-900"><Info size={17} />Result unknown. Retry the frozen payment to avoid double deductions.</p>}
    {field({ name: "mode", label: "Payment source", type: "select" }, [{ value: "new", label: "Make a new card payment", description: "Deduct from the chosen cash account", icon: Receipt }, { value: "existing", label: "Link a recorded payment", description: "Allocate only; no new cash deduction", icon: Receipt }])}
    {field({ name: "installment_id", label: "Installment", type: "select", required: true }, [...loan.schedule.filter((row) => Number(row.remaining_due) > 0).map((row) => ({ value: String(row.id), label: `#${row.index} · ${dateLabel(row.due_date)} · ${money(row.remaining_due)} remaining` })), ...(Number(loan.separate_fee_remaining) > 0 ? [{ value: "fee", label: "Separate processing fee" }] : [])])}
    <p className="text-sm text-slate-600"><Info size={16} className="mr-1 inline" />Still due: {money(item?.remaining_due || loan.separate_fee_remaining)}{item && ` · Already allocated: ${money(item.paid_amount)}`}</p>
    {values.mode === "existing" ? <>
      {candidates.loading ? <p role="status" className="text-sm text-slate-600">Loading unallocated card payments…</p> : candidates.error ? <p role="alert" className="text-sm text-red-800">{candidates.error}</p> : field({ name: "movement_id", label: "Recorded card payment", type: "select", required: true }, candidates.data.payments.map((row) => ({ value: String(row.id), label: `${dateLabel(row.date)} · ${row.source_name} · ${money(row.available)} unallocated` })))}
      {selectedPayment && <p className="text-sm text-slate-600">The original payment of {money(selectedPayment.amount)} remains unchanged.</p>}
    </> : <>
      {field({ name: "source_account_id", label: "Pay from", type: "select", source: "cashAccounts", required: true }, accounts.filter((account) => account.active && ["bank", "cash", "ewallet"].includes(account.kind)).map(accountChoiceOption))}
      <div className="grid gap-4 sm:grid-cols-2">{field({ name: "amount", label: "Actual card payment (₱)", type: "number", min: "0.01", step: "0.01", required: true })}{field({ name: "date", label: "Payment date", type: "date", max: today(), required: true })}</div>
      <AccountBalancePreview account={payer} amount={values.amount} />
    </>}
    <fieldset className="space-y-3 border-t pt-4"><legend className="pt-3 font-medium">Allocate the payment</legend><div className="grid gap-4 sm:grid-cols-3">{["principal", "interest", "fees"].map((key) => field({ name: key, label: `${key[0].toUpperCase() + key.slice(1)} (₱)`, type: "number", min: 0, step: "0.01" }))}</div><p className="text-sm tabular-nums">Allocated: {formatMinorUnits(total)}. Any remainder stays unallocated on the card payment.</p></fieldset>
    {needsPosting && <label className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"><input type="checkbox" className="mt-1 size-4" checked={confirmPosting} disabled={write.locked} onChange={(event) => setConfirmPosting(event.target.checked)} /><span>These charges were actually applied by the lender. Post {money(posting.interest)} interest and {money(posting.fees)} fees before allocating payment. Projections alone are not expenses.</span></label>}
    {paymentEffect && <CashLoanAccountEffects card={card} {...paymentEffect} />}
    {!item && <p className="flex gap-2 text-sm text-slate-600"><Info size={17} />Post the separate fee to the card first, or record its cash payment from the loan actions.</p>}
  </FormModalShell>;
}
