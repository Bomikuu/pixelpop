import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CalendarClock, CreditCard, History, Info, Landmark, LayoutDashboard, Pencil, Plus, Receipt, RotateCcw } from "lucide-react";
import { useRecords } from "../hooks/useDashboardData";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Panel, ErrorState, EmptyState } from "../components/Panel";
import SummaryTiles from "../components/SummaryTiles";
import RecordIdentity from "../components/RecordIdentity";
import MoneyFlowAmount from "../components/MoneyFlowAmount";
import { dateLabel, money, words } from "../lib/format";
import CashLoanSchedule from "./CashLoanSchedule";
import CashLoanPaymentDialog from "./CashLoanPaymentDialog";
import CashLoanLifecycleDialog from "./CashLoanLifecycleDialog";

export default function CashLoanDetailView({ accountId, loanId, dashboard, month, notify }) {
  const state = useRecords(`cash-loans/${loanId}/`, dashboard.request, dashboard.version);
  const loan = state.data;
  const [tab, setTab] = useState("overview");
  const [dialog, setDialog] = useState(null);
  const [period, setPeriod] = useState("month");
  const [page, setPage] = useState(1);
  const historyState = useRecords(`cash-loans/${loanId}/history/?page_size=20&page=${page}${period === "month" ? "&month=" + month : ""}`, dashboard.request, dashboard.version);
  const heading = useRef(null);
  useEffect(() => { heading.current?.focus(); }, [loan?.id]);
  useEffect(() => { setPage(1); }, [month, period]);
  useEffect(() => {
    if (!loan) return;
    const previous = document.title; document.title = loan.name + " | Cash loans";
    return () => { document.title = previous; };
  }, [loan?.name]);
  const saved = () => { setDialog(null); dashboard.refresh(); notify("Cash-loan records updated.", { action: "saved", entity: "account" }); };
  const back = `/dashboard/accounts/${accountId}?month=${month}`;
  if (state.loading) return <p role="status" className="py-8 text-sm text-slate-600">Loading cash-loan details…</p>;
  if (state.error) return <ErrorState message={state.error} retry={dashboard.refresh} />;
  if (!loan || String(loan.card_id) !== accountId) return <EmptyState icon={Landmark} title="Loan not found on this card" action={<Button asChild variant="outline"><Link to={back}>Back to account</Link></Button>} />;
  const active = !["cancelled", "fully_paid"].includes(loan.status);
  const percent = loan.total_installments ? loan.paid_installments / loan.total_installments * 100 : 0;
  const history = historyState.data?.results || [];
  const count = historyState.data?.count || 0;
  const pages = Math.max(1, Math.ceil(count / 20));
  const details = dialog?.installment;
  const open = (kind, installment, allocation) => setDialog({ kind, installment, allocation });
  return <div className="min-w-0 space-y-5">
    <Button asChild variant="ghost"><Link to={back}><ArrowLeft />{loan.card_name}</Link></Button>
    <section className="flex flex-wrap items-start justify-between gap-4 rounded-xl border bg-white p-5">
      <div className="flex min-w-0 gap-3"><span className="grid size-12 shrink-0 place-items-center rounded-full bg-blue-50 text-[var(--pd-primary)]"><Landmark /></span><div className="min-w-0"><h2 ref={heading} tabIndex={-1} className="break-words text-xl font-semibold focus:outline-none">{loan.name}</h2><p className="mt-1 text-sm text-slate-600">{loan.card_name} · {words(loan.status)} · Released {dateLabel(loan.original_terms.loan_date)}</p><p className="mt-1 text-xs text-slate-600">Received in {loan.receiving_account_name}. This is financing, not earned income.</p></div></div>
      <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => open("rename")}><Pencil /> Rename</Button>{active && <><Button onClick={() => open("payment")}><Plus /> Record repayment</Button><Button variant="outline" onClick={() => open("settle")}><CreditCard /> Early settlement</Button></>}</div>
    </section>
    <Tabs value={tab} onValueChange={setTab} className="gap-5">
      <TabsList aria-label="Cash-loan details" className="h-auto w-full flex-wrap justify-start gap-1 p-1 sm:w-fit"><TabsTrigger value="overview" className="px-3 py-2"><LayoutDashboard />Overview</TabsTrigger><TabsTrigger value="schedule" className="px-3 py-2"><CalendarClock />Payment schedule</TabsTrigger><TabsTrigger value="transactions" className="px-3 py-2"><History />Transactions</TabsTrigger></TabsList>
      <TabsContent value="overview" className="space-y-5">
        <SummaryTiles items={[
          { label: "Remaining principal", value: money(loan.remaining.principal), icon: "debt" },
          { label: "Regular installment", value: money(loan.quote.regular_payment), icon: "deadline" },
          { label: "Projected interest left", value: money(loan.remaining.interest), icon: "expenses", hint: "Not all of this is posted card debt" },
          { label: "Remaining obligations", value: money(loan.remaining_total), icon: "financing", hint: "Principal, unwaived interest and fees—not additional debt" },
        ]} />
        <Panel title="Repayment progress" description="Only explicitly allocated payments count—not elapsed months.">
          <div className="flex flex-wrap justify-between gap-2 text-sm"><span>{loan.paid_installments} of {loan.total_installments} installments paid</span><span className="text-slate-600">{loan.next_installment ? "Next due " + dateLabel(loan.next_installment.due_date) + " · " + money(loan.next_installment.remaining_due) : "No installment due"}</span></div>
          <div role="progressbar" aria-label="Paid installments" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percent)} className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-[var(--pd-primary)] motion-safe:transition-[width] motion-safe:duration-300" style={{ width: `${percent}%` }} /></div>
          <dl className="mt-5 grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2 lg:grid-cols-4">{[
            ["Original principal", money(loan.original_quote.financed_principal)], ["Net cash received", money(loan.original_quote.net_cash_received)], ["Interest method", words(loan.terms.interest_method)], ["Rate", loan.terms.rate + "% " + (loan.terms.rate_period === "monthly" ? "monthly" : "nominal annual")], ["Original interest", money(loan.original_quote.total_interest)], ["Original processing fee", money(loan.original_quote.processing_fee)], ["Original total repayment", money(loan.original_quote.total_cash_outlay)], ["Estimated last due", dateLabel(loan.schedule.at(-1)?.due_date)], ["Final scheduled installment", money(loan.quote.final_payment)], ["Remaining installments", String(loan.total_installments - loan.paid_installments)], ["Credit policy", loan.terms.credit_policy === "full_installments" ? "Full installments" : "Financed principal"], ["Fee still outstanding", money(loan.separate_fee_remaining)],
          ].map(([label, value]) => <div key={label}><dt className="text-xs text-slate-600">{label}</dt><dd className="mt-1 tabular-nums">{value}</dd></div>)}</dl>
        </Panel>
        {active && <Panel title="Lender adjustments" description="These actions preserve your original agreement and actual payment history."><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => open("amend")}><Pencil />Amend future terms</Button>{Number(loan.separate_fee_remaining) > 0 && <Button variant="outline" onClick={() => open("post")}><Receipt />Record separate fee</Button>}<Button variant="outline" onClick={() => open("cancel")}><RotateCcw />Reconcile & cancel</Button></div></Panel>}
        {loan.schedule_history.length > 1 && <details className="rounded-lg border bg-white p-4"><summary className="cursor-pointer text-sm font-medium">Prior agreements ({loan.schedule_history.length})</summary><div className="mt-4 space-y-4">{loan.schedule_history.map((version) => <div key={version.version} className="text-sm"><p className="font-medium">Version {version.version} · Effective {dateLabel(version.effective_date)}</p><p className="text-slate-600">{version.terms.term_months} months · {version.terms.rate}% {version.terms.rate_period === "monthly" ? "monthly" : "nominal annual"} · {money(version.quote.regular_payment)} regular payment</p><details className="mt-2"><summary className="cursor-pointer text-xs text-[var(--pd-primary)]">View preserved schedule</summary><CashLoanSchedule rows={version.quote.schedule} /></details></div>)}</div></details>}
      </TabsContent>
      <TabsContent value="schedule"><Panel title="Payment schedule" description="Click an installment to inspect payments or confirm a repayment. Projected interest is posted only when you explicitly record the actual charge."><CashLoanSchedule rows={loan.schedule} onSelect={(row) => open("inspect", row)} /></Panel></TabsContent>
      <TabsContent value="transactions"><Panel title="Loan transactions" description="Actual postings and card payments appear once. Allocation details do not create additional cash deductions."
        action={<Select value={period} onValueChange={setPeriod}><SelectTrigger aria-label="Loan transaction period" className="w-44"><SelectValue /></SelectTrigger><SelectContent className="personal-dashboard" position="popper"><SelectItem value="month">Selected month</SelectItem><SelectItem value="all">All time</SelectItem></SelectContent></Select>}>
        {historyState.loading ? <p role="status" className="py-6 text-sm text-slate-600">Loading loan activity…</p> : historyState.error ? <ErrorState message={historyState.error} retry={dashboard.refresh} /> : !history.length ? <EmptyState icon={History} title="No loan activity in this period" message="Choose All time to see the original financing and older payments." /> : <ol className="divide-y">{history.map((row) => <li key={row.id} className="flex flex-wrap justify-between gap-3 py-3 hover:bg-slate-50"><div className="min-w-0 flex-1"><RecordIdentity resource="movements" row={row} label={row.name} /><p className="ml-12 mt-1 text-xs text-slate-600">{dateLabel(row.date)} · {row.account_name || "Lender adjustment"} · {row.notes}</p>{row.allocated_to_loan != null && <p className="ml-12 mt-1 text-xs">{money(row.allocated_to_loan)} allocated to this loan, out of the full card payment shown.</p>}{row.allocations?.map((allocation) => <div key={allocation.id} className="ml-12 mt-2"><Button size="sm" variant="ghost" disabled={loan.status === "cancelled"} onClick={() => open("reverse", null, allocation)}><RotateCcw size={14} /> Reverse allocation {allocation.id}</Button></div>)}</div><MoneyFlowAmount amount={row.amount} direction={["disbursement", "rebate", "adjustment"].includes(row.kind) ? "in" : "out"} className="!font-normal" /></li>)}</ol>}
        <div className="mt-4 flex flex-wrap justify-between gap-3 border-t pt-3 text-sm"><p className="text-slate-600">{count} entries · Page {page} of {pages}</p><div className="flex gap-2"><Button size="sm" variant="outline" disabled={historyState.loading || page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button><Button size="sm" variant="outline" disabled={historyState.loading || page >= pages} onClick={() => setPage((value) => value + 1)}>Next</Button></div></div>
      </Panel></TabsContent>
    </Tabs>
    {dialog?.kind === "inspect" && <Dialog open onOpenChange={(value) => { if (!value) setDialog(null); }}><DialogContent className="personal-dashboard max-h-[85dvh] overflow-y-auto bg-white"><DialogHeader><DialogTitle>Installment #{details.index}</DialogTitle><DialogDescription>Due {dateLabel(details.due_date)} · {words(details.status)}</DialogDescription></DialogHeader><dl className="grid grid-cols-2 gap-4 text-sm">{Object.entries(details.remaining).map(([label, value]) => <div key={label}><dt className="text-slate-600">{words(label)} remaining</dt><dd className="mt-1 tabular-nums">{money(value)}</dd></div>)}<div><dt className="text-slate-600">Already paid</dt><dd>{money(details.paid_amount)}</dd></div></dl><p className="flex gap-2 text-xs text-slate-600"><Info size={16} />Unposted: {money(details.unposted.interest)} interest · {money(details.unposted.fees)} fees.</p>{details.allocations.length ? <ol className="divide-y text-sm">{details.allocations.map((row) => <li key={row.id} className="py-2">Card payment #{row.movement_id} · {dateLabel(row.date)} · {money(row.amount)}</li>)}</ol> : <p className="text-sm text-slate-600">No allocated payments yet.</p>}{active && <div className="flex flex-wrap gap-2">{Number(details.remaining_due) > 0 && <Button onClick={() => open("payment", details)}><Plus />Record repayment</Button>}{(Number(details.unposted.interest) + Number(details.unposted.fees)) > 0 && <Button variant="outline" onClick={() => open("post", details)}><Receipt />Post actual charges</Button>}<Button variant="outline" onClick={() => open("statement", details)}><CreditCard />Link statement</Button></div>}</DialogContent></Dialog>}
    {dialog?.kind === "payment" && <CashLoanPaymentDialog loan={loan} installment={dialog.installment} accounts={dashboard.data.accounts} request={dashboard.request} onSaved={saved} onClose={() => setDialog(null)} />}
    {dialog && !["inspect", "payment"].includes(dialog.kind) && <CashLoanLifecycleDialog {...dialog} loan={loan} accounts={dashboard.data.accounts} request={dashboard.request} onSaved={saved} onClose={() => setDialog(null)} />}
  </div>;
}
