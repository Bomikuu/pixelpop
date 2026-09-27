import { useState } from "react";
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../ui/chart";
import { Button } from "../ui/button";
import { money, dateLabel } from "../lib/format";
import { EmptyState, Panel } from "./Panel";
import RecordIdentity from "./RecordIdentity";

const config = {
  amount: { label: "Amount", color: "var(--chart-1)" },
  contributions: { label: "Contributions", color: "var(--chart-3)" },
  withdrawals: { label: "Withdrawals", color: "var(--chart-4)" },
  given: { label: "Given / support", color: "var(--chart-1)" },
  lent: { label: "Principal lent", color: "var(--chart-4)" },
  repaid: { label: "Loan repayments", color: "var(--chart-3)" },
  income: { label: "Received income", color: "var(--chart-3)" },
  expected: { label: "Expected income", color: "var(--chart-2)" },
  expenses: { label: "Expenses", color: "var(--chart-1)" },
  paid: { label: "Paid", color: "var(--chart-3)" },
  unpaid: { label: "Unpaid", color: "var(--chart-4)" },
  remaining: { label: "Income less expenses", color: "var(--chart-2)" },
  pending: { label: "Pending", color: "var(--chart-4)" },
  completed: { label: "Completed / paid", color: "var(--chart-3)" },
  unpriced: { label: "Needs amount", color: "var(--chart-2)" },
};

