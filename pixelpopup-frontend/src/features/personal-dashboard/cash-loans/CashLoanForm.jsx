import { useEffect, useRef, useState } from "react";
import { Banknote, CalendarDays, ChevronDown, CreditCard, Info, Percent, Receipt, Scale, Wallet } from "lucide-react";
import FormModalShell from "../components/forms/FormModalShell";
import FormField from "../components/forms/FormField";
import { accountChoiceOption } from "../components/AccountBalancePreview";
import { Button } from "../ui/button";
import { money, today } from "../lib/format";
import { toMinorUnits } from "../quick-entry/money";
import { cashLoanApi, fieldMessage, useLoanWrite } from "./api";
import useCashLoanQuote from "./useCashLoanQuote";
import CashLoanPreview from "./CashLoanPreview";
import CashLoanAccountEffects from "./CashLoanAccountEffects";

const option = (value, label, description, icon = Percent) => ({ value, label, description, icon });
export const termOptions = {
  rate_period: [option("monthly", "Monthly rate", "Rate applied each month"), option("annual_nominal", "Nominal annual rate", "Annual rate divided by 12—not effective APR")],
  interest_method: [option("add_on", "Add-on", "Interest on original financed principal"), option("diminishing", "Diminishing", "Interest on remaining principal")],
  fee_kind: [option("fixed", "Fixed fee", "Enter the peso amount"), option("percentage", "Percentage fee", "Percentage of the requested loan")],
  fee_treatment: [option("upfront", "Deduct from proceeds", "Cash received is reduced"), option("separate", "Pay separately", "Not paid until explicitly recorded"), option("financed", "Add to principal", "Fee also accrues interest")],
  credit_policy: [option("principal", "Financed principal", "Future interest does not reserve credit", CreditCard), option("full_installments", "Full installments", "Reserve projected interest and charges too", Scale)],
};

export const loanFields = [
  { name: "loan_amount", label: "Loan amount (₱)", type: "number", min: "0.01", step: "0.01", required: true },
  { name: "term_months", label: "Term in months", type: "number", min: 1, max: 1200, step: 1, required: true },
  { name: "rate", label: "Lender interest rate (%)", type: "number", min: 0, step: "0.000001", required: true },
  { name: "rate_period", label: "Rate period", type: "select", required: true },
  { name: "interest_method", label: "Interest calculation", type: "select", required: true },
  { name: "fee_kind", label: "Processing fee", type: "select" },
  { name: "fee_value", label: "Fee amount or percentage", type: "number", min: 0, step: "0.0001" },
  { name: "fee_treatment", label: "Fee treatment", type: "select" },
  { name: "monthly_charge", label: "Additional monthly charge (₱)", type: "number", min: 0, step: "0.01" },
  { name: "loan_date", label: "Release date", type: "date", max: today(), required: true },
  { name: "first_payment_date", label: "First payment date", type: "date", required: true },
  { name: "credit_policy", label: "Credit reservation", type: "select", required: true },
];

function LoanFieldGroup({ title, icon: Icon, children }) {
  return <fieldset className="min-w-0 border-t border-slate-200 pt-4">
    <legend className="flex items-center gap-2 pr-3 text-sm font-semibold text-slate-950">
      <Icon size={16} className="text-slate-500" aria-hidden="true" />{title}
    </legend>
    <div className="grid min-w-0 gap-4 sm:grid-cols-2">{children}</div>
  </fieldset>;
}

