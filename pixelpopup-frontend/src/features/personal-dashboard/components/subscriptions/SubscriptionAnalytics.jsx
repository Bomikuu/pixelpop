import { useSearchParams } from "react-router-dom";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import SelectableField from "../SelectableField";
import { Panel, ErrorState } from "../Panel";
import { useRecords } from "../../hooks/useDashboardData";
import { servicePath } from "../../subscriptions/api";
import { option, queryString } from "../../subscriptions/model";
import { money } from "../../lib/format";
import ServiceTable from "./ServiceTable";
import SubscriptionCharts from "./SubscriptionCharts";

export default function SubscriptionAnalytics({ service, dashboard, month }) {
  const [params, setParams] = useSearchParams();
  const range = params.get("range") || "12";
  const anchor = new Date(`${month}-01T00:00:00Z`);
  const end = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
  const months = ["3", "6", "12"].includes(range) ? Number(range) : 12;
  const start = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() - months + 1, 1)).toISOString().slice(0, 10);
  const query = queryString({ start: range === "custom" ? params.get("start") || start : start, end: range === "custom" ? params.get("end") || end : end });
  const records = useRecords(servicePath(service.id, `analytics/?${query}`), dashboard.request, dashboard.version);
  const change = (key, value) => setParams((old) => { const next = new URLSearchParams(old); value ? next.set(key, value) : next.delete(key); return next; });
  return <div className="space-y-5"><div className="flex flex-wrap items-end justify-end gap-3"><div className="w-48"><Label className="mb-2 block">Comparison range</Label><SelectableField label="Comparison range" value={range} onChange={(v) => change("range", v)} options={[option("3", "Last 3 months"), option("6", "Last 6 months"), option("12", "Last 12 months"), option("custom", "Custom dates")]} /></div>{range === "custom" && <><div><Label htmlFor="service-analytics-start" className="mb-2 block">From</Label><Input id="service-analytics-start" type="date" value={params.get("start") || start} onChange={(e) => change("start", e.target.value)} /></div><div><Label htmlFor="service-analytics-end" className="mb-2 block">Through</Label><Input id="service-analytics-end" type="date" value={params.get("end") || end} onChange={(e) => change("end", e.target.value)} /></div></>}</div>
    {records.loading ? <p role="status">Loading comparisons…</p> : records.error ? <ErrorState message={records.error} retry={dashboard.refresh} /> : records.data && <>
      <Panel title="Cycle comparisons" description={`Lifetime actual payments: ${money(records.data.lifetime_paid)}. ${records.data.attribution}`}><ServiceTable rows={records.data.rows} columns={[{ key: "label", label: "Bill due" }, { key: "actual", label: "Actual bill", render: (r) => r.actual == null ? "Unconfirmed" : money(r.actual) }, { key: "usage", label: "Cycle usage", render: (r) => r.usage == null ? "Incomplete coverage" : Number(r.usage).toFixed(3) }, { key: "daily", label: "Observed units / day", render: (r) => r.daily == null ? "Unknown" : Number(r.daily).toFixed(3) }, { key: "daily_change_percent", label: "Vs. previous cycle", render: (r) => r.daily_change_percent == null ? "No baseline" : `${Number(r.daily_change_percent).toFixed(1)}%` }, { key: "daily_year_change_percent", label: "Vs. previous year", render: (r) => r.daily_year_change_percent == null ? "No baseline" : `${Number(r.daily_year_change_percent).toFixed(1)}%` }, { key: "error_percent", label: "Prediction error", render: (r) => r.error_percent == null ? "No saved prediction" : `${Number(r.error_percent).toFixed(1)}%` }]} /></Panel>
      <SubscriptionCharts analytics={records.data} />
    </>}
  </div>;
}
