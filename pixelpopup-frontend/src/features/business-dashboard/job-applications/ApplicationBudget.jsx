import { Info, Settings2, TriangleAlert, Wallet } from "lucide-react";
import { Button } from "../../personal-dashboard/ui/button";

export function usd(value) { return value == null ? "Unavailable" : `$${Number(value).toFixed(6)}`; }

export default function ApplicationBudget({ usage, compact = false, onSettings }) {
  if (!usage) return null;
  const spent = Number(usage.spent_usd), held = Number(usage.held_usd), budget = usage.budget_usd == null ? null : Number(usage.budget_usd);
  const hasBudget = budget !== null && budget > 0;
  const percentage = hasBudget ? (spent + held) / budget * 100 : null;
  const spentWidth = hasBudget ? Math.min(100, spent / budget * 100) : 0;
  const heldWidth = hasBudget ? Math.min(100 - spentWidth, held / budget * 100) : 0;
  const overBudget = hasBudget && spent + held > budget;
  const unknown = usage.unknown_unreserved_count > 0;
  return <section className="space-y-3 rounded-md border bg-white p-4" aria-label="Monthly AI allowance">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="flex items-center gap-2 text-sm font-medium"><Wallet size={17}/>Monthly AI usage · {usage.month} (Manila)</h3>{onSettings && <Button size="sm" variant="outline" onClick={onSettings}><Settings2 size={15}/>Budget settings</Button>}</div>
    <div className="space-y-2">
      <div className="flex flex-wrap justify-between gap-2 text-xs"><span className="text-slate-600">Recorded charges + held estimates</span><span className={`tabular-nums ${overBudget || budget === 0 ? "text-red-800" : "text-slate-800"}`}>{hasBudget ? `${unknown ? "At least " : ""}${Number(percentage.toFixed(1))}% allocated` : budget === 0 ? "Budget is zero · new AI calls blocked" : "Set a budget to track percentage"}</span></div>
      <div role={hasBudget ? "progressbar" : undefined} aria-label="Monthly AI budget allocated" aria-valuemin={hasBudget ? 0 : undefined} aria-valuemax={hasBudget ? 100 : undefined} aria-valuenow={hasBudget ? Math.min(100, percentage) : undefined} aria-valuetext={hasBudget ? `${usd(spent)} recorded and ${usd(held)} held against ${usd(budget)}.${unknown ? " Some charges are unknown; total usage may be higher." : overBudget ? " Budget exceeded." : ""}` : undefined} className="flex h-2.5 overflow-hidden rounded-full bg-slate-100">
        <span aria-hidden="true" className={overBudget ? "h-full bg-red-600" : "h-full bg-blue-600"} style={{ width: `${spentWidth}%` }}/><span aria-hidden="true" className="h-full bg-amber-400" style={{ width: `${heldWidth}%` }}/>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600"><span className="flex items-center gap-1.5"><span aria-hidden="true" className={`size-2 rounded-full ${overBudget ? "bg-red-600" : "bg-blue-600"}`}/>Recorded charges</span><span className="flex items-center gap-1.5"><span aria-hidden="true" className="size-2 rounded-full bg-amber-400"/>Held estimates—not final charges</span></div>
    </div>
    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[["Recorded charges", usd(usage.spent_usd)], ["Held estimates", usd(usage.held_usd)], ["Monthly limit", usage.budget_usd == null ? "Not set" : usd(usage.budget_usd)], ["Remaining", usage.budget_usd == null ? "No app limit" : usd(usage.remaining_usd)]].map(([label, value]) => <div key={label}><dt className="text-xs text-slate-600">{label}</dt><dd className="mt-1 text-sm tabular-nums">{value}</dd></div>)}</dl>
    <p className="flex items-start gap-2 text-xs leading-5 text-slate-600"><Info size={15} className="mt-0.5 shrink-0"/>{compact ? "Across all your applications and providers. Provider billing remains authoritative." : "This is an app-level estimate guard, not a guaranteed provider billing cap. Provider billing is authoritative. Unset allows generation; zero blocks new calls."}</p>
    {overBudget && <p className="flex items-start gap-2 text-xs text-red-800"><TriangleAlert size={15} className="shrink-0"/>Recorded charges and held estimates exceed your monthly budget.</p>}
    {usage.unresolved_count > 0 && <p className="flex items-start gap-2 text-xs text-amber-900"><Info size={15} className="shrink-0"/><span>{usage.unresolved_count} requests have unresolved charges.{unknown && " Total usage is incomplete. Reconcile unknown costs before using a monthly limit."}</span></p>}
  </section>;
}