function ChartTable({ rows, fields, monetary = true, chartConfig = config }) {
  return (
    <details className="mt-4 text-sm">
      <summary className="cursor-pointer font-medium text-slate-600 hover:text-slate-950">
        View chart data
      </summary>
      <div className="mt-3 max-h-64 overflow-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th className="p-2">Period / category</th>
              {fields.map((field) => (
                <th key={field} className="p-2">
                  {chartConfig[field]?.label || field}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.date || row.month || index} className="border-t">
                <th className="p-2 font-normal">
                  <RecordIdentity
                    resource="chart"
                    row={{ name: row.label }}
                    label={row.date ? dateLabel(row.date) : row.label}
                  />
                </th>
                {fields.map((field) => (
                  <td key={field} className="p-2 tabular-nums">
                    {monetary
                      ? money(row[field])
                      : Number(row[field] || 0).toLocaleString("en-PH")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export function SpendingChart({ charts }) {
  const [mode, setMode] = useState("daily");
  const rows = charts[mode].map((r) => ({
    ...r,
    amount: Number(mode === "monthly" ? r.expenses : r.amount),
  }));
  const hasData = rows.some((r) => r.amount > 0);
  return (
    <Panel
      title="Spending trend"
      description="Spot spending spikes before they become a pattern."
      action={
        <div className="flex gap-1" aria-label="Spending period">
          {["daily", "weekly", "monthly"].map((value) => (
            <Button
              key={value}
              size="sm"
              variant={mode === value ? "secondary" : "ghost"}
              aria-pressed={mode === value}
              onClick={() => setMode(value)}
            >
              {value[0].toUpperCase() + value.slice(1)}
            </Button>
          ))}
        </div>
      }
    >
      {hasData ? (
        <>
          <ChartContainer config={config} className="h-64 w-full">
            <LineChart
              accessibilityLayer
              data={rows}
              margin={{ left: 8, right: 8 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                minTickGap={28}
              />
              <YAxis
                tickFormatter={(v) =>
                  "₱" +
                  new Intl.NumberFormat("en-PH", {
                    notation: "compact",
                  }).format(v)
                }
                tickLine={false}
                axisLine={false}
                width={60}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.date
                        ? dateLabel(payload[0].payload.date)
                        : payload?.[0]?.payload?.label
                    }
                    formatter={(value, _, item) => (
                      <div className="grid gap-1">
                        <span>{money(value)}</span>
                        <span className="text-xs text-slate-600">
                          {item.payload.count} expenses
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Line
                dataKey="amount"
                type="monotone"
                stroke="var(--color-amount)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ChartContainer>
          <ChartTable rows={rows} fields={["amount"]} />
        </>
      ) : (
        <EmptyState
          title="Your spending trend starts here"
          message="Record an expense to see your daily, weekly and monthly spending."
        />
      )}
    </Panel>
  );
}

export function ComparisonChart({
  title,
  description,
  rows,
  fields = ["income", "expenses"],
  monetary = true,
  amountLabel = "Amount",
  incomeLabel = "Received income",
  comparisonMonth,
}) {
  const chartConfig = {
    ...config,
    amount: { ...config.amount, label: amountLabel },
    income: { ...config.income, label: incomeLabel },
  };
  const values = rows.map((row) => ({
    ...row,
    ...Object.fromEntries(fields.map((f) => [f, Number(row[f])])),
  }));
  return (
    <Panel title={title} description={description}>
      {values.some((r) => fields.some((f) => Math.abs(r[f]) > 0)) ? (
        <>
          {rows[0]?.month && (
            <MonthComparison
              rows={rows}
              fields={fields}
              monetary={monetary}
              chartConfig={chartConfig}
              preferredMonth={comparisonMonth}
            />
          )}
          <div className="mb-3 flex flex-wrap gap-4 text-xs text-slate-600">
            {fields.map((f) => (
              <span key={f} className="flex items-center gap-2">
                <span
                  className="size-2 rounded-sm"
                  style={{ background: chartConfig[f].color }}
                  aria-hidden="true"
                />
                {chartConfig[f].label}
              </span>
            ))}
          </div>
          <ChartContainer config={chartConfig} className="h-64 w-full">
            <BarChart accessibilityLayer data={values}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                minTickGap={30}
              />
              <YAxis
                tickFormatter={(v) =>
                  (monetary ? "₱" : "") +
                  new Intl.NumberFormat("en-PH", {
                    notation: "compact",
                  }).format(v)
                }
                width={60}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <span>
                        {chartConfig[name]?.label}:{" "}
                        {monetary
                          ? money(value)
                          : Number(value).toLocaleString("en-PH")}
                      </span>
                    )}
                  />
                }
              />
              {fields.map((f) => (
                <Bar
                  key={f}
                  dataKey={f}
                  fill={"var(--color-" + f + ")"}
                  radius={[3, 3, 0, 0]}
                  isAnimationActive={false}
                />
              ))}
            </BarChart>
          </ChartContainer>
          <ChartTable
            rows={values}
            fields={fields}
            monetary={monetary}
            chartConfig={chartConfig}
          />
        </>
      ) : (
        <EmptyState
          title="No amounts in this period"
          message="Add matching records to see this chart."
        />
      )}
    </Panel>
  );
}

function MonthComparison({
  rows,
  fields,
  monetary,
  chartConfig,
  preferredMonth,
}) {
  const [first, setFirst] = useState("");
  const [second, setSecond] = useState("");
  const preferredIndex = rows.findIndex((r) => r.month === preferredMonth);
  const rightIndex = preferredIndex < 0 ? rows.length - 1 : preferredIndex;
  const left =
    rows.find((r) => r.month === first) || rows[Math.max(0, rightIndex - 1)];
  const right = rows.find((r) => r.month === second) || rows[rightIndex];
  const format = (value) =>
    monetary ? money(value) : Number(value || 0).toLocaleString("en-PH");
  return (
    <div className="mb-5 space-y-4 border-b pb-5">
      <div className="flex flex-wrap gap-3">
        <label className="grid gap-1 text-xs font-medium text-slate-600">
          Compare from
          <input
            type="month"
            value={left.month}
            min={rows[0].month}
            max={rows[rows.length - 1].month}
            onChange={(e) => setFirst(e.target.value)}
            className="h-9 min-w-0 rounded-md border bg-white px-2 text-sm text-slate-950"
          />
        </label>
        <label className="grid gap-1 text-xs font-medium text-slate-600">
          Compare with
          <input
            type="month"
            value={right.month}
            min={rows[0].month}
            max={rows[rows.length - 1].month}
            onChange={(e) => setSecond(e.target.value)}
            className="h-9 min-w-0 rounded-md border bg-white px-2 text-sm text-slate-950"
          />
        </label>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {fields.map((field) => {
          const previous = Number(left[field] || 0),
            current = Number(right[field] || 0),
            delta = current - previous;
          return (
            <div key={field} className="rounded-md bg-slate-50 p-3">
              <dt className="text-xs text-slate-600">
                {chartConfig[field].label}
              </dt>
              <dd className="mt-1 text-sm font-medium tabular-nums">
                {format(previous)} → {format(current)}
              </dd>
              <dd className="mt-1 text-xs tabular-nums text-slate-600">
                {delta > 0 ? "+" : ""}
                {format(delta)}{" "}
                {previous
                  ? "(" +
                    (delta > 0 ? "+" : "") +
                    ((delta / Math.abs(previous)) * 100).toFixed(1) +
                    "%)"
                  : "· no prior baseline"}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}

export function RecordCharts({ charts, month }) {
  if (!charts) return null;
  return (
    <div className="space-y-4">
      {charts.monthly && (
        <ComparisonChart
          title="Month-to-month comparison"
          description={
            "Up to 12 months ending " +
            month +
            ". Search and category choices apply; record-list date filters do not limit this history."
          }
          rows={charts.monthly}
          fields={charts.fields}
          monetary={charts.monetary}
          comparisonMonth={month}
        />
      )}
      <div className={charts.cards ? "grid gap-4 xl:grid-cols-2" : ""}>
        <ComparisonChart
          title={charts.breakdown_title}
          description={
            charts.monthly
              ? "Matches the records and filters below."
              : "Current recorded values—not a historical valuation."
          }
          rows={charts.breakdown || []}
          fields={["amount"]}
          monetary={charts.monetary}
          amountLabel={charts.monetary ? "Amount" : "Records"}
        />
        {charts.cards && (
          <ComparisonChart
            title="Current credit-card debt"
            rows={charts.cards}
            fields={["amount"]}
            amountLabel="Outstanding debt"
          />
        )}
      </div>
      {Number(charts.unpriced) > 0 && (
        <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {Number(charts.unpriced)} bill occurrence(s) in this comparison still
          need an amount. Their unknown amounts are excluded from monetary bars.
        </p>
      )}
    </div>
  );
}
