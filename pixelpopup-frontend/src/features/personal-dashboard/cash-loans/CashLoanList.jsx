import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Landmark, Plus } from "lucide-react";
import { useRecords } from "../hooks/useDashboardData";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Panel, EmptyState, ErrorState } from "../components/Panel";
import { dateLabel, money, today, words } from "../lib/format";
import CashLoanForm from "./CashLoanForm";

function nextDueLabel(day) {
  const days = Math.round((Date.parse(day + "T12:00:00Z") - Date.parse(today() + "T12:00:00Z")) / 86400000);
  const unit = Math.abs(days) >= 60 ? "month" : Math.abs(days) >= 14 ? "week" : "day";
  const value = unit === "month" ? Math.round(days / 30) : unit === "week" ? Math.round(days / 7) : days;
  return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(value, unit);
}

export default function CashLoanList({ card, dashboard, month, notify }) {
  const [adding, setAdding] = useState(false);
  const [page, setPage] = useState(1);
  const state = useRecords(`cash-loans/?card_id=${card.id}&page=${page}&page_size=20`, dashboard.request, dashboard.version);
  const add = <Button onClick={() => setAdding(true)}><Plus /> Add cash loan</Button>;
  return <>
    <Panel title="Cash loans" description="Borrowed cash, installment progress and lender costs—separate from purchases." action={card.active && add}>
      {state.loading ? <p role="status" className="py-8 text-sm text-slate-600">Loading cash loans…</p> : state.error ? <ErrorState message={state.error} retry={dashboard.refresh} /> : !state.data?.results?.length ? <EmptyState icon={Landmark} title="No cash loans on this card" message="Add your lender’s offer to calculate a schedule before saving it." /> : <>
        <div className="grid gap-3 lg:grid-cols-2">{state.data.results.map((loan) => <Link key={loan.id} to={`/dashboard/accounts/${card.id}/cash-loans/${loan.id}?month=${month}`} className="group flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 transition-colors hover:border-[var(--pd-primary)] hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-[var(--pd-primary)]">
          <div className="flex min-w-0 items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-blue-50 text-[var(--pd-primary)]"><Landmark size={19} /></span><div><p className="font-medium text-slate-950">{loan.name}</p><p className="text-xs text-slate-600">{words(loan.status)} · {loan.paid_installments}/{loan.total_installments} installments paid</p><p className="mt-1 text-xs text-slate-600">{loan.next_installment ? "Next " + nextDueLabel(loan.next_installment.due_date) + " · " + dateLabel(loan.next_installment.due_date) : "No installment due"}</p></div></div>
          <div className="flex items-center gap-5 text-sm tabular-nums"><div><p className="text-xs text-slate-600">Monthly payment</p><p>{money(loan.quote.regular_payment)}</p></div><div><p className="text-xs text-slate-600">Principal left</p><p>{money(loan.remaining.principal)}</p></div><ChevronRight className="size-4 text-slate-500" /></div>
          <div className="w-full">
            <p className="mb-3 text-xs text-slate-600">Original principal {money(loan.original_quote.financed_principal)} · {card.name}</p>
            <div className="mb-2 flex flex-wrap justify-between gap-2 text-xs tabular-nums">
              <span className="text-slate-600">{loan.paid_installments} of {loan.total_installments} installments paid</span>
              <span className="font-medium text-[var(--pd-primary)]">{loan.total_installments ? Math.round(loan.paid_installments / loan.total_installments * 100) : 0}% complete</span>
            </div>
            <Progress value={Math.min(100, Math.max(0, loan.total_installments ? loan.paid_installments / loan.total_installments * 100 : 0))} aria-label={`${loan.name}: installments paid`} aria-valuetext={`${loan.paid_installments} of ${loan.total_installments} installments paid`} className="h-2.5 bg-slate-100 [&_[data-slot=progress-indicator]]:motion-reduce:transition-none" />
            <span className="mt-3 block text-xs font-medium text-[var(--pd-primary)]">View details & repayments</span>
          </div>
        </Link>)}</div>
        <div className="mt-3 flex justify-end gap-2"><Button variant="outline" size="sm" disabled={!state.data.previous} onClick={() => setPage((value) => value - 1)}>Previous</Button><Button variant="outline" size="sm" disabled={!state.data.next} onClick={() => setPage((value) => value + 1)}>Next</Button></div>
      </>}
    </Panel>
    {adding && <CashLoanForm card={card} accounts={dashboard.data.accounts} request={dashboard.request} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); dashboard.refresh(); notify("Cash loan saved. Proceeds are tracked as financing, not income.", { action: "added", entity: "account" }); }} />}
  </>;
}
