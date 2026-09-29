import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../ui/chart";
import { EmptyState, Panel } from "./Panel";
import { money } from "../lib/format";

const chartConfig = {
  inflow: { label: "Increases", color: "var(--chart-3)" },
  outflow: { label: "Reductions", color: "var(--chart-1)" },
  balance: { label: "Recorded balance", color: "var(--pd-primary)" },
};

function axisMoney(value) {
  return "₱" + new Intl.NumberFormat("en-PH", { notation: "compact" }).format(value);
}

function ChartData({ rows, firstLabel, secondLabel, valueLabel }) {
  return (
    <details className="mt-4 text-sm">
      <summary className="cursor-pointer font-medium text-slate-600 hover:text-slate-950">
        View chart data
      </summary>
      <div className="mt-3 max-h-64 overflow-auto">
        <table className="w-full min-w-[360px] text-left text-sm">
          <thead className="border-b border-[var(--pd-border)] text-slate-600">
            <tr>
              <th scope="col" className="px-2 py-2 font-medium">Month</th>
              <th scope="col" className="px-2 py-2 text-right font-medium">{firstLabel}</th>
              <th scope="col" className="px-2 py-2 text-right font-medium">{secondLabel}</th>
              <th scope="col" className="px-2 py-2 text-right font-medium">{valueLabel}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--pd-border)]">
            {rows.map((row) => (
              <tr key={row.month}>
                <th scope="row" className="px-2 py-2 font-medium">{row.label}</th>
                <td className="px-2 py-2 text-right tabular-nums">{money(row.inflow)}</td>
                <td className="px-2 py-2 text-right tabular-nums">{money(row.outflow)}</td>
                <td className="px-2 py-2 text-right tabular-nums">{row.balance == null ? "Not yet recorded" : money(row.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export default function AccountSummaryCharts({ account, charts }) {
  const rows = (charts?.monthly || []).map((row) => ({
    ...row,
    inflow: Number(row.inflow || 0),
    outflow: Number(row.outflow || 0),
    balance: row.balance == null ? null : Number(row.balance),
  }));
  const card = account.kind === "credit_card";
  const fund = account.kind === "fund";
  const firstLabel = card ? "Debt increases" : fund ? "Value added" : "Money in / added";
  const secondLabel = card ? "Debt reductions" : fund ? "Value withdrawn" : "Money out / reduced";
  const valueLabel = card ? "Recorded debt" : fund ? "Recorded value" : "Recorded balance";
  const config = {
    ...chartConfig,
    inflow: { ...chartConfig.inflow, label: firstLabel, color: card ? "var(--chart-1)" : "var(--chart-3)" },
    outflow: { ...chartConfig.outflow, label: secondLabel, color: card ? "var(--chart-3)" : "var(--chart-1)" },
    balance: { ...chartConfig.balance, label: valueLabel },
  };
  const hasActivity = rows.some((row) => row.inflow || row.outflow);

  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-2">
      <Panel
        title="Monthly account activity"
        description="Account effects include opening amounts and dated corrections; they are not all income or spending."
      >
        {hasActivity ? (
          <ChartContainer config={config} className="h-64 w-full">
            <BarChart accessibilityLayer data={rows} barGap={2} margin={{ left: 2, right: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={28} />
              <YAxis tickFormatter={axisMoney} tickLine={false} axisLine={false} width={58} />
              <ChartTooltip content={<ChartTooltipContent formatter={(value, name) => <span>{config[name]?.label}: {money(value)}</span>} />} />
              <Bar dataKey="inflow" fill="var(--color-inflow)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="outflow" fill="var(--color-outflow)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ChartContainer>
        ) : (
          <EmptyState title="No account activity to chart" message="Posted entries will appear here as you record them." />
        )}
        <ChartData rows={rows} firstLabel={firstLabel} secondLabel={secondLabel} valueLabel={valueLabel} />
      </Panel>
      <Panel
        title={valueLabel + " trend"}
        description="Reconstructed from your dated ledger, not a bank or provider statement. The current month is through today; future months have no projected value."
      >
        <ChartContainer config={config} className="h-64 w-full">
          <LineChart accessibilityLayer data={rows} margin={{ left: 2, right: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={28} />
            <YAxis tickFormatter={axisMoney} tickLine={false} axisLine={false} width={58} />
            <ChartTooltip content={<ChartTooltipContent formatter={(value) => money(value)} />} />
            <Line type="monotone" dataKey="balance" stroke="var(--color-balance)" strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
          </LineChart>
        </ChartContainer>
        <p className="mt-3 text-xs text-slate-600">Open “View chart data” beside the activity chart for exact monthly figures.</p>
      </Panel>
    </div>
  );
}
