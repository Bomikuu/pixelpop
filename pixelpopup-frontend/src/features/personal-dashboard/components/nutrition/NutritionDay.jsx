import { createElement, useEffect, useRef, useState } from "react";
import { DropdownMenu } from "radix-ui";
import { Activity, ArrowDownLeft, ArrowUpRight, Bike, ChevronDown, Clock3, CookingPot, Droplets, Dumbbell, Flame, Footprints, Info, Pencil, Plus, Trash2, UtensilsCrossed, Waves, Wheat } from "lucide-react";
import { Button } from "../../ui/button";
import { EmptyState, Panel } from "../Panel";
import { SummaryTilePattern } from "../SummaryTiles";
import { dateLabel, today } from "../../lib/format";
import CalorieProgress from "./CalorieProgress";

const number = (value, decimals = 0) => new Intl.NumberFormat("en-PH", { maximumFractionDigits: decimals }).format(Number(value));
const mealTime = (value) => value ? new Intl.DateTimeFormat("en-PH", { timeZone: "Asia/Manila", hour: "numeric", minute: "2-digit" }).format(new Date(value)) : null;
const activityIcons = { walking: Footprints, running: Activity, cycling: Bike, swimming: Waves, strength: Dumbbell };
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
  return <div className={`group relative isolate min-w-0 overflow-hidden rounded-lg border p-3.5 transition-[border-color,background-color,transform] duration-150 hover:-translate-y-0.5 motion-reduce:transform-none ${warning ? "border-red-200 bg-red-50 hover:border-red-300 hover:bg-red-50/80" : "border-[var(--pd-border)] bg-white hover:border-blue-200 hover:bg-blue-50/40"}`}>
    <SummaryTilePattern tone={warning ? "negative" : "neutral"} />
    <span className={`relative z-10 mb-2 grid size-9 place-items-center rounded-full ${warning ? "bg-red-100 text-red-700" : "bg-blue-50 text-[var(--pd-primary)]"}`}>{createElement(Icon, { className: "size-4.5", "aria-hidden": "true" })}</span>
    <p className="relative z-10 text-xs font-medium text-slate-600">{label}</p>
    <p className={`relative z-10 mt-0.5 text-xl font-semibold tabular-nums ${warning ? "text-red-800" : "text-slate-950"}`}>{value} <span className="text-xs font-normal text-slate-600">{unit}</span></p>
    {target != null && <p className="relative z-10 mt-1 text-xs tabular-nums text-slate-600">of {number(target, 2)} {unit} daily target{warning ? <span className="ml-1 font-semibold text-red-800">· Over target</span> : null}</p>}
  </div>;
}

