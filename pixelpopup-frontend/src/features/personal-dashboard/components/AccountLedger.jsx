import { useEffect, useState } from "react";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  CreditCard,
  History,
  House,
  PiggyBank,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useRecords } from "../hooks/useDashboardData";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { EmptyState, ErrorState, Panel } from "./Panel";
import { dateLabel, money, words } from "../lib/format";

const icons = {
  income: ArrowDownLeft,
  expense: ArrowUpRight,
  transfer: ArrowLeftRight,
  loan_disbursement: ArrowUpRight,
  loan_repayment: ArrowDownLeft,
  credit_card_payment: CreditCard,
  fund_contribution: PiggyBank,
  fund_withdrawal: PiggyBank,
  adjustment: SlidersHorizontal,
  asset_financing_payment: House,
};

function effectLabel(kind, effect) {
  if (effect === 0) return "No balance change";
  if (kind === "credit_card") return effect > 0 ? "Debt increased" : "Debt reduced";
  if (kind === "fund") return effect > 0 ? "Value added" : "Value withdrawn";
  return effect > 0 ? "Money in" : "Money out";
}

export default function AccountLedger({ account, month, dashboard }) {
  const [period, setPeriod] = useState("month");
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [month]);
  const params = new URLSearchParams({ page: String(page) });
  if (period === "month") params.set("month", month);
  const state = useRecords(
    "accounts/" + account.id + "/ledger/?" + params.toString(),
    dashboard.request,
    dashboard.version,
  );
  const rows = state.data?.results || [];
  const count = state.data?.count || 0;
  const pages = Math.max(1, Math.ceil(count / 20));

  return (
    <Panel
      title="Account history"
      description="Posted changes to this account, including transfers, card payments, fund movements, and reasoned corrections. Expected income is not posted."
      action={
        <Select value={period} onValueChange={(value) => { setPeriod(value); setPage(1); }}>
          <SelectTrigger aria-label="History period" className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="personal-dashboard" position="popper">
            <SelectItem value="month">Selected month</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      }
    >
      {state.error ? (
        <ErrorState message={state.error} retry={dashboard.refresh} />
      ) : state.loading ? (
        <p role="status" className="py-8 text-sm text-slate-600">Loading account history…</p>
      ) : !rows.length ? (
        <EmptyState
          icon={History}
          title="No history for this period"
          message={period === "month" ? "Try All time to see older account activity." : "The first posted entry for this account will appear here."}
        />
      ) : (
        <>
          <ol className="divide-y divide-[var(--pd-border)]" aria-label="Posted account history">
            {rows.map((row) => {
              const Icon = icons[row.kind] || History;
              const effect = Number(row.effect);
              const favorable = account.kind === "credit_card" ? effect < 0 : effect > 0;
              const tone = effect === 0 ? "text-slate-600" : favorable ? "text-emerald-700" : "text-rose-700";
              const DirectionIcon = effect >= 0 ? TrendingUp : TrendingDown;
              return (
                <li key={row.kind + "-" + row.id} className="flex flex-wrap items-start justify-between gap-3 py-3 transition-colors hover:bg-[var(--pd-soft)]/50">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--pd-soft)] text-[var(--pd-primary)]">
                      <Icon size={17} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="break-words font-medium text-slate-950">{row.name || words(row.kind)}</p>
                      <p className="mt-0.5 break-words text-xs text-slate-600">
                        {dateLabel(row.date)} · {words(row.kind)}
                        {row.counterparty ? " · " + row.counterparty : ""}
                      </p>
                      {row.note && <p className="mt-1 break-words text-xs text-slate-600">{row.note}</p>}
                    </div>
                  </div>
                  <div className={"flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold tabular-nums " + tone}>
                    <DirectionIcon size={16} aria-hidden="true" />
                    <span className="sr-only">{effectLabel(account.kind, effect)}: </span>
                    {money(Math.abs(effect))}
                  </div>
                </li>
              );
            })}
          </ol>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--pd-border)] pt-4 text-sm text-slate-600">
            <span>{count.toLocaleString("en-PH")} posted entries · Page {page} of {pages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((value) => value + 1)}>Next</Button>
            </div>
          </div>
        </>
      )}
    </Panel>
  );
}
