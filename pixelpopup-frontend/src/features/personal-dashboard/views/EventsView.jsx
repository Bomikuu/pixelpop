import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Activity, Archive, CheckCheck, ChevronDown, ChevronLeft, ChevronRight, CreditCard,
  FileClock, FileJson2, Lightbulb, Link2, LockKeyhole, Pencil, Plus, Send, Trash2,
} from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../ui/chart";
import { Button } from "../ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import { EmptyState, ErrorState, Panel } from "../components/Panel";
import { useRecords } from "../hooks/useDashboardData";

const actionConfig = {
  added: { label: "Added", icon: Plus, color: "#0f766e", tone: "bg-emerald-50 text-emerald-700" },
  edited: { label: "Edited", icon: Pencil, color: "#2f5bff", tone: "bg-blue-50 text-blue-700" },
  deleted: { label: "Deleted", icon: Trash2, color: "#b91c1c", tone: "bg-red-50 text-red-700" },
  other: { label: "Other actions", icon: Activity, color: "#b45309", tone: "bg-amber-50 text-amber-700" },
};

const eventConfig = {
  ...actionConfig,
  adjusted: { icon: CreditCard, tone: "bg-blue-50 text-blue-700" },
  settled: { icon: CheckCheck, tone: "bg-emerald-50 text-emerald-700" },
  paid: { icon: CreditCard, tone: "bg-emerald-50 text-emerald-700" },
  reported: { icon: Send, tone: "bg-amber-50 text-amber-700" },
  closed: { icon: CheckCheck, tone: "bg-emerald-50 text-emerald-700" },
  shared: { icon: Link2, tone: "bg-blue-50 text-blue-700" },
  revoked: { icon: LockKeyhole, tone: "bg-amber-50 text-amber-700" },
  archived: { icon: Archive, tone: "bg-slate-100 text-slate-700" },
  restored: { icon: Plus, tone: "bg-emerald-50 text-emerald-700" },
  reviewed: { icon: CheckCheck, tone: "bg-blue-50 text-blue-700" },
  rotated: { icon: LockKeyhole, tone: "bg-amber-50 text-amber-700" },
  allocated: { icon: Activity, tone: "bg-blue-50 text-blue-700" },
  imported: { icon: FileJson2, tone: "bg-blue-50 text-blue-700" },
  carried: { icon: Lightbulb, tone: "bg-blue-50 text-blue-700" },
};

const actions = [
  ["all", "All actions"], ["added", "Added"], ["edited", "Edited"],
  ["deleted", "Deleted"], ["adjusted", "Adjusted"], ["settled", "Settled"],
  ["paid", "Paid"], ["reported", "Payment reported"], ["closed", "Closed"], ["shared", "Shared"],
  ["revoked", "Revoked"], ["archived", "Archived"], ["restored", "Restored"],
  ["reviewed", "Reviewed"], ["rotated", "PIN rotated"], ["allocated", "Allocation accepted"],
  ["imported", "Imported"], ["carried", "Carried to task"],
];

const areas = [
  ["all", "All areas"], ["accounts", "Accounts & cards"], ["assets", "Assets"],
  ["bills", "Bills & tasks"], ["transactions", "Transactions"],
  ["people", "People & money"], ["nutrition", "Nutrition"], ["brainstorm", "Brainstorming"], ["settings", "Settings"],
];

const chartConfig = Object.fromEntries(
  Object.entries(actionConfig).map(([key, value]) => [key, { label: value.label, color: value.color }]),
);

function displayValue(value) {
  if (value === null || value === undefined || value === "") return "None";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.length ? value.join(" · ") : "None";
  return String(value);
}

function eventTime(value) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila",
  }).format(new Date(value));
}

function ActionIcon({ action }) {
  const config = eventConfig[action] || actionConfig.other;
  const Icon = config.icon;
  return (
    <span className={`grid size-9 shrink-0 place-items-center rounded-full ${config.tone}`}>
      <Icon size={17} aria-hidden="true" />
    </span>
  );
}

