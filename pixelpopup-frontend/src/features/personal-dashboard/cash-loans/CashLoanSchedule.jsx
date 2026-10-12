import { CalendarClock } from "lucide-react";
import { Button } from "../ui/button";
import { dateLabel, money, words } from "../lib/format";

export default function CashLoanSchedule({ rows, onSelect }) {
  const next = rows.find((row) => Number(row.remaining_due) > 0);
  return <div className="max-h-[55dvh] overflow-auto rounded-md border border-[var(--pd-border)]">
    <table className="w-full min-w-[660px] text-left text-sm tabular-nums">
      <caption className="sr-only">Cash-loan installment schedule</caption>
      <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600"><tr>
        {["Installment", "Due date", "Principal", "Interest", "Charges", "Payment", "Remaining principal", ...(onSelect ? ["Status"] : [])].map((label) => <th key={label} scope="col" className="px-3 py-3 font-medium">{label}</th>)}
      </tr></thead>
      <tbody className="divide-y divide-[var(--pd-border)]">{rows.map((row) => <tr key={row.id || row.index} className={row === next ? "bg-blue-50 hover:bg-blue-100" : "bg-white hover:bg-slate-50"}>
        <td className="px-3 py-3">{onSelect ? <Button size="sm" variant="ghost" onClick={() => onSelect(row)}><CalendarClock size={15} />#{row.index}</Button> : "#" + row.index}</td>
        <td className="px-3 py-3 whitespace-nowrap">{dateLabel(row.due_date)}{row === next && <span className="block text-xs text-blue-800">Next unpaid</span>}</td>
        {["principal", "interest", "charges", "payment"].map((key) => <td key={key} className="px-3 py-3 whitespace-nowrap">{money(row[key])}</td>)}
        <td className="px-3 py-3 whitespace-nowrap">{money(row.remaining_principal)}</td>
        {onSelect && <td className="px-3 py-3"><span className={row.status === "overdue" ? "text-red-800" : row.status === "paid" ? "text-emerald-800" : "text-slate-600"}>{words(row.status)}{Number(row.remaining_due) > 0 && <span className="block text-xs">{money(row.remaining_due)} left</span>}</span></td>}
      </tr>)}</tbody>
    </table>
  </div>;
}
