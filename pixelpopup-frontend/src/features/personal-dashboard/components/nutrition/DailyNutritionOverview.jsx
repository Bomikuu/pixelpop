import { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeftRight, Calculator, CheckCircle2, ChevronDown, ChevronRight, Droplets, Dumbbell, Flame, Footprints, Info, Target, UtensilsCrossed, Wheat } from "lucide-react";
import { Panel } from "../Panel";
import AnimatedNumber from "../AnimatedNumber";
import { Button } from "../../ui/button";
import { SummaryTilePattern } from "../SummaryTiles";
import { deriveDailyOverview, nutritionNumber as number } from "../../nutrition/dashboardModel";
import useWorkspaceMobile from "../../../workspace-mobile/useWorkspaceMobile";
import "./mobileNutritionSummary.css";

export function NutritionProgress({ value, label, tone = "blue", className = "h-2", known = true, valueText }) {
  const [fill, setFill] = useState(0);
  useEffect(() => { const frame = requestAnimationFrame(() => setFill(value)); return () => cancelAnimationFrame(frame); }, [value]);
  const colors = { blue: "bg-blue-600", red: "bg-red-600", amber: "bg-amber-500", green: "bg-emerald-600" };
  return <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={known ? Math.round(value) : undefined} aria-valuetext={valueText} className={`overflow-hidden rounded-full bg-slate-100 ${className}`}><div className={`h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none ${colors[tone]}`} style={{ width: `${fill}%` }} /></div>;
}

function DailySummaryTile({ label, value, target, remaining, percentage, fill, unit, icon: Icon, tone = "blue", status }) {
  const over = remaining != null && remaining < 0;
  const percent = percentage == null ? "—" : `${number(Math.floor(percentage * 10) / 10, 1)}%`;
  return <div className={`group relative isolate min-w-0 overflow-hidden rounded-lg border bg-white p-3.5 transition-colors hover:border-blue-200 ${over ? "border-red-200" : "border-[var(--pd-border)]"}`}>
    <SummaryTilePattern tone={over ? "negative" : "neutral"} />
    <div className="relative z-10">
      <span className={`mb-2 grid size-9 place-items-center rounded-full ${over ? "bg-red-50 text-red-700" : "bg-blue-50 text-[var(--pd-primary)]"}`}><Icon className="size-4.5" aria-hidden="true" /></span>
      <p className="text-xs font-medium text-slate-600">{label}</p>
      <p className={`mt-0.5 break-words text-xl tabular-nums ${over ? "text-red-700" : "font-semibold text-slate-950"}`}><AnimatedNumber value={value} format={number} digits={2} /> <span className="text-xs font-normal text-slate-600">{unit}</span></p>
      <p className="mt-1 text-xs tabular-nums text-slate-600">of {number(target, 2)} {unit} daily target</p>
      <div className="mt-3"><NutritionProgress value={fill} tone={over ? "red" : tone} label={`${label}: ${number(value, 2)} of ${number(target, 2)} ${unit}`} /></div>
      <p className={`mt-2 text-xs tabular-nums ${over ? "text-red-700" : "text-slate-600"}`}>{remaining == null ? "No food logged" : `${number(Math.abs(remaining), 2)} ${unit} ${over ? "over target" : "remaining"}`}</p>
      <p className="mt-1 text-xs text-slate-500">{status || (remaining === 0 ? "Target reached" : over ? "Over target" : "Below target")} · {percent}</p>
    </div>
  </div>;
}

function CalorieBasis({ basis, onChange, compact = false }) {
  if (compact) return <Button type="button" size="sm" variant="outline" className="nutrition-basis-button" onClick={() => onChange(basis === "food" ? "net" : "food")} aria-label={`Showing ${basis} calories. Switch to ${basis === "food" ? "net" : "food"} calories.`}>{basis === "food" ? "Food" : "Net"}<ArrowLeftRight className="size-3.5" aria-hidden="true" /></Button>;
  return <div role="group" aria-label="Calorie basis" className="nutrition-basis-switch flex gap-1 rounded-md border border-[var(--pd-border)] p-1">{["food", "net"].map((value) => <Button key={value} size="sm" variant={basis === value ? "default" : "ghost"} aria-pressed={basis === value} onClick={() => onChange(value)}>{value === "food" ? "Food" : "Net"}</Button>)}</div>;
}