function LogAmount({ value, direction }) {
  const incoming = direction === "in";
  const Icon = incoming ? ArrowDownLeft : ArrowUpRight;
  return <span className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-sm font-medium tabular-nums ${incoming ? "text-blue-700" : "text-emerald-800"}`}>
    <span className={`grid size-7 place-items-center rounded-full ${incoming ? "bg-blue-50" : "bg-emerald-50"}`}><Icon className="size-4" aria-hidden="true" /></span>
    {incoming ? "+" : "−"}{number(value, 2)} <span className="text-xs font-normal">kcal</span>
  </span>;
}

export default function NutritionDay({ date, meals, activities = [], profile, summary, onAdd, onEdit, onDelete, onAddActivity, onEditActivity, onDeleteActivity }) {
  const [now, setNow] = useState(() => Date.now());
  const addTrigger = useRef(null);
  const opening = useRef(false);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);
  const totals = summary?.day_totals;
  const target = profile?.daily_target_kcal == null ? null : Number(profile.daily_target_kcal);
  const calories = totals ? Number(totals.calories) : null;
  const activityCalories = Number(summary?.day_activity_kcal || 0);
  const netCalories = calories === null ? null : calories - activityCalories;
  const proteinTarget = profile?.daily_target_protein_g == null ? null : Number(profile.daily_target_protein_g);
  const carbsTarget = profile?.daily_target_carbs_g == null ? null : Number(profile.daily_target_carbs_g);
  const fatTarget = profile?.daily_target_fat_g == null ? null : Number(profile.daily_target_fat_g);
  const over = target !== null && calories !== null && calories > target;
  const previous = summary?.days?.at(-2);
  const previousBurn = Number(previous?.activity_kcal || 0);
  const surplus = target !== null && previous?.totals ? Number(previous.net_calories ?? previous.totals.calories) - target : 0;
  const balanced = target - surplus;
  const metrics = [
    { label: "Calories", value: calories === null ? "—" : number(calories), unit: "kcal", target, icon: Flame, warning: over },
    { label: "Protein", value: totals ? number(totals.protein, 2) : "—", unit: "g", target: proteinTarget, icon: Dumbbell, warning: totals && proteinTarget !== null && Number(totals.protein) > proteinTarget },
    { label: "Carbs", value: totals ? number(totals.carbs, 2) : "—", unit: "g", target: carbsTarget, icon: Wheat, warning: totals && carbsTarget !== null && Number(totals.carbs) > carbsTarget },
    { label: "Fat", value: totals ? number(totals.fat, 2) : "—", unit: "g", target: fatTarget, icon: Droplets, warning: totals && fatTarget !== null && Number(totals.fat) > fatTarget },
  ];

  const addAction = <DropdownMenu.Root><DropdownMenu.Trigger asChild><Button ref={addTrigger}><Plus className="size-4" aria-hidden="true" />Add entry<ChevronDown className="size-4" aria-hidden="true" /></Button></DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content align="end" sideOffset={6} className="personal-dashboard z-50 min-w-44 rounded-md border border-[var(--pd-border)] bg-white p-1 text-[var(--pd-ink)] shadow-md" onCloseAutoFocus={(event) => { if (opening.current) { event.preventDefault(); opening.current = false; } }}><DropdownMenu.Item className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-3 py-2 text-sm outline-none data-[highlighted]:bg-[var(--pd-soft)]" onSelect={() => { opening.current = true; addTrigger.current?.focus(); onAdd(); }}><UtensilsCrossed className="size-4" aria-hidden="true" />Add meal</DropdownMenu.Item><DropdownMenu.Item className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-3 py-2 text-sm outline-none data-[highlighted]:bg-[var(--pd-soft)]" onSelect={() => { opening.current = true; addTrigger.current?.focus(); onAddActivity(); }}><Activity className="size-4" aria-hidden="true" />Add activity</DropdownMenu.Item></DropdownMenu.Content></DropdownMenu.Portal></DropdownMenu.Root>;

  return <Panel title={`Daily log · ${dateLabel(date)}`} description="Meals and individual activity sessions for this day." action={addAction}>
    <div className="border-b border-[var(--pd-border)] pb-5">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {metrics.map((metric) => <MetricTile key={metric.label} {...metric} />)}
      </div>
      {/* <div className="mt-3 grid grid-cols-2 gap-2 rounded-md border border-[var(--pd-border)] bg-white px-3 py-2.5 text-sm">
        <p className="min-w-0"><span className="block text-xs text-slate-600">Active calories burned</span><span className="font-medium tabular-nums text-emerald-800">−{number(activityCalories, 2)} kcal</span></p>
        <p className="min-w-0"><span className="block text-xs text-slate-600">Estimated net · food − activity</span><span className="font-medium tabular-nums text-slate-950">{netCalories === null ? "—" : `${number(netCalories, 2)} kcal`}</span></p>
      </div> */}
      <CalorieProgress calories={calories} activityCalories={activityCalories} target={target} />
      {surplus > 0 && <div className="mt-3 flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm text-slate-800" role="note">
        <Info className="mt-0.5 size-4 shrink-0 text-[var(--pd-primary)]" aria-hidden="true" />
        <p>{date === today() ? "Yesterday" : "The previous day"} was {number(surplus, 2)} {previousBurn > 0 ? "net " : "food "}kcal over your target. {balanced > 0 ? `Optional one-day balance: ${number(balanced, 2)} kcal for this day. ` : "No balance amount is suggested. "}Your daily food target stays {number(target, 2)} kcal.</p>
      </div>}
    </div>

    <section className="mt-4 border-b border-[var(--pd-border)] pb-4" aria-labelledby="nutrition-activity-heading">
      <div><h3 id="nutrition-activity-heading" className="font-semibold text-slate-950">Activity</h3><p className="text-xs text-slate-600">Log individual sessions, not all-day steps. Burn is an estimate unless entered manually.</p></div>
      {activities.length ? <ul className="mt-3 space-y-3">
        {activities.map((activity) => {
          const Icon = activityIcons[activity.activity_type] || Activity;
          return <li key={activity.id} className="overflow-hidden rounded-lg border border-[var(--pd-border)] bg-white transition-colors hover:border-blue-300 focus-within:border-blue-400"><details className="group"><summary className="flex cursor-pointer list-none items-center gap-3 p-3.5 transition-colors hover:bg-blue-50/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pd-primary)] [&::-webkit-details-marker]:hidden"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700"><Icon className="size-5" aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="block truncate font-semibold text-slate-950">{activity.name}</span><span className="mt-0.5 block text-xs text-slate-600">{[activity.steps ? `${number(activity.steps)} steps` : null, activity.duration_minutes ? `${number(activity.duration_minutes, 2)} min${activity.duration_assumed ? " · assumed pace" : ""}` : null, activity.source === "estimated" ? "Estimated burn" : activity.manual_override ? "Manual override" : "Manually entered"].filter(Boolean).join(" · ")}</span></span><LogAmount value={activity.active_kcal} direction="out" /><ChevronDown className="size-4 shrink-0 text-slate-500 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" /></summary><div className="border-t border-[var(--pd-border)] bg-slate-50/70 px-4 pb-4"><p className="py-3 text-xs text-slate-600">{activity.source === "estimated" ? `Estimated active burn${activity.weight_kg_used ? ` using ${number(activity.weight_kg_used, 2)} kg` : ""}.` : "Active calories entered manually."}</p><div className="flex flex-wrap gap-2 border-t border-[var(--pd-border)] pt-4"><Button size="sm" variant="outline" onClick={() => onEditActivity(activity)}><Pencil className="size-4" aria-hidden="true" />Edit activity</Button><Button size="sm" variant="ghost" className="text-red-700 hover:bg-red-50 hover:text-red-800" onClick={() => onDeleteActivity(activity)}><Trash2 className="size-4" aria-hidden="true" />Delete activity</Button></div></div></details></li>;
        })}
      </ul> : <p className="mt-3 flex items-center gap-2 text-sm text-slate-600"><Footprints className="size-4 text-emerald-700" aria-hidden="true" />No activity logged for this day.</p>}
    </section>

    {meals.length ? <ul className="mt-4 space-y-3">
      {meals.map((meal) => <li key={meal.id} className="overflow-hidden rounded-lg border border-[var(--pd-border)] bg-white transition-colors hover:border-blue-300 focus-within:border-blue-400">
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-3 p-3.5 transition-colors hover:bg-blue-50/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pd-primary)] [&::-webkit-details-marker]:hidden">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-blue-50 text-[var(--pd-primary)]"><UtensilsCrossed className="size-5" aria-hidden="true" /></span>
            <span className="min-w-0 flex-1"><span className="block truncate font-semibold text-slate-950">{meal.meal_name}</span><span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-600"><span>{meal.items.length} food {meal.items.length === 1 ? "item" : "items"} · {number(meal.totals.protein, 2)} g protein</span><span className="inline-flex items-center gap-1"><Clock3 className="size-3" aria-hidden="true" />{meal.datetime ? <time dateTime={meal.datetime} title={`${dateLabel(meal.date)} at ${mealTime(meal.datetime)}`}>{mealTime(meal.datetime)} · {relativeTime(meal.datetime, now)}</time> : "Time not recorded"}</span></span></span>
            <LogAmount value={meal.totals.calories} direction="in" />
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
    </ul> : <EmptyState title="No meals logged" message="Add a meal when you have one to record. Unlogged days are not counted as zero intake." icon={UtensilsCrossed} />}
  </Panel>;
}
