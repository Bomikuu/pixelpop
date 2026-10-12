import { ArrowDownLeft, ArrowUpRight, RotateCcw, Trash2, TriangleAlert } from "lucide-react";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { AccountSelect, CategorySelect } from "./QuickEntrySelect";
import { formatMinorUnits, toMinorUnits } from "../../quick-entry/money";

function errorText(value) {
  if (!value) return [];
  if (typeof value === "string") return [value];
  return Object.values(value).flatMap(errorText);
}

export default function QuickEntryRow({ row, draft, accounts, categories }) {
  const incoming = row.kind === "income", sign = incoming ? "+" : "-";
  const Icon = incoming ? ArrowDownLeft : ArrowUpRight;
  const errors = [...row.errors, ...errorText(draft.serverErrors[row.id])];
  const errorId = `quick-entry-error-${row.id}`;
  return (
    <li className="border-b border-[var(--pd-border)] py-4 last:border-b-0">
      <div className="grid min-w-0 grid-cols-[2.5rem_minmax(0,1fr)_2.75rem] items-start gap-3 lg:grid-cols-[2.5rem_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.4fr)_2.75rem]">
        <span className={`grid size-10 place-items-center rounded-full ${incoming ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}><Icon className="size-5" aria-hidden="true" /><span className="sr-only">{incoming ? "Income" : "Expense"}</span></span>
        <div className="min-w-0 space-y-2">
          {row.amount && <>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`tabular-nums text-sm ${incoming ? "text-emerald-700" : "text-red-700"}`}>{sign}{formatMinorUnits(toMinorUnits(row.amount))}</span>
              <span className="text-xs text-slate-500">Line {row.lineNumber}</span>
            </div>
          </>}
          <Input className="text-base sm:text-sm" aria-label={`Signed amount and description for line ${row.lineNumber}`} value={row.raw} disabled={draft.locked} onChange={(event) => draft.editLine(row.id, event.target.value)} aria-invalid={errors.length > 0 || undefined} aria-describedby={errors.length ? errorId : undefined} />
        </div>
        <div className="col-span-3 space-y-1 lg:col-span-1">
          <CategorySelect label={`Category for line ${row.lineNumber}`} categories={categories} value={row.categoryId} disabled={draft.locked || !row.amount} onChange={(value) => draft.setChoice(row.id, "categoryId", value)} />
          {row.categoryManual && <Button variant="ghost" size="sm" disabled={draft.locked} onClick={() => draft.resetChoice(row.id, "categoryId")}><RotateCcw className="size-3" aria-hidden="true" />Reset detection</Button>}
        </div>
        <div className="col-span-3 space-y-1 lg:col-span-1">
          <AccountSelect label={`Account for line ${row.lineNumber}`} accounts={accounts} kind={row.kind} value={row.accountId} disabled={draft.locked || !row.amount} onChange={(value) => draft.setChoice(row.id, "accountId", value)} />
          {row.accountManual && <Button variant="ghost" size="sm" disabled={draft.locked} onClick={() => draft.resetChoice(row.id, "accountId")}><RotateCcw className="size-3" aria-hidden="true" />Reset detection</Button>}
        </div>
        <Button variant="ghost" size="icon" className="col-start-3 row-start-1 size-11 lg:col-start-auto lg:row-start-auto" aria-label={`Remove line ${row.lineNumber}`} disabled={draft.locked} onClick={() => draft.remove(row.id)}><Trash2 className="size-4" aria-hidden="true" /></Button>
      </div>
      {errors.length > 0 && <div id={errorId} className="mt-2 flex gap-2 text-sm text-red-700"><TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><span>{errors.join(" ")}</span></div>}
      {row.hints.map((hint) => <p key={hint} className="mt-2 text-xs text-slate-600">{hint}</p>)}
    </li>
  );
}
