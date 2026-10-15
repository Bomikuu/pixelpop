import { Info, TriangleAlert } from "lucide-react";
import SummaryTiles from "../SummaryTiles";
import { Panel } from "../Panel";
import ServiceTable from "./ServiceTable";
import { money } from "../../lib/format";

export default function UtilityOverview({ cycle, service }) {
  const prediction = cycle?.prediction;
  if (!prediction) return null;
  const consumption = prediction.consumption;
  const budget = prediction.budget || {};
  const unit = consumption.unit || service.meters?.[0]?.unit || "units";
  const limit = budget.usage_limit ?? service.expected_usage;
  const progress = limit != null && Number(limit) > 0 && consumption.usage != null ? Number(consumption.usage) / Number(limit) * 100 : null;
  const over = progress > 100;
  return <div className="space-y-5"><SummaryTiles items={[
    { label: "Measured / interpolated usage", value: consumption.usage == null ? "Baseline needed" : `${Number(consumption.usage).toLocaleString(undefined, { maximumFractionDigits: 3 })} ${unit}`, icon: "count", hint: `${consumption.coverage} coverage${prediction.as_of ? ` · as of ${new Date(prediction.as_of).toLocaleDateString("en-PH", { timeZone: "Asia/Manila" })}` : ""}` },
    { label: "Projected cycle bill", value: prediction.projected_amount == null ? "Not enough data" : money(prediction.projected_amount), icon: "deadline", hint: `${prediction.model.replaceAll("_", " ")}${prediction.limited ? " · limited coverage" : ""}. Estimate only.` },
    { label: "Actual confirmed bill", value: cycle.actual_amount == null ? "Awaiting bill" : money(cycle.actual_amount), icon: "expenses" },
    { label: "Remaining to pay", value: cycle.remaining == null ? "Confirm bill first" : money(cycle.remaining), icon: "balance" },
  ]} />
    <Panel title="Consumption & budget" description={cycle.period_start ? `${cycle.period_start} – ${cycle.period_end} (exclusive)` : "Set your actual billing period and rate before estimating."}>
      {progress != null ? <div><div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm"><span>{over ? "Over" : "Within"} {budget.usage_limit != null ? "tariff-based budget allowance" : "expected usage"}</span><span className={over ? "text-red-800" : "text-slate-700"}>{progress.toFixed(1)}% · {Number(consumption.usage).toFixed(2)} / {Number(limit).toFixed(2)} {unit}</span></div><div role="progressbar" aria-label="Cycle consumption allowance used" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.max(0, Math.min(100, progress))} aria-valuetext={`${progress.toFixed(1)} percent used`} className="h-2 overflow-hidden rounded bg-slate-100"><div style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} className={`h-full rounded motion-safe:transition-[width] motion-safe:duration-500 ${over ? "bg-red-500" : "bg-emerald-500"}`} /></div></div> : <p className="flex gap-2 text-sm text-slate-600"><Info size={16} className="shrink-0" />A positive budget / expected usage and comparable readings are needed for a meaningful progress bar.</p>}
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3"><div><dt className="text-slate-600">Monthly budget</dt><dd>{budget.budget == null ? "Not configured" : money(budget.budget)}</dd></div><div><dt className="text-slate-600">Projected over / under budget</dt><dd className={Number(budget.variance) > 0 ? "text-red-800" : "text-slate-950"}>{budget.variance == null ? "Unknown" : `${money(Math.abs(Number(budget.variance)))} ${Number(budget.variance) > 0 ? "over" : "under"}`}</dd></div><div><dt className="text-slate-600">Remaining daily allowance</dt><dd>{budget.daily_allowance == null ? "Unknown" : `${Number(budget.daily_allowance).toFixed(3)} ${unit} / day`}</dd></div></dl>
      {budget.reason && <p className="mt-3 text-xs text-slate-600">{String(budget.reason).replaceAll("_", " ")}</p>}
      {prediction.anomaly?.warning && <p role="status" className="mt-3 flex gap-2 rounded-md bg-red-50 p-3 text-sm text-red-800"><TriangleAlert className="size-4 shrink-0" />Daily usage is {Number(prediction.anomaly.change_percent).toFixed(1)}% above its recorded baseline. Check recent consumption.</p>}
      {prediction.warnings?.map((warning) => <p key={warning} className="mt-3 flex gap-2 text-sm text-slate-600"><Info size={16} className="shrink-0" />{warning}</p>)}
    </Panel>
    {prediction.tariff_lines?.length > 0 && <Panel title="Projected bill breakdown" description="Estimated full-cycle charges. Actual provider bills may include fees not configured here."><ServiceTable rows={prediction.tariff_lines} rowKey="name" columns={[{ key: "name", label: "Charge", render: (r) => r.name || r.label || "Usage" }, { key: "amount", label: "Estimated amount", render: (r) => money(r.amount) }]} /></Panel>}
  </div>;
}
