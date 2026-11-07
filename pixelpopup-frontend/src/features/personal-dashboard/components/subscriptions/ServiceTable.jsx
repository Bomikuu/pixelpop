import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Button } from "../../ui/button";
import { EmptyState } from "../Panel";
import useWorkspaceMobile from "../../../workspace-mobile/useWorkspaceMobile";
import MobileDisclosure from "../../../workspace-mobile/MobileDisclosure";

export default function ServiceTable({ columns, rows, rowKey = "id", empty = "No records yet" }) {
  const mobile = useWorkspaceMobile();
  if (!rows?.length) return <EmptyState title={empty} message="Saved records will appear here." />;
  if (mobile) {
    const primary = columns.filter((column, index) => index === 0 || ["amount", "income", "expenses", "remaining", "status", "due_date"].includes(column.key)).slice(0, 4);
    const secondary = columns.filter((column) => !primary.includes(column));
    const value = (column, row) => column.render ? column.render(row) : row[column.key] ?? "—";
    return <ul className="space-y-3">{rows.map((row, index) => <li key={row[rowKey] ?? index} className="min-w-0 rounded-lg border border-[var(--pd-border)] bg-[var(--site-surface)] p-3">
      <dl className="grid min-w-0 grid-cols-2 gap-3">{primary.map((column) => <div key={column.key} className="min-w-0 break-words"><dt className="mb-1 text-xs text-[var(--site-secondary)]">{column.label}</dt><dd className="text-sm text-[var(--pd-ink)]">{value(column, row)}</dd></div>)}</dl>
      {!!secondary.length && <MobileDisclosure title="More details"><dl className="grid min-w-0 gap-3">{secondary.map((column) => <div key={column.key} className="min-w-0 break-words [&_button]:min-h-11"><dt className="mb-1 text-xs text-[var(--site-secondary)]">{column.label}</dt><dd className="text-sm">{value(column, row)}</dd></div>)}</dl></MobileDisclosure>}
    </li>)}</ul>;
  }
  return <div className="max-w-full overflow-x-auto"><Table><TableHeader><TableRow>{columns.map((c) => <TableHead key={c.key}>{c.label}</TableHead>)}</TableRow></TableHeader><TableBody>{rows.map((row, index) => <TableRow key={row[rowKey] ?? index}>{columns.map((c) => <TableCell key={c.key} className="max-w-sm whitespace-normal break-words">{c.render ? c.render(row) : row[c.key] ?? "—"}</TableCell>)}</TableRow>)}</TableBody></Table></div>;
}
export function Pagination({ page, setPage, data, busy = false }) {
  return <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600"><span>{data?.count ?? 0} records · Page {page}</span><div className="flex gap-2"><Button variant="outline" disabled={page <= 1 || busy} onClick={() => setPage(page - 1)}>Previous</Button><Button variant="outline" disabled={!data?.next || busy} onClick={() => setPage(page + 1)}>Next</Button></div></div>;
}
export function StatusBadge({ status }) {
  let tone = "bg-white text-slate-700 ring-1 ring-inset ring-slate-200";
  if (["overdue", "cancelled", "expired", "review"].includes(status)) tone = "bg-red-50 text-red-800";
  if (["paid", "active"].includes(status)) tone = "bg-emerald-50 text-emerald-800";
  return <span className={`inline-flex rounded-md px-2 py-1 text-xs ${tone}`}>{String(status || "unknown").replaceAll("_", " ")}</span>;
}
