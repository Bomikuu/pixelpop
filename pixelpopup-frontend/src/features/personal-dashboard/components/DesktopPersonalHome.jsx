import { useState } from "react";
import { ArrowDownLeft, ArrowUp, ArrowDown, ArrowUpRight, Bell, CalendarClock, CalendarDays, ChevronRight, CircleCheck, CreditCard, House, Info, ListTodo, Minus, ReceiptText, RefreshCw, TriangleAlert, Users, Wallet } from "lucide-react";
import { Button } from "../ui/button";
import MonthPicker from "./MonthPicker";
import { SummaryTilePattern } from "./SummaryTiles";
import UnsettledReminder from "./quick-entry/UnsettledReminder";
import { useRecords } from "../hooks/useDashboardData";
import { dateLabel, money, monthLabel, today, words } from "../lib/format";
import "../styles/desktopHome.css";

function Trend({ values, label, tone = "neutral" }) {
  const points = values.map(Number).filter(Number.isFinite);
  if (points.length < 2) return null;
  const min = Math.min(...points), max = Math.max(...points);
  const coordinates = points.map((value, index) => `${4 + index * 124 / (points.length - 1)},${max === min ? 24 : 36 - (value - min) * 30 / (max - min)}`).join(" ");
  return <svg className="desktop-finance-trend" data-tone={tone} viewBox="0 0 132 44" role="img" aria-label={label}>
    <polygon points={`4,44 ${coordinates} 128,44`} fill="currentColor" opacity="0.07" />
    <polyline points={coordinates} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
  </svg>;
}

function FinancialTile({ item, navigate }) {
  const { Icon, label, value, hint, comparison, history, target, tone = "neutral" } = item;
  const comparisonTone = comparison?.tone || tone;
  const ChangeIcon = comparison?.trend === "up" ? ArrowUp : comparison?.trend === "down" ? ArrowDown : Minus;
  return <button type="button" className="desktop-finance-card group" onClick={() => navigate(target)} aria-label={`${label}: ${money(value)}. ${comparison?.text || hint}`}>
    <SummaryTilePattern tone={comparisonTone} />
    <span className="desktop-finance-icon" data-tone={tone}><Icon size={23} aria-hidden="true" /></span>
    <span className="desktop-finance-value"><span>{label}</span><strong>{money(value)}</strong></span>
    <span className="desktop-finance-context">
      {comparison?.percentageLabel ? <><span className="desktop-finance-change" data-tone={comparisonTone}><ChangeIcon size={14} aria-hidden="true" />{comparison.percentageLabel}</span><span>vs. last month</span></> : <span className="desktop-finance-caption">{comparison?.noBaseline ? "No prior baseline" : hint}</span>}
    </span>
    {history && <Trend values={history} label={`${label}: recorded ${label === "Current balance" ? "previous closing and current balances" : "monthly history"}`} tone={comparisonTone} />}
    <ChevronRight size={17} className="desktop-finance-chevron" aria-hidden="true" />
  </button>;
}

function AttentionRow({ Icon, title, description, badge, tone = "neutral", onClick, disabled }) {
  return <button type="button" className="desktop-attention-row" data-tone={tone} onClick={onClick} disabled={disabled} aria-busy={disabled || undefined}>
    <span className="desktop-attention-icon"><Icon size={22} aria-hidden="true" /></span>
    <span className="desktop-home-row-copy"><strong>{title}</strong><span>{description}</span></span>
    {badge && <span className="desktop-home-badge" data-tone={tone}>{badge}</span>}
    <ChevronRight size={16} aria-hidden="true" />
  </button>;
}

function DueDate({ row }) {
  return <><span className={row.urgency === "overdue" ? "desktop-home-overdue" : "desktop-home-due"}>{row.urgency === "overdue" ? "Overdue" : row.due_date === today() ? "Today" : words(row.urgency)}</span><time dateTime={row.due_date}>{dateLabel(row.due_date)}{row.due_time ? ` · ${row.due_time.slice(0, 5)}` : ""}</time></>;
}

