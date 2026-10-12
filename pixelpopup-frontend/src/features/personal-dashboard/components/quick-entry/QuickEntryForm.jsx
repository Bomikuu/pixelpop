import { useLayoutEffect, useRef } from "react";
import { Info, Plus, RefreshCw, Save, TriangleAlert, X } from "lucide-react";
import { Button } from "../../ui/button";
import { useQuickEntryDraft } from "../../hooks/useQuickEntryDraft";
import { projectBalances, runningBalances } from "../../quick-entry/money";
import QuickEntryCard from "./QuickEntryCard";
import BalancePreview from "./BalancePreview";
import DailySpendingGuide from "./DailySpendingGuide";
import { today } from "../../lib/format";

export default function QuickEntryForm({ dashboard, notify, date, onStateChange }) {
  const input = useRef(null);
  const draft = useQuickEntryDraft({ ...dashboard.data, date, request: dashboard.request, onSaved: (result) => {
    dashboard.refresh();
    notify(`${result.results.length} ${result.results.length === 1 ? "transaction saved" : "transactions saved"}.`, { entity: "expense", action: "added" });
    window.requestAnimationFrame(() => input.current?.focus());
  } });
  useLayoutEffect(() => { input.current?.focus(); }, []);
  useLayoutEffect(() => {
    if (!input.current) return;
    input.current.style.height = "auto";
    input.current.style.height = `${Math.min(280, Math.max(56, input.current.scrollHeight))}px`;
    onStateChange?.({ dirty: Boolean(draft.source.trim()), locked: draft.locked });
  }, [draft.source, draft.locked, onStateChange]);
  const projection = projectBalances(draft.rows, dashboard.data.accounts);
  const running = runningBalances(draft.rows, dashboard.data.accounts);
  const invalidDate = (value) => !/^\d{4}-\d{2}-\d{2}$/.test(value) || value > today();
  const invalid = draft.rows.filter((row) => row.errors.length || invalidDate(row.date || date)).length;
  const valid = draft.rows.length - invalid;
  const insufficient = projection.accounts.some((account) => account.insufficient);
  return <div className="space-y-5">
    <div className="rounded-2xl border border-[var(--pd-border)] bg-white p-3 shadow-sm sm:p-4">
      <label htmlFor="quick-entry-source" className="sr-only">Expenses − · Income +</label>
      <div className="flex items-start gap-3">
        <span className="mt-2 grid size-9 shrink-0 place-items-center rounded-full bg-[var(--pd-soft)] text-[var(--pd-primary)]"><Plus className="size-5" aria-hidden="true" /></span>
        <textarea ref={input} id="quick-entry-source" rows={1} style={{ minHeight: 56, resize: "none", outline: "none", boxShadow: "none" }} className="min-h-14 min-w-0 flex-1 resize-none rounded-none border-x-0 border-t-0 border-b-2 border-solid border-transparent bg-white px-0 py-3 text-base leading-7 text-[var(--pd-ink)] shadow-none outline-none transition-colors placeholder:text-[var(--pd-muted)] focus:border-[var(--pd-primary)] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none" value={draft.source} disabled={draft.locked} onChange={(event) => draft.changeSource(event.target.value)} onBlur={draft.reveal} placeholder="-250 jollibee" aria-describedby="quick-entry-help" aria-invalid={invalid > 0 || undefined} />
      </div>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2 pt-2">
        <span className="text-xs text-slate-600" role="status">{draft.rows.length} {draft.rows.length === 1 ? "transaction" : "transactions"} detected{invalid > 0 ? ` · ${invalid} need correction` : ""}</span>
        {draft.source && <Button variant="ghost" size="sm" className="min-h-11" disabled={draft.locked} onClick={() => { draft.changeSource(""); input.current?.focus(); }}><X className="size-3.5" aria-hidden="true" />Clear</Button>}
      </div>
    </div>
    <p id="quick-entry-help" className="flex items-start gap-1.5 text-xs leading-5 text-slate-600"><Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><span>One signed amount per line. Commas and decimals work. Other Account stays unsettled until you assign it in the dashboard.</span></p>
    <DailySpendingGuide dashboard={dashboard} rows={draft.rows} date={date} status={draft.status} />
    {draft.error && <div role="alert" className="flex gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"><TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><div>{draft.error}{draft.status === "uncertain" && <p className="mt-1 text-xs">Retry this exact batch before making any changes.</p>}</div></div>}
    {draft.rows.length > 0 && <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
      <section aria-label="Transaction preview" className="min-w-0">
        <div className="mb-3 flex items-center justify-between gap-2"><h2 className="text-sm font-semibold">Transactions</h2><span className="text-xs text-slate-600">{draft.rows.length} entries</span></div>
        {draft.revealed ? <ul className="grid grid-cols-1 gap-3 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150">{draft.rows.map((row) => <QuickEntryCard key={row.id} row={row} draft={draft} accounts={dashboard.data.accounts} categories={dashboard.data.categories} date={date} running={running.get(row.id)} />)}</ul> : <p className="text-sm text-slate-600">Start a new line or leave the input to see your entries.</p>}
      </section>
      <aside className="min-w-0 lg:sticky lg:top-4"><BalancePreview projection={projection} compact /></aside>
    </div>}
    <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--pd-border)] bg-white px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:mx-0 sm:px-0">
      <p className={`flex items-center gap-1.5 text-xs ${invalid || insufficient ? "text-red-700" : "text-slate-600"}`}>{invalid || insufficient ? <><TriangleAlert className="size-4 shrink-0" aria-hidden="true" />{invalid ? "Correct highlighted entries before saving." : "An account has insufficient balance or credit."}</> : <><Info className="size-4 shrink-0" aria-hidden="true" />{draft.status === "saving" ? "Saving all entries…" : "Preview only. Balances change when you save."}</>}</p>
      <Button className="h-11 w-full sm:ml-auto sm:w-auto sm:min-w-44" disabled={draft.status === "saving" || (draft.status !== "uncertain" && (!valid || invalid > 0 || insufficient))} onClick={draft.save}>{draft.status === "uncertain" ? <RefreshCw className="size-4" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}{draft.status === "saving" ? "Saving…" : draft.status === "uncertain" ? "Confirm saved batch" : `Save ${valid} ${valid === 1 ? "transaction" : "transactions"}`}</Button>
    </div>
  </div>;
}
