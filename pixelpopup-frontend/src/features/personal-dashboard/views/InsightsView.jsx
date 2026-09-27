import SummaryTiles from "../components/SummaryTiles";
import { ComparisonChart, SpendingChart } from "../components/Charts";
import { Panel, EmptyState } from "../components/Panel";
import BudgetProgress from "../components/BudgetProgress";
import { money } from "../lib/format";
import RecordList from "../components/RecordList";

export default function InsightsView({
  dashboard,
  reports,
  month = dashboard.data.overview.selected_month,
  ...actions
}) {
  const o = dashboard.data.overview;
  return (
    <div className="space-y-6">
      <SummaryTiles
        items={[
          {
            label: "Monthly income",
            value: money(o.month.income),
            icon: "income",
          },
          {
            label: "Monthly spending",
            value: money(o.month.expenses),
            icon: "expenses",
          },
          {
            label: "Daily average",
            value: money(o.average_daily),
            icon: "expenses",
          },
          {
            label: "Highest category",
            value: o.charts.categories[0]?.name || "No expenses",
            icon: "count",
          },
          {
            label: "Pending bills",
            value: money(o.bills.unpaid),
            icon: "debt",
          },
        ]}
      />
      {reports ? (
        <>
          <ComparisonChart
            title="Income versus expenses"
            rows={o.charts.monthly}
            description="Monthly history includes received and expected income."
            incomeLabel="Received + expected income"
            comparisonMonth={o.selected_month}
          />
          <Panel
            title="Monthly totals"
            description="Income includes expected amounts; the difference is not your spendable bank balance."
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>
                    {[
                      "Month",
                      "Income",
                      "Expenses",
                      "Income less expenses",
                    ].map((label) => (
                      <th key={label} className="p-3">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {o.charts.monthly.map((r) => (
                    <tr key={r.month} className="border-t">
                      <th className="p-3 font-medium">
                        <RecordIdentity
                          resource="chart"
                          row={{}}
                          label={r.label}
                        />
                      </th>
                      <td className="p-3 tabular-nums">{money(r.income)}</td>
                      <td className="p-3 tabular-nums">{money(r.expenses)}</td>
                      <td className="p-3 tabular-nums">{money(r.remaining)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
          <RecordList
            resource="movements"
            title="Balance movements for the selected month"
            dashboard={dashboard}
            month={month}
            {...actions}
          />
        </>
      ) : (
        <SpendingChart charts={o.charts} />
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <ComparisonChart
          title="Spending by category"
          description="Actual expense amounts in the selected month."
          rows={o.charts.categories.map((row) => ({
            label: row.name,
            amount: row.amount,
          }))}
          fields={["amount"]}
          amountLabel="Spent"
        />
        <Panel
          title="Category breakdown"
          description="Ranked by spending in the selected month."
        >
          {o.charts.categories.length ? (
            <ul className="space-y-5">
              {o.charts.categories.map((row) => (
                <li key={row.category_id || "other"}>
                  <div className="mb-2 flex justify-between gap-2 text-sm">
                    <span className="font-medium">{row.name}</span>
                    <span className="tabular-nums">
                      {money(row.amount)} · {row.percentage}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded bg-slate-100">
                    <div
                      className="h-full bg-[var(--pd-primary)]"
                      style={{ width: row.percentage + "%" }}
                    />
                  </div>
                  {row.budget != null && (
                    <div className="mt-3">
                      <BudgetProgress
                        label={row.name + " budget"}
                        used={row.amount}
                        limit={row.budget}
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No category spending" />
          )}
        </Panel>
        <Panel title="Month summary">
          <dl className="grid grid-cols-2 gap-5">
            {[
              ["Received income", money(o.month.received)],
              ["Expected income", money(o.month.expected)],
              ["Expenses", money(o.month.expenses)],
              [
                "Income less expenses",
                money(Number(o.month.income) - Number(o.month.expenses)),
              ],
              ["Completed items", o.bills.completed],
              ["Pending items", o.bills.pending],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-sm text-slate-600">{label}</dt>
                <dd className="mt-2 text-xl font-semibold tabular-nums">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 text-xs leading-5 text-slate-600">
            Card settlements and loan principal movements affect cash, not
            income or purchase-date expenses.
          </p>
        </Panel>
      </div>
      <ComparisonChart
        title="Bills by due month"
        rows={o.charts.bills}
        comparisonMonth={o.selected_month}
        fields={["paid", "unpaid"]}
      />
    </div>
  );
}
import RecordIdentity from "../components/RecordIdentity";
