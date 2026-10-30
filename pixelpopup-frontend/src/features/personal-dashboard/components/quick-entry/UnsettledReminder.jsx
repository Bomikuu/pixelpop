import { useState } from "react";
import { Clock, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../../ui/button";
import { today } from "../../lib/format";
import { formatMinorUnits, toMinorUnits } from "../../quick-entry/money";

export default function UnsettledReminder({ summary, user, embedded = false }) {
  const key = `personal-dashboard:unsettled-snooze:${typeof user === "string" ? user : user?.username || user?.id}`;
  const [until, setUntil] = useState(() => {
    try { return window.localStorage.getItem(key) || ""; }
    catch { return ""; /* Storage can be unavailable in private browsers. */ }
  });
  if (!summary?.count || until > today()) return null;
  function snooze() {
    const date = new Date(`${today()}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + 1);
    const value = date.toISOString().slice(0, 10);
    setUntil(value);
    try { window.localStorage.setItem(key, value); }
    catch { /* Keep the snooze for this mounted view when storage is unavailable. */ }
  }
  return <aside aria-label="Unsettled transaction reminder" className={"flex flex-wrap items-center justify-between gap-3 " + (embedded ? "py-4 first:pt-0 last:pb-0" : "rounded-md border border-[var(--pd-border)] bg-white p-4")}>
    <div className="flex min-w-0 items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--pd-soft)] text-slate-600"><Wallet className="size-4" aria-hidden="true" /></span><div><p className="text-sm font-medium">{summary.count} {summary.count === 1 ? "transaction needs" : "transactions need"} an account</p><p className="mt-1 text-xs leading-5 text-slate-600">Expenses {formatMinorUnits(toMinorUnits(summary.expenses))} · income {formatMinorUnits(toMinorUnits(summary.income))} · net {formatMinorUnits(toMinorUnits(summary.net))}. Already counted in reporting.</p></div></div>
    <div className="flex flex-wrap gap-2"><Button asChild variant="outline" size={embedded ? "sm" : "default"}><Link to="/dashboard/quick-entry-transactions?view=unsettled"><Wallet className="size-4" aria-hidden="true" />{embedded ? "Review entries" : "Settle now"}</Link></Button><Button variant="ghost" size={embedded ? "sm" : "default"} onClick={snooze}><Clock className="size-4" aria-hidden="true" />Remind tomorrow</Button></div>
  </aside>;
}
