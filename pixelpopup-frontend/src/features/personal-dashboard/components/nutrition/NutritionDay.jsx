import { useEffect, useRef, useState } from "react";
import { DropdownMenu } from "radix-ui";
import { ArrowDownLeft, ArrowUpRight, BookmarkPlus, ChevronDown, Clock3, Copy, Library, MoreHorizontal, Pencil, Plus, Trash2, UtensilsCrossed } from "lucide-react";
import { Button } from "../../ui/button";
import { Panel } from "../Panel";
import { dateLabel } from "../../lib/format";
import { nutritionNumber as number } from "../../nutrition/dashboardModel";

function MealImage({ record, className = "size-12" }) {
  const [failedUrl, setFailedUrl] = useState(null);
  const source = typeof record.image_url === "string" ? record.image_url.trim() : "";
  return <img src={source && source !== failedUrl ? source : "/workspace-assets/meal-item-placeholder-v1.webp"} width="192" height="192" alt="" aria-hidden="true" loading="lazy" decoding="async" className={`shrink-0 rounded-lg bg-[var(--pd-soft)] object-contain ${className}`} onError={() => { if (source && source !== failedUrl) setFailedUrl(source); }} />;
}

export function LogAmount({ value, direction }) {
  const incoming = direction === "in", Icon = incoming ? ArrowDownLeft : ArrowUpRight;
  return <span className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-sm tabular-nums ${incoming ? "text-blue-700" : "text-emerald-800"}`}><Icon className="size-4" aria-hidden="true" />{incoming ? "+" : "−"}{number(value, 2)} kcal</span>;
}
function timeLabel(value, now) {
  const time = new Intl.DateTimeFormat("en-PH", { timeZone: "Asia/Manila", hour: "numeric", minute: "2-digit" }).format(new Date(value));
  const minutes = Math.max(0, Math.floor((now - Date.parse(value)) / 60000));
  const relative = minutes < 1 ? "just now" : minutes < 60 ? `${minutes} min ago` : minutes < 1440 ? `${Math.floor(minutes / 60)} hours ago` : `${Math.floor(minutes / 1440)} days ago`;
  return `${time} · ${relative}`;
}
function ReuseActions({ meal, onDuplicate, onSavePreset }) {
  const opening = useRef(false);
  return <DropdownMenu.Root><DropdownMenu.Trigger asChild><Button size="sm" variant="outline" aria-label={`More actions for ${meal.meal_name}`}><MoreHorizontal className="size-4" />More</Button></DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content sideOffset={4} className="personal-dashboard z-50 min-w-44 rounded-md border border-[var(--pd-border)] bg-white p-1 shadow-md" onCloseAutoFocus={(event) => { if (opening.current) { event.preventDefault(); opening.current = false; } }}>{[["Duplicate", Copy, onDuplicate], ["Save as preset", BookmarkPlus, onSavePreset]].filter(([, , action]) => action).map(([label, Icon, action]) => <DropdownMenu.Item key={label} className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm outline-none data-[highlighted]:bg-[var(--pd-soft)]" onSelect={() => { opening.current = true; action(meal); }}><Icon className="size-4" />{label}</DropdownMenu.Item>)}</DropdownMenu.Content></DropdownMenu.Portal></DropdownMenu.Root>;
}
export default function NutritionDay({ date, meals, onAdd, onEdit, onDelete, onDuplicate, onSavePreset, onOpenLibrary }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 60000); return () => window.clearInterval(timer); }, []);
  return <Panel title={`Meals · ${meals.length}`} contentClassName="flex flex-1 flex-col" description={`${dateLabel(date)} · ${meals.length ? `${number(meals.reduce((sum, meal) => sum + Number(meal.totals.calories), 0), 2)} kcal recorded` : "No food entries"}`} action={<div className="flex flex-wrap gap-2">{onOpenLibrary && <Button size="sm" variant="outline" onClick={onOpenLibrary}><Library className="size-4" />Meal library</Button>}<Button size="sm" onClick={onAdd}><Plus className="size-4" />Add meal</Button></div>}>
    {meals.length ? <ul className="mb-4 space-y-3">{meals.map((meal) => <li key={meal.id} className="overflow-hidden rounded-lg border border-[var(--pd-border)] bg-white hover:border-blue-300 focus-within:border-blue-400">
      <details className="group"><summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 p-3.5 hover:bg-blue-50/40 focus-visible:outline-2 focus-visible:outline-[var(--pd-primary)] [&::-webkit-details-marker]:hidden">
        <MealImage record={meal} />
        <span className="min-w-0 flex-1"><span className="block break-words font-semibold text-slate-950">{meal.meal_name}</span><span className="mt-1 block text-xs text-slate-600">{meal.items.length} foods · {number(meal.totals.protein, 2)} g protein</span>{meal.datetime && <time dateTime={meal.datetime} title={dateLabel(meal.date)} className="mt-1 flex items-center gap-1 text-xs text-slate-500"><Clock3 className="size-3" aria-hidden="true" />{timeLabel(meal.datetime, now)}</time>}</span>
        <LogAmount value={meal.totals.calories} direction="in" /><ChevronDown className="size-4 text-slate-500 group-open:rotate-180" aria-hidden="true" />
      </summary><div className="border-t border-[var(--pd-border)] px-4 pb-4">
        <ul className="divide-y divide-[var(--pd-border)]">{meal.items.map((item, index) => <li key={index} className="flex items-start gap-3 py-3">
          <MealImage record={item} className="size-10" /><div className="min-w-0 flex-1"><p className="break-words text-sm font-medium">{item.name}</p><p className="text-xs text-slate-600">{number(item.amount, 3)} {item.unit}</p><p className="mt-1 text-xs tabular-nums text-slate-600">P {number(item.protein, 2)} g · C {number(item.carbs, 2)} g · F {number(item.fat, 2)} g</p></div><span className="shrink-0 text-sm tabular-nums">{number(item.calories, 2)} kcal</span>
        </li>)}</ul>
        <div className="flex flex-wrap gap-2 border-t border-[var(--pd-border)] pt-3"><Button size="sm" variant="outline" onClick={() => onEdit(meal)}><Pencil className="size-4" />Edit</Button>{(onDuplicate || onSavePreset) && <ReuseActions meal={meal} onDuplicate={onDuplicate} onSavePreset={onSavePreset} />}<Button size="sm" variant="ghost" className="text-red-700" onClick={() => onDelete(meal)}><Trash2 className="size-4" />Delete</Button></div>
      </div></details>
    </li>)}</ul> : <div className="mb-4 flex min-h-40 flex-1 flex-col items-center justify-center px-4 py-8 text-center xl:min-h-52"><span className="mb-3 grid size-12 place-items-center rounded-full bg-blue-50 text-[var(--pd-primary)]"><UtensilsCrossed className="size-6" aria-hidden="true" /></span><p className="text-sm font-medium text-slate-950">No meals logged for this day</p><p className="mt-1 max-w-xs text-sm text-slate-600">Add a meal or choose one from your meal library.</p></div>}
    <p className="mt-auto border-t border-[var(--pd-border)] pt-3 text-xs leading-5 text-slate-500">Unlogged days don’t count as zero intake.</p>
  </Panel>;
}
