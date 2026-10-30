import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowDownLeft, ArrowLeft, ArrowLeftRight, ArrowUpRight, ChevronRight, Ellipsis, PiggyBank, Plus, TrendingUp, Wallet } from "lucide-react";
import AnimatedNumber from "../personal-dashboard/components/AnimatedNumber";
import { SummaryTilePattern } from "../personal-dashboard/components/SummaryTiles";
import RecordList from "../personal-dashboard/components/RecordList";
import { EmptyState, ErrorState, LoadingState } from "../personal-dashboard/components/Panel";
import { useRecords } from "../personal-dashboard/hooks/useDashboardData";
import { choiceIcon } from "../personal-dashboard/lib/presets";
import { dateLabel, money, monthLabel, words } from "../personal-dashboard/lib/format";
import { MoneyCategoryChart, MoneyChange, MoneyMonthComparison, MonthlyMoneyChart } from "./MobileMoneyCharts";
import "./mobileTransactions.css";

const percent = (value) => value == null ? "—" : new Intl.NumberFormat("en-PH", { maximumFractionDigits: 1 }).format(Number(value)) + "%";

function SectionHeading({ id, children, onViewAll }) {
  return <div className="money-section-heading"><h2 id={id}>{children}</h2>{onViewAll && <button type="button" onClick={onViewAll}>View all <ChevronRight size={14} aria-hidden="true" /></button>}</div>;
}

function MoneyMetric({ label, value, previous, Icon, tone, month, rate = false }) {
  return <div className="group workspace-summary-tile money-surface money-metric" data-tone={tone}>
    <SummaryTilePattern tone={tone} />
    <dt><span className="money-icon"><Icon size={17} aria-hidden="true" /></span>{label}</dt>
    <dd className="money-metric-value"><AnimatedNumber value={value} format={rate ? percent : money} /></dd>
    {rate ? <dd className="money-muted">of received income</dd> : <><dd><MoneyChange value={value} previous={previous} lowerIsBetter={tone === "negative"} /></dd><dd className="money-muted">vs. {monthLabel(month)}</dd></>}
  </div>;
}

function RecentEntries({ state, movement = false, onOpen, onRetry }) {
  if (state.loading) return <LoadingState message={movement ? "Loading movements…" : "Loading transactions…"} />;
  if (!state.data) return <ErrorState message={state.error || "Records could not be loaded."} retry={onRetry} />;
  const rows = state.data.results || [];
  return <>
    {state.error && <ErrorState message={`Showing the last loaded records. ${state.error}`} retry={onRetry} />}
    {state.refreshing && <p role="status" className="money-muted px-4 pt-3">Updating records…</p>}
    {!rows.length ? <EmptyState title={movement ? "No movements this month" : "No transactions this month"} message={movement ? "Transfers, card payments and loan movements will appear here." : "Add an expense or received income to start your record."} /> : <ul className="money-records">{rows.map((row) => {
      const income = row.kind === "income";
      const expected = income && row.receipt_state === "expected";
      const Icon = movement ? ArrowLeftRight : income ? ArrowDownLeft : choiceIcon(row.category_name?.toLowerCase() || "other", row.category_name);
      return <li key={row.id}><button type="button" className="money-record" data-tone={movement || expected ? "neutral" : income ? "positive" : "negative"} onClick={() => onOpen(row)}>
        <span className="money-icon"><Icon size={18} aria-hidden="true" /></span>
        <span className="money-record-name"><strong>{movement ? words(row.kind) : row.name || words(row.kind)}</strong><span>{movement ? [row.source_name, row.destination_name].filter(Boolean).join(" → ") || "Account movement" : `${row.category_name || "Other"} · ${row.account == null ? "Needs account" : row.account_name || "Account"}`}{expected && " · Expected"}</span></span>
        <span className="money-record-amount"><strong>{movement ? "" : income ? "+" : "−"}{money(row.amount)}</strong><span>{dateLabel(row.date)}</span></span>
        {movement && <ChevronRight size={14} aria-hidden="true" />}
      </button></li>;
    })}</ul>}
  </>;
}

