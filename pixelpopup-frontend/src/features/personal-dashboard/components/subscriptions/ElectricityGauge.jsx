import { CircleCheck, Info, Minus, TrendingUp } from "lucide-react";
import ElectricityMeterPrediction from "./ElectricityMeterPrediction";
import ElectricityProgress from "./ElectricityProgress";
import { money } from "../../lib/format";

export default function ElectricityGauge({ result, comparison, mode, values }) {
  if (mode === "readings") return <ElectricityMeterPrediction result={result} values={values} />;
  const valid = comparison != null;
  const previous = Number(comparison?.previous ?? 0);
  const current = Number(comparison?.current ?? 0);
  const difference = Number(comparison?.difference ?? 0);
  const maximum = Math.max(previous, current);
  const position = maximum > 0 ? current / maximum * 100 : 0;
  const baseline = maximum > 0 ? previous / maximum * 100 : 0;
  const context = !valid ? "empty" : difference > 0 ? "higher" : difference < 0 ? "lower" : "same";
  const { tone, surface, fill, Icon, status } = {
    empty: { tone: "text-slate-700", surface: "bg-slate-50", fill: "bg-slate-400", Icon: Info, status: "Enter both bill amounts" },
    higher: { tone: "text-red-700", surface: "bg-red-50", fill: "bg-red-500", Icon: TrendingUp, status: "Higher than your previous bill" },
    lower: { tone: "text-emerald-700", surface: "bg-emerald-50", fill: "bg-emerald-500", Icon: CircleCheck, status: "Lower than your previous bill" },
    same: { tone: "text-blue-700", surface: "bg-blue-50", fill: "bg-blue-500", Icon: Minus, status: "Same bill amount" },
  }[context];
  const percent = comparison?.percent;
  const message = !valid ? "Compare any two electricity bills without saving a record."
    : difference === 0 ? "Your current and previous bills are the same amount."
      : `Your current bill is ${money(Math.abs(difference))}${percent == null ? "" : ` (${Math.abs(Number(percent)).toFixed(1)}%)`} ${difference > 0 ? "higher" : "lower"}. ${percent == null ? "A zero previous bill has no percentage baseline." : "Bill totals can change with usage, rates or fees."}`;

  return <div className="@container">
    <div className="relative pb-3 pt-24">
      <div className={`absolute top-0 w-36 -translate-x-1/2 rounded-lg px-3 py-2 text-center ${surface}`} style={{ left: `clamp(4.5rem, ${position}%, calc(100% - 4.5rem))` }}>
        <p className={`break-words text-base font-semibold tabular-nums ${tone}`}>{money(current)}</p>
        <p className={`mt-1 text-xs ${tone}`}>Current bill</p>
        <span aria-hidden="true" className={`absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rotate-45 ${surface}`} />
      </div>
      <ElectricityProgress position={position} baseline={valid ? baseline : null} fill={fill} valid={valid} animationKey={`${previous}:${current}`} label="Current bill compared with previous bill" description={valid ? `Current bill ${money(current)}, previous bill ${money(previous)}. Scale maximum ${money(maximum)}.` : "Enter both bill amounts to compare"} />
    </div>
    <p className="mt-1 text-xs text-slate-600">Dashed marker: previous bill. The bar is scaled to the larger bill.</p>
    <dl className="mt-5 grid gap-3 text-center @sm:grid-cols-3 @sm:divide-x @sm:divide-slate-200">
      <div className="flex min-w-0 flex-col px-2"><dt className="order-2 mt-1 text-xs text-slate-600">Previous bill</dt><dd className="order-1 break-words text-base font-semibold tabular-nums text-slate-950">{money(previous)}</dd></div>
      <div className="flex min-w-0 flex-col px-2"><dt className="order-2 mt-1 text-xs text-slate-600">Current bill</dt><dd className="order-1 break-words text-base font-semibold tabular-nums text-slate-950">{money(current)}</dd></div>
      <div className="flex min-w-0 flex-col px-2"><dt className="order-2 mt-1 text-xs text-slate-600">{difference > 0 ? "Increase" : difference < 0 ? "Decrease" : "Difference"}</dt><dd className={`order-1 break-words text-base tabular-nums ${tone}`}>{money(Math.abs(difference))}</dd></div>
    </dl>
    <div role="status" aria-live="polite" className={`mt-5 flex items-start gap-3 rounded-lg p-3 ${surface} ${tone}`}>
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white"><Icon size={18} aria-hidden="true" /></span>
      <div className="min-w-0"><p className="text-sm font-semibold">{status}</p><p className="mt-1 text-xs leading-5">{message}</p></div>
    </div>
  </div>;
}
