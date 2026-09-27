import {
  ArrowUpRight,
  CalendarClock,
  LayoutDashboard,
  Wallet,
  ChartNoAxesCombined,
  CalendarDays,
  ChevronRight,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import RecordIdentity from "../components/RecordIdentity";
import { Button } from "../ui/button";
import SummaryTiles from "../components/SummaryTiles";
import { ComparisonChart, SpendingChart } from "../components/Charts";
import BudgetProgress from "../components/BudgetProgress";
import RecordList from "../components/RecordList";
import { Panel, EmptyState } from "../components/Panel";
import { money, monthLabel, today } from "../lib/format";
import { useRecords } from "../hooks/useDashboardData";
import UrgencyBadge from "../components/UrgencyBadge";
import { dateLabel } from "../lib/format";

function deadlineGroup(row) {
  const now = new Date(today() + "T12:00:00Z");
  const due = new Date(row.due_date + "T12:00:00Z");
  const days = Math.round((due - now) / 86400000);
  if (row.urgency === "overdue") return "Overdue";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return days <= 7 - (now.getUTCDay() || 7) ? "This week" : "Later";
}

export default function OverviewView({
  dashboard,
  month,
  navigate,
  ...actions
}) {
  const o = dashboard.data.overview;
  const upcoming = useRecords(
    "deadlines/?status=pending&page_size=8",
    dashboard.request,
    dashboard.version,
  );
  const groups = ["Overdue", "Today", "Tomorrow", "This week", "Later"].map(
    (label) => ({
      label,
      rows: (upcoming.data?.results || []).filter(
        (r) => deadlineGroup(r) === label,
      ),
    }),
  );
  const tiles = [
    {
      label: "Current balance",
      value: money(o.position.available),
      hint: "Available cash and bank balances",
      icon: "balance",
    },
    {
      label: "Monthly income",
      value: money(o.month.income),
      hint: money(o.month.expected) + " still expected",
      icon: "income",
    },
    {
      label: "Monthly expenses",
      value: money(o.month.expenses),
      hint:
        o.month.income > 0
          ? ((Number(o.month.expenses) / Number(o.month.income)) * 100).toFixed(
              1,
            ) + "% of monthly income"
          : "No monthly income recorded",
      icon: "expenses",
    },
    {
      label: "Projected remaining",
      value: money(o.month.remaining),
      hint: "Income less expenses and unpaid ordinary bills",
      icon: "budget",
    },
    {
      label: "Spent today",
      value: money(o.today.spent),
      hint:
        o.budget.daily == null
          ? "Set a monthly budget for a daily guide"
          : "Daily guide: " + money(o.budget.daily),
      icon: "expenses",
    },
  ];
  return (
    <div className="space-y-6">
      <SummaryTiles items={tiles} />
      <Tabs defaultValue="summary" className="gap-5">
        <TabsList
          aria-label="Dashboard overview groups"
          className="w-full flex-wrap justify-start gap-1 p-1 group-data-[orientation=horizontal]/tabs:h-auto sm:w-fit"
        >
          <TabsTrigger value="summary" className="px-3 py-2">
            <LayoutDashboard aria-hidden="true" />
            Summary
          </TabsTrigger>
          <TabsTrigger value="planning" className="px-3 py-2">
            <CalendarClock aria-hidden="true" />
            Planning
          </TabsTrigger>
          <TabsTrigger value="money" className="px-3 py-2">
            <Wallet aria-hidden="true" />
            Money
          </TabsTrigger>
          <TabsTrigger value="insights" className="px-3 py-2">
            <ChartNoAxesCombined aria-hidden="true" />
            Insights
          </TabsTrigger>
        </TabsList>
        <TabsContent value="summary" className="space-y-6">
          <Panel
            title="Next deadlines"
            description="Outstanding items across all months, earliest first."
            action={
              <Button variant="outline" onClick={() => navigate("deadlines")}>
                View all
                <ChevronRight aria-hidden="true" />
              </Button>
            }
          >
            {upcoming.loading ? (
              <p role="status">Loading deadlines…</p>
            ) : upcoming.error ? (
              <p role="alert">{upcoming.error}</p>
            ) : !upcoming.data?.results.length ? (
              <EmptyState
                title="Nothing outstanding"
                message="Add a task or bill to plan ahead."
              />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {groups
                  .filter((g) => g.rows.length)
                  .map((g) => (
                    <section
                      key={g.label}
                      className={
                        "min-w-0 xl:border-l xl:pl-5 first:xl:border-l-0 first:xl:pl-0 " +
                        (g.rows.length > 1 ? "sm:col-span-2 " : "") +
                        (g.rows.length >= 4
                          ? "xl:col-span-4"
                          : g.rows.length === 3
                            ? "xl:col-span-3"
                            : g.rows.length === 2
                              ? "xl:col-span-2"
                              : "xl:col-span-1")
                      }
                    >
                      <h3 className="mb-3 text-sm font-semibold text-slate-600">
                        {g.label}
                      </h3>
                      <ul
                        className={
                          "grid gap-3 " +
                          (g.rows.length > 1 ? "sm:grid-cols-2 " : "") +
                          (g.rows.length >= 4
                            ? "xl:grid-cols-4"
                            : g.rows.length === 3
                              ? "xl:grid-cols-3"
                              : "")
                        }
                      >
                        {g.rows.map((r) => (
                          <li key={r.id} className="min-w-0">
                            <button
                              type="button"
                              onClick={() => actions.openForm("deadline", r)}
                              aria-label={
                                "Review " +
                                r.title +
                                ", due " +
                                dateLabel(r.due_date)
                              }
                              className={
                                "group flex h-full w-full flex-col rounded-lg border p-3 text-left text-sm text-slate-950 transition-colors hover:border-rose-300 hover:bg-rose-100/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pd-primary)] motion-reduce:transition-none " +
                                (r.urgency === "overdue"
                                  ? "border-rose-200 bg-rose-100/50"
                                  : "border-rose-100 bg-rose-50/60")
                              }
                            >
                              <span className="flex w-full items-start gap-2">
                                <span className="min-w-0 flex-1 [&>span>span:last-child]:font-semibold">
                                  <RecordIdentity
                                    resource="deadlines"
                                    row={r}
                                    label={r.title}
                                  />
                                </span>
                                <ChevronRight
                                  size={18}
                                  aria-hidden="true"
                                  className="mt-2 shrink-0 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-rose-800 motion-reduce:transform-none motion-reduce:transition-none"
                                />
                              </span>
                              <span className="ml-11 mt-1 flex items-start gap-1.5 text-xs leading-5 text-slate-600">
                                <CalendarDays
                                  size={14}
                                  className="mt-0.5 shrink-0"
                                  aria-hidden="true"
                                />
                                <span>
                                  {dateLabel(r.due_date)}
                                  {r.due_time
                                    ? " · " + r.due_time.slice(0, 5) + " PHT"
                                    : ""}
                                </span>
                              </span>
                              {r.amount != null && (
                                <span className="ml-11 mt-1 text-xs leading-5 text-slate-600 tabular-nums">
                                  {money(r.amount)}
                                </span>
                              )}
                              <span className="mt-auto pt-2">
                                <UrgencyBadge state={r.urgency} />
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
              </div>
            )}
          </Panel>
          <SpendingChart charts={o.charts} />
        </TabsContent>
        <TabsContent value="planning" className="space-y-6">
          <div className="space-y-6">
            <div className="min-w-0 space-y-6">
              <Panel
                title="Today at a glance"
                description="Your responsibilities before everything else."
                action={
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("deadlines")}
                  >
                    All deadlines
                    <ArrowUpRight />
                  </Button>
                }
              >
                <div className="flex flex-wrap items-center gap-5 border-b pb-4 text-sm">
                  <span>
                    <strong className="text-lg">{o.today.tasks}</strong> tasks
                    today
                  </span>
                  <span>
                    <strong className="text-lg">{o.today.bills}</strong> bills
                    due
                  </span>
                  <span className="flex items-center gap-2 text-slate-600">
                    <CalendarClock size={16} />
                    Next: {o.today.next || "Nothing scheduled"}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  Check off a task or record a payment below. Completed items
                  stay visible in their settled state.
                </p>
              </Panel>
              <RecordList
                title="Today's tasks and bills"
                resource="deadlines"
                dashboard={dashboard}
                month={month}
                compact
                fixedParams={{ start: today(), end: today() }}
                {...actions}
              />
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel
              title={"Bills & deadlines · " + monthLabel(month)}
              description="Outgoing bills grouped by their due month."
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("bills")}
                >
                  View bills
                  <ArrowUpRight />
                </Button>
              }
            >
              <dl className="grid grid-cols-2 gap-4 text-sm">
                {[
                  ["Priced bills", money(o.bills.total)],
                  ["Paid", money(o.bills.paid)],
                  ["Still to pay", money(o.bills.unpaid)],
                  ["Unpriced bills", o.bills.unpriced],
                  ["Pending items", o.bills.pending],
                  ["Completed / paid", o.bills.completed],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-slate-600">{label}</dt>
                    <dd className="mt-1 text-lg font-semibold tabular-nums">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
              {o.bills.next && (
                <p className="mt-5 border-t pt-4 text-sm">
                  Next outstanding: <strong>{o.bills.next}</strong>
                </p>
              )}
            </Panel>
            <Panel
              title="Monthly budget"
              description="A spending guide, not a limit on your bank account."
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    actions.openForm("budget", dashboard.data.settings)
                  }
                >
                  Set budget
                </Button>
              }
            >
              <BudgetProgress
                label="This month's budget"
                used={o.budget.used}
                limit={o.budget.limit}
              />
              {o.budget.limit != null && (
                <div className="mt-5 flex flex-wrap gap-6 text-sm">
                  <div>
                    <p className="text-slate-600">Budget remaining</p>
                    <p className="mt-1 text-lg font-semibold">
                      {money(o.budget.remaining)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600">Suggested daily budget</p>
                    <p className="mt-1 text-lg font-semibold">
                      {money(o.budget.daily)}
                    </p>
                  </div>
                </div>
              )}
              <p className="mt-5 text-sm text-slate-600">
                Subscriptions this month: {money(o.subscriptions.amount)} across{" "}
                {o.subscriptions.count} items.
              </p>
            </Panel>
          </div>
          <ComparisonChart
            title="Bills by month"
            description="Paid versus unpaid obligations. Unpriced bills are counted separately."
            rows={o.charts.bills}
            comparisonMonth={o.selected_month}
            fields={["paid", "unpaid"]}
          />
        </TabsContent>
        <TabsContent value="money" className="space-y-6">
          <section aria-labelledby="position-title" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="position-title" className="text-lg font-semibold">
                Your financial position
              </h2>
              <span className="text-xs text-slate-600">
                Current recorded values, separate from the selected month
              </span>
            </div>
            <SummaryTiles
              items={[
                {
                  label: "Estimated assets",
                  value: money(o.position.assets),
                  icon: "assets",
                  hint: "House, car and other assets",
                },
                {
                  label: "Credit-card debt",
                  value: money(o.position.debt),
                  icon: "debt",
                },
                {
                  label: "Benefits & investments",
                  value: money(o.position.funds),
                  icon: "funds",
                  hint: "Recorded value, not available cash",
                },
                {
                  label: "Money owed to you",
                  value: money(o.position.receivables),
                  icon: "loans",
                },
                {
                  label: "Tracked net worth",
                  value: money(o.position.net_worth),
                  icon: "balance",
                  hint: "Estimated; excludes unrecorded liabilities",
                },
                {
                  label: "Account count",
                  value: o.configuration.accounts,
                  icon: "count",
                },
              ]}
            />
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => navigate("accounts")}>
                Accounts & cards
              </Button>
              <Button variant="outline" onClick={() => navigate("assets")}>
                House & other assets
              </Button>
              <Button variant="outline" onClick={() => navigate("funds")}>
                Benefits & investments
              </Button>
              <Button variant="outline" onClick={() => navigate("people")}>
                People & money
              </Button>
            </div>
            <Panel
              title="Account balances"
              description="Cash and bank balances are available money. Card debt and fund values are separate."
            >
              {dashboard.data.accounts.length ? (
                <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {dashboard.data.accounts.map((a) => (
                    <div key={a.id} className="border-l-2 pl-3">
                      <dt className="text-sm text-slate-600">
                        <RecordIdentity
                          resource="accounts"
                          row={a}
                          label={a.name}
                        />
                        {!a.active ? " · Archived" : ""}
                      </dt>
                      <dd className="mt-1 text-lg font-semibold tabular-nums">
                        {money(a.balance)}
                        {a.kind === "credit_card" && (
                          <span className="ml-2 text-xs font-normal text-slate-600">
                            debt
                          </span>
                        )}
                        {a.kind === "fund" && (
                          <span className="ml-2 text-xs font-normal text-slate-600">
                            fund value
                          </span>
                        )}
                      </dd>
                      {a.kind === "credit_card" && a.credit_limit != null && (
                        <BudgetProgress
                          credit
                          label="Credit utilization"
                          used={a.balance}
                          limit={a.credit_limit}
                        />
                      )}
                    </div>
                  ))}
                </dl>
              ) : (
                <EmptyState
                  title="Add your first account"
                  message="For example, add Metrobank with your current recorded balance."
                  action={
                    <Button onClick={() => actions.openForm("account")}>
                      Add account
                    </Button>
                  }
                />
              )}
            </Panel>
          </section>
        </TabsContent>
        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <ComparisonChart
              title="Money by month"
              description="Income includes expected money; expenses follow the purchase date."
              rows={o.charts.monthly}
              incomeLabel="Received + expected income"
              comparisonMonth={o.selected_month}
            />
            <Panel
              title="Spending insights"
              description="Calculated from your records, not AI predictions."
            >
              {o.insights.length ? (
                <ul className="space-y-3 text-sm">
                  {o.insights.map((text) => (
                    <li key={text} className="border-b pb-3 last:border-0">
                      {text}
                    </li>
                  ))}
                  <li>
                    Average daily spending:{" "}
                    <strong>{money(o.average_daily)}</strong>
                  </li>
                  <li>
                    Estimated month-end expenses:{" "}
                    <strong>{money(o.projected_expenses)}</strong>
                  </li>
                </ul>
              ) : (
                <EmptyState
                  title="No spending insights yet"
                  message="Record expenses to see category trends and monthly estimates."
                />
              )}
            </Panel>
          </div>
          <RecordList
            title="Recent transactions"
            resource="transactions"
            dashboard={dashboard}
            month={month}
            compact
            {...actions}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
