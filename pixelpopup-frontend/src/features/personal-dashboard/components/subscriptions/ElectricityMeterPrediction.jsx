import { CircleCheck, Info, TriangleAlert } from "lucide-react";
import { dateLabel } from "../../lib/format";
import ElectricityProgress from "./ElectricityProgress";

const number = (value) => Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 3 });
const quantity = (value) => `${number(value)} kWh`;

export default function ElectricityMeterPrediction({ result, values = {} }) {
  const valid = result?.usage != null;
  const known = valid && result.over_expected != null;
  const warning = known && result.over_expected;
  const usage = Number(result?.usage ?? 0);
  const projected = Number(result?.projected_usage ?? 0);
  const denominator = Number(result?.denominator ?? 0);
  const expected = result?.denominator_kind === "expected";
  const remaining = denominator - usage;
  const exceeded = known && expected && remaining < 0;
  const percent = denominator > 0 ? usage / denominator * 100 : 0;
  const position = projected > 0 ? Math.max(0, Math.min(100, usage / projected * 100)) : 0;
  const previous = result?.previous_reading ?? values.previous_reading;
  const current = result?.current_reading ?? values.current_reading;
  const dates = result?.dates;
  const context = !valid ? "empty" : !known ? "prediction" : exceeded ? "exceeded" : warning ? "warning" : "onTrack";
  const { tone, surface, fill } = {
    empty: { tone: "text-slate-700", surface: "bg-slate-50", fill: "bg-slate-400" },
    prediction: { tone: "text-blue-700", surface: "bg-blue-50", fill: "bg-blue-500" },
    exceeded: { tone: "text-red-700", surface: "bg-red-50", fill: "bg-red-500" },
    warning: { tone: "text-amber-800", surface: "bg-amber-50", fill: "bg-amber-500" },
    onTrack: { tone: "text-emerald-700", surface: "bg-emerald-50", fill: "bg-emerald-500" },
  }[context];
  const StatusIcon = !known ? Info : warning ? TriangleAlert : CircleCheck;
  const status = !valid ? "Enter your readings" : !known ? "Usage target not set" : exceeded ? "Expected usage exceeded" : warning ? "Trending above expected usage" : "On track";
  const message = !valid ? "Complete the meter fields to see your usage and prediction."
    : !known ? "Enter Expected usage in the prediction inputs to check whether you are on track."
      : exceeded ? `You have used ${quantity(Math.abs(remaining))} more than your expected usage for this period.`
        : warning ? `At your current pace, you are projected to use ${quantity(projected)}, above your ${quantity(denominator)} target.`
          : "Your usage is on track. At your current pace, the full-cycle projection is within your expected range.";

  return <div className="@container">
    <div className="grid grid-cols-2 items-end gap-3 @xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)] @xl:gap-4">
      <div className="order-2 min-w-0 @xl:order-1">
        <p className="break-words text-sm font-medium tabular-nums text-slate-950">{quantity(previous)}</p>
        <p className="mt-1 text-xs text-slate-600">Previous reading</p>
        <p className="mt-1 text-xs text-slate-600">{dateLabel(dates?.start || values.previous_date)}</p>
      </div>
      <div className="relative order-1 col-span-2 min-w-0 pb-3 pt-24 @xl:order-2 @xl:col-span-1">
        <div className={`absolute top-0 w-36 -translate-x-1/2 rounded-lg px-3 py-2 text-center ${surface}`} style={{ left: `clamp(4.5rem, ${position}%, calc(100% - 4.5rem))` }}>
          <p className={`break-words text-base font-semibold tabular-nums ${tone}`}>{quantity(current)}</p>
          <p className={`mt-1 text-xs ${tone}`}>Current reading</p>
          <p className={`mt-1 text-xs ${tone}`}>{dateLabel(dates?.observed || values.reading_date)}</p>
          <span aria-hidden="true" className={`absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rotate-45 ${surface}`} />
        </div>
        <ElectricityProgress position={position} fill={fill} valid={valid} animationKey={`${usage}:${projected}`} label="Current usage compared with projected full-cycle usage" description={valid ? `${quantity(usage)} consumed, ${quantity(projected)} projected for the full cycle` : "Enter readings to calculate usage"} />
      </div>
      <div className="order-3 min-w-0 text-right">
        <p className="break-words text-sm font-medium tabular-nums text-slate-950">{quantity(valid ? Number(previous) + projected : 0)}</p>
        <p className="mt-1 text-xs text-slate-600">Projected reading</p>
        <p className="mt-1 text-xs text-slate-600">{dateLabel(dates?.end || values.period_end)}</p>
        <p className="mt-1 text-xs text-slate-500">Cycle end (exclusive)</p>
      </div>
    </div>

    <dl className="mt-5 grid gap-3 text-center @sm:grid-cols-3 @sm:divide-x @sm:divide-slate-200">
      <div className="flex min-w-0 flex-col px-2"><dt className="order-2 mt-1 text-xs text-slate-600">Current usage</dt><dd className="order-1 break-words text-base font-semibold tabular-nums text-slate-950">{quantity(usage)}</dd><dd className="order-3 mt-1 text-xs text-slate-600">{denominator > 0 ? `${number(percent)}% of ${expected ? "expected" : "projected"}` : "Enter readings to compare"}</dd></div>
      <div className="flex min-w-0 flex-col px-2"><dt className="order-2 mt-1 text-xs text-slate-600">{expected ? "Expected usage" : "Projected usage"}</dt><dd className="order-1 break-words text-base font-semibold tabular-nums text-slate-950">{quantity(denominator)}</dd><dd className="order-3 mt-1 text-xs text-slate-600">For this billing period</dd></div>
      <div className="flex min-w-0 flex-col px-2"><dt className="order-2 mt-1 text-xs text-slate-600">{remaining < 0 ? "Over expected usage" : "Remaining usage"}</dt><dd className={`order-1 break-words text-base font-semibold tabular-nums ${remaining < 0 ? "text-red-700" : "text-slate-950"}`}>{quantity(Math.abs(remaining))}</dd><dd className="order-3 mt-1 text-xs text-slate-600">{denominator > 0 ? `${number(Math.abs(remaining) / denominator * 100)}% ${remaining < 0 ? "over" : "remaining"}` : "Enter readings to compare"}</dd></div>
    </dl>

    <div role="status" aria-live="polite" className={`mt-5 flex items-start gap-3 rounded-lg p-3 ${surface} ${tone}`}>
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white"><StatusIcon size={18} aria-hidden="true" /></span>
      <div className="min-w-0"><p className="text-sm font-semibold">{status}</p><p className="mt-1 text-xs leading-5">{message}</p></div>
    </div>
  </div>;
}
