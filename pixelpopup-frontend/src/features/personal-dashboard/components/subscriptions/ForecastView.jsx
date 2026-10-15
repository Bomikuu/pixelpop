import { useSearchParams } from "react-router-dom";
import { Download, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import SelectableField from "../SelectableField";
import SummaryTiles from "../SummaryTiles";
import { ErrorState, Panel } from "../Panel";
import { useRecords } from "../../hooks/useDashboardData";
import { downloadExport } from "../../subscriptions/api";
import { option, queryString, titleCase } from "../../subscriptions/model";
import ServiceTable from "./ServiceTable";
import { ServiceChart } from "./SubscriptionCharts";
import { money, dateLabel } from "../../lib/format";

export default function ForecastView({ dashboard, month, notify }) {
  const [params, setParams] = useSearchParams();
  const change = (key, value) => setParams((old) => { const next = new URLSearchParams(old); next.set(key, value); return next; });
  const scenario = params.get("scenario") || "normal";
  const query = queryString({ month, horizon: params.get("horizon") || "3", scenario, ...(scenario === "custom" ? { multiplier: params.get("multiplier") || "1" } : {}) });
  const records = useRecords(`subscriptions/forecasts/?${query}`, dashboard.request, dashboard.version);
  const data = records.data;
  return <div className="space-y-5">
    <div className="grid items-end gap-3 sm:grid-cols-3 xl:grid-cols-4"><div><Label className="mb-2 block">Forecast horizon</Label><SelectableField label="Forecast horizon" value={params.get("horizon") || "3"} onChange={(v) => change("horizon", v)} options={[option("1", "Selected month"), option("3", "3 months"), option("12", "12 months")]} /></div><div><Label className="mb-2 block">Usage scenario</Label><SelectableField label="Usage scenario" value={scenario} onChange={(v) => change("scenario", v)} options={[option("normal", "Normal usage"), option("high", "High · +20% usage"), option("low", "Low · −20% usage"), option("custom", "Custom usage multiplier")]} /></div>{scenario === "custom" && <div><Label htmlFor="forecast-multiplier" className="mb-2 block">Usage multiplier</Label><Input id="forecast-multiplier" type="number" min="0" max="99" step="0.01" value={params.get("multiplier") || "1"} onChange={(e) => change("multiplier", e.target.value)} /></div>}<Button variant="outline" onClick={() => downloadExport(dashboard, `subscriptions/export/?kind=forecasts&${query}`).catch((e) => notify(e.message, { tone: "error" }))}><Download size={16} />Export forecast</Button></div>
    {records.loading ? <p role="status" className="text-sm text-slate-600">Calculating forecast…</p> : records.error ? <ErrorState message={records.error} retry={dashboard.refresh} /> : data && <>
      <SummaryTiles items={[{ label: "Remaining service obligations", value: money(data.total), icon: "deadline", hint: "Confirmed amounts + estimates in this forecast." }, { label: "Current available cash", value: money(data.cash_available), icon: "balance", hint: "Cash, bank and e-wallet accounts; no credit capacity or funds." }, { label: "After these subscriptions only", value: money(data.projected_after_subscriptions), icon: "budget", statusTone: Number(data.projected_after_subscriptions) < 0 ? "negative" : "neutral", hint: "Not a complete available-to-spend budget; other expenses are not subtracted." }, { label: "Unpriced obligations", value: data.unknown, icon: "count", hint: "Unknown costs are excluded, not assumed free." }]} />
      <p className="flex gap-2 text-sm leading-6 text-slate-600"><Info size={17} className="mt-1 shrink-0" />{data.note} Scenarios change variable usage only. Historical billed-cost fallbacks stay unscaled when the fee / usage split is unknown.</p>
      <Panel title="Forecast obligations" description="Real renewal dates; each existing deadline is counted once."><ServiceTable rows={data.rows} rowKey="due_date" columns={[{ key: "name", label: "Service", render: (r) => <Link className="text-blue-700 hover:underline" to={`/dashboard/bills/subscriptions/${r.subscription_id}?month=${month}`}>{r.name}</Link> }, { key: "due_date", label: "Due", render: (r) => dateLabel(r.due_date) }, { key: "remaining", label: "Remaining", render: (r) => r.remaining == null ? "Unknown" : money(r.remaining) }, { key: "model", label: "Basis", render: (r) => r.confirmed ? "Confirmed actual bill" : `Estimate · ${titleCase(r.model)}` }]} /></Panel>
      <ServiceChart title="Upcoming bills by month" rows={data.months.map((r) => ({ ...r, label: r.month }))} fields={[{ key: "confirmed", label: "Confirmed remaining" }, { key: "estimated", label: "Estimated remaining" }]} description="Unknown costs are listed above but cannot be charted as monetary values." />
    </>}
  </div>;
}
