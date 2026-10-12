import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Check, PencilLine, RotateCcw, Trash2, TriangleAlert, Wallet } from "lucide-react";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { AccountSelect, CategorySelect } from "./QuickEntrySelect";
import TransactionTypeIcon from "../TransactionTypeIcon";
import { accountLabel, today } from "../../lib/format";
import { formatMinorUnits, toMinorUnits } from "../../quick-entry/money";

function errorText(value) {
  if (!value) return [];
  if (typeof value === "string") return [value];
  return Object.values(value).flatMap(errorText);
}

export default function QuickEntryCard({ row, draft, accounts, categories, date, running }) {
  const [editing, setEditing] = useState(false);
  const incoming = row.kind === "income";
  const Direction = incoming ? ArrowDownLeft : ArrowUpRight;
  const category = categories.find((item) => String(item.id) === String(row.categoryId));
  const entryDate = row.date || date;
  const invalidDate = !/^\d{4}-\d{2}-\d{2}$/.test(entryDate) || entryDate > today();
  const errors = [...row.errors, ...errorText(draft.serverErrors[row.id]), ...(invalidDate ? ["Choose today or an earlier date."] : [])];
  const errorId = `quick-entry-error-${row.id}`;
  return <li className={`min-w-0 border bg-white p-4 transition-[border-color,box-shadow] duration-150 motion-reduce:transition-none ${errors.length ? "border-red-300" : "border-[var(--pd-border)] hover:border-slate-300 hover:shadow-sm"}`}>
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className={`flex items-center gap-1.5 text-xl tabular-nums ${row.amount ? incoming ? "text-emerald-700" : "text-red-700" : "text-slate-700"}`}>
          <Direction className="size-4 shrink-0" aria-hidden="true" />
          {row.amount ? `${incoming ? "+" : "−"}${formatMinorUnits(toMinorUnits(row.amount))}` : "Check amount"}
          <span className="sr-only">{incoming ? "Income" : "Expense"}</span>
        </p>
        <h3 className="mt-1 break-words text-sm font-semibold">{row.name || (incoming ? "Income" : "Expense")}</h3>
      </div>
      <TransactionTypeIcon name={row.name} categoryName={category?.name || "Other"} />
    </div>
    <div className="mt-2 flex items-center justify-between gap-2">
      <span className="text-xs text-slate-500">Line {row.lineNumber}</span>
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="size-11 rounded-none" disabled={draft.locked} aria-expanded={editing} aria-label={`${editing ? "Finish editing" : "Edit"} line ${row.lineNumber}`} title={editing ? "Finish editing" : "Edit transaction"} onClick={() => setEditing((value) => !value)}>{editing ? <Check className="size-4" aria-hidden="true" /> : <PencilLine className="size-4" aria-hidden="true" />}</Button>
        <Button variant="ghost" size="icon" className="size-11 rounded-none" aria-label={`Remove line ${row.lineNumber}`} title="Remove transaction" disabled={draft.locked} onClick={() => draft.remove(row.id)}><Trash2 className="size-4" aria-hidden="true" /></Button>
      </div>
    </div>
    {(editing || row.errors.length > 0) && <div className="mb-3 space-y-1"><label htmlFor={`quick-line-${row.id}`} className="text-xs text-slate-600">Signed amount and description</label><Input autoFocus={editing} id={`quick-line-${row.id}`} className="rounded-none text-base sm:text-sm" value={row.raw} disabled={draft.locked} onChange={(event) => draft.editLine(row.id, event.target.value)} aria-invalid={errors.length > 0 || undefined} aria-describedby={errors.length ? errorId : undefined} /></div>}
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      <CategorySelect className="min-w-0 rounded-none px-2 text-xs" label={`Category for line ${row.lineNumber}`} categories={categories} value={row.categoryId} disabled={draft.locked || !row.amount} onChange={(value) => draft.setChoice(row.id, "categoryId", value)} />
      <AccountSelect className="min-w-0 rounded-none px-2 text-xs" label={`Account for line ${row.lineNumber}`} accounts={accounts} kind={row.kind} value={row.accountId} disabled={draft.locked || !row.amount} onChange={(value) => draft.setChoice(row.id, "accountId", value)} />
      <Input type="date" className="h-11 min-w-0 rounded-none px-2 text-base sm:text-xs" aria-label={`Date for line ${row.lineNumber}`} value={entryDate} max={today()} disabled={draft.locked} aria-invalid={invalidDate || undefined} aria-describedby={invalidDate ? errorId : undefined} onChange={(event) => draft.setChoice(row.id, "date", event.target.value)} />
    </div>
    {(row.categoryManual || row.accountManual) && <div className="mt-1 flex flex-wrap gap-1">
      {row.categoryManual && <Button variant="ghost" size="sm" disabled={draft.locked} onClick={() => draft.resetChoice(row.id, "categoryId")}><RotateCcw className="size-3" aria-hidden="true" />Detect category</Button>}
      {row.accountManual && <Button variant="ghost" size="sm" disabled={draft.locked} onClick={() => draft.resetChoice(row.id, "accountId")}><RotateCcw className="size-3" aria-hidden="true" />Detect account</Button>}
    </div>}
    <div className="mt-3 border-t border-[var(--pd-border)] pt-3 text-xs text-slate-600">
      {row.accountId == null ? <p className="flex items-center gap-1.5"><Wallet className="size-4 shrink-0" aria-hidden="true" />Unsettled · Assign an account in the dashboard</p> : running ? <>
        <p className="break-words">{accountLabel(running.account)}<span className={`mt-1 block tabular-nums ${running.available < 0n ? "text-red-700" : "text-slate-950"}`}>{formatMinorUnits(running.available)} {running.card && running.hasLimit ? "available credit" : running.card ? "card debt" : "remaining"} after this entry</span></p>
        {running.percent != null && <><div className="mt-2 flex gap-1" aria-hidden="true">{Array.from({ length: 20 }, (_, index) => <span key={index} className={`h-1.5 min-w-0 flex-1 rounded-sm ${index < Math.ceil(running.percent / 5) ? "bg-emerald-500" : "bg-slate-100"}`} />)}</div><p className="mt-1 text-[11px]">{!running.card && running.available > running.baseline ? "Above starting balance" : `${running.percent}% of ${running.card ? "credit limit" : "starting balance"} available`}</p></>}
      </> : <p>Correct this entry to preview its balance.</p>}
    </div>
    {errors.length > 0 && <div id={errorId} className="mt-2 flex gap-2 text-xs text-red-700"><TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><span>{errors.join(" ")}</span></div>}
    {row.hints.map((hint) => <p key={hint} className="mt-2 text-xs text-slate-600">{hint}</p>)}
  </li>;
}
