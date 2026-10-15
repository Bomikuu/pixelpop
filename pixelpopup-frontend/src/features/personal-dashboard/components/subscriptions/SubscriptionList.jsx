import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Download, LayoutGrid, Search, Table2, Plus, X } from "lucide-react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import SelectableField from "../SelectableField";
import { EmptyState, ErrorState, Panel } from "../Panel";
import { useRecords } from "../../hooks/useDashboardData";
import ServiceTable, { Pagination, StatusBadge } from "./ServiceTable";
import SubscriptionSummary from "./SubscriptionSummary";
import SubscriptionForm from "./forms/SubscriptionForm";
import LifecycleForm from "./forms/LifecycleForm";
import { downloadExport } from "../../subscriptions/api";
import { option, queryString, serviceTypes, titleCase, viewValue } from "../../subscriptions/model";
import { dateLabel, money } from "../../lib/format";

export default function SubscriptionList({ dashboard, month, notify }) {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const [search, setSearch] = useState(q);
  const [composing, setComposing] = useState(false);
  const [selection, setSelection] = useState([]);
  const [dialog, setDialog] = useState(null);
  const [view, setView] = useState(() => { try { return viewValue(localStorage.getItem("pd-service-view")); } catch { return "cards"; } });
  const page = Math.max(1, Number(params.get("page")) || 1);
  const change = (key, value) => setParams((prior) => { const next = new URLSearchParams(prior); value ? next.set(key, String(value)) : next.delete(key); if (key !== "page") next.delete("page"); return next; });
  useEffect(() => { setSearch(q); }, [q]);
  useEffect(() => { if (composing || search === q) return; const timer = setTimeout(() => change("q", search.trim()), 300); return () => clearTimeout(timer); }, [search, composing, q]);
  const filters = { page, q, status: params.get("status"), category: params.get("category"), service_type: params.get("service_type"), billing_type: params.get("billing_type"), archived: params.get("archived"), sort: params.get("sort") || "name" };
  const filterKey = queryString(filters);
  useEffect(() => { setSelection([]); }, [filterKey]);
  const records = useRecords(`subscriptions/?${filterKey}`, dashboard.request, dashboard.version);
  const summary = useRecords(`subscriptions/summary/?month=${month}`, dashboard.request, dashboard.version);
  const rows = records.data?.results || [];
  const detail = (r) => `/dashboard/bills/subscriptions/${r.id}?month=${month}`;
  const toggleView = () => { const next = view === "cards" ? "table" : "cards"; setView(next); try { localStorage.setItem("pd-service-view", next); } catch { /* Preference is optional. */ } };
  const selected = (row) => <input type="checkbox" aria-label={`Select ${row.title}`} className="size-4 accent-blue-600" checked={selection.includes(row.id)} onChange={(e) => setSelection((ids) => e.target.checked ? [...ids, row.id] : ids.filter((id) => id !== row.id))} />;
  return <div className="space-y-5">
    {summary.error && <ErrorState message={summary.error} retry={dashboard.refresh} />}
    <SubscriptionSummary data={summary.data} />
    <Panel title="Subscriptions & utilities" description="Recurring services, consumption and renewal planning. Open a service for its readings and billing history." action={<div className="flex flex-wrap gap-2"><Button variant="outline" onClick={toggleView}><span aria-hidden="true">{view === "cards" ? <Table2 size={16} /> : <LayoutGrid size={16} />}</span>{view === "cards" ? "Table view" : "Card view"}</Button><Button variant="outline" onClick={() => downloadExport(dashboard, `subscriptions/export/?kind=catalog&${filterKey}`).catch((e) => notify(e.message, { tone: "error" }))}><Download size={16} />Export</Button><Button onClick={() => setDialog({ kind: "add" })}><Plus size={16} />Add service</Button></div>}>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="relative sm:col-span-2"><Search aria-hidden="true" className="absolute left-3 top-2.5 size-4 text-slate-500" /><Input aria-label="Search subscriptions" placeholder="Search services, providers or notes…" value={search} className="pl-9 pr-10" onChange={(e) => setSearch(e.target.value)} onCompositionStart={() => setComposing(true)} onCompositionEnd={() => setComposing(false)} />{search && <Button size="icon" variant="ghost" className="absolute right-0 top-0" aria-label="Clear search" onClick={() => { setSearch(""); change("q", ""); }}><X size={15} /></Button>}</div>
        <SelectableField label="Status filter" value={filters.status || ""} onChange={(v) => change("status", v)} options={[option("", "All statuses"), ...["active", "paused", "cancelled", "expired"].map((v) => option(v, titleCase(v)))]} />
        <SelectableField label="Service type filter" value={filters.service_type || ""} onChange={(v) => change("service_type", v)} options={[option("", "All service types"), ...serviceTypes]} />
        <SelectableField label="Category filter" value={filters.category || ""} onChange={(v) => change("category", v)} options={[option("", "All categories"), ...dashboard.data.categories.map((c) => option(c.id, c.name))]} />
        <SelectableField label="Billing type filter" value={filters.billing_type || ""} onChange={(v) => change("billing_type", v)} options={[option("", "Fixed + variable"), option("fixed", "Fixed bills"), option("variable", "Variable bills")]} />
        <SelectableField label="Archive filter" value={filters.archived || ""} onChange={(v) => change("archived", v)} options={[option("", "Not archived"), option("1", "Archived"), option("all", "All records")]} />
        <SelectableField label="Sort services" value={filters.sort} onChange={(v) => change("sort", v)} options={[option("name", "Sort: Name"), option("amount", "Sort: Fixed amount"), option("due", "Sort: Next unpaid due")]} />
      </div>
      {selection.length > 0 && <div className="mb-4 flex flex-wrap items-center gap-2 rounded-md bg-blue-50 p-3 text-sm"><span>{selection.length} selected on this page</span>{["pause", "resume", "archive", "restore"].map((action) => <Button key={action} variant="outline" onClick={() => setDialog({ kind: "bulk", action })}>{titleCase(action)}</Button>)}<Button variant="ghost" onClick={() => setSelection([])}>Clear selection</Button></div>}
      {records.loading ? <p role="status" className="py-8 text-center text-sm text-slate-600">Loading services…</p> : records.error ? <ErrorState message={records.error} retry={dashboard.refresh} /> : !rows.length ? <EmptyState title="No matching services" message="Add a service or adjust your filters. Existing ordinary recurring bills are included automatically." /> : view === "table" ? <ServiceTable rows={rows} columns={[
        { key: "selection", label: <input type="checkbox" aria-label="Select all services on this page" checked={rows.length > 0 && selection.length === rows.length} ref={(node) => { if (node) node.indeterminate = selection.length > 0 && selection.length < rows.length; }} onChange={(e) => setSelection(e.target.checked ? rows.map((r) => r.id) : [])} />, render: selected },
        { key: "title", label: "Service", render: (r) => <Link className="text-blue-700 hover:underline" to={detail(r)}>{r.title}</Link> }, { key: "provider", label: "Provider" }, { key: "service_type", label: "Type", render: (r) => titleCase(r.service_type) }, { key: "amount", label: "Bill", render: (r) => r.variable_amount ? "Variable · confirm actual" : money(r.amount) }, { key: "due", label: "Next unpaid", render: (r) => r.next_unpaid ? dateLabel(r.next_unpaid.due_date) : "Nothing pending" }, { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
      ]} /> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{rows.map((r) => { const Icon = serviceTypes.find((t) => t.value === r.service_type)?.icon || serviceTypes[0].icon; return <article key={r.id} className="min-w-0 rounded-lg border border-[var(--pd-border)] bg-white p-4 transition-colors hover:border-blue-300"><div className="flex items-start justify-between gap-2"><div className="flex min-w-0 gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700"><Icon size={19} aria-hidden="true" /></span><div className="min-w-0"><Link to={detail(r)} className="block break-words font-semibold text-slate-950 hover:text-blue-700">{r.title}</Link><p className="text-xs text-slate-600">{r.provider || titleCase(r.service_type)}</p></div></div>{selected(r)}</div><div className="mt-4 flex flex-wrap justify-between gap-2"><span className="text-lg tabular-nums">{r.variable_amount ? "Variable bill" : money(r.amount)}</span><StatusBadge status={r.status} /></div><p className="mt-2 text-xs text-slate-600">Every {r.interval} {r.frequency} · {r.next_unpaid ? `Next unpaid: ${dateLabel(r.next_unpaid.due_date)}` : "Nothing pending"}</p>{r.current_cycle?.prediction?.projected_amount != null && r.variable_amount && <p className="mt-2 text-xs text-slate-600">Estimated cycle bill: {money(r.current_cycle.prediction.projected_amount)}</p>}<Link to={detail(r)} className="mt-4 inline-flex py-2 text-sm text-blue-700 hover:underline">View service & history →</Link></article>; })}</div>}
      {records.data && <Pagination page={page} data={records.data} busy={records.loading} setPage={(v) => change("page", v)} />}
    </Panel>
    {dialog?.kind === "add" && <SubscriptionForm dashboard={dashboard} notify={notify} onSaved={() => setDialog(null)} onCancel={() => setDialog(null)} />}
    {dialog?.kind === "bulk" && <LifecycleForm ids={selection} action={dialog.action} dashboard={dashboard} notify={notify} onSaved={() => { setDialog(null); setSelection([]); }} onCancel={() => setDialog(null)} />}
  </div>;
}
