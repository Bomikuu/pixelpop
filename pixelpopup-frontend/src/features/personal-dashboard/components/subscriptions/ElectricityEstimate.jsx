import { Calculator, Info, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Panel } from "../Panel";
import SummaryTiles from "../SummaryTiles";
import { money } from "../../lib/format";

export default function ElectricityEstimate({ mode, result, previousBill }) {
  const reading = mode === "readings";
  const comparison = result?.comparison;
  const delta = comparison == null ? null : Number(comparison.difference);
  const Icon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const comparisonValue = reading ? previousBill : comparison?.previous;
  const currentValue = reading ? result?.projected_bill : comparison?.current;
  return <Panel title={<span className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-full bg-blue-50 text-blue-700"><Calculator size={21} aria-hidden="true" /></span>{reading ? "Estimated bill" : "Bill totals"}</span>} description={reading ? "Based on your entered readings, daily average and flat rate." : "Compare two bill amounts without creating any records."}>
    {reading ? <SummaryTiles primaryColumns={2} items={[
      { label: "Usage cost so far", value: money(result?.current_energy_cost ?? 0), icon: "expenses", hint: result?.usage == null ? "Enter meter readings and a rate." : `For ${Number(result.usage).toLocaleString()} kWh · energy only` },
      { label: "Projected full-cycle bill", value: money(currentValue ?? 0), icon: "deadline", hint: result?.projected_usage == null ? "Enter dates and a cycle end." : `For ${Number(result.projected_usage).toLocaleString(undefined, { maximumFractionDigits: 3 })} kWh · fees included` },
      { label: "Estimated daily usage", value: `${Number(result?.daily_usage ?? 0).toLocaleString(undefined, { maximumFractionDigits: 3 })} kWh/day`, icon: "count", hint: result?.daily_usage == null ? "Enter meter readings to calculate usage." : "Average between your two readings." },
      { label: "Estimated daily usage cost", value: `${money(result?.daily_energy_cost ?? 0)}/day`, icon: "balance", hint: result?.daily_energy_cost == null ? "Enter readings and a rate to calculate cost." : "Energy only; excludes fixed fees and other charges." },
    ]} /> : <SummaryTiles primaryColumns={2} items={[
      { label: "Previous bill", value: money(comparison?.previous ?? 0), icon: "deadline", hint: comparison?.previous == null ? "Enter both bill amounts to compare." : "Your comparison baseline" },
      { label: "Current bill", value: money(currentValue ?? 0), icon: "expenses", hint: currentValue == null ? "Enter both bill amounts to compare." : "The amount you entered" },
    ]} />}
    {reading ? <>
      <p className="mt-2 text-xs leading-5 text-slate-600">{result?.elapsed_days == null ? "Calculated from the average between your two readings." : `Based on your ${result.elapsed_days}-day reading average.`} Daily cost uses your entered kWh rate and excludes fixed fees and other charges.</p>
      <dl className="mt-5 divide-y divide-slate-100 text-sm">{result?.lines?.map((line) => <div key={line.name} className="flex justify-between gap-4 py-3"><dt>{line.name}</dt><dd className="shrink-0 tabular-nums">{money(line.amount)}</dd></div>)}</dl>
      <div className="mt-3 flex items-center justify-between gap-3 rounded-md bg-slate-50 p-4"><span className="flex items-center gap-2 text-sm font-medium"><Info size={16} aria-hidden="true" />Estimated total</span><span className="text-lg font-semibold tabular-nums">{money(result?.projected_bill ?? 0)}</span></div>
      {result?.budget_variance != null && <p className={`mt-3 text-sm ${Number(result.budget_variance) > 0 ? "text-red-800" : "text-slate-700"}`}>{money(Math.abs(Number(result.budget_variance)))} {Number(result.budget_variance) > 0 ? "over" : "under"} your entered {money(result.budget)} cycle budget.</p>}
    </> : <div role="status" className="mt-5 space-y-3">
      <div className={`flex items-center justify-between gap-3 rounded-md p-4 ${delta == null || delta === 0 ? "bg-slate-50 text-slate-950" : delta > 0 ? "bg-red-50 text-red-900" : "bg-emerald-50 text-emerald-900"}`}><span className="flex items-center gap-2 text-sm"><Icon size={19} aria-hidden="true" />Bill difference</span><span className="text-lg tabular-nums">{delta == null ? "Enter both amounts" : `${delta > 0 ? "+" : delta < 0 ? "−" : ""}${money(Math.abs(delta))}`}</span></div>
      {comparison && <p className="text-sm text-slate-600">{comparison.percent == null ? "The previous bill is zero, so a percentage change cannot be calculated." : delta === 0 ? "Same amount as the previous bill (0.0% change)." : `${Math.abs(Number(comparison.percent)).toFixed(1)}% ${delta > 0 ? "higher" : "lower"} than the previous bill.`}</p>}
    </div>}
    {reading && comparisonValue !== "" && comparisonValue != null && currentValue != null && <p className="mt-4 text-sm text-slate-600">Previous bill reference: {money(comparisonValue)}. The chart below compares it with this estimate.</p>}
    <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-600"><Info size={15} className="mt-0.5 shrink-0" aria-hidden="true" />{reading ? "Estimate only. Unentered provider fees or tiered rates may change the actual bill. Fixed charges are included once." : "These amounts are scratch values. Use Confirm actual bill separately if you want to record a bill."}</p>
  </Panel>;
}
