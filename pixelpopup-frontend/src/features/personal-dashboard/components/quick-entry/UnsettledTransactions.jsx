import { useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowDownLeft, ArrowUpRight, Check, ChevronLeft, ChevronRight, Info, RefreshCw, Wallet } from "lucide-react";
import { useRecords } from "../../hooks/useDashboardData";
import { Button } from "../../ui/button";
import { Panel, EmptyState, ErrorState } from "../Panel";
import { dateLabel } from "../../lib/format";
import { projectBalances, formatMinorUnits, toMinorUnits } from "../../quick-entry/money";
import { AccountSelect } from "./QuickEntrySelect";
import BalancePreview from "./BalancePreview";
import { Tabs, TabsList, TabsTrigger } from "../../ui/tabs";

export default function UnsettledTransactions({ dashboard, notify }) {
  const [params, setParams] = useSearchParams();
  const filter = ["all", "unsettled", "settled"].includes(params.get("view")) ? params.get("view") : "all";
  const [page, setPage] = useState(1), [chosen, setChosen] = useState({}), [selected, setSelected] = useState([]);
  const [status, setStatus] = useState("idle"), [error, setError] = useState(""), [rowErrors, setRowErrors] = useState({});
  const frozen = useRef(null), saving = useRef(false);
  const data = useRecords(`transactions/quick-entry-records/?settlement=${filter}&page=${page}&page_size=20`, dashboard.request, dashboard.version);
  const rows = data.data?.results || [], summary = data.data?.summary;
  const currentPage = Math.max(1, Math.min(page, Math.ceil((data.data?.count || 0) / 20)));
  const locked = status !== "idle";
  const pendingRows = rows.filter((row) => row.account == null);
  const drafts = rows.filter((row) => chosen[row.id] != null && selected.includes(row.id)).map((row) => ({ ...row, accountId: chosen[row.id], errors: [] }));
  const projection = projectBalances(drafts, dashboard.data.accounts);
  const selectedRows = rows.filter((row) => selected.includes(row.id));
  function choose(id, value) { setChosen((prev) => ({ ...prev, [id]: value })); setError(""); setRowErrors({}); }
  function changePage(next) { setPage(next); setSelected([]); setChosen({}); setError(""); setRowErrors({}); }
  function changeFilter(next) {
    if (locked) return;
    changePage(1);
    setParams((previous) => { const value = new URLSearchParams(previous); value.set("view", next); return value; });
  }
  async function settle(ids) {
    if (saving.current) return;
    const body = frozen.current || { assignments: ids.map((id) => ({ id, account: chosen[id] })) };
    if (!body.assignments.length || body.assignments.some((row) => row.account == null)) { setError("Choose an account for each selected entry."); return; }
    const affected = rows.filter((row) => ids.includes(row.id)).map((row) => ({ ...row, errors: [], accountId: chosen[row.id] }));
    if (!frozen.current && projectBalances(affected, dashboard.data.accounts).accounts.some((account) => account.insufficient)) { setError("The selected entries exceed an account balance or credit limit."); return; }
    frozen.current = body; saving.current = true; setStatus("saving"); setError("");
    try {
      await dashboard.request("transactions/settle/", { method: "POST", body });
      frozen.current = null; setStatus("idle"); setSelected([]); setChosen({}); setRowErrors({});
      dashboard.refresh();
      notify(`${body.assignments.length} ${body.assignments.length === 1 ? "transaction assigned" : "transactions assigned"}. Reporting totals are unchanged.`, { entity: "expense", action: "edited" });
    } catch (failure) {
      if (failure.status && failure.status < 500 && ![408, 429].includes(failure.status)) {
        frozen.current = null; setStatus("idle"); setError(failure.message); setRowErrors(failure.fields?.assignments || {});
      } else { setStatus("uncertain"); setError("Assignment may have completed. Retry the same selection to confirm; no transactions will be duplicated."); }
    } finally { saving.current = false; }
  }
  return <div className="space-y-4">
    <Tabs value={filter} onValueChange={changeFilter}><TabsList aria-label="Quick Entry settlement status"><TabsTrigger value="all" disabled={locked}>All</TabsTrigger><TabsTrigger value="unsettled" disabled={locked}><Wallet className="size-4" aria-hidden="true" />Unsettled</TabsTrigger><TabsTrigger value="settled" disabled={locked}><Check className="size-4" aria-hidden="true" />Settled</TabsTrigger></TabsList></Tabs>
    <Panel title="Quick Entry transactions" description="Already saved and counted in reporting. Assign unsettled entries here; totals won't be counted twice.">
    {data.loading ? <p className="py-8 text-sm text-slate-600" role="status">Loading Quick Entry transactions…</p> : data.error ? <ErrorState message={data.error} retry={dashboard.refresh} /> : <div className="space-y-5">
      {summary && <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[["Transactions", summary.count, ""], ["Expenses", formatMinorUnits(toMinorUnits(summary.expenses)), toMinorUnits(summary.expenses) ? "text-red-700" : ""], ["Income", formatMinorUnits(toMinorUnits(summary.income)), toMinorUnits(summary.income) ? "text-emerald-700" : ""], ["Need an account", summary.unsettled_count, ""]].map(([label, value, tone]) => <div key={label}><dt className="text-xs text-slate-600">{label}</dt><dd className={`mt-1 text-lg tabular-nums ${tone}`}>{value}</dd></div>)}</dl>}
      {error && <div role="alert" className="flex gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"><Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><span>{error}</span></div>}
      {!rows.length ? <EmptyState icon={Wallet} title={filter === "unsettled" ? "All accounts assigned" : "No Quick Entry transactions"} message={filter === "settled" ? "Assigned Quick Entry transactions appear here after saving or settling." : "Save transactions in Quick Entry, then review their accounts here."} /> : <>
        {(pendingRows.length > 0 || locked) && <div className="flex flex-wrap items-center gap-3 border-y border-[var(--pd-border)] py-3">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-[var(--pd-primary)]" disabled={locked} checked={pendingRows.length > 0 && pendingRows.every((r) => selected.includes(r.id))} onChange={(event) => setSelected(event.target.checked ? pendingRows.map((r) => r.id) : [])} />Select unsettled on this page</label>
          <span className="text-xs text-slate-600">{selectedRows.length} selected</span>
          {selectedRows.length > 0 && <div className="min-w-0 flex-1 sm:max-w-sm"><AccountSelect accounts={dashboard.data.accounts} kind={selectedRows.some((r) => r.kind === "income") ? "income" : "expense"} label="Apply account to selected entries" value={null} disabled={locked} onChange={(value) => setChosen((prev) => ({ ...prev, ...Object.fromEntries(selectedRows.map((r) => [r.id, value])) }))} /></div>}
          <Button className="sm:ml-auto" disabled={status === "saving" || (status !== "uncertain" && (!selectedRows.length || selectedRows.some((r) => chosen[r.id] == null) || projection.accounts.some((a) => a.insufficient)))} onClick={() => settle(selected)}>{status === "uncertain" ? <RefreshCw className="size-4" aria-hidden="true" /> : <Check className="size-4" aria-hidden="true" />}{status === "saving" ? "Assigning…" : status === "uncertain" ? "Retry assignment" : "Assign selected"}</Button>
        </div>}
        <ul className="divide-y divide-[var(--pd-border)]">{rows.map((row) => { const Icon = row.kind === "income" ? ArrowDownLeft : ArrowUpRight; return <li key={row.id} className="py-3">
          <div className="grid items-center gap-3 md:grid-cols-[1.25rem_2.25rem_minmax(0,1fr)_minmax(0,1fr)_auto]">
            {row.account == null ? <input type="checkbox" className="size-4 accent-[var(--pd-primary)]" aria-label={`Select ${row.name}`} disabled={locked} checked={selected.includes(row.id)} onChange={(event) => setSelected((prev) => event.target.checked ? [...prev, row.id] : prev.filter((id) => id !== row.id))} /> : <Check className="size-4 text-emerald-700" aria-label="Settled" />}
            <span className={`grid size-9 place-items-center rounded-full ${row.kind === "income" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}><Icon className="size-4" aria-hidden="true" /></span>
            <div className="min-w-0"><span className="block break-words text-sm font-medium">{row.name}</span><span className="block text-xs text-slate-600">{dateLabel(row.date)} · {row.category_name || "Other"}</span><span className={`mt-1 block text-sm tabular-nums ${row.kind === "income" ? "text-emerald-700" : "text-red-700"}`}>{row.kind === "income" ? "+" : "−"}{formatMinorUnits(toMinorUnits(row.amount))}</span></div>
            {row.account == null ? <><AccountSelect label={`Account for ${row.name}`} accounts={dashboard.data.accounts} kind={row.kind} value={chosen[row.id]} disabled={locked} onChange={(value) => choose(row.id, value)} /><Button variant="outline" disabled={locked || chosen[row.id] == null} onClick={() => settle([row.id])}><Check className="size-4" aria-hidden="true" />Assign</Button></> : <><span className="text-sm text-slate-700">{row.account_name}</span><span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700"><Check className="size-3" aria-hidden="true" />Settled</span></>}
          </div>
          {rowErrors[row.id] && <p className="mt-2 text-sm text-red-700">{Object.values(rowErrors[row.id]).flat().join(" ")}</p>}
        </li>; })}</ul>
        <div className="flex items-center justify-between gap-3 text-xs text-slate-600"><span>{data.data.count} transactions · page {currentPage}</span><div className="flex gap-2"><Button variant="outline" size="icon" aria-label="Previous transaction page" disabled={locked || currentPage <= 1} onClick={() => changePage(currentPage - 1)}><ChevronLeft className="size-4" aria-hidden="true" /></Button><Button variant="outline" size="icon" aria-label="Next transaction page" disabled={locked || !data.data.next} onClick={() => changePage(currentPage + 1)}><ChevronRight className="size-4" aria-hidden="true" /></Button></div></div>
        {drafts.length > 0 && <BalancePreview projection={projection} />}
      </>}
    </div>}
    <p className="mt-4 text-xs text-slate-500">Historical settled entries created before Quick Entry source tracking are not included.</p>
  </Panel></div>;
}
