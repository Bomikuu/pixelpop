import { createElement, useEffect, useState } from "react";
import { ChevronDown, Clock3, CookingPot, Droplets, Dumbbell, Flame, Info, Pencil, Plus, Trash2, UtensilsCrossed, Wheat } from "lucide-react";
import { Button } from "../../ui/button";
import { EmptyState, Panel } from "../Panel";
import { dateLabel, today } from "../../lib/format";
import CalorieProgress from "./CalorieProgress";

const number = (value, decimals = 0) => new Intl.NumberFormat("en-PH", { maximumFractionDigits: decimals }).format(Number(value));
const mealTime = (value) => value ? new Intl.DateTimeFormat("en-PH", { timeZone: "Asia/Manila", hour: "numeric", minute: "2-digit" }).format(new Date(value)) : null;
function relativeTime(value, now) {
  if (!value) return null;
  const minutes = Math.max(0, Math.floor((now - Date.parse(value)) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}

function MetricTile({ label, value, unit, target, icon: Icon, warning = false }) {
  return <div className={`min-w-0 rounded-lg border p-3.5 transition-colors ${warning ? "border-red-200 bg-red-50 hover:border-red-300" : "border-[var(--pd-border)] bg-slate-50 hover:border-blue-200 hover:bg-blue-50/40"}`}>
    <span className={`mb-2 grid size-9 place-items-center rounded-full ${warning ? "bg-red-100 text-red-700" : "bg-blue-50 text-[var(--pd-primary)]"}`}>{createElement(Icon, { className: "size-4.5", "aria-hidden": "true" })}</span>
    <p className="text-xs font-medium text-slate-600">{label}</p>
    <p className={`mt-0.5 text-xl font-semibold tabular-nums ${warning ? "text-red-800" : "text-slate-950"}`}>{value} <span className="text-xs font-normal text-slate-600">{unit}</span></p>
    {target != null && <p className="mt-1 text-xs tabular-nums text-slate-600">of {number(target, 2)} {unit} daily target{warning ? <span className="ml-1 font-semibold text-red-800">· Over target</span> : null}</p>}
  </div>;
}

export default function NutritionDay({ date, meals, profile, summary, onAdd, onEdit, onDelete }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);
  const totals = summary?.day_totals;
  const target = profile?.daily_target_kcal == null ? null : Number(profile.daily_target_kcal);
  const calories = totals ? Number(totals.calories) : null;
  const proteinTarget = profile?.daily_target_protein_g == null ? null : Number(profile.daily_target_protein_g);
  const carbsTarget = profile?.daily_target_carbs_g == null ? null : Number(profile.daily_target_carbs_g);
  const fatTarget = profile?.daily_target_fat_g == null ? null : Number(profile.daily_target_fat_g);
  const over = target !== null && calories !== null && calories > target;
  const previous = summary?.days?.at(-2);
  const surplus = target !== null && previous?.totals ? Number(previous.totals.calories) - target : 0;
  const balanced = target - surplus;
  const metrics = [
    { label: "Calories", value: calories === null ? "—" : number(calories), unit: "kcal", target, icon: Flame, warning: over },
    { label: "Protein", value: totals ? number(totals.protein, 2) : "—", unit: "g", target: proteinTarget, icon: Dumbbell, warning: totals && proteinTarget !== null && Number(totals.protein) > proteinTarget },
    { label: "Carbs", value: totals ? number(totals.carbs, 2) : "—", unit: "g", target: carbsTarget, icon: Wheat, warning: totals && carbsTarget !== null && Number(totals.carbs) > carbsTarget },
    { label: "Fat", value: totals ? number(totals.fat, 2) : "—", unit: "g", target: fatTarget, icon: Droplets, warning: totals && fatTarget !== null && Number(totals.fat) > fatTarget },
  ];

  return <Panel title={`Meals · ${dateLabel(date)}`} description="One entry per meal, with all its food items together." action={<Button onClick={onAdd}><Plus className="size-4" aria-hidden="true" />Add meal</Button>}>
    <div className="border-b border-[var(--pd-border)] pb-5">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {metrics.map((metric) => <MetricTile key={metric.label} {...metric} />)}
      </div>
      <CalorieProgress calories={calories} target={target} />
      {surplus > 0 && <div className="mt-3 flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm text-slate-800" role="note">
        <Info className="mt-0.5 size-4 shrink-0 text-[var(--pd-primary)]" aria-hidden="true" />
        <p>{date === today() ? "Yesterday" : "The previous day"} was {number(surplus, 2)} kcal over your target. {balanced > 0 ? `Optional one-day balance: ${number(balanced, 2)} kcal for this day. ` : "No balance amount is suggested. "}Your daily target stays {number(target, 2)} kcal.</p>
      </div>}
    </div>

    {meals.length ? <ul className="mt-4 space-y-3">
      {meals.map((meal) => <li key={meal.id} className="overflow-hidden rounded-lg border border-[var(--pd-border)] bg-white transition-colors hover:border-blue-300 focus-within:border-blue-400">
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-3 p-3.5 transition-colors hover:bg-blue-50/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pd-primary)] [&::-webkit-details-marker]:hidden">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-blue-50 text-[var(--pd-primary)]"><UtensilsCrossed className="size-5" aria-hidden="true" /></span>
            <span className="min-w-0 flex-1"><span className="block truncate font-semibold text-slate-950">{meal.meal_name}</span><span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-600"><span>{meal.items.length} food {meal.items.length === 1 ? "item" : "items"} · {number(meal.totals.protein, 2)} g protein</span><span className="inline-flex items-center gap-1"><Clock3 className="size-3" aria-hidden="true" />{meal.datetime ? <time dateTime={meal.datetime} title={`${dateLabel(meal.date)} at ${mealTime(meal.datetime)}`}>{mealTime(meal.datetime)} · {relativeTime(meal.datetime, now)}</time> : "Time not recorded"}</span></span></span>
            <span className="shrink-0 text-right font-semibold tabular-nums text-slate-950">{number(meal.totals.calories)} <span className="text-xs font-normal text-slate-600">kcal</span></span>
            <ChevronDown className="size-4 shrink-0 text-slate-500 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
          </summary>
          <div className="border-t border-[var(--pd-border)] bg-slate-50/70 px-4 pb-4">
            <div className="flex items-center justify-between gap-3 py-3 text-xs font-semibold text-slate-600"><span>Food breakdown</span><span>{meal.items.length} {meal.items.length === 1 ? "item" : "items"}</span></div>
            <ul className="divide-y divide-[var(--pd-border)]">{meal.items.map((item, index) => <li key={`${index}-${item.name}`} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-[var(--pd-primary)] ring-1 ring-blue-100"><CookingPot className="size-4" aria-hidden="true" /></span>
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-semibold text-slate-900">{item.name}</p>
                <p className="mt-0.5 text-xs text-slate-600">{number(item.amount, 3)} {item.unit}</p>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs tabular-nums text-slate-600"><span>Protein <strong className="font-medium text-slate-800">{number(item.protein, 2)} g</strong></span><span>Carbs <strong className="font-medium text-slate-800">{number(item.carbs, 2)} g</strong></span><span>Fat <strong className="font-medium text-slate-800">{number(item.fat, 2)} g</strong></span></div>
              </div>
              <span className="shrink-0 text-right text-sm font-semibold tabular-nums text-slate-950">{number(item.calories, 2)} <span className="text-xs font-normal text-slate-600">kcal</span></span>
            </li>)}</ul>
            <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--pd-border)] pt-4"><Button size="sm" variant="outline" onClick={() => onEdit(meal)}><Pencil className="size-4" aria-hidden="true" />Edit meal</Button><Button size="sm" variant="ghost" className="text-red-700 hover:bg-red-50 hover:text-red-800" onClick={() => onDelete(meal)}><Trash2 className="size-4" aria-hidden="true" />Delete meal</Button></div>
          </div>
        </details>
      </li>)}
    </ul> : <EmptyState title="No meals logged" message="Add a meal when you have one to record. Unlogged days are not counted as zero intake." icon={UtensilsCrossed} action={<Button variant="outline" onClick={onAdd}><Plus className="size-4" aria-hidden="true" />Add meal</Button>} />}
  </Panel>;
}
