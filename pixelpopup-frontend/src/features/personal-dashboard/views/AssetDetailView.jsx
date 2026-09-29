import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CalendarClock, CircleCheck, House, Pencil, Plus, Receipt, TriangleAlert } from "lucide-react";
import { useRecords } from "../hooks/useDashboardData";
import { Button } from "../ui/button";
import { EmptyState, ErrorState, Panel } from "../components/Panel";
import SummaryTiles from "../components/SummaryTiles";
import MoneyFlowAmount from "../components/MoneyFlowAmount";
import AssetFinancingDialog from "../components/AssetFinancingDialog";
import AssetPaymentDialog from "../components/AssetPaymentDialog";
import { dateLabel, money, today, words } from "../lib/format";

export default function AssetDetailView({ assetId, dashboard, month, openForm, notify }) {
  const state = useRecords("assets/" + assetId + "/financing/", dashboard.request, dashboard.version);
  const [dialog, setDialog] = useState(null);
  const heading = useRef(null);
  const asset = state.data?.asset;
  const financing = state.data?.financing;
  const pending = financing?.schedule.filter((item) => item.status === "pending") || [];
  const overdue = pending.filter((item) => item.overdue);
  const next = pending[0];
  const latestTerms = financing?.term_changes.filter((change) => change.effective_date <= today()).at(-1);
  useEffect(() => { heading.current?.focus(); }, [assetId, asset?.id]);
  useEffect(() => {
    if (!asset) return;
    const previous = document.title;
    document.title = asset.name + " | Assets";
    return () => { document.title = previous; };
  }, [asset?.name]);
  return (
    <div className="space-y-5">
      <Button asChild variant="ghost">
        <Link to={"/dashboard/assets?month=" + month}><ArrowLeft aria-hidden="true" /> Back to assets</Link>
      </Button>
      {state.loading ? (
        <p role="status" className="py-8 text-sm text-slate-600">Loading asset…</p>
      ) : state.error ? (
        <ErrorState message={state.error} retry={dashboard.refresh} />
      ) : !asset ? (
        <EmptyState title="Asset not found" message="It may have been removed. Return to your assets to choose another." />
      ) : (
        <>
          <section className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-[var(--pd-border)] bg-white p-5 sm:p-6">
            <div className="flex min-w-0 items-start gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-blue-50 text-[var(--pd-primary)]"><House aria-hidden="true" /></span>
              <div className="min-w-0">
                <h2 ref={heading} tabIndex={-1} className="break-words text-xl font-semibold tracking-tight text-slate-950 focus:outline-none">{asset.name}</h2>
                <p className="mt-1 text-sm text-slate-600">{words(asset.kind)} · Valued {dateLabel(asset.valuation_date)}{!asset.active ? " · Archived" : ""}</p>
                {financing && <p className="mt-1 text-sm text-slate-600">Financed through {financing.lender}</p>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {asset.active && <Button variant="outline" onClick={() => openForm("asset", asset)}><Pencil aria-hidden="true" /> Edit asset</Button>}
              {financing && asset.active ? (
                <Button variant="outline" onClick={() => setDialog({ type: "terms" })}>Update lender terms</Button>
              ) : !financing && asset.active && (
                <Button onClick={() => setDialog({ type: "setup" })}><Plus aria-hidden="true" /> Add financing</Button>
              )}
            </div>
          </section>
          {!financing ? (
            <Panel title="No financing linked" description="This asset has a recorded value, but no loan balance or installment schedule.">
              <EmptyState icon={Receipt} title="Track payments for this asset" message="Add the lender's current principal balance, due, rate and remaining term to see installments here and in Bills." />
            </Panel>
          ) : (
            <>
              <SummaryTiles items={[
                { label: "Asset value", value: money(asset.value), icon: "assets", hint: "Your latest recorded valuation" },
                { label: "Principal left", value: money(financing.current_principal), icon: "debt", hint: "From confirmed starting balance and recorded principal" },
                { label: "Estimated equity", value: money(Number(asset.value) - Number(financing.current_principal)), icon: "balance", hint: "Value minus tracked principal; not a lender valuation" },
                { label: "Monthly due", value: money(latestTerms?.monthly_due ?? financing.monthly_due), icon: "deadline", hint: "Lender-confirmed, not reduced automatically by extra payments" },
                { label: "Advance credit", value: money(financing.advance_credit), icon: "balance", hint: "Paid ahead, not yet allocated to installments" },
              ]} />
              {overdue.length > 0 && <div role="status" className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
                <TriangleAlert size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                <p><strong>{overdue.length} overdue installment{overdue.length === 1 ? "" : "s"}.</strong> Choose one below to record a payment or apply advance credit.</p>
              </div>}
              <Panel
                title="Loan outlook"
                description="A monthly estimate using the current annual rate. Fees, lender posting rules and future rate changes may change the actual total."
                action={<Button onClick={() => setDialog({ type: "payment", installment: next })} disabled={Number(financing.current_principal) <= 0}><Plus aria-hidden="true" /> Record payment</Button>}
              >
                <div className="grid gap-5 text-sm sm:grid-cols-2 lg:grid-cols-5">
                  <div><p className="text-slate-600">Current annual rate</p><p className="mt-1 font-semibold tabular-nums">{Number(latestTerms?.annual_rate ?? financing.annual_rate).toLocaleString("en-PH", { maximumFractionDigits: 4 })}%</p></div>
                  <div><p className="text-slate-600">Next installment</p><p className="mt-1 font-semibold">{next ? dateLabel(next.due_date) + " · " + money(next.remaining_due) : "None due"}</p></div>
                  <div><p className="text-slate-600">Estimated payments in shown schedule</p><p className="mt-1 font-semibold tabular-nums">{money(financing.estimated_five_year_payments)}</p></div>
                  <div><p className="text-slate-600">Estimated interest in shown schedule</p><p className="mt-1 font-semibold tabular-nums">{money(financing.estimated_five_year_interest)}</p></div>
                  <div><p className="text-slate-600">Estimated balance after schedule</p><p className="mt-1 font-semibold tabular-nums">{money(financing.estimated_balance_after_schedule)}</p></div>
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-sm text-slate-600">
                  <span>Balance confirmed {dateLabel(financing.balance_as_of)} · {financing.remaining_months} installments remaining at setup</span>
                  <Button variant="outline" size="sm" onClick={() => setDialog({ type: "historical" })}><Plus aria-hidden="true" /> Add earlier payment history</Button>
                </div>
              </Panel>
              <Panel title="Installments" description="Up to five years are shown. Select Pay to record an actual payment; future principal and interest are estimates.">
                {financing.schedule.length ? <div className="max-h-[38rem] overflow-auto rounded-lg border border-[var(--pd-border)]">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600"><tr><th className="px-3 py-3 font-medium">Due</th><th className="px-3 py-3 font-medium">Contractual</th><th className="px-3 py-3 font-medium">Paid</th><th className="px-3 py-3 font-medium">Est. interest</th><th className="px-3 py-3 font-medium">Est. balance after</th><th className="px-3 py-3 font-medium">Status</th><th className="px-3 py-3 text-right font-medium">Action</th></tr></thead>
                    <tbody className="divide-y divide-[var(--pd-border)]">{financing.schedule.map((item) => (
                      <tr key={item.id} className={item.overdue ? "bg-red-50/70 hover:bg-red-100/70" : "hover:bg-blue-50/50"}>
                        <th scope="row" className="px-3 py-3 font-medium text-slate-950">{dateLabel(item.due_date)}</th>
                        <td className="px-3 py-3 tabular-nums">{money(item.due)}</td>
                        <td className="px-3 py-3 tabular-nums">{money(item.paid)}</td>
                        <td className="px-3 py-3 tabular-nums">{item.status === "pending" ? money(item.estimated_interest) : "Not projected"}</td>
                        <td className="px-3 py-3 tabular-nums">{item.status === "pending" ? money(item.estimated_balance_after) : "Not projected"}</td>
                        <td className="px-3 py-3">{item.status === "paid" ? <span className="inline-flex items-center gap-1 text-emerald-800"><CircleCheck size={15} aria-hidden="true" /> Paid</span> : item.status === "completed" ? "Closed early" : item.overdue ? <span className="font-medium text-red-800">Overdue · {money(item.remaining_due)} left</span> : <span className="inline-flex items-center gap-1 text-slate-600"><CalendarClock size={15} aria-hidden="true" /> Upcoming</span>}</td>
                        <td className="px-3 py-3 text-right">{item.status === "pending" && <Button size="sm" variant="outline" onClick={() => setDialog({ type: "payment", installment: item })}>Pay</Button>}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div> : <EmptyState title="No installments left" message="The tracked principal has been paid off or the schedule has ended." />}
              </Panel>
              <Panel title="Payment history" description="Actual entries stay separate from estimates. Earlier history does not change the confirmed opening balance.">
                {financing.payments.length ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="border-b text-slate-600"><tr><th className="py-2 pr-3 font-medium">Date</th><th className="py-2 pr-3 font-medium">Account</th><th className="py-2 pr-3 font-medium">Cash paid</th><th className="py-2 pr-3 font-medium">Regular principal</th><th className="py-2 pr-3 font-medium">Extra principal</th><th className="py-2 pr-3 font-medium">Interest + fees</th><th className="py-2 pr-3 font-medium">Advance</th><th className="py-2 font-medium">Type</th></tr></thead>
                  <tbody className="divide-y">{financing.payments.map((payment) => (
                    <tr key={payment.id}><th scope="row" className="py-3 pr-3 font-medium">{dateLabel(payment.date)}</th><td className="py-3 pr-3">{payment.account_name}</td><td className="py-3 pr-3 tabular-nums"><MoneyFlowAmount amount={payment.cash_amount} direction="out" /></td><td className="py-3 pr-3 tabular-nums">{money(payment.principal)}</td><td className="py-3 pr-3 tabular-nums">{money(payment.extra_principal)}</td><td className="py-3 pr-3 tabular-nums">{money(Number(payment.interest) + Number(payment.fees))}</td><td className="py-3 pr-3 tabular-nums">{Number(payment.advance_reserved) > 0 ? "+" + money(payment.advance_reserved) : Number(payment.advance_applied) > 0 ? "-" + money(payment.advance_applied) : "None"}</td><td className="py-3">{payment.historical ? "Earlier history" : "Recorded"}</td></tr>
                  ))}</tbody>
                </table></div> : <EmptyState title="No payments recorded" message="Select an installment above or use Record payment in Loan outlook for a principal-only payment." />}
              </Panel>
            </>
          )}
          {dialog && (dialog.type === "setup" || dialog.type === "terms") && <AssetFinancingDialog asset={asset} financing={financing} mode={dialog.type} mutate={dashboard.mutate} close={() => setDialog(null)} notify={notify} />}
          {dialog && (dialog.type === "payment" || dialog.type === "historical") && <AssetPaymentDialog asset={asset} financing={financing} accounts={dashboard.data.accounts} initialInstallment={dialog.installment} historical={dialog.type === "historical"} mutate={dashboard.mutate} close={() => setDialog(null)} notify={notify} />}
        </>
      )}
    </div>
  );
}