function MobileNutritionSummary({ data, basis, status, tone, onTargets, onBasisChange }) {
  const remaining = data.calories == null ? "No food logged" : data.target == null ? "Set your daily target" : data.remaining === 0 ? "Target reached" : `${number(Math.abs(data.remaining), 1)} kcal ${data.remaining < 0 ? "over target" : "remaining"}`;
  return <div className="nutrition-mobile-summary">
    <section className="nutrition-mobile-banner" aria-label="Daily calorie and macro progress">
      <span className="nutrition-mobile-artwork" aria-hidden="true"><img src="/workspace-assets/smokey-nutrition-v1.webp" width="299" height="384" alt="" decoding="async" /></span>
      <div className="nutrition-mobile-card-controls">
        <button type="button" className="nutrition-mobile-heading" onClick={onTargets} aria-label="View calorie and macro targets">
          <span className="nutrition-mobile-flame"><Flame size={21} aria-hidden="true" /></span><span>{basis === "net" ? "Net calories" : "Calories"}</span><ChevronRight size={17} aria-hidden="true" />
        </button>
        <CalorieBasis compact basis={basis} onChange={onBasisChange} />
      </div>
      <div className="nutrition-mobile-calories">
        <p className="nutrition-mobile-total"><strong><AnimatedNumber value={data.calories} format={number} digits={1} /></strong><span>/ {number(data.target, 1)} kcal</span></p>
        <p className="nutrition-mobile-remaining" data-over={data.status === "over" || undefined}>{remaining}</p>
        <div className="nutrition-mobile-progress">
          <NutritionProgress value={data.fill} tone={tone} known={data.percentage != null} label={basis === "net" ? "Net calories against daily target" : "Food calories against daily target"} valueText={data.calories == null ? "No food logged; intake unknown" : `${number(data.calories, 1)} of ${number(data.target, 1)} kcal; ${status}`} />
          {data.percentage != null && <span aria-hidden="true">{number(data.percentage, 0)}%</span>}
        </div>
      </div>
      <dl className="nutrition-mobile-macros">
        {data.macros.map((macro) => <div key={macro.key} data-macro={macro.key} data-over={macro.remaining != null && macro.remaining < 0 || undefined}>
          <dt><span aria-hidden="true" />{macro.key === "protein" ? "Protein" : macro.key === "carbs" ? "Carbs" : "Fat"}</dt>
          <dd><strong><AnimatedNumber value={macro.value} format={number} digits={1} />g</strong><span> / {number(macro.target, 1)}g</span></dd>
          {macro.value == null ? <dd className="nutrition-mobile-macro-note">No food logged</dd> : macro.remaining < 0 ? <dd className="nutrition-mobile-macro-note">{number(-macro.remaining, 1)}g over</dd> : null}
        </div>)}
      </dl>
    </section>
  </div>;
}

