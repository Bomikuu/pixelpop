import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, XAxis, YAxis } from "recharts";
import { ChartNoAxesCombined, ChartColumn } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../../ui/chart";
import { Panel, EmptyState } from "../Panel";
import { ServiceChart } from "./SubscriptionCharts";
import ServiceTable from "./ServiceTable";
import { usageTrend } from "../../subscriptions/electricityComparison";

const config = { actual: { label: "Entered usage (unsaved)", color: "var(--pd-primary)" }, projected: { label: "Projected usage", color: "var(--chart-2)" } };
const shortDate = (value) => new Date(value).toLocaleDateString("en-PH", { timeZone: "Asia/Manila", month: "short", day: "numeric" });

export default function ElectricityComparisonCharts({ mode, result, previousBill }) {
  const reading = mode === "readings";
  const rows = usageTrend(result);
  const comparisonRows = reading
    ? [{ label: "Previous bill", amount: previousBill === "" ? null : previousBill }, { label: "Cycle prediction", amount: result?.projected_bill ?? null }]
    : [{ label: "Previous bill", amount: result?.comparison?.previous ?? null }, { label: "Current bill", amount: result?.comparison?.current ?? null }];
  return <div className={reading ? "grid gap-5 xl:grid-cols-2" : ""}>
    {reading && <Panel title={<span className="flex items-center gap-2"><ChartNoAxesCombined size={20} aria-hidden="true" />Usage trend</span>} description="Two entered observations, followed by a daily-average projection. No invented daily readings.">
      {rows.length ? <>
        <div className="mb-4 flex flex-wrap gap-4 text-xs text-slate-600"><span>Solid: entered usage</span><span>Dashed: projection</span>{Number(result.expected_usage) > 0 && <span>Gray line: expected usage</span>}</div>
        <ChartContainer config={config} className="h-64 w-full">
          <ComposedChart data={rows} accessibilityLayer margin={{ left: 0, right: 12, top: 10, bottom: 0 }}>
            <CartesianGrid vertical={false} /><XAxis dataKey="timestamp" type="number" scale="time" domain={["dataMin", "dataMax"]} tickFormatter={shortDate} tickLine={false} minTickGap={28} /><YAxis width={54} tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent labelFormatter={(_, payload) => payload?.[0]?.payload?.label || "Usage"} formatter={(value, name) => <span>{config[name]?.label}: {Number(value).toLocaleString(undefined, { maximumFractionDigits: 3 })} kWh</span>} />} />
            {Number(result.expected_usage) > 0 && <ReferenceLine y={Number(result.expected_usage)} stroke="var(--pd-muted)" strokeDasharray="5 5" ifOverflow="extendDomain" />}
            <Area dataKey="actual" type="linear" fill="var(--pd-primary)" fillOpacity={0.08} stroke="var(--pd-primary)" strokeWidth={2.5} connectNulls={false} isAnimationActive={false} dot={{ r: 4 }} />
            <Line dataKey="projected" type="linear" stroke="var(--chart-2)" strokeWidth={2.5} strokeDasharray="5 5" connectNulls={false} isAnimationActive={false} dot={{ r: 4 }} />
          </ComposedChart>
        </ChartContainer>
        <p className="mt-3 text-xs text-slate-600">{Number(result.daily_usage).toFixed(3)} kWh/day across {result.elapsed_days} observed days · {result.cycle_days} days in the entered cycle.</p>
        <details className="mt-3 text-sm"><summary className="cursor-pointer text-slate-700 hover:text-blue-700">View comparison data</summary><ServiceTable rows={rows} rowKey="label" columns={[{ key: "label", label: "Date" }, { key: "actual", label: "Entered usage (kWh)" }, { key: "projected", label: "Projection (kWh)" }]} /></details>
      </> : <EmptyState icon={ChartNoAxesCombined} title="Enter two meter readings" message="The chart will show the observed change and an explicitly marked projection to your cycle end." />}
    </Panel>}
    <ServiceChart title={<span className="flex items-center gap-2"><ChartColumn size={20} aria-hidden="true" />{reading ? "Bill vs. prediction" : "Bill comparison"}</span>} rows={comparisonRows} fields={[{ key: "amount", label: reading ? "Bill / estimate (PHP)" : "Bill amount (PHP)" }]} description={reading ? "The previous bill is a reference, not a recorded payment. The current value is a prediction." : "Only your two entered amounts are compared. Historical averages are not invented."} emptyTitle="Ready for a quick comparison" emptyMessage="Enter the bill amounts above. Nothing needs to be recorded or saved." />
  </div>;
}
