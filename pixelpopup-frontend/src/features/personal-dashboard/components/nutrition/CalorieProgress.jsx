import { useEffect, useState } from "react";
import { AlertTriangle, Calculator, ChevronDown, Footprints, Info, Target, UtensilsCrossed } from "lucide-react";

const number = (value) => new Intl.NumberFormat("en-PH", { maximumFractionDigits: 0 }).format(value);

export default function CalorieProgress({ calories, activityCalories = 0, target }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  if (calories === null || target === null) return null;
  const burn = Number(activityCalories) || 0;
  const net = calories - burn;
  const over = calories > target;
  const scale = Math.max(calories, target, 1);
  const foodWidth = 100 * calories / scale;
  const offsetStart = 100 * Math.max(net, 0) / scale;
  const targetPosition = 100 * target / scale;
  const difference = Math.abs(target - calories);

  return <details className={`group mt-4 rounded-md border px-4 py-3 ${over ? "border-red-200 bg-red-50/70" : "border-blue-100 bg-blue-50/50"}`}>
    <summary className="cursor-pointer list-none focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pd-primary)] [&::-webkit-details-marker]:hidden">
      <span className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className={`inline-flex items-center gap-1.5 font-semibold ${over ? "text-red-800" : "text-slate-800"}`}>
          {over && <AlertTriangle className="size-4" aria-hidden="true" />}
          {over ? `Food over target by ${number(difference)} kcal` : `${number(difference)} food kcal remaining`}
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-slate-700"><Info className="size-4 text-[var(--pd-primary)]" aria-hidden="true" />How this works <ChevronDown className="size-4 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" /></span>
      </span>
      <span className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs tabular-nums text-slate-700">
        <span className="inline-flex items-center gap-1"><UtensilsCrossed className="size-3.5 text-[var(--pd-primary)]" aria-hidden="true" />Food {number(calories)} kcal</span>
        <span className="inline-flex items-center gap-1"><Footprints className="size-3.5 text-emerald-700" aria-hidden="true" />Activity −{number(burn)} kcal</span>
        <span className="inline-flex items-center gap-1 font-semibold text-slate-900"><Calculator className="size-3.5" aria-hidden="true" />Estimated net {number(net)} kcal</span>
        <span className="inline-flex items-center gap-1"><Target className="size-3.5" aria-hidden="true" />Target {number(target)} kcal</span>
      </span>
      <span role="meter" aria-label="Food intake and activity offset compared with daily food target" aria-valuenow={calories} aria-valuemin={0} aria-valuemax={scale} aria-valuetext={`${number(calories)} food kcal logged, ${number(burn)} active kcal, ${number(net)} net kcal. Fixed food target ${number(target)} kcal.`} className="relative mt-3 block h-3 overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
        <span className="absolute inset-y-0 left-0 bg-[var(--pd-primary)] transition-[width] duration-700 ease-out motion-reduce:transition-none" style={{ width: `${animated ? foodWidth : 0}%` }} />
        {burn > 0 && <span className="absolute inset-y-0 bg-emerald-600/85 transition-[left,width] duration-700 ease-out motion-reduce:transition-none" style={{ left: `${animated ? offsetStart : 0}%`, width: `${animated ? foodWidth - offsetStart : 0}%` }} />}
        <span className="absolute inset-y-0 z-10 w-0.5 bg-slate-800" style={{ left: `calc(${targetPosition}% - 1px)` }} aria-hidden="true" />
      </span>
      <span className="mt-1.5 flex justify-between text-[11px] text-slate-600"><span>0 kcal</span><span className="inline-flex items-center gap-1"><Target className="size-3" aria-hidden="true" />Food target marker · {number(target)} kcal</span></span>
    </summary>
    <div className="mt-3 grid gap-x-5 gap-y-3 border-t border-slate-200 pt-3 text-xs leading-5 text-slate-700 sm:grid-cols-2">
      <p className="flex items-start gap-2"><UtensilsCrossed className="mt-0.5 size-4 shrink-0 text-[var(--pd-primary)]" aria-hidden="true" /><span><strong className="text-slate-900">Food · {number(calories)} kcal.</strong> Blue measures meals logged against your fixed daily food target.</span></p>
      <p className="flex items-start gap-2"><Footprints className="mt-0.5 size-4 shrink-0 text-emerald-700" aria-hidden="true" /><span><strong className="text-slate-900">Activity · −{number(burn)} kcal.</strong> Green overlays the activity offset on the food bar. It does not raise your food target.</span></p>
      <p className="flex items-start gap-2"><Calculator className="mt-0.5 size-4 shrink-0 text-slate-700" aria-hidden="true" /><span><strong className="text-slate-900">Estimated net · {number(net)} kcal.</strong> Food minus logged active burn; it is not your full daily energy balance. If activity exceeds food, green covers the whole food bar.</span></p>
      <p className="flex items-start gap-2"><Target className="mt-0.5 size-4 shrink-0 text-slate-700" aria-hidden="true" /><span><strong className="text-slate-900">Target · {number(target)} kcal.</strong> The dark marker shows your food goal, which may already account for your usual activity.</span></p>
    </div>
  </details>;
}
