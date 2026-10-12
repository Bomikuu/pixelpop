import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import FormModalShell from "../components/forms/FormModalShell";
import FormField from "../components/forms/FormField";
import AccountBalancePreview, { accountChoiceOption, accountProjection } from "../components/AccountBalancePreview";
import { useRecords } from "../hooks/useDashboardData";
import { money, today } from "../lib/format";
import { toMinorUnits, formatMinorUnits } from "../quick-entry/money";
import { fieldMessage, useLoanWrite } from "./api";
import { loanFields, termOptions } from "./CashLoanForm";
import useCashLoanQuote from "./useCashLoanQuote";
import CashLoanAccountEffects from "./CashLoanAccountEffects";

const titles = { rename: "Rename cash loan", amend: "Amend future installments", settle: "Early loan settlement", cancel: "Reconcile and cancel loan", post: "Post actual lender charges", statement: "Link card statement", reverse: "Reverse payment allocation" };

export default function CashLoanLifecycleDialog({ loan, kind, installment, allocation, accounts, request, onSaved, onClose }) {
  const [values, setValues] = useState({ ...loan.terms, name: loan.name, effective_date: today(), date: today(), settlement_interest: loan.remaining.interest, settlement_fees: loan.remaining.fees, early_fee: "0", source_account_id: "", account_id: String(loan.card_id), principal: "0", interest: installment?.unposted.interest || "0", fees: installment?.unposted.fees || "0", statement_id: installment?.statement_id ? String(installment.statement_id) : "" });
  const [confirmed, setConfirmed] = useState(false);
  const [settlement, setSettlement] = useState({ key: "", quote: null, error: "", loading: false });
  const write = useLoanWrite(request, onSaved);
  const isSettlement = ["settle", "cancel"].includes(kind);
  const terms = { ...values, loan_amount: loan.remaining.principal, loan_date: values.effective_date, fee_value: "0", fee_kind: "fixed", fee_treatment: "separate" };
  const amended = useCashLoanQuote({ request, terms, enabled: kind === "amend" });
  const settlementBody = { settlement_interest: values.settlement_interest, settlement_fees: values.settlement_fees, early_fee: values.early_fee };
  const key = JSON.stringify(settlementBody);
  const candidates = useRecords(`cash-loans/${loan.id}/payment-candidates/`, request, 0);
  useEffect(() => {
    if (!isSettlement) return;
    const controller = new AbortController();
    setSettlement({ key, quote: null, error: "", loading: true });
    const timer = setTimeout(() => request(`cash-loans/${loan.id}/settlement-preview/`, { method: "POST", body: JSON.parse(key), signal: controller.signal }).then((quote) => {
      if (!controller.signal.aborted) setSettlement({ key, quote, error: "", loading: false });
    }).catch((error) => {
      if (!controller.signal.aborted) setSettlement({ key, quote: null, error: fieldMessage(error.fields) || error.message, loading: false });
    }), 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [isSettlement, loan.id, key, request]);
  const settlementCurrent = settlement.key === key && settlement.quote && !settlement.loading;
  const payer = accounts.find((row) => String(row.id) === values.source_account_id);
  const card = accounts.find((row) => row.id === loan.card_id);
  const feePayer = accounts.find((row) => String(row.id) === values.account_id);
  let charge = null;
  try { charge = installment ? toMinorUnits(values.interest) + toMinorUnits(values.fees) : toMinorUnits(loan.separate_fee_remaining); } catch { /* Invalid edited values have no account-effect preview. */ }
  const currentReservation = loan.terms.credit_policy === "full_installments" ? loan.schedule.reduce((sum, row) => sum + toMinorUnits(row.unposted.interest) + toMinorUnits(row.unposted.fees), 0n) : 0n;
  const blocked = isSettlement && (!payer || !settlementCurrent || accountProjection(payer, settlement.quote.payment)?.blocked);
  const change = (name, value) => { setValues((old) => ({ ...old, [name]: value })); setConfirmed(false); };
  const field = (definition, options = []) => <FormField key={definition.name} layout="plain" idPrefix="cash-lifecycle" field={definition} values={values} options={options} error={fieldMessage(write.fields[definition.name] || (kind === "amend" ? amended.errors[definition.name] : null))} disabled={write.locked} onChange={change} />;
  const submit = (event) => {
    event.preventDefault();
    if (!write.uncertain && ((!confirmed && kind !== "rename") || blocked || (kind === "amend" && !amended.current))) return;
    const prefix = `cash-loans/${loan.id}/`;
    if (kind === "rename") write.save(prefix, { name: values.name, version: loan.version }, "PATCH");
    else if (kind === "reverse") write.save(prefix + `allocations/${allocation.id}/reverse/`, {});
    else if (kind === "statement") write.save(prefix + "link-statement/", { installment_id: installment.id, statement_id: values.statement_id ? Number(values.statement_id) : null });
    else if (kind === "post") write.save(prefix + "post/", { date: values.date, ...(installment ? { installment_id: installment.id, interest: values.interest, fees: values.fees } : { processing_fee: true, account_id: Number(values.account_id) }) });
    else if (kind === "amend") write.save(prefix + "amend/", { ...terms, version: loan.version, effective_date: values.effective_date });
    else write.save(prefix + kind + "/", { ...settlementBody, settlement_amount: settlement.quote?.payment, source_account_id: Number(values.source_account_id), date: values.date, version: loan.version });
  };
  return <FormModalShell title={titles[kind]} description={kind === "amend" ? "Only untouched future installments can be replaced. Paid and posted history remains intact." : kind === "reverse" ? "Remove this allocation from loan progress. The original card payment and bank deduction remain unchanged." : "Use actual lender figures. Your original agreement and transaction history remain available."}
    scrollBody dirty={!write.uncertain} busy={write.busy} error={write.error} onCancel={() => write.close(onClose)} onSubmit={submit}
    submitDisabled={!write.uncertain && ((kind !== "rename" && !confirmed) || blocked || (kind === "amend" && !amended.current) || (kind === "rename" && !values.name.trim()))}
    saveLabel={write.uncertain ? "Retry same action" : kind === "rename" ? "Save name" : kind === "settle" ? "Record settlement" : kind === "cancel" ? "Reconcile & cancel" : kind === "amend" ? "Save amendment" : kind === "statement" ? "Save statement link" : kind === "reverse" ? "Reverse allocation" : "Post charges"}>
    {write.uncertain && <p className="flex gap-2 text-sm text-amber-900"><Info size={17} />Result unknown. Retry this unchanged action; edits are locked.</p>}
    {kind === "rename" && field({ name: "name", label: "Loan name", type: "text", required: true })}
    {kind === "amend" && <>
      {field({ name: "effective_date", label: "Effective date", type: "date", max: today(), required: true })}
      <div className="grid gap-4 sm:grid-cols-2">{loanFields.filter((row) => ["rate", "rate_period", "interest_method", "term_months", "first_payment_date", "monthly_charge", "credit_policy"].includes(row.name)).map((row) => field(row, termOptions[row.name] || []))}</div>
      {amended.loading ? <p role="status">Recalculating future terms…</p> : amended.current && <p className="text-sm tabular-nums">New monthly payment: {money(amended.quote.regular_payment)} · Remaining principal: {money(loan.remaining.principal)} · Projected interest: {money(amended.quote.total_interest)}</p>}
      {amended.current && <CashLoanAccountEffects card={card} reservationChange={toMinorUnits(amended.quote.additional_reservation) - currentReservation} />}
    </>}
    {isSettlement && <>
      <p className="text-sm">Principal remaining: <span className="tabular-nums">{money(loan.remaining.principal)}</span>. Enter the interest and fees your lender actually requires for closing.</p>
      <div className="grid gap-4 sm:grid-cols-3">{[{ name: "settlement_interest", label: "Lender interest (₱)" }, { name: "settlement_fees", label: "Existing fees to pay (₱)" }, { name: "early_fee", label: "Additional closing fee (₱)" }].map((row) => field({ ...row, type: "number", min: 0, step: "0.01", required: true }))}</div>
      {!settlementCurrent ? <p role="status" className="text-sm text-slate-600">{settlement.error || "Calculating lender settlement…"}</p> : <dl className="grid gap-3 rounded-md border bg-slate-50 p-4 text-sm sm:grid-cols-3"><div><dt className="text-slate-600">Actual payment</dt><dd className="mt-1 tabular-nums text-red-800">{money(settlement.quote.payment)}</dd></div><div><dt className="text-slate-600">Interest waived</dt><dd className="mt-1 tabular-nums">{money(settlement.quote.interest_rebate)}</dd></div><div><dt className="text-slate-600">Fees waived</dt><dd className="mt-1 tabular-nums">{money(settlement.quote.fee_rebate)}</dd></div></dl>}
      {field({ name: "source_account_id", label: "Pay from", source: "cashAccounts", type: "select", required: true }, accounts.filter((row) => row.active && ["bank", "cash", "ewallet"].includes(row.kind)).map(accountChoiceOption))}
      <AccountBalancePreview account={payer} amount={settlementCurrent ? settlement.quote.payment : "0"} />
      {settlementCurrent && <CashLoanAccountEffects card={card} debtChange={toMinorUnits(settlement.quote.card_debt_change)} reservationChange={toMinorUnits(settlement.quote.reservation_change)} />}
      {field({ name: "date", label: "Settlement date", type: "date", max: today(), required: true })}
    </>}
    {kind === "post" && <>
      {installment ? <div className="grid gap-4 sm:grid-cols-2">{field({ name: "interest", label: "Actual interest charge (₱)", type: "number", min: 0, step: "0.01" })}{field({ name: "fees", label: "Actual installment fees (₱)", type: "number", min: 0, step: "0.01" })}</div> : <>
        <p className="text-sm">Separate processing fee: {money(loan.separate_fee_remaining)}. Choosing the card posts debt; choosing cash records an actual fee payment.</p>
        {field({ name: "account_id", label: "Charge card or pay fee from", type: "select", source: "accounts", required: true }, accounts.filter((row) => row.id === loan.card_id || (row.active && ["bank", "cash", "ewallet"].includes(row.kind))).map(accountChoiceOption))}
      </>}
      {field({ name: "date", label: "Actual charge date", type: "date", max: today(), required: true })}
      {charge != null && charge >= 0n && (installment || feePayer?.id === loan.card_id) && <CashLoanAccountEffects card={card} debtChange={charge} reservationChange={installment && loan.terms.credit_policy === "full_installments" ? -charge : 0n} />}
      {!installment && feePayer?.id !== loan.card_id && <AccountBalancePreview account={feePayer} amount={loan.separate_fee_remaining} />}
    </>}
    {kind === "statement" && <>{candidates.loading ? <p role="status">Loading statements…</p> : candidates.error ? <p role="alert">{candidates.error}</p> : field({ name: "statement_id", label: "Card statement", type: "select" }, [{ value: "", label: "No statement link" }, ...(candidates.data?.statements || []).map((row) => ({ value: String(row.id), label: row.title }))])}<p className="text-sm text-slate-600">This is a reference only. It does not post or pay any amount. Linked installments are not counted twice in projected monthly obligations.</p></>}
    {kind === "reverse" && <p className="text-sm">Reverse {formatMinorUnits(toMinorUnits(allocation.principal) + toMinorUnits(allocation.interest) + toMinorUnits(allocation.fees))} allocated to this loan. Progress will reopen; no money is moved.</p>}
    {kind !== "rename" && <label className="flex items-start gap-3 border-t pt-4 text-sm"><input type="checkbox" className="mt-1 size-4" checked={confirmed} disabled={write.locked} onChange={(event) => setConfirmed(event.target.checked)} /><span>{kind === "statement" ? "I confirm this statement reference." : kind === "reverse" ? "I understand the card payment itself will not be reversed." : "I confirm these are actual lender terms or charges, and I have reviewed the financial effect."}</span></label>}
  </FormModalShell>;
}