function DeadlineStamp({ date }) {
  if (!date) return <span className="desktop-home-date-stamp">No date</span>;
  return <span className="desktop-home-date-stamp"><span>{new Intl.DateTimeFormat("en-PH", { month: "short", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`))}</span><strong>{Number(date.slice(-2))}</strong></span>;
}

export default function DesktopPersonalHome({ dashboard, month, onMonthChange, navigate, comparisons, upcoming, onDeadline, reviewOverdue, overdueLoading, overdueError, onReminders, financialFigures, children, onCalendar, active = true }) {
  const o = dashboard.data.overview;
  const [filter, setFilter] = useState("all");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const day = today();
  const dueToday = useRecords(`deadlines/?status=pending&start=${day}&end=${day}&page_size=100&compact=1`, dashboard.request, dashboard.version, { enabled: active });
  const rows = dueToday.data?.results || [];
  const tasks = rows.filter((row) => ["task", "reminder"].includes(row.kind));
  const bills = rows.filter((row) => ["bill", "subscription", "payment"].includes(row.kind) && row.settlement_kind !== "loan_collection");
  const filtered = filter === "tasks" ? tasks : filter === "bills" ? bills : rows;
  const totalToday = Number(o.today.tasks) + Number(o.today.bills);
  const cashHistory = o.previous_position?.available == null ? null : [o.previous_position.available, o.position.available];
  const tiles = [
    { label: "Current balance", value: o.position.available, Icon: Wallet, hint: "Available cash and bank balances", comparison: comparisons.balance, history: cashHistory, target: "accounts" },
    { label: "Tracked net worth", value: o.position.net_worth, Icon: House, hint: "Estimated from recorded assets and liabilities", target: "assets" },
    { label: "Credit-card debt", value: o.position.debt, Icon: CreditCard, hint: "Outstanding recorded card balances", target: "accounts" },
    { label: "Money owed to you", value: o.position.receivables, Icon: Users, hint: "Outstanding loans to people", target: "loans" },
    { label: "Monthly income", value: o.month.income, Icon: ArrowDownLeft, hint: "Recorded income for the selected month", comparison: comparisons.income, history: o.charts.monthly.map((row) => row.income), target: "income", tone: "positive" },
    { label: "Monthly expenses", value: o.month.expenses, Icon: ArrowUpRight, hint: "Recorded expenses for the selected month", comparison: comparisons.expenses, history: o.charts.monthly.map((row) => row.expenses), target: "transactions", tone: "negative" },
  ];
  const openToday = () => document.getElementById("desktop-today-deadlines")?.focus();
  return <div className="desktop-personal-home">
    <section className="desktop-home-welcome" aria-labelledby="desktop-home-greeting">
      <div><h2 id="desktop-home-greeting">Good day, {dashboard.data.user.name}!</h2><p>Stay on top of your money, bills, and deadlines.</p></div>
      <img src="/workspace-assets/smokey-today-transparent-v2.webp" width="296" height="320" alt="" aria-hidden="true" decoding="async" />
    </section>

    <section aria-labelledby="desktop-financial-summary">
      <div className="desktop-home-section-heading"><h2 id="desktop-financial-summary">Financial summary</h2><div className="desktop-home-period">
        <span className="sr-only" role="status">{dashboard.refreshing ? "Refreshing workspace…" : "Workspace up to date"}</span>
        <Button type="button" size="icon" variant="outline" disabled={dashboard.refreshing} aria-busy={dashboard.refreshing} aria-label="Refresh workspace" title={dashboard.updatedAt ? `Last updated ${new Intl.DateTimeFormat("en-PH", {hour:"numeric",minute:"2-digit",timeZone:"Asia/Manila"}).format(new Date(dashboard.updatedAt))} PHT. Refresh workspace.` : "Refresh workspace"} onClick={dashboard.refresh}><RefreshCw className={dashboard.refreshing ? "motion-safe:animate-spin" : ""} aria-hidden="true" /></Button>
        <MonthPicker id="desktop-summary-month" month={month} currentMonth={day.slice(0, 7)} onChange={onMonthChange} label="Financial summary month" />
      </div></div>
      <div className="desktop-finance-grid">{tiles.map((item) => <FinancialTile key={item.label} item={item} navigate={navigate} />)}</div>
      <p className="sr-only">Current balance, net worth, debt, and money owed are current positions. Income and expenses cover {monthLabel(month)}.</p>
    </section>

    <div className="desktop-home-work-grid">
      <div className="desktop-home-left-column">
        <section className="desktop-home-panel" aria-labelledby="desktop-home-attention">
          <div className="desktop-home-panel-heading"><h2 id="desktop-home-attention"><Bell size={20} aria-hidden="true" />Needs your attention</h2><button type="button" className="desktop-home-link" onClick={onReminders}>Checklist<ChevronRight size={15} aria-hidden="true" /></button></div>
          <div className="desktop-attention-list">
            {Number(o.attention.overdue) > 0 && <AttentionRow Icon={TriangleAlert} title={`${o.attention.overdue} overdue items`} description={overdueLoading ? "Loading overdue items…" : "Pending tasks and payments, earliest due first."} badge="Overdue" tone="negative" onClick={reviewOverdue} disabled={overdueLoading} />}
            {totalToday > 0 && <AttentionRow Icon={CalendarClock} title={`${totalToday} items due today`} description={`${o.today.tasks} tasks · ${o.today.bills} bills`} badge="Due today" onClick={openToday} />}
            {o.budget.limit != null && Number(o.budget.remaining) < 0 && <AttentionRow Icon={Info} title="Monthly budget exceeded" description={`${money(Math.abs(Number(o.budget.remaining)))} above your ${monthLabel(month)} budget`} badge="Review" tone="warning" onClick={() => navigate("spending")} />}
            {!Number(o.attention.overdue) && !totalToday && <p className="desktop-home-empty"><CircleCheck size={20} aria-hidden="true" />No overdue items or deadlines today.</p>}
          </div>
          {overdueError && <p role="alert" className="mt-3 text-sm text-red-800">{overdueError}</p>}
          <UnsettledReminder summary={o.unsettled} user={dashboard.data.user} embedded />
        </section>

        <section className="desktop-home-panel" aria-labelledby="desktop-upcoming-heading">
          <div className="desktop-home-panel-heading"><h2 id="desktop-upcoming-heading"><CalendarDays size={20} aria-hidden="true" />Upcoming deadlines</h2><button type="button" className="desktop-home-link" onClick={() => navigate("calendar")}>Calendar<ChevronRight size={15} aria-hidden="true" /></button></div>
          {upcoming.loading ? <p role="status" className="desktop-home-empty">Loading deadlines…</p> : upcoming.error ? <p role="alert" className="desktop-home-empty">{upcoming.error}</p> : !upcoming.data?.results?.length ? <p className="desktop-home-empty">No outstanding tasks or bills.</p> : <div className="desktop-upcoming-list">{upcoming.data.results.slice(0, 3).map((row) => <button type="button" key={row.id} className="desktop-upcoming-row" onClick={() => onDeadline(row)}>
            <DeadlineStamp date={row.due_date} />
            <span className="desktop-home-row-copy"><strong>{row.title}</strong><span>{row.category_name && row.category_name !== "Other" ? `${row.category_name} · ` : ""}{["task", "reminder"].includes(row.kind) ? words(row.kind) : row.amount == null ? "Not priced" : money(row.remaining_due ?? row.amount)}</span></span>
            <span className="desktop-home-badge" data-tone={row.urgency === "overdue" ? "negative" : "neutral"}>{row.urgency === "overdue" ? "Overdue" : row.due_date ? dateLabel(row.due_date) : "Unscheduled"}</span><ChevronRight size={15} aria-hidden="true" />
          </button>)}</div>}
          <button type="button" className="desktop-home-link desktop-home-view-all" onClick={() => navigate("deadlines")}>View all deadlines<ChevronRight size={15} aria-hidden="true" /></button>
        </section>
      </div>

      <section className="desktop-home-panel desktop-today-panel" aria-labelledby="desktop-today-deadlines">
        <div className="desktop-home-panel-heading"><h2 id="desktop-today-deadlines" tabIndex={-1}><ListTodo size={20} aria-hidden="true" />Today's tasks &amp; bills</h2><button type="button" className="desktop-home-link" onClick={onCalendar} aria-label="View all tasks and bills in calendar">View all<ChevronRight size={15} aria-hidden="true" /></button></div>
        <div className="desktop-today-filters" role="group" aria-label="Filter today's tasks and bills">{[{key:"all",label:"All",count:rows.length},{key:"tasks",label:"Tasks",count:tasks.length},{key:"bills",label:"Bills",count:bills.length}].map((item) => <button key={item.key} type="button" aria-pressed={filter === item.key} onClick={() => setFilter(item.key)}>{item.label} ({item.count})</button>)}</div>
        {dueToday.loading ? <p role="status" className="desktop-home-empty">Loading today's tasks and bills…</p> : dueToday.error ? <div className="desktop-home-empty"><p role="alert">{dueToday.error}</p><button type="button" className="desktop-home-link" onClick={dashboard.refresh}>Retry</button></div> : !filtered.length ? <p className="desktop-home-empty">No pending {filter === "all" ? "tasks or bills" : filter} due today.</p> : <div className="desktop-today-list">{filtered.slice(0, 6).map((row) => <button key={row.id} type="button" className="desktop-today-row" onClick={() => onDeadline(row)}>
          <span className="desktop-task-indicator" aria-hidden="true">{!["task", "reminder"].includes(row.kind) && <ReceiptText size={15} />}</span>
          <span className="desktop-home-row-copy"><strong>{row.title}</strong><span>{row.system_key ? "Complete by logging an entry" : row.category_name && row.category_name !== "Other" ? row.category_name : words(row.kind)}</span></span>
          <span className="desktop-today-due"><DueDate row={row} /></span><ChevronRight size={15} aria-hidden="true" />
        </button>)}</div>}
        {(filtered.length > 6 || Number(dueToday.data?.count) > rows.length) && <p className="desktop-today-footnote">Showing {Math.min(filtered.length, 6)} items. View all to see the complete list.</p>}
      </section>
    </div>
    <details className="desktop-home-details" onToggle={(event) => setDetailsOpen(event.currentTarget.open)}><summary>More financial figures &amp; deadline views</summary>{detailsOpen && <div className="space-y-5 pt-5">{financialFigures}{children}</div>}</details>
  </div>;
}
