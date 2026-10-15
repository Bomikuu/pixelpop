import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Button } from "../../ui/button";
import { EmptyState } from "../Panel";

export default function ServiceTable({ columns, rows, rowKey = "id", empty = "No records yet" }) {
  if (!rows?.length) return <EmptyState title={empty} message="Saved records will appear here." />;
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
