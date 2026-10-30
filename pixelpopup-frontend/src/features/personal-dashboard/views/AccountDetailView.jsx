import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowLeftRight,
  CalendarClock,
  CreditCard,
  History,
  LayoutDashboard,
  Pencil,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { useRecords } from "../hooks/useDashboardData";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import AccountCardFace from "../components/AccountCardFace";
import AccountActionsMenu from "../components/AccountActionsMenu";
import { InstitutionLogo } from "../components/ChoiceTiles";
import AccountLedger from "../components/AccountLedger";
import AccountSummaryCharts from "../components/AccountSummaryCharts";
import RecordList from "../components/RecordList";
import SummaryTiles from "../components/SummaryTiles";
import { EmptyState, ErrorState, Panel, LoadingState } from "../components/Panel";
import { dateLabel, money, today, words } from "../lib/format";
import { coverageTypes, fundTypes, institutionFor } from "../lib/presets";
import CashLoanList from "../cash-loans/CashLoanList";

function summaryItems(account, summary, details) {
  if (account.kind === "fund" && coverageTypes.includes(account.fund_type))
    return [
      { label: "Paid in selected month", value: money(details?.premium_summary?.paid_this_month || 0), icon: "expenses" },
      { label: "Total premiums recorded", value: money(details?.premium_summary?.paid_total || 0), icon: "count" },
      { label: "Next premium due", value: details?.next_premium_due ? dateLabel(details.next_premium_due) : "Not scheduled", icon: "deadline" },
    ];
  const card = account.kind === "credit_card";
  const fund = account.kind === "fund";
  const items = [
    {
      label: card ? "Outstanding debt" : fund ? "Recorded value" : "Available balance",
      value: money(summary.balance),
      icon: card ? "debt" : fund ? "funds" : "balance",
      hint: "Current recorded amount, through today",
    },
  ];
  if (card) {
    items.push(
      { label: "Charges this month", value: money(summary.card_charges), icon: "expenses" },
      { label: "Payments this month", value: money(summary.card_payments), icon: "income" },
      { label: "Debt change this month", value: money(summary.net_change), icon: "debt", hint: "Positive means more debt" },
      { label: "Available credit", value: money(summary.available_credit), icon: "balance", hint: "Credit limit less posted debt and cash-loan reservations" },
      { label: "Unposted costs reserved", value: money(summary.additional_reservation), icon: "financing", hint: "Reservation only—not posted debt" },
      { label: "Limit used", value: summary.utilization == null ? "Not set" : Number(summary.utilization).toFixed(1) + "%", icon: "count" },
    );
  } else if (fund) {
    items.push(
      { label: "Added this month", value: money(summary.contributions), icon: "funds" },
      { label: "Withdrawn this month", value: money(summary.withdrawals), icon: "expenses" },
      { label: "Value change this month", value: money(summary.net_change), icon: "balance" },
    );
  } else {
    items.push(
      { label: "Received income", value: money(summary.received_income), icon: "income" },
      { label: "Expenses this month", value: money(summary.expenses), icon: "expenses" },
      { label: "Transfers in", value: money(summary.transfers_in), icon: "income" },
      { label: "Transfers out", value: money(summary.transfers_out), icon: "expenses" },
      { label: "Net change this month", value: money(summary.net_change), icon: "balance", hint: "Includes transfers, corrections and financing payments" },
      { label: "Expected income", value: money(summary.expected_income), icon: "income", hint: "Not included in your balance" },
    );
  }
  return items;
}

