import { ArrowDown, ArrowDownLeft, ArrowUp, ArrowUpRight, Bell, CalendarDays, ChevronRight, CircleCheck, CreditCard, Landmark, TriangleAlert, Users, Wallet } from "lucide-react";
import { money, dateLabel, monthLabel } from "../personal-dashboard/lib/format";
import UnsettledReminder from "../personal-dashboard/components/quick-entry/UnsettledReminder";

function FlowChange({ comparison }) {
  if (!comparison?.percentageLabel) return null;
  const Icon = comparison.trend === "down" ? ArrowDown : ArrowUp;
  return <span className="workspace-today-change" data-tone={comparison.tone} aria-label={comparison.text}>
    {comparison.trend !== "flat" && <Icon size={12} aria-hidden="true" />}
    {comparison.trend === "up" ? "+" : comparison.trend === "down" ? "−" : ""}{comparison.percentageLabel}
  </span>;
}

export default function MobilePersonalHome({ overview: o, month, user, accounts = [], comparisons = {}, upcoming, onDeadline, navigate, reviewToday, reviewOverdue, overdueLoading, overdueError, onReminders, financialFigures }) {
  const due = Number(o.today.tasks) + Number(o.today.bills);
  const overdue = Number(o.attention.overdue);
  // Match the cash, bank and e-wallet accounts included in the current balance.
  const cashAccounts = accounts.filter((account) => ["cash", "bank", "ewallet"].includes(account.kind));
  const names = cashAccounts.slice(0, 3).map((account) => account.name).join(" · ");
  return <div className="workspace-mobile-home workspace-personal-today">
    <section className="workspace-today-card" aria-labelledby="mobile-balance-title">
      <div className="workspace-today-banner">
        <img src="/workspace-assets/smokey-today-transparent-v2.webp" width="296" height="320" alt="" aria-hidden="true" decoding="async" className="workspace-today-artwork" />
        <h2 id="mobile-balance-title" className="workspace-today-balance-label"><span className="workspace-today-icon"><Wallet size={20} aria-hidden="true" /></span>Current cash &amp; bank balance</h2>
        <p className="workspace-today-balance">{money(o.position.available)}</p>
        <div className="workspace-today-balance-comparison">
          {o.previous_position?.available != null ? <><FlowChange comparison={comparisons.balance} /><span>vs. last month ({money(o.previous_position.available)})</span><span className="sr-only">Recorded balance as of {dateLabel(o.previous_position.as_of)}.{comparisons.balance?.noBaseline ? " Percentage change is unavailable for a zero baseline." : ""}</span></> : <span>Last month's balance unavailable</span>}
        </div>
        <div className="workspace-today-balance-context">
          <p>Available balances across {cashAccounts.length} recorded {cashAccounts.length === 1 ? "account" : "accounts"}</p>
        </div>
      </div>
      <dl className="workspace-today-cashflow" aria-label={`Income and expenses for ${monthLabel(month)}`}>
        {[{ key: "income", label: "Income", Icon: ArrowDownLeft }, { key: "expenses", label: "Expenses", Icon: ArrowUpRight }].map(({ key, label, Icon }) => <div key={key} className="workspace-today-flow" data-flow={key}>
          <dt><span className="workspace-today-icon"><Icon size={19} aria-hidden="true" /></span>{label}</dt>
          <dd><span className="workspace-today-flow-value">{money(o.month[key])}</span><FlowChange comparison={comparisons[key]} /></dd>
          {o.previous_month?.month && o.previous_month[key] != null && <dd className="workspace-today-previous">vs. {monthLabel(o.previous_month.month)}: {money(o.previous_month[key])}{comparisons[key]?.noBaseline && <span className="block">No percentage baseline</span>}</dd>}
        </div>)}
      </dl>
      <p className="workspace-today-period">Income and expenses for {monthLabel(month)}</p>
      <button type="button" className="workspace-today-accounts" onClick={() => navigate("accounts")}>
        <span className="workspace-today-icon"><Landmark size={22} aria-hidden="true" /></span>
        <span className="workspace-today-account-copy"><strong>{cashAccounts.length} recorded {cashAccounts.length === 1 ? "account" : "accounts"}</strong><span>{names || "Add an account to track your balances"}{cashAccounts.length > 3 ? ` · +${cashAccounts.length - 3} more` : ""}</span></span>
        <span className="workspace-today-account-action">Manage<span className="sr-only"> accounts</span><ChevronRight size={16} aria-hidden="true" /></span>
      </button>
    </section>

    <section aria-labelledby="mobile-personal-priorities">
      <div className="mb-3 flex items-center justify-between gap-3"><h2 id="mobile-personal-priorities" className="text-base font-semibold">Needs your attention</h2><button type="button" onClick={onReminders} className="inline-flex min-h-11 items-center gap-1.5 text-sm text-[var(--site-link)]"><Bell size={16} aria-hidden="true" />Checklist</button></div>
      <div className="workspace-today-attention">
        {overdue > 0 && <button type="button" className="workspace-mobile-row" disabled={overdueLoading} onClick={reviewOverdue} aria-busy={overdueLoading}><span className="workspace-today-icon" data-tone="negative"><TriangleAlert size={23} aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{overdue} overdue {overdue === 1 ? "item" : "items"}</span><span className="mt-1 block text-xs text-slate-500">{overdueLoading ? "Loading…" : "Review pending tasks and payments"}</span></span><ChevronRight size={18} aria-hidden="true" /></button>}
        {due > 0 && <button type="button" className="workspace-mobile-row" onClick={reviewToday}><span className="workspace-today-icon"><CalendarDays size={23} aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{due} due today</span><span className="mt-1 block text-xs text-slate-500">{o.today.tasks} tasks · {o.today.bills} bills</span></span><ChevronRight size={18} aria-hidden="true" /></button>}
        {!overdue && !due && <p className="flex items-center gap-3 py-5 text-sm text-slate-600"><CircleCheck size={22} className="text-emerald-700" aria-hidden="true" />No overdue items or deadlines today.</p>}
      </div>
      {overdueError && <p role="alert" className="mt-3 text-sm text-red-800">{overdueError}</p>}
      <UnsettledReminder summary={o.unsettled} user={user} embedded />
    </section>

    <div className="workspace-today-positions">
      <button type="button" className="workspace-today-position" onClick={() => navigate("accounts")}><span className="workspace-today-icon"><CreditCard size={21} aria-hidden="true" /></span><span><span className="workspace-today-position-label">Credit-card debt</span><strong>{money(o.position.debt)}</strong></span><ChevronRight size={16} aria-hidden="true" /></button>
      <button type="button" className="workspace-today-position" onClick={() => navigate("loans")}><span className="workspace-today-icon"><Users size={21} aria-hidden="true" /></span><span><span className="workspace-today-position-label">Owed to you</span><strong>{money(o.position.receivables)}</strong></span><ChevronRight size={16} aria-hidden="true" /></button>
    </div>

    <section aria-labelledby="mobile-next-deadlines">
      <div className="mb-4 flex items-center justify-between gap-3"><h2 id="mobile-next-deadlines" className="text-base font-semibold">Coming up</h2><button type="button" className="inline-flex min-h-11 items-center gap-1 text-sm text-[var(--site-link)]" onClick={() => navigate("calendar")}><CalendarDays size={16} aria-hidden="true" />Calendar</button></div>
      {upcoming.loading ? <p role="status" className="py-4 text-sm text-slate-500">Loading deadlines…</p> : upcoming.error ? <p role="alert" className="text-sm text-red-800">{upcoming.error}</p> : upcoming.data?.results?.length ? <div className="workspace-mobile-list">{upcoming.data.results.slice(0, 4).map((row) => <button key={row.id} type="button" className="workspace-mobile-row" onClick={() => onDeadline(row)}><span className="min-w-0 flex-1"><span className="block break-words text-sm font-medium">{row.title}</span><span className={`mt-1 block text-xs ${row.urgency === "overdue" ? "text-red-700" : "text-slate-500"}`}>{dateLabel(row.due_date)}{row.urgency === "overdue" ? " · Overdue" : ""}</span></span><ChevronRight size={18} className="shrink-0" aria-hidden="true" /></button>)}</div> : <p className="py-4 text-sm text-slate-500">No outstanding tasks or bills.</p>}
      <button type="button" className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-[var(--site-link)]" onClick={() => navigate("deadlines")}>All tasks &amp; bills<ChevronRight size={16} aria-hidden="true" /></button>
    </section>
    <details className="workspace-mobile-disclosure"><summary>All financial figures</summary>{financialFigures}</details>
  </div>;
}
