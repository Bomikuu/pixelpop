import { ChevronDown } from "lucide-react";
import { words } from "../lib/format";

const identity = { transactions: "name", movements: "kind", deadlines: "title", loans: "person", assets: "name", categories: "name", schedules: "title" };
const amounts = { transactions: "amount", movements: "amount", deadlines: "amount", loans: "outstanding", assets: "value", categories: "monthly_budget", schedules: "amount" };
const metadata = { transactions: ["date", "category_name"], movements: ["date", "destination_name"], deadlines: ["due_date", "urgency"], loans: ["due_date", "collection_state"], assets: ["kind", "valuation_date"], schedules: ["frequency", "anchor_date"] };

export default function MobileRecordCards({ rows, resource, fields, renderField, renderActions, renderPrimary, rowKey = "id" }) {
  const name = identity[resource] || fields[0];
  const amount = amounts[resource];
  const meta = (metadata[resource] || []).filter((field) => fields.includes(field));
  const extra = fields.filter((field) => ![name, amount, ...meta].includes(field));
  return <ul className="space-y-3" aria-label="Records">{rows.map((row) => <li key={row[rowKey]} className="min-w-0 rounded-lg border border-[var(--pd-border)] bg-[var(--site-surface)] p-3">
    <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
      <h3 className="min-w-0 flex-[1_1_8rem] break-words text-sm font-medium text-[var(--pd-ink)]">{renderField(name, row)}</h3>
      {amount && <div className="min-w-0 break-words text-base font-semibold tabular-nums text-[var(--pd-ink)]"><span className="mb-1 block text-[11px] font-normal text-[var(--site-secondary)]">{words(amount)}</span>{renderField(amount, row)}</div>}
    </div>
    {!!meta.length && <dl className="mt-3 grid min-w-0 grid-cols-2 gap-3 text-xs [&_.min-w-28]:min-w-0 [&_.min-w-32]:min-w-0">{meta.map((field) => <div key={field} className="min-w-0 break-words"><dt className="mb-1 text-[var(--site-secondary)]">{words(field.replace("_name", ""))}</dt><dd>{renderField(field, row)}</dd></div>)}</dl>}
    {renderPrimary && <div className="mt-3 empty:hidden [&_button]:min-h-11">{renderPrimary(row)}</div>}
    <details className="group/record mt-3 border-t border-[var(--pd-border)]">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-xs font-medium text-[var(--site-link)] focus-visible:outline-2 focus-visible:outline-offset-2 [&::-webkit-details-marker]:hidden">Details &amp; actions<ChevronDown size={15} aria-hidden="true" className="group-open/record:rotate-180 motion-safe:transition-transform" /></summary>
      {!!extra.length && <dl className="mb-3 grid min-w-0 gap-3 text-xs">{extra.map((field) => <div key={field} className="min-w-0 break-words"><dt className="mb-1 text-[var(--site-secondary)]">{words(field.replace("_name", ""))}</dt><dd>{renderField(field, row)}</dd></div>)}</dl>}
      <div className="[&_button]:min-h-11 [&_button]:min-w-11 [&_a[data-slot=button]]:min-h-11">{renderActions(row)}</div>
    </details>
  </li>)}</ul>;
}