export default function AccountDetailView({ accountId, dashboard, month, openForm, confirmDelete, showHistory, notify }) {
  const state = useRecords(
    "accounts/" + accountId + "/detail/?month=" + month,
    dashboard.request,
    dashboard.version,
  );
  const [tab, setTab] = useState("summary");
  const heading = useRef(null);
  const account = state.data?.account;
  const summary = state.data?.summary;
  const isCard = account?.kind === "credit_card";
  const isFund = account?.kind === "fund";
  const isCoverage = isFund && coverageTypes.includes(account.fund_type);
  const showInstitution = account && !isFund && account.kind !== "cash";
  const institution = showInstitution ? institutionFor(account.institution || account.name) : null;
  const backTarget = isFund ? "funds" : "accounts";
  const premiumSchedule = state.data?.premium_schedule;
  const premiumDues = state.data?.premium_dues || [];

  useEffect(() => { heading.current?.focus(); }, [accountId, account?.id]);
  useEffect(() => {
    if (!account) return;
    const previous = document.title;
    document.title = account.name + " | Accounts & cards";
    return () => { document.title = previous; };
  }, [account?.name]);

  return (
    <div className="min-w-0 space-y-5">
      <Button asChild variant="ghost">
        <Link to={"/dashboard/" + backTarget + "?month=" + month}>
          <ArrowLeft aria-hidden="true" /> Back to {isFund ? "benefits & investments" : "accounts & cards"}
        </Link>
      </Button>
      {state.loading ? (
        <LoadingState message="Loading account…" />
      ) : state.error ? (
        <ErrorState message={state.error} retry={dashboard.refresh} />
      ) : !account || !summary ? (
        <EmptyState title="Account not found" message="It may have been removed. Return to your accounts to choose another." />
      ) : (
        <>
          <section className="flex flex-wrap items-start justify-between gap-5 rounded-xl border border-[var(--pd-border)] bg-white p-4 sm:p-5">
            <div className="flex min-w-0 flex-1 flex-wrap items-start gap-5">
              {isCoverage ? (
                <span className="grid size-20 shrink-0 place-items-center rounded-xl border border-[var(--pd-border)] bg-slate-50 text-slate-600" aria-hidden="true">
                  <ShieldCheck size={34} strokeWidth={1.6} />
                </span>
              ) : <div className="w-full max-w-[290px] shrink-0"><AccountCardFace account={account} /></div>}
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-3">
                  {showInstitution && (
                    <span className="grid h-11 w-16 shrink-0 place-items-center rounded-md border border-[var(--pd-border)] bg-white p-1" aria-hidden="true">
                      <InstitutionLogo institution={institution} className="h-8 w-full" />
                    </span>
                  )}
                  <h2 ref={heading} tabIndex={-1} className="min-w-0 break-words text-xl font-semibold tracking-tight text-slate-950 focus:outline-none">{account.name}</h2>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {isFund ? fundTypes.find((item) => item.value === account.fund_type)?.label || words(account.fund_type) : words(account.kind)}
                  {account.institution ? " · " + account.institution : ""}
                  {!account.active ? " · Archived" : ""}
                </p>
                {account.last_four && <p className="mt-2 text-sm text-slate-600">Ending in {account.last_four}{account.card_expiry ? " · Expires " + account.card_expiry : ""}</p>}
                <p className="mt-4 text-xs text-slate-600">{isCoverage ? "Premiums are expenses linked to this policy. Coverage is not counted as an asset or included in net worth." : isFund ? "Manually tracked; not a live provider balance." : "Manually tracked; not a live bank balance."}</p>
              </div>
            </div>
            {account.active && (
              <AccountActionsMenu account={account} dashboard={dashboard} month={month} openForm={openForm} showHistory={() => setTab("history")} confirmDelete={confirmDelete} notify={notify} premiumDue={premiumDues[0]} />
            )}
          </section>

          {isCoverage ? (
            <div className="space-y-5">
              <SummaryTiles items={summaryItems(account, summary, state.data)} />
              <Panel
                title="Premium schedule"
                description="Choose a fixed or variable premium, then pay each monthly or quarterly bill when it is due."
                action={account.active && (
                  <Button variant="outline" onClick={() => openForm("schedule", premiumSchedule || { coverage: account.id, title: account.name + " premium", frequency: "monthly" })}>
                    {premiumSchedule ? <Pencil aria-hidden="true" /> : <Plus aria-hidden="true" />}
                    {premiumSchedule ? "Edit schedule" : "Set schedule"}
                  </Button>
                )}
              >
                {premiumSchedule ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-x-8 gap-y-2 border-b border-[var(--pd-border)] pb-4 text-sm">
                      <span><span className="text-slate-600">Frequency</span><strong className="ml-2 font-medium text-slate-950">{words(premiumSchedule.frequency)}</strong></span>
                      <span><span className="text-slate-600">Premium</span><strong className="ml-2 font-medium text-slate-950">{premiumSchedule.variable_amount ? "Variable" : money(premiumSchedule.amount)}</strong></span>
                      <span><span className="text-slate-600">Status</span><strong className="ml-2 font-medium text-slate-950">{premiumSchedule.active ? "Active" : "Stopped"}</strong></span>
                    </div>
                    {premiumDues.length ? (
                      <div className="divide-y divide-[var(--pd-border)]">
                        {premiumDues.map((due) => (
                          <div key={due.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600" aria-hidden="true"><CalendarClock size={19} /></span>
                              <div>
                                <p className="font-medium text-slate-950">{dateLabel(due.due_date)}</p>
                                <p className="text-sm text-slate-600">{due.amount == null ? "Enter amount when paying" : money(due.amount)}{due.due_date < today() ? " · Overdue" : " · Upcoming"}</p>
                              </div>
                            </div>
                            {account.active && <Button variant="outline" size="sm" onClick={() => openForm("settlement", due)}>Pay premium</Button>}
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-sm text-slate-600">{premiumSchedule.active ? "No premium due within the next 100 days." : "This schedule is stopped. Previous payments remain below."}</p>}
                  </div>
                ) : (
                  <EmptyState icon={CalendarClock} title="No premium schedule yet" message="Set a monthly or quarterly schedule to see upcoming dues here and in Bills." />
                )}
              </Panel>
              <RecordList
                resource="transactions"
                kind="expense"
                title="Premium payment history"
                fixedParams={{ coverage: String(account.id) }}
                hideAnalytics
                hideAdd
                dashboard={dashboard}
                month={month}
                openForm={openForm}
                confirmDelete={confirmDelete}
                showHistory={showHistory}
                notify={notify}
              />
            </div>
          ) : <Tabs value={tab} onValueChange={setTab} className="gap-5">
            <TabsList aria-label="Account details" className="w-full flex-wrap justify-start gap-1 p-1 group-data-[orientation=horizontal]/tabs:h-auto sm:w-fit">
              <TabsTrigger value="summary" className="px-3 py-2"><LayoutDashboard aria-hidden="true" /> Summary</TabsTrigger>
              <TabsTrigger value="transactions" className="px-3 py-2"><ArrowLeftRight aria-hidden="true" /> Transactions</TabsTrigger>
              <TabsTrigger value="history" className="px-3 py-2"><History aria-hidden="true" /> History</TabsTrigger>
              {isCard && <TabsTrigger value="cash-loans" className="px-3 py-2"><CreditCard aria-hidden="true" /> Cash loans</TabsTrigger>}
            </TabsList>
            <TabsContent value="summary" className="space-y-5">
              <SummaryTiles items={summaryItems(account, summary)} />
              {isCard && <Panel title="Debt & credit usage" description="Used credit includes posted debt and reserved cash-loan costs; this is not a repayment percentage.">
                <div className="mb-3 flex flex-wrap items-end justify-between gap-2 text-sm">
                  <span>Outstanding debt <span className="ml-2 tabular-nums">{money(summary.balance)}</span></span>
                  <span className="tabular-nums text-slate-600">{summary.utilization == null ? "Credit limit not set" : Number(summary.utilization).toFixed(1) + "% of " + money(account.credit_limit) + " used"}</span>
                </div>
                {summary.utilization == null ? <p className="text-sm text-slate-600">Set a credit limit in Edit account to track usage.</p> : <Progress value={Math.min(100, Math.max(0, Number(summary.utilization)))} aria-label="Credit limit used" aria-valuetext={Number(summary.utilization).toFixed(1) + "% used"} className={"h-3 bg-slate-100 [&_[data-slot=progress-indicator]]:motion-reduce:transition-none " + (Number(summary.utilization) >= 90 ? "[&_[data-slot=progress-indicator]]:bg-amber-600" : "")} />}
                <p className="mt-3 text-xs text-slate-600">{money(summary.available_credit)} available credit{Number(summary.additional_reservation) > 0 ? " · " + money(summary.additional_reservation) + " reserved for unposted loan costs" : ""}</p>
              </Panel>}
              <AccountSummaryCharts account={account} charts={state.data.charts} />
            </TabsContent>
            <TabsContent value="transactions">
              {isFund ? (
                <Panel title="Transactions" description="Income and expenses are separate from fund contributions and withdrawals.">
                  <EmptyState title="No fund transactions" message="Contributions and withdrawals appear in History, where they change the recorded fund value." />
                </Panel>
              ) : (
                <RecordList
                  key={account.id}
                  resource="transactions"
                  title="Account transactions"
                  accountScoped
                  hideAdd
                  fixedParams={{ account: String(account.id) }}
                  dashboard={dashboard}
                  month={month}
                  openForm={openForm}
                  confirmDelete={confirmDelete}
                  showHistory={showHistory}
                  notify={notify}
                />
              )}
            </TabsContent>
            <TabsContent value="history">
              <AccountLedger key={account.id} account={account} month={month} dashboard={dashboard} />
            </TabsContent>
            {isCard && <TabsContent value="cash-loans"><CashLoanList card={account} dashboard={dashboard} month={month} notify={notify} /></TabsContent>}
          </Tabs>}
        </>
      )}
    </div>
  );
}
