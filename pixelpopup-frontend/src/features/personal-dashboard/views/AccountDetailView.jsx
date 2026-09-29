import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowLeftRight,
  CalendarClock,
  CreditCard,
  History,
  LayoutDashboard,
  Pencil,
  Plus,
  Receipt,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useRecords } from "../hooks/useDashboardData";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import AccountCardFace from "../components/AccountCardFace";
import { InstitutionLogo } from "../components/ChoiceTiles";
import AccountLedger from "../components/AccountLedger";
import AccountSummaryCharts from "../components/AccountSummaryCharts";
import RecordList from "../components/RecordList";
import SummaryTiles from "../components/SummaryTiles";
import { EmptyState, ErrorState, Panel } from "../components/Panel";
import { dateLabel, money, today, words } from "../lib/format";
import { coverageTypes, fundTypes, institutionFor } from "../lib/presets";

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
        <p role="status" className="py-8 text-sm text-slate-600">Loading account…</p>
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
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => openForm(isFund ? "fund" : "account", account)}><Pencil aria-hidden="true" /> Edit</Button>
                {!isCoverage && <Button variant="outline" onClick={() => openForm("adjustment", account)}><ArrowLeftRight aria-hidden="true" /> Correct balance</Button>}
                {isCard && Number(summary.balance) > 0 && <Button onClick={() => openForm("movement", { kind: "credit_card_payment", destination: account.id })}><CreditCard aria-hidden="true" /> Record payment</Button>}
                {isFund && !isCoverage && <>
                  <Button onClick={() => openForm("fund_contribution", { destination: account.id })}><Plus aria-hidden="true" /> Contribute</Button>
                  <Button variant="outline" onClick={() => openForm("fund_withdrawal", { source: account.id })}><ArrowDownLeft aria-hidden="true" /> Withdraw</Button>
                </>}
                {isCoverage && <Button onClick={() => premiumDues.length ? openForm("settlement", premiumDues[0]) : openForm("expense", { name: account.name + " premium", coverage: account.id })}><Receipt aria-hidden="true" /> Record premium payment</Button>}
                <Button variant="ghost" onClick={() => confirmDelete("accounts", account)}><Trash2 aria-hidden="true" /> Archive</Button>
              </div>
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
            </TabsList>
            <TabsContent value="summary" className="space-y-5">
              <SummaryTiles items={summaryItems(account, summary)} />
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
                  headerActions={account.active && (
                    <div className="flex flex-wrap gap-2">
                      {!isCard && <Button variant="outline" onClick={() => openForm("income", { account: account.id })}><Plus aria-hidden="true" /> Add income</Button>}
                      <Button onClick={() => openForm("expense", { account: account.id })}><Plus aria-hidden="true" /> Add expense</Button>
                    </div>
                  )}
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
          </Tabs>}
        </>
      )}
    </div>
  );
}
