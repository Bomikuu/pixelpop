import { useEffect, useState } from "react";
import { AlertTriangle, ChevronDown } from "lucide-react";

const number = (value) => new Intl.NumberFormat("en-PH", { maximumFractionDigits: 0 }).format(value);

export default function CalorieProgress({ calories, target }) {
  const ratio = calories === null || target === null ? 0 : Math.min(calories / target, 1);
  const [fill, setFill] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setFill(ratio));
    return () => cancelAnimationFrame(frame);
  }, [ratio]);

  if (calories === null || target === null) return null;
  const over = calories > target;
  const difference = Math.abs(target - calories);

  return <details className={`group mt-4 rounded-md border px-4 py-3 ${over ? "border-red-200 bg-red-50/70" : "border-blue-100 bg-blue-50/50"}`}>
    <summary className="cursor-pointer list-none focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pd-primary)] [&::-webkit-details-marker]:hidden">
      <span className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className={`inline-flex items-center gap-1.5 font-semibold ${over ? "text-red-800" : "text-slate-800"}`}>{over && <AlertTriangle className="size-4" aria-hidden="true" />}{over ? `Over current target by ${number(difference)} kcal` : `${number(difference)} kcal remaining`}</span>
        <span className="inline-flex items-center gap-1 text-xs text-slate-600">View details <ChevronDown className="size-4 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" /></span>
      </span>
      <span role="meter" aria-label="Calories compared with current daily target" aria-valuenow={calories} aria-valuemin={0} aria-valuemax={Math.max(calories, target)} aria-valuetext={`${number(calories)} kcal logged. Current target ${number(target)} kcal. ${over ? `${number(difference)} kcal over target.` : `${number(difference)} kcal remaining.`}`} className="mt-3 block h-2.5 overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
        <span className={`block h-full w-full origin-left rounded-full transition-transform duration-700 ease-out motion-reduce:transition-none ${over ? "bg-red-600" : "bg-[var(--pd-primary)]"}`} style={{ transform: `scaleX(${fill})` }} />
      </span>
    </summary>
    <div className="mt-3 grid gap-2 border-t border-slate-200 pt-3 text-sm sm:grid-cols-3">
      <p><span className="block text-xs text-slate-600">Logged</span><strong className="tabular-nums text-slate-950">{number(calories)} kcal</strong></p>
      <p><span className="block text-xs text-slate-600">Current target</span><strong className="tabular-nums text-slate-950">{number(target)} kcal</strong></p>
      <p><span className="block text-xs text-slate-600">Difference</span><strong className={`tabular-nums ${over ? "text-red-800" : "text-slate-950"}`}>{over ? "+" : "-"}{number(difference)} kcal</strong></p>
    </div>
  </details>;
}