export default function CashLoanForm({ card, accounts, request, onSaved, onClose }) {
  const initial = useRef({ name: "", loan_amount: "", rate: "", rate_period: "monthly", interest_method: "add_on", term_months: "12", fee_kind: "fixed", fee_value: "0", fee_treatment: "separate", monthly_charge: "0", loan_date: today(), first_payment_date: "", credit_policy: "principal", receiving_account_id: "" });
  const [values, setValues] = useState(initial.current);
  const [comparisons, setComparisons] = useState([]);
  const [comparing, setComparing] = useState(false);
  const [compareError, setCompareError] = useState("");
  const compareController = useRef(null);
  useEffect(() => () => compareController.current?.abort(), []);
  const terms = Object.fromEntries(loanFields.map(({ name }) => [name, values[name]]));
  const quoteState = useCashLoanQuote({ request, terms });
  const write = useLoanWrite(request, onSaved);
  const change = (name, value) => {
    compareController.current?.abort();
    setComparing(false); setComparisons([]); setCompareError("");
    setValues((previous) => ({ ...previous, [name]: value }));
  };
  let insufficient = true;
  if (quoteState.quote && card.credit_limit != null) {
    const available = card.available_credit != null ? toMinorUnits(card.available_credit) : toMinorUnits(card.credit_limit) - toMinorUnits(card.balance);
    insufficient = toMinorUnits(quoteState.quote.financed_principal) + toMinorUnits(quoteState.quote.additional_reservation) > available;
  }
  const compare = async () => {
    compareController.current?.abort();
    const controller = new AbortController(); compareController.current = controller;
    setComparing(true); setCompareError("");
    try {
      const result = await cashLoanApi(request).compare(terms, [6, 12, 18, 24, 36], controller.signal);
      if (!controller.signal.aborted) setComparisons(result);
    } catch (error) { if (!controller.signal.aborted) setCompareError(fieldMessage(error.fields) || error.message); }
    finally { if (!controller.signal.aborted) setComparing(false); }
  };
  const valid = quoteState.current && values.name.trim() && values.receiving_account_id && !insufficient;
  const renderField = (name, fullWidth = false) => {
    const definition = loanFields.find((field) => field.name === name);
    const field = name === "fee_value" ? { ...definition, label: values.fee_kind === "percentage" ? "Processing fee (%)" : "Processing fee (₱)" } : definition;
    return <div key={name} className={(fullWidth ? "min-w-0 sm:col-span-2" : "min-w-0") + (termOptions[name]?.length === 2 ? " [&_fieldset>div]:sm:grid-cols-2" : "")}>
      <FormField layout="plain" idPrefix="cash-loan" field={field} values={values} options={termOptions[name] || []} disabled={write.locked} error={fieldMessage(write.fields[name] || quoteState.errors[name])} onChange={change} />
      {name === "term_months" && <div className="mt-2 grid grid-cols-5 gap-1" aria-label="Common loan terms">{[6, 12, 18, 24, 36].map((months) => <Button key={months} type="button" size="sm" variant="ghost" className="px-1 text-xs" aria-pressed={values.term_months === String(months)} disabled={write.locked} onClick={() => change("term_months", String(months))}>{months} mo</Button>)}</div>}
    </div>;
  };
  return <FormModalShell title="Add credit-card cash loan" description={`Track a lender offer on ${card.name}. Use the lender’s actual rate and fees.`}
    scrollBody dirty={!write.uncertain && JSON.stringify(values) !== JSON.stringify(initial.current)} busy={write.busy} error={write.error}
    saveLabel={write.uncertain ? "Retry same loan" : "Save cash loan"} submitDisabled={!write.uncertain && !valid}
    onCancel={() => write.close(() => { compareController.current?.abort(); onClose(); })} onSubmit={(event) => { event.preventDefault(); if (valid || write.uncertain) write.save("cash-loans/", { ...values, card_id: card.id }); }}>
    {write.uncertain && <p role="status" className="flex gap-2 text-sm text-amber-900"><Info size={18} />The save result is unknown. Retry the same loan; fields are locked to prevent duplicates.</p>}
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="min-w-0 space-y-6">
        <LoanFieldGroup title="Loan details" icon={Banknote}>
          <div className="min-w-0 sm:col-span-2"><FormField layout="plain" idPrefix="cash-loan" field={{ name: "name", label: "Loan name", type: "text", required: true }} values={values} disabled={write.locked} error={fieldMessage(write.fields.name)} onChange={change} /></div>
          {renderField("loan_amount")}
          {renderField("term_months")}
          {renderField("loan_date")}
          {renderField("first_payment_date")}
        </LoanFieldGroup>
        <LoanFieldGroup title="Interest" icon={Percent}>
          {renderField("rate", true)}
          {renderField("rate_period", true)}
          {renderField("interest_method", true)}
        </LoanFieldGroup>
        <LoanFieldGroup title="Fees & charges" icon={Receipt}>
          {renderField("fee_kind", true)}
          {renderField("fee_value")}
          {renderField("monthly_charge")}
          {renderField("fee_treatment", true)}
        </LoanFieldGroup>
        <LoanFieldGroup title="Accounts & credit" icon={Wallet}>
          <div className="min-w-0 sm:col-span-2 [&_fieldset>div]:sm:grid-cols-1 [&_fieldset>div]:xl:grid-cols-2"><FormField layout="plain" idPrefix="cash-loan" field={{ name: "receiving_account_id", label: "Receive cash into", type: "select", source: "cashAccounts", required: true }} values={values}
            options={accounts.filter((account) => account.active && ["bank", "cash", "ewallet"].includes(account.kind)).map(accountChoiceOption)} disabled={write.locked} error={fieldMessage(write.fields.receiving_account_id)} onChange={change} /></div>
          {renderField("credit_policy", true)}
        </LoanFieldGroup>
      </div>
      <div className="min-w-0 space-y-5">
        <CashLoanPreview {...quoteState} card={card} terms={terms} />
        {quoteState.current && <div className="min-w-0 lg:border-l lg:pl-6"><CashLoanAccountEffects card={card} debtChange={toMinorUnits(quoteState.quote.financed_principal)} reservationChange={toMinorUnits(quoteState.quote.additional_reservation)} receiver={accounts.find((row) => String(row.id) === values.receiving_account_id)} proceeds={toMinorUnits(quoteState.quote.net_cash_received)} /></div>}
      </div>
    </div>
    <details className="group min-w-0 border-t border-slate-200 pt-4">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-sm text-sm font-medium text-slate-700 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        <CalendarDays size={16} aria-hidden="true" />Compare repayment terms<ChevronDown size={16} className="ml-auto group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="mt-4 min-w-0 space-y-3">
        <Button type="button" variant="outline" onClick={compare} disabled={!quoteState.current || comparing || write.locked}><CalendarDays aria-hidden="true" />{comparing ? "Comparing terms…" : "Compare common terms"}</Button>
        {compareError && <p role="alert" className="flex items-start gap-2 text-sm text-red-800"><Info size={16} className="shrink-0" aria-hidden="true" />{compareError}</p>}
        {!!comparisons.length && <div className="overflow-x-auto"><table className="w-full text-left text-sm tabular-nums"><caption className="sr-only">Alternative loan terms</caption><thead><tr>{["Term", "Monthly", "Borrowing cost", ""].map((text) => <th key={text} className="p-2 font-medium">{text}</th>)}</tr></thead><tbody>{comparisons.map((item) => <tr key={item.term_months} className="border-t"><td className="p-2">{item.term_months} months</td><td className="p-2">{money(item.regular_payment)}{Number(item.regular_payment) === Math.min(...comparisons.map((row) => Number(row.regular_payment))) && <span className="block text-xs text-emerald-800">Lowest monthly</span>}</td><td className="p-2">{money(item.borrowing_cost)}{Number(item.borrowing_cost) === Math.min(...comparisons.map((row) => Number(row.borrowing_cost))) && <span className="block text-xs text-emerald-800">Lowest cost</span>}</td><td><Button type="button" size="sm" variant="ghost" disabled={write.locked} onClick={() => change("term_months", String(item.term_months))}>Use term</Button></td></tr>)}</tbody></table></div>}
      </div>
    </details>
  </FormModalShell>;
}
