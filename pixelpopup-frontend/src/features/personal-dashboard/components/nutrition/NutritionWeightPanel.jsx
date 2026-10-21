import { Scale } from "lucide-react";
import { Line, LineChart, XAxis, YAxis, ReferenceLine } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../../ui/chart";
import { Button } from "../../ui/button";
import { Panel } from "../Panel";
import { dateLabel } from "../../lib/format";
import { nutritionNumber as number, weightGoalProgress } from "../../nutrition/dashboardModel";
import { NutritionProgress } from "./DailyNutritionOverview";
export default function NutritionWeightPanel({ date, weights = [], baseline, targetWeight, onLog }) {
  const readings = weights.filter((row) => row.date <= date).sort((a, b) => a.date.localeCompare(b.date));
  const latest = readings.at(-1), previous = readings.at(-2);
  const goal = weightGoalProgress({ baseline, latest, target: targetWeight });
  const points = readings.map((row) => ({ ...row, timestamp: Date.parse(`${row.date}T12:00:00Z`), weight: Number(row.weight_kg) }));
  return <Panel title="Weight" action={<Button size="sm" variant="outline" onClick={onLog}><Scale className="size-4" />{latest?.date === date ? "Edit reading" : "Log weight"}</Button>}>
    {latest ? <><p className="text-2xl font-semibold tabular-nums">{number(latest.weight_kg, 2)} <span className="text-sm font-normal text-slate-600">kg</span></p><p className="mt-1 text-xs text-slate-600">Measured {dateLabel(latest.date)}{previous && ` · ${Number(latest.weight_kg) - Number(previous.weight_kg) > 0 ? "+" : ""}${number(Number(latest.weight_kg) - Number(previous.weight_kg), 2)} kg vs previous reading`}</p>
      {points.length >= 2 && <ChartContainer config={{ weight: { label: "Weight (kg)", color: "var(--pd-primary)" } }} className="mt-3 h-24 w-full"><LineChart data={points} accessibilityLayer margin={{ top: 5, right: 5, bottom: 5, left: 5 }}><XAxis dataKey="timestamp" type="number" domain={["dataMin", "dataMax"]} hide /><YAxis domain={["auto", "auto"]} hide /><ChartTooltip content={<ChartTooltipContent labelFormatter={(_, payload) => payload?.[0]?.payload?.date ? dateLabel(payload[0].payload.date) : "Weight"} />} />{targetWeight && <ReferenceLine y={Number(targetWeight)} stroke="#64748b" strokeDasharray="3 3" />}<Line dataKey="weight" type="linear" stroke="var(--color-weight)" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} /></LineChart></ChartContainer>}
      {goal && <div className="mt-3"><p className="mb-1.5 text-xs">Goal {number(targetWeight, 2)} kg · {goal.reached ? "Reached" : `${number(goal.remaining, 2)} kg away`}</p><NutritionProgress value={goal.percentage} tone="green" label="Weight goal progress" /><p className="mt-1 text-xs text-slate-500">From your {dateLabel(goal.baselineDate)} reading</p></div>}
    </> : <p className="flex items-center gap-2 py-3 text-sm text-slate-500"><Scale className="size-5" aria-hidden="true" />No reading on or before this day.</p>}
  </Panel>;
}
