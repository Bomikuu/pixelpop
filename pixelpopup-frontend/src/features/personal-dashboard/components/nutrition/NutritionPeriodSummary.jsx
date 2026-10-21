import { CalendarCheck2, Droplets, Dumbbell, Flame, Footprints, Minus, TrendingDown, TrendingUp, Wheat } from "lucide-react";
import { SummaryTilePattern } from "../SummaryTiles";
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
    const Direction = Number(change?.absolute) < 0 ? TrendingDown : TrendingUp;
    return <div key={key} className={`group relative isolate min-w-0 overflow-hidden rounded-lg border bg-white ${over ? "border-red-200" : "border-[var(--pd-border)]"} ${compact ? "p-3" : "p-4"}`}><SummaryTilePattern tone={over ? "negative" : "neutral"} /><dt className="relative z-10 flex items-center justify-between gap-2 text-xs text-slate-600">{label}<Icon className="size-4 shrink-0" aria-hidden="true" /></dt><dd className={`relative z-10 mt-2 tabular-nums ${compact ? "text-lg" : "text-2xl"} ${over ? "text-red-700" : "text-slate-950"}`}>{number(value, 2)} <span className="text-xs text-slate-500">{unit}</span></dd>{change && <dd className="relative z-10 mt-2 text-xs text-slate-600">{change.percentage != null ? <span className="flex items-center gap-1"><Direction className="size-3.5" aria-hidden="true" />{Number(change.percentage) > 0 ? "+" : ""}{number(change.percentage, 1)}% vs previous period</span> : "No positive previous baseline"}</dd>}</div>;
  }
  return <div className="space-y-4"><dl className="grid grid-cols-2 gap-3 xl:grid-cols-4">{main.map((item) => tile(item, false))}</dl><dl className="grid grid-cols-2 gap-3 xl:grid-cols-5">{secondary.map((item) => tile(item, true))}</dl><p className="text-xs text-slate-600">{current.meal_count} meals across {current.logged_days} food-logged days; previous period: {data.previous.logged_days} food-logged days. Net averages subtract burn only on dates with meals.</p><NutritionCharts kind="calories" days={data.days} weights={data.weights} profile={profile} /></div>;
}