function EventRow({ row }) {
  return (
    <li className="border-b border-[var(--pd-border)] last:border-b-0">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-4 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--pd-primary)] motion-reduce:transition-none [&::-webkit-details-marker]:hidden">
          <ActionIcon action={row.action} />
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
              <strong className="font-semibold text-slate-950">{row.label}</strong>
              <span className="text-slate-600">{actions.find(([value]) => value === row.action)?.[1] || row.action}</span>
            </span>
            <span className="mt-1 block text-xs text-slate-600">
              {row.area_label} · {row.actor_label} · <time dateTime={row.created_at}>{eventTime(row.created_at)}</time>
            </span>
          </span>
          <ChevronDown size={17} className="shrink-0 text-slate-500 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
        </summary>
        <div className="border-t bg-slate-50/70 px-4 py-3 pl-16 text-sm">
          {row.changes.length ? (
            <dl className="grid gap-x-4 gap-y-3 sm:grid-cols-[minmax(7rem,12rem)_minmax(0,1fr)]">
              {row.changes.map((change) => (
                <div key={change.field} className="contents">
                  <dt className="font-medium text-slate-700">{change.field}</dt>
                  <dd className="min-w-0 break-words text-slate-900">
                    {row.action === "added" && change.old == null ? displayValue(change.new) : row.action === "deleted" && change.new == null ? displayValue(change.old) : (
                      <><span className="text-slate-600">{displayValue(change.old)}</span><span className="mx-2 text-slate-400" aria-hidden="true">→</span><span>{displayValue(change.new)}</span></>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-slate-600">This action is recorded without exposing private credentials.</p>
          )}
        </div>
      </details>
    </li>
  );
}

function ActionChart({ rows }) {
  return (
    <Panel title="Changes over time" description="Actions recorded each day in the selected month.">
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600">
        {Object.entries(actionConfig).map(([key, item]) => (
          <span key={key} className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />{item.label}</span>
        ))}
      </div>
      <ChartContainer config={chartConfig} className="h-56 w-full">
        <BarChart accessibilityLayer data={rows} margin={{ left: -20, right: 4 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={25} tickFormatter={(value) => String(Number(value.slice(-2)))} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
          <ChartTooltip content={<ChartTooltipContent labelFormatter={(value) => value} />} />
          {Object.entries(actionConfig).map(([key, item]) => (
            <Bar key={key} dataKey={key} stackId="events" fill={item.color} maxBarSize={22} />
          ))}
        </BarChart>
      </ChartContainer>
      <details className="mt-4 text-xs text-slate-600">
        <summary className="cursor-pointer font-medium hover:text-slate-950">View daily counts</summary>
        <div className="mt-2 max-h-48 overflow-auto">
          <table className="w-full text-left tabular-nums">
            <thead><tr><th scope="col" className="p-2">Date</th>{Object.keys(actionConfig).map((key) => <th scope="col" key={key} className="p-2">{actionConfig[key].label}</th>)}</tr></thead>
            <tbody>{rows.map((row) => <tr key={row.date} className="border-t"><th scope="row" className="p-2 font-normal">{row.date}</th>{Object.keys(actionConfig).map((key) => <td key={key} className="p-2">{row[key]}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </details>
    </Panel>
  );
}

function AreaChart({ rows }) {
  return (
    <Panel title="Activity by area" description="Where recorded changes happened, not a measure of money or calories.">
      <ChartContainer config={{ count: { label: "Changes", color: "var(--pd-primary)" } }} className="h-56 w-full">
        <BarChart accessibilityLayer data={rows} layout="vertical" margin={{ left: 8, right: 20 }}>
          <CartesianGrid horizontal={false} strokeDasharray="3 3" />
          <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="label" width={105} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="count" fill="var(--pd-primary)" maxBarSize={20} radius={[0, 3, 3, 0]} />
        </BarChart>
      </ChartContainer>
      <p className="mt-3 text-xs text-slate-600">{rows.map((row) => `${row.label}: ${row.count}`).join(" · ")}</p>
    </Panel>
  );
}

export default function EventsView({ dashboard, month }) {
  const [action, setAction] = useState("all");
  const [area, setArea] = useState("all");
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [month]);
  const query = new URLSearchParams({ month, page: String(page) });
  if (action !== "all") query.set("action", action);
  if (area !== "all") query.set("area", area);
  const records = useRecords(`events/?${query}`, dashboard.request, dashboard.version);
  const data = records.data;

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm text-slate-700">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-[var(--pd-primary)]"><FileClock size={17} aria-hidden="true" /></span>
        <p className="leading-6">Events are recorded from this feature onward. Earlier changes cannot be reconstructed; this log does not include page visits or failed actions.</p>
      </div>

      {records.loading ? (
        <div role="status" aria-label="Loading events" className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-4">{[0, 1, 2, 3].map((n) => <div key={n} className="h-20 animate-pulse rounded-lg border bg-white motion-reduce:animate-none" />)}</div>
          <div className="h-64 animate-pulse rounded-lg border bg-white motion-reduce:animate-none" />
        </div>
      ) : records.error ? (
        <ErrorState message={records.error} retry={dashboard.refresh} />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Event summary">
            {[
              ["All changes", data.summary.total, FileClock, "text-slate-800 bg-slate-100"],
              ["Added", data.summary.added, Plus, "text-emerald-700 bg-emerald-50"],
              ["Edited", data.summary.edited, Pencil, "text-blue-700 bg-blue-50"],
              ["Deleted", data.summary.deleted, Trash2, "text-red-700 bg-red-50"],
            ].map(([label, value, Icon, tone]) => (
              <div key={label} className="flex items-center justify-between gap-3 rounded-lg border bg-white px-4 py-3 transition-colors hover:border-blue-200 hover:bg-blue-50/30 motion-reduce:transition-none">
                <div><p className="text-xs text-slate-600">{label}</p><p className="mt-1 text-2xl font-semibold tabular-nums text-slate-950">{value}</p></div>
                {value > 0 && <span className={`grid size-9 place-items-center rounded-full ${tone}`}><Icon size={17} aria-hidden="true" /></span>}
              </div>
            ))}
          </div>

          {data.summary.total > 0 && (
            <div className="grid gap-5 xl:grid-cols-2">
              <ActionChart rows={data.charts.timeline} />
              <AreaChart rows={data.charts.areas} />
            </div>
          )}

          <Panel
            title="Event history"
            description="Newest first. Entries cannot be edited or deleted here."
            action={<div className="flex flex-wrap gap-2">
              <Select value={action} onValueChange={(value) => { setAction(value); setPage(1); }}>
                <SelectTrigger className="w-36" aria-label="Filter by action"><SelectValue /></SelectTrigger>
                <SelectContent>{actions.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={area} onValueChange={(value) => { setArea(value); setPage(1); }}>
                <SelectTrigger className="w-44" aria-label="Filter by area"><SelectValue /></SelectTrigger>
                <SelectContent>{areas.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
              </Select>
            </div>}
          >
            {data.results.length ? (
              <ul className="-mx-6 -my-2">{data.results.map((row) => <EventRow key={row.id} row={row} />)}</ul>
            ) : (
              <EmptyState icon={FileClock} title={data.summary.total ? "No events on this page" : "No events to show"} message="New changes will appear here after they are saved. Try another month or filter to see other activity." />
            )}
            {(data.previous || data.next) && (
              <div className="mt-4 flex items-center justify-between border-t pt-4 text-sm text-slate-600">
                <span>Page {page} · {data.count} matching events</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={!data.previous} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft aria-hidden="true" /> Previous</Button>
                  <Button variant="outline" size="sm" disabled={!data.next} onClick={() => setPage((value) => value + 1)}>Next <ChevronRight aria-hidden="true" /></Button>
                </div>
              </div>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}