export default function MobileTransactionsPage({ dashboard, month, onMore, ...actions }) {
  const [params, setParams] = useSearchParams();
  const view = params.get("moneyView") || ([...params.keys()].some((key) => key.startsWith("transactions.")) ? "transactions" : [...params.keys()].some((key) => key.startsWith("movements.")) ? "movements" : "overview");
  const overview = view !== "transactions" && view !== "movements";
  const heading = useRef(null);
  const priorView = useRef(view);
  useEffect(() => {
    if (priorView.current !== view) { heading.current?.focus(); priorView.current = view; }
  }, [view]);
  const records = useRecords(`transactions/?month=${month}&page_size=5`, dashboard.request, dashboard.version, { enabled: overview });
  const movements = useRecords(`movements/?month=${month}&page_size=3`, dashboard.request, dashboard.version, { enabled: overview });
  const o = dashboard.data.overview;
  function showView(next, filters = {}) {
    setParams((current) => {
      const query = new URLSearchParams(current);
      query.set("moneyView", next);
      if (next === "transactions") {
        for (const key of ["q", "category", "kind", "period", "start", "end", "page"]) query.delete(`transactions.${key}`);
      }
      for (const [key, value] of Object.entries(filters)) {
        if (value == null || value === "") query.delete(`transactions.${key}`);
        else query.set(`transactions.${key}`, String(value));
      }
      return query;
    });
  }
  const shared = { dashboard, month, ...actions };
  if (!overview) return <div className="mobile-money-page space-y-4">
    <button ref={heading} type="button" className="money-back" onClick={() => showView("overview")}><ArrowLeft size={16} aria-hidden="true" />Money overview</button>
    {view === "movements" && <button type="button" className="money-link" onClick={() => actions.openForm("movement")}>Add a transfer or payment</button>}
    <RecordList resource={view === "movements" ? "movements" : "transactions"} title={view === "movements" ? "Transfers, card payments & loan movements" : "All transactions"} {...shared} />
  </div>;
  if (o.selected_month !== month) return <LoadingState message="Loading money overview…" />;
  const current = { income: Number(o.month.received), expenses: Number(o.month.expenses) };
  current.net = current.income - current.expenses;
  const history = o.charts.monthly;
  const selectedIndex = history.findIndex((row) => row.month === month);
  const old = history[selectedIndex - 1];
  const previous = old ? { income: Number(old.income) - Number(old.expected || 0), expenses: Number(old.expenses), net: Number(old.net) } : {};
  const topCategory = o.charts.categories.find((row) => Number(row.amount) > 0);
  const metrics = [
    { key: "income", label: "Income", Icon: ArrowDownLeft, tone: "positive" },
    { key: "expenses", label: "Expenses", Icon: ArrowUpRight, tone: "negative" },
    { key: "net", label: "Net income", Icon: TrendingUp, tone: "neutral" },
  ];
  return <div className="mobile-money-page workspace-personal-today">
    <h2 ref={heading} tabIndex={-1} className="sr-only">Money overview</h2>
    <section className="workspace-today-card money-balance" aria-labelledby="mobile-money-balance-title">
      <div className="workspace-today-banner">
        <img src="/workspace-assets/smokey-money-v1.webp" width="320" height="352" alt="" aria-hidden="true" decoding="async" className="money-balance-artwork" />
        <h2 id="mobile-money-balance-title" className="workspace-today-balance-label"><span className="workspace-today-icon"><Wallet size={19} aria-hidden="true" /></span>Current balance</h2>
        <p className="workspace-today-balance"><AnimatedNumber value={o.position.available} format={money} /></p>
        {o.previous_position?.available != null && <div className="money-balance-comparison"><MoneyChange value={o.position.available} previous={o.previous_position.available} /><span>vs. last month ({money(o.previous_position.available)})</span><span className="sr-only">Closing balance on {dateLabel(o.previous_position.as_of)}</span></div>}
        <p className="money-balance-caption">Available cash and bank balances</p>
      </div>
    </section>
    <dl className="money-metrics">{metrics.map(({ key, ...metric }) => <MoneyMetric key={key} {...metric} value={current[key]} previous={previous[key]} month={old?.month || o.previous_month.month} />)}<MoneyMetric label="Savings rate" Icon={PiggyBank} value={current.income > 0 ? current.net / current.income * 100 : null} rate tone="neutral" /></dl>
    <section aria-labelledby="mobile-money-actions-title">
      <SectionHeading id="mobile-money-actions-title">Quick actions</SectionHeading>
      <div className="money-quick-actions">
        <button type="button" data-tone="negative" onClick={() => actions.openForm("expense")}><span className="money-icon"><Plus size={18} aria-hidden="true" /></span>Add expense</button>
        <button type="button" data-tone="positive" onClick={() => actions.openForm("income")}><span className="money-icon"><ArrowDownLeft size={18} aria-hidden="true" /></span>Add income</button>
        <button type="button" onClick={() => actions.openForm("movement", { kind: "transfer" })}><span className="money-icon"><ArrowLeftRight size={18} aria-hidden="true" /></span>Transfer</button>
        <button type="button" aria-label="More quick actions" onClick={onMore}><Ellipsis size={20} aria-hidden="true" /></button>
      </div>
    </section>
    <section aria-labelledby="mobile-money-recent-title"><SectionHeading id="mobile-money-recent-title" onViewAll={() => showView("transactions")}>Recent transactions</SectionHeading><div className="money-surface"><RecentEntries state={records} onRetry={dashboard.refresh} onOpen={(row) => actions.showHistory("transactions", row)} /></div></section>
    <MonthlyMoneyChart rows={o.charts.daily} month={month} />
    <section aria-labelledby="mobile-money-this-month-title"><SectionHeading id="mobile-money-this-month-title">This month</SectionHeading><div className="money-month-grid">{metrics.map(({ key, label, Icon, tone }) => <button key={key} type="button" className="group workspace-summary-tile money-surface money-month-item" data-tone={tone} onClick={() => showView("transactions", { kind: key === "net" ? "" : key === "income" ? "income" : "expense", page: 1 })}><SummaryTilePattern tone={tone} /><span className="money-icon"><Icon size={19} aria-hidden="true" /></span><span><span>{label}</span><strong>{money(current[key])}</strong></span><ChevronRight size={14} aria-hidden="true" /></button>)}<button type="button" className="group workspace-summary-tile money-surface money-month-item" onClick={() => showView("transactions", { kind: "expense", category: topCategory?.category_id || "", page: 1 })}><SummaryTilePattern tone="neutral" /><span className="money-icon"><Wallet size={19} aria-hidden="true" /></span><span><span>Top category</span><strong>{topCategory?.name || "No expenses"}</strong>{topCategory && <span>{money(topCategory.amount)}</span>}</span><ChevronRight size={14} aria-hidden="true" /></button></div></section>
    <MoneyCategoryChart categories={o.charts.categories} onViewAll={() => showView("transactions", { kind: "expense", page: 1 })} />
    <MoneyMonthComparison history={history} month={month} />
    <section aria-labelledby="mobile-money-movements-title"><SectionHeading id="mobile-money-movements-title" onViewAll={() => showView("movements")}>Transfers, card payments &amp; loans</SectionHeading><div className="money-surface"><RecentEntries state={movements} movement onRetry={dashboard.refresh} onOpen={(row) => actions.showHistory("movements", row)} /></div></section>
    <p className="money-muted">Income and savings rate use received income. Expected income of {money(o.month.expected)} is excluded. Transfers and repayments stay separate.</p>
  </div>;
}