export default function DailyNutritionOverview({ summary, profile, basis, onBasisChange, actions, onTargets }) {
  const mobile = useWorkspaceMobile();
  const data = deriveDailyOverview({ summary, profile, basis });
  const statuses = { unlogged: "No food logged", below: "Below target", approaching: "Approaching target", reached: "Target reached", over: "Over target" };
  const tone = data.status === "over" ? "red" : data.status === "reached" ? "green" : data.status === "approaching" ? "amber" : "blue";
  const icons = { protein: Dumbbell, carbs: Wheat, fat: Droplets };
  const previous = summary?.days?.at(-2);
  const surplus = previous?.totals && data.target ? Number(previous.net_calories ?? previous.totals.calories) - data.target : 0;
  const selectedDate = summary?.date ? new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Manila", weekday: "long", month: "long", day: "2-digit", year: "numeric" }).format(new Date(`${summary.date}T12:00:00+08:00`)) : null;
  return <div className="workspace-nutrition-panel"><Panel title="Daily overview" description={selectedDate && <time dateTime={summary.date}>{selectedDate}</time>} action={mobile ? actions : <div className="flex flex-wrap items-center justify-end gap-2"><CalorieBasis basis={basis} onChange={onBasisChange} />{actions}</div>}>
    {mobile ? <MobileNutritionSummary data={data} basis={basis} status={statuses[data.status]} tone={tone} onTargets={onTargets} onBasisChange={onBasisChange} /> : <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <DailySummaryTile label={basis === "net" ? "Calories · net" : "Calories"} value={data.calories} target={data.target} remaining={data.remaining} percentage={data.percentage} fill={data.fill} unit="kcal" icon={Flame} tone={tone} status={statuses[data.status]} />
      {data.macros.map((macro) => <DailySummaryTile key={macro.key} label={macro.key === "protein" ? "Protein" : macro.key === "carbs" ? "Carbs" : "Fat"} value={macro.value} target={macro.target} remaining={macro.remaining} percentage={macro.value != null && macro.target ? macro.value / macro.target * 100 : null} fill={macro.fill} unit="g" icon={icons[macro.key]} status={macro.value == null ? "No food logged" : undefined} />)}
    </div>}
    <div className="mt-3">
        <p className="text-xs text-slate-600">Food {number(data.food, 2)} kcal · Active burn {number(data.burn, 2)} kcal{data.previousDelta != null && <span className="mt-1 block">{data.previousDelta > 0 ? "+" : ""}{number(data.previousDelta, 2)} kcal vs previous day ({basis})</span>}</p>
        {basis === "net" && <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-600"><Info className="size-3.5 shrink-0" aria-hidden="true" />Net isn’t total energy expenditure. Only logged active burn is subtracted.</p>}
        {data.net != null && data.net < 0 && <p className="mt-2 text-xs text-slate-600">Logged activity exceeds logged food by {number(-data.net, 2)} kcal. This isn’t a complete energy balance.</p>}
        {basis === "net" && data.foodStatus === "over" && <p role="note" className="mt-2 flex items-center gap-2 text-xs text-red-700"><AlertTriangle className="size-4" aria-hidden="true" />Food intake is still above your daily food target.</p>}
        {data.foodStatus === "reached" && <p className="mt-2 flex items-center gap-2 text-xs text-emerald-800"><CheckCircle2 className="size-4" aria-hidden="true" />Food target reached.</p>}
    </div>
    <details className="group mt-4 border-t border-[var(--pd-border)] pt-3">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-sm text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pd-primary)] [&::-webkit-details-marker]:hidden"><Info className="size-4 text-[var(--pd-primary)]" aria-hidden="true" />How this works<ChevronDown className="ml-auto size-4 text-slate-500 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" /></summary>
      <dl className="mt-4 grid gap-4 text-xs leading-5 sm:grid-cols-2">
        <div><dt className="flex items-center gap-2 font-semibold text-slate-900"><UtensilsCrossed className="size-4 text-[var(--pd-primary)]" aria-hidden="true" />Food calories</dt><dd className="mt-1 text-slate-600">The calories from meals logged for this day. Food mode compares these with your fixed daily calorie target. No meal log means unknown intake, not zero.</dd></div>
        <div><dt className="flex items-center gap-2 font-semibold text-slate-900"><Footprints className="size-4 text-emerald-700" aria-hidden="true" />Activity burn</dt><dd className="mt-1 text-slate-600">Only the active calories from sessions you logged. Estimated burn uses the activity details and your recorded weight; manually entered burn uses your amount.</dd></div>
        <div><dt className="flex items-center gap-2 font-semibold text-slate-900"><Calculator className="size-4 text-[var(--pd-primary)]" aria-hidden="true" />Net calories</dt><dd className="mt-1 text-slate-600">Food minus logged active burn. Switch to Net to see that comparison. It isn’t your full daily energy balance, and a food-over-target warning stays visible.</dd></div>
        <div><dt className="flex items-center gap-2 font-semibold text-slate-900"><Target className="size-4 text-[var(--pd-primary)]" aria-hidden="true" />Progress & remaining</dt><dd className="mt-1 text-slate-600">Remaining is your target minus the displayed intake. Red shows the amount over target; bars stop at 100%. Macro targets always use food grams. Activity doesn’t increase your food target.</dd></div>
      </dl>
    </details>
    {surplus > 0 && <details className="mt-4 border-t border-[var(--pd-border)] pt-3 text-xs text-slate-600"><summary className="cursor-pointer">Previous-day surplus · {number(surplus, 2)} kcal</summary><p className="mt-2">{data.target - surplus > 0 ? `Optional one-day balance: ${number(data.target - surplus, 2)} kcal. ` : "No balance amount is suggested. "}Your daily food target stays {number(data.target)} kcal.</p></details>}
  </Panel></div>;
}
