import { useState } from "react";
import { CalendarDays, Info } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { dateLabel, money } from "../lib/format";
import { toMinorUnits, formatMinorUnits } from "../quick-entry/money";
import CashLoanSchedule from "./CashLoanSchedule";
import { fieldMessage } from "./api";

export default function CashLoanPreview({ quote, loading, errors, card, terms }) {
  const [schedule, setSchedule] = useState(false);
  const used = quote ? toMinorUnits(quote.financed_principal) + toMinorUnits(quote.additional_reservation) : 0n;
  const available = card.available_credit != null ? toMinorUnits(card.available_credit) : toMinorUnits(card.credit_limit) - toMinorUnits(card.balance);
  return <section className="min-w-0 space-y-4 border-t pt-4 lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0" aria-label="Loan estimate" aria-live="polite">
    <h3 className="font-semibold text-slate-950">Your loan estimate</h3>
    {loading ? <p role="status" className="text-sm text-slate-600">Calculating your current terms…</p> : !quote ? <p className="text-sm text-slate-600">Enter the amount, rate and dates to see the estimate. {fieldMessage(errors.detail)}</p> : <>
      <p className="text-sm text-slate-600">Regular monthly payment<span className="mt-1 block text-3xl tabular-nums text-slate-950">{money(quote.regular_payment)}</span></p>
      <dl className="divide-y text-sm tabular-nums">{[
        ["Final installment", quote.final_payment], ["Cash you receive", quote.net_cash_received], ["Financed principal", quote.financed_principal], ["Total interest", quote.total_interest], ["Processing fee", quote.processing_fee], ["Monthly charges, total", quote.total_charges], ["Total cash to repay", quote.total_cash_outlay], ["Borrowing cost", quote.borrowing_cost],
      ].map(([label, value]) => <div key={label} className="flex justify-between gap-4 py-2"><dt className="text-slate-600">{label}</dt><dd>{money(value)}</dd></div>)}</dl>
      <p className="text-xs text-slate-600">First due {dateLabel(quote.schedule[0]?.due_date)} · Last due {dateLabel(quote.schedule.at(-1)?.due_date)}</p>
      <p className={"text-sm " + (card.credit_limit == null || used > available ? "text-red-800" : "text-emerald-800")}>
        <Info className="mr-1 inline size-4" aria-hidden="true" />{card.credit_limit == null ? "Set a card limit before saving." : `Available credit after release: ${formatMinorUnits(available - used)}`}
      </p>
      <p className="text-xs leading-5 text-slate-600">Preview only. Borrowed cash is not income. Principal is card debt, not an expense. {terms.credit_policy === "full_installments" ? "Unposted interest and charges reserve credit until posted or waived." : "Only financed principal reserves credit; actual charges increase debt when posted."}</p>
      {terms.fee_treatment === "financed" && <p className="text-xs text-slate-600">The processing fee is added to principal and also accrues interest.</p>}
      <Button type="button" variant="outline" onClick={() => setSchedule(true)}><CalendarDays /> View schedule</Button>
    </>}
    {schedule && quote && <Dialog open onOpenChange={setSchedule}><DialogContent className="personal-dashboard bg-white lg:w-[75vw] lg:max-w-[75vw]"><DialogHeader><DialogTitle>Estimated payment schedule</DialogTitle><DialogDescription>Projected terms only. No account balance has changed.</DialogDescription></DialogHeader><CashLoanSchedule rows={quote.schedule} /></DialogContent></Dialog>}
  </section>;
}
