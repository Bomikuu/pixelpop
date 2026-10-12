import { ArrowDownLeft, ArrowUpRight, Eye, Info, TriangleAlert } from "lucide-react";
import { accountLabel } from "../../lib/format";
import { formatMinorUnits } from "../../quick-entry/money";

export default function BalancePreview({ projection, compact = false }) {
  const values = [
    ["Current cash", projection.overallCash.current, "text-slate-950"],
    ["Draft expenses", projection.expenses, projection.expenses === 0n ? "text-slate-950" : "text-red-700"],
    ["Draft income", projection.income, projection.income === 0n ? "text-slate-950" : "text-emerald-700"],
    ["Projected cash", projection.overallCash.projected, projection.overallCash.projected < 0n ? "text-red-700" : "text-slate-950"],
  ];
  const NetIcon = projection.net < 0n ? ArrowUpRight : ArrowDownLeft;
  if (compact) return <section className="space-y-4 rounded-xl border border-[var(--pd-border)] bg-white p-4" aria-label="Balance preview">
    <div className="flex items-center gap-2"><Eye className="size-4 text-slate-500" aria-hidden="true" /><h2 className="text-sm font-semibold">Balance preview</h2></div>
    <div><p className="text-xs text-slate-600">Predicted cash balance</p><p className={`mt-1 text-2xl tabular-nums ${projection.overallCash.projected < 0n ? "text-red-700" : "text-slate-950"}`}>{formatMinorUnits(projection.overallCash.projected)}</p><p className="mt-1 text-xs text-slate-500">Assigned cash, bank and e-wallet accounts only</p></div>
    <dl className="space-y-2 border-y border-[var(--pd-border)] py-3 text-xs">
      {[["Current cash", projection.overallCash.current, ""], ["Expenses", projection.expenses, projection.expenses > 0n ? "text-red-700" : ""], ["Income", projection.income, projection.income > 0n ? "text-emerald-700" : ""], ["Recorded net change", projection.net, projection.net < 0n ? "text-red-700" : projection.net > 0n ? "text-emerald-700" : ""]].map(([label, value, tone]) => <div key={label} className="flex items-center justify-between gap-3"><dt className="text-slate-600">{label}</dt><dd className={`flex items-center gap-1 tabular-nums ${tone}`}>{value !== 0n && (label === "Expenses" || label === "Recorded net change" && value < 0n ? <ArrowUpRight className="size-3" aria-hidden="true" /> : label === "Income" || label === "Recorded net change" ? <ArrowDownLeft className="size-3" aria-hidden="true" /> : null)}{label === "Expenses" && value > 0n ? "−" : (label === "Income" || label === "Recorded net change") && value > 0n ? "+" : ""}{formatMinorUnits(value)}</dd></div>)}
    </dl>
    <p className="flex items-start gap-1.5 text-xs leading-5 text-slate-600"><Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><span>{projection.unassigned.count} unsettled {projection.unassigned.count === 1 ? "transaction" : "transactions"}. Included in recorded totals, not predicted cash.</span></p>
    {projection.accounts.filter((account) => account.insufficient).map((account) => <p key={account.id} role="alert" className="flex gap-1.5 text-xs text-red-700"><TriangleAlert className="size-4 shrink-0" aria-hidden="true" /><span>{accountLabel(account)}: {account.card ? "exceeds available credit or missing limit" : "insufficient balance"}.</span></p>)}
    <p className="text-xs text-slate-500">Nothing changes until you save.</p>
  </section>;
  return (
    <section className="space-y-4 border-t border-[var(--pd-border)] pt-5" aria-label="Balance preview">
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-semibold">Balance preview</h2><span className="inline-flex items-center gap-1.5 text-xs text-slate-600"><Eye className="size-4" aria-hidden="true" />Nothing changes until you save</span></div>
      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">{values.map(([label, value, tone]) => <div key={label}><dt className="text-xs text-slate-600">{label}</dt><dd className={`mt-1 text-lg tabular-nums ${tone}`}>{formatMinorUnits(value)}</dd></div>)}</dl>
      <p className="flex flex-wrap items-center gap-2 text-sm text-slate-600">Draft net change<span className={`inline-flex items-center gap-1 tabular-nums ${projection.net < 0n ? "text-red-700" : projection.net > 0n ? "text-emerald-700" : "text-slate-950"}`}>{projection.net !== 0n && <NetIcon className="size-4" aria-hidden="true" />}{projection.net > 0n ? "+" : ""}{formatMinorUnits(projection.net)}</span><span className="text-xs">Includes unsettled entries, not just cash-account changes.</span></p>
      {projection.accounts.length > 0 && <div className="overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Account projections for valid draft entries</caption><thead className="border-b border-[var(--pd-border)] text-xs text-slate-600"><tr><th className="py-2 pr-4 font-medium">Account</th><th className="px-3 py-2 font-medium">Current</th><th className="px-3 py-2 font-medium">Change</th><th className="px-3 py-2 font-medium">After save</th></tr></thead><tbody>{projection.accounts.map((a) => <tr key={a.id} className="border-b border-[var(--pd-border)] last:border-0">
        <th className="py-3 pr-4 font-normal"><span className="block">{accountLabel(a)}</span><span className="text-xs text-slate-600">{a.card ? "Credit-card debt" : "Cash balance"}</span></th>
        <td className="whitespace-nowrap px-3 py-3 tabular-nums">{formatMinorUnits(a.current)}</td><td className={`whitespace-nowrap px-3 py-3 tabular-nums ${a.change < 0n || a.card ? "text-red-700" : a.change > 0n ? "text-emerald-700" : ""}`}>{a.change > 0n ? "+" : ""}{formatMinorUnits(a.change)}</td>
        <td className="px-3 py-3"><span className={`whitespace-nowrap tabular-nums ${a.insufficient ? "text-red-700" : ""}`}>{formatMinorUnits(a.projected)}</span>{a.card && <span className="block text-xs text-slate-600">{a.limit == null ? "No credit limit configured" : `${formatMinorUnits(a.limit - a.projected - (a.reserved || 0n))} available credit`}</span>}{a.insufficient && <span className="mt-1 flex items-center gap-1 text-xs text-red-700"><TriangleAlert className="size-3 shrink-0" aria-hidden="true" />{a.card ? "Exceeds available credit or missing limit" : "Insufficient balance"}</span>}</td>
      </tr>)}</tbody></table></div>}
      {projection.unassigned.count > 0 && <div className="flex items-start gap-2 rounded-md bg-[var(--pd-soft)] p-3 text-sm"><Info className="mt-0.5 size-4 shrink-0 text-slate-600" aria-hidden="true" /><div><p>{projection.unassigned.count} {projection.unassigned.count === 1 ? "entry needs" : "entries need"} an account.</p><p className="mt-1 text-xs leading-5 text-slate-600">Unassigned expenses {formatMinorUnits(projection.unassigned.expenses)} · income {formatMinorUnits(projection.unassigned.income)} · net {formatMinorUnits(projection.unassigned.net)}. These count in reporting when saved, but not in projected cash.</p></div></div>}
    </section>
  );
}
