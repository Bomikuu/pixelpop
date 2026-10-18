import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../../ui/chart";
import { EmptyState, Panel } from "../Panel";
import ServiceTable from "./ServiceTable";
import { money } from "../../lib/format";

export function ServiceChart({ title, rows = [], fields, monetary = true, description, emptyTitle = "Not enough comparable data", emptyMessage = "Record actual bills or meter readings to build this chart. Unknown values are not shown as zero." }) {
  const config = Object.fromEntries(fields.map((field, index) => [field.key, { label: field.label, color: `var(--chart-${index + 1})` }]));
  const values = rows.map((row) => ({ ...row, ...Object.fromEntries(fields.map((f) => [f.key, row[f.key] == null ? null : Number(row[f.key])])) }));
  return <Panel title={title} description={description}>
    {values.some((r) => fields.some((f) => r[f.key] != null)) ? <><div className="mb-3 flex flex-wrap gap-3 text-xs">{fields.map((f) => <span key={f.key} className="flex items-center gap-2"><span aria-hidden="true" className="size-2 rounded-sm" style={{ background: config[f.key].color }} />{f.label}</span>)}</div><ChartContainer className="h-64 w-full" config={config}><BarChart accessibilityLayer data={values}><CartesianGrid vertical={false} /><XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={24} /><YAxis width={68} tickLine={false} axisLine={false} tickFormatter={(v) => monetary ? `₱${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}` : v} /><ChartTooltip content={<ChartTooltipContent formatter={(value, name) => <span>{config[name]?.label}: {monetary ? money(value) : Number(value).toLocaleString(undefined, { maximumFractionDigits: 3 })}</span>} />} />{fields.map((f) => <Bar key={f.key} dataKey={f.key} fill={config[f.key].color} radius={[3, 3, 0, 0]} isAnimationActive={false} />)}</BarChart></ChartContainer><details className="mt-3 text-sm"><summary className="cursor-pointer text-slate-700 hover:text-blue-700">View chart data</summary><ServiceTable rows={rows} rowKey="label" columns={[{ key: "label", label: "Period" }, ...fields.map((f) => ({ key: f.key, label: f.label, render: (r) => r[f.key] == null ? "Unknown" : monetary ? money(r[f.key]) : Number(r[f.key]).toLocaleString(undefined, { maximumFractionDigits: 3 }) }))]} /></details></> : <EmptyState title={emptyTitle} message={emptyMessage} />}
  </Panel>;
}
export default function SubscriptionCharts({ analytics }) {
  const rows = analytics?.rows || [];
  return <div className="grid gap-5 xl:grid-cols-2"><ServiceChart title="Actual bills vs. saved prediction" rows={rows} fields={[{ key: "actual", label: "Confirmed bill" }, { key: "predicted", label: "Prediction at confirmation" }]} description="Billing cycles, not payment dates. Predictions stay frozen when a bill is confirmed." /><ServiceChart title="Daily-normalized consumption" rows={rows} fields={[{ key: "daily", label: "Units per day" }]} monetary={false} description="Compare usage even when billing periods have different lengths." /></div>;
}
