import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Droplets, Dumbbell, Flame, Info, Wheat } from "lucide-react";
import { Panel } from "../Panel";
import { Button } from "../../ui/button";
import { deriveDailyOverview, nutritionNumber as number } from "../../nutrition/dashboardModel";

export function NutritionProgress({ value, label, tone = "blue", className = "h-2" }) {
  const [fill, setFill] = useState(0);
  useEffect(() => { const frame = requestAnimationFrame(() => setFill(value)); return () => cancelAnimationFrame(frame); }, [value]);
  const colors = { blue: "bg-blue-600", red: "bg-red-600", amber: "bg-amber-500", green: "bg-emerald-600" };
  return <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)} className={`overflow-hidden rounded-full bg-slate-100 ${className}`}><div className={`h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none ${colors[tone]}`} style={{ width: `${fill}%` }} /></div>;
}
export default function DailyNutritionOverview({ summary, profile, basis, onBasisChange }) {
  const data = deriveDailyOverview({ summary, profile, basis });
  const statuses = { unlogged: "No food logged", below: "Below target", approaching: "Approaching target", reached: "Target reached", over: "Over target" };
  const tone = data.status === "over" ? "red" : data.status === "reached" ? "green" : data.status === "approaching" ? "amber" : "blue";
  const icons = { protein: Dumbbell, carbs: Wheat, fat: Droplets };
  const percent = (value) => value == null ? "—" : `${number(Math.floor(value * 10) / 10, 1)}%`;
  const previous = summary?.days?.at(-2);
  const surplus = previous?.totals && data.target ? Number(previous.net_calories ?? previous.totals.calories) - data.target : 0;
  return <Panel title="Daily overview" action={<div role="group" aria-label="Calorie basis" className="flex gap-1 rounded-md border border-[var(--pd-border)] p-1">{["food", "net"].map((value) => <Button key={value} size="sm" variant={basis === value ? "default" : "ghost"} aria-pressed={basis === value} onClick={() => onBasisChange(value)}>{value === "food" ? "Food" : "Net"}</Button>)}</div>}>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <div><p className="flex items-center gap-2 text-sm text-slate-600"><Flame className="size-4 text-orange-600" aria-hidden="true" />{basis === "food" ? "Food calories" : "Net · food minus logged active burn"}</p><p className={`mt-2 text-3xl font-semibold tabular-nums ${data.status === "over" ? "text-red-700" : "text-slate-950"}`}>{number(data.calories, 2)} <span className="text-sm font-normal text-slate-600">/ {number(data.target)} kcal</span></p>
        <div className="mt-4"><NutritionProgress value={data.fill} tone={tone} label={`${statuses[data.status]}: ${number(data.calories)} of ${number(data.target)} kcal`} className="h-3" /></div>
        <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs"><span className="font-medium">{statuses[data.status]} · {percent(data.percentage)}</span><span className={data.remaining < 0 ? "text-red-700" : "text-slate-600"}>{data.remaining == null ? "Add a meal to see your progress" : `${number(Math.abs(data.remaining), 2)} kcal ${data.remaining < 0 ? "over" : "remaining"}`}</span></div>
        <p className="mt-3 text-xs text-slate-600">Food {number(data.food, 2)} kcal · Active burn {number(data.burn, 2)} kcal{data.previousDelta != null && <span className="mt-1 block">{data.previousDelta > 0 ? "+" : ""}{number(data.previousDelta, 2)} kcal vs previous day ({basis})</span>}</p>
        {basis === "net" && <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-600"><Info className="size-3.5 shrink-0" aria-hidden="true" />Net isn’t total energy expenditure. Only logged active burn is subtracted.</p>}
        {data.net != null && data.net < 0 && <p className="mt-2 text-xs text-slate-600">Logged activity exceeds logged food by {number(-data.net, 2)} kcal. This isn’t a complete energy balance.</p>}
        {basis === "net" && data.foodStatus === "over" && <p role="note" className="mt-2 flex items-center gap-2 text-xs text-red-700"><AlertTriangle className="size-4" aria-hidden="true" />Food intake is still above your daily food target.</p>}
        {data.foodStatus === "reached" && <p className="mt-2 flex items-center gap-2 text-xs text-emerald-800"><CheckCircle2 className="size-4" aria-hidden="true" />Food target reached.</p>}
      </div>
      <div className="space-y-4">{data.macros.map((macro) => { const Icon = icons[macro.key]; return <div key={macro.key}><div className="mb-1.5 flex justify-between gap-2 text-xs"><span className="flex items-center gap-2 capitalize"><Icon className="size-4 text-slate-500" aria-hidden="true" />{macro.key}</span><span className="tabular-nums">{number(macro.value, 2)} / {number(macro.target, 2)} g</span></div><NutritionProgress value={macro.fill} tone={macro.remaining < 0 ? "red" : "blue"} label={`${macro.key}: ${number(macro.value, 2)} of ${number(macro.target, 2)} grams`} /><p className={`mt-1 text-right text-xs ${macro.remaining < 0 ? "text-red-700" : "text-slate-500"}`}>{macro.remaining == null ? "No food logged" : `${percent(macro.value / macro.target * 100)} · ${number(Math.abs(macro.remaining), 2)} g ${macro.remaining < 0 ? "over" : "remaining"}`}</p></div>; })}</div>
    </div>
    {surplus > 0 && <details className="mt-4 border-t border-[var(--pd-border)] pt-3 text-xs text-slate-600"><summary className="cursor-pointer">Previous-day surplus · {number(surplus, 2)} kcal</summary><p className="mt-2">{data.target - surplus > 0 ? `Optional one-day balance: ${number(data.target - surplus, 2)} kcal. ` : "No balance amount is suggested. "}Your daily food target stays {number(data.target)} kcal.</p></details>}
  </Panel>;
}
