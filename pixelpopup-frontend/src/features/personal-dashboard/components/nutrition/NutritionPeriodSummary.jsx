import { CalendarCheck2, Droplets, Dumbbell, Flame, Footprints, Info, Minus, TrendingDown, TrendingUp, Wheat } from "lucide-react";
import { SummaryTilePattern } from "../SummaryTiles";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import { nutritionNumber as number } from "../../nutrition/dashboardModel";
import NutritionCharts from "./NutritionCharts";
export default function NutritionPeriodSummary({ data, profile }) {
  const current = data.current;
  const main = [["Total food", "total_food", "kcal", Flame], ["Logged active burn", "activity_kcal", "kcal", Footprints], ["Daily food average", "average_calories", "kcal", Flame], ["Daily net average", "average_net_calories", "kcal", Minus]];
  const secondary = [["Average protein", "average_protein", "g", Dumbbell], ["Average carbs", "average_carbs", "g", Wheat], ["Average fat", "average_fat", "g", Droplets], ["Days with meals", "logged_days", `of ${data.days.length}`, CalendarCheck2]];
  function tile([label, key, unit, Icon], compact) {
    const value = key === "total_food" ? current.totals?.calories : current[key];
    const old = data.previous.totals?.calories;
    const change = key === "total_food" ? { absolute: value != null && old != null ? Number(value) - Number(old) : null, percentage: value != null && Number(old) > 0 ? (Number(value) - Number(old)) / Number(old) * 100 : null } : data.differences[key];
    const over = key === "average_calories" && value != null && Number(value) > Number(profile.daily_target_kcal);
    const Direction = Number(change?.absolute) === 0 ? Minus : Number(change?.absolute) < 0 ? TrendingDown : TrendingUp;
    return <div key={key} className={`group relative isolate min-w-0 overflow-hidden rounded-lg border bg-white ${over ? "border-red-200" : "border-[var(--pd-border)]"} ${compact ? "p-3" : "p-4"}`}>
      <SummaryTilePattern tone={over ? "negative" : "neutral"} />
      <dt className="relative z-10 flex items-center justify-between gap-2 text-xs text-slate-600"><span>{label}</span><span className="flex items-center gap-1">{change?.percentage == null && change?.absolute == null && <Tooltip><TooltipTrigger asChild><button type="button" aria-label={`About the ${label.toLowerCase()} comparison`} className="grid size-6 place-items-center rounded-sm focus-visible:outline-2"><Info className="size-3.5" /></button></TooltipTrigger><TooltipContent variant="light" className="personal-dashboard max-w-56">No comparable previous-period records. Missing food isn’t zero intake.</TooltipContent></Tooltip>}<Icon className="size-4 shrink-0" aria-hidden="true" /></span></dt>
      <dd className={`relative z-10 mt-2 tabular-nums ${compact ? "text-lg" : "text-2xl"} ${over ? "text-red-700" : "text-slate-950"}`}>{number(value, 2)} <span className="text-xs text-slate-500">{unit}</span></dd>
      {change?.absolute != null && <dd className="relative z-10 mt-2 flex items-center gap-1 text-xs text-slate-600"><Direction className="size-3.5" aria-hidden="true" />{Number(change.absolute) > 0 ? "+" : ""}{change.percentage != null ? `${number(change.percentage, 1)}%` : `${number(change.absolute, 2)} ${unit.startsWith("of ") ? "days" : unit}`} vs previous period</dd>}
      {over && <dd className="relative z-10 mt-1 text-xs text-red-700">Above current food target</dd>}
    </div>;
  }
  return <div className="space-y-4"><dl className="grid grid-cols-2 gap-3 xl:grid-cols-4">{main.map((item) => tile(item, false))}</dl><dl className="grid grid-cols-2 gap-3 xl:grid-cols-5">{secondary.map((item) => tile(item, true))}</dl><p className="text-xs text-slate-600">{current.meal_count} meals across {current.logged_days} food-logged days; previous period: {data.previous.logged_days} food-logged days. Net averages subtract burn only on dates with meals.</p><NutritionCharts kind="calories" days={data.days} weights={data.weights} profile={profile} /></div>;
}
