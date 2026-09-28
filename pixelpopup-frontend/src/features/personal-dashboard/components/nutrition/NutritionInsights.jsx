import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Scale } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../../ui/chart";
import { EmptyState, Panel } from "../Panel";
import { dateLabel } from "../../lib/format";
import NutritionPeriodSummary from "./NutritionPeriodSummary";

const weightConfig = { weight: { label: "Weight (kg)", color: "var(--chart-2)" } };
const number = (value) => Number(value).toLocaleString("en-PH", { maximumFractionDigits: 2 });

export default function NutritionInsights({ summary, profile, period, onPeriodChange, periodState, onRetry }) {
  const weights = summary.weights.map((row) => ({ date: row.date, label: dateLabel(row.date), weight: Number(row.weight_kg) }));

  return <div className="space-y-5">
    <NutritionPeriodSummary summary={summary} profile={profile} period={period} onPeriodChange={onPeriodChange} periodState={periodState} onRetry={onRetry} />
    <Panel title="Weight readings" description="Only dates you measured are plotted; other dates stay blank.">
      {weights.length ? <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(19rem,1fr)]">
        <ChartContainer config={weightConfig} className="h-56 w-full min-w-0">
          <LineChart accessibilityLayer data={weights} margin={{ left: 0, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={20} />
            <YAxis type="number" domain={["auto", "auto"]} tickLine={false} axisLine={false} width={42} tickFormatter={(value) => number(value)} />
            <ChartTooltip content={<ChartTooltipContent labelFormatter={(_, payload) => payload?.[0]?.payload?.date ? dateLabel(payload[0].payload.date) : "Weight"} />} />
            <Line type="linear" dataKey="weight" stroke="var(--color-weight)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ChartContainer>
        <div className="overflow-hidden rounded-lg border border-[var(--pd-border)]"><div className="max-h-56 overflow-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Recorded weights</caption><thead className="sticky top-0 bg-slate-100"><tr><th scope="col" className="px-3 py-2 font-semibold">Date</th><th scope="col" className="px-3 py-2 text-right font-semibold">Weight</th></tr></thead><tbody>{weights.map((row) => <tr key={row.date} className="border-t border-[var(--pd-border)] transition-colors hover:bg-blue-50/50"><th scope="row" className="px-3 py-2 font-normal">{row.label}</th><td className="px-3 py-2 text-right tabular-nums">{number(row.weight)} kg</td></tr>)}</tbody></table></div></div>
      </div> : <EmptyState icon={Scale} title="No weight readings yet" message="Log a reading whenever you choose. Unrecorded days remain blank." />}
    </Panel>
  </div>;
}
