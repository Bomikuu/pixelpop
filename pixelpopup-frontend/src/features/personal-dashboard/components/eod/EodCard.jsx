import { CalendarDays, ChevronRight, ListChecks, NotebookPen } from "lucide-react";
import EodPattern from "./EodPattern";
import "./eod.css";

const status = { workday: "Workday", day_off: "Day off", vacation: "Vacation", holiday: "Holiday" };
const weekday = (value) => new Intl.DateTimeFormat("en-PH", { weekday: "long" }).format(new Date(`${value}T12:00:00`));

export default function EodCard({ date, entry, selected, onSelect, wide }) {
  const tone = !entry ? "unlogged" : entry.type === "workday" ? "logged" : "neutral";

  return <button type="button" onClick={onSelect} aria-expanded={selected} aria-controls={selected ? "eod-detail" : undefined}
    className={`eod-card group relative flex min-h-44 min-w-0 flex-col overflow-hidden border bg-white p-4 text-left shadow-[0_3px_12px_-9px_rgba(15,23,42,.4)] transition-[border-color,box-shadow] hover:border-blue-300 hover:shadow-[0_8px_22px_-13px_rgba(15,23,42,.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 motion-reduce:transition-none ${wide ? "sm:col-span-2" : ""} ${selected ? "border-blue-500 ring-1 ring-blue-100" : "border-slate-200"}`}>
    <EodPattern tone={tone} />
    <span className="relative z-10 flex items-start justify-between gap-3">
      <span className="text-3xl font-semibold leading-none text-slate-950 tabular-nums">{Number(date.slice(8))}</span>
      <span className="whitespace-nowrap border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">{entry ? status[entry.type] || "Workday" : "No entry"}</span>
    </span>
    <span className="relative z-10 mt-2 text-xs text-slate-500">{weekday(date)}</span>
    {entry ? <span className="relative z-10 mt-5 line-clamp-2 text-sm font-semibold leading-5 text-slate-950">{entry.title}</span> : <span className="relative z-10 mt-5 flex items-center gap-2 text-sm font-semibold leading-5 text-slate-700"><span className="grid size-8 shrink-0 place-items-center rounded-full border border-blue-100 bg-blue-50 text-blue-700"><NotebookPen size={16} aria-hidden="true" /></span>Nothing logged yet</span>}
    {entry?.summary && <span className="relative z-10 mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{entry.summary}</span>}
    <span className="relative z-10 mt-auto flex items-center gap-1.5 pt-4 text-xs text-slate-500">
      {!entry ? <><CalendarDays size={13} aria-hidden="true" /> Add a recap</> : entry.type === "workday" ? <><ListChecks size={13} aria-hidden="true" /> {entry.items.length} {entry.items.length === 1 ? "item" : "items"}</> : <><CalendarDays size={13} aria-hidden="true" /> No work recap</>}
      <ChevronRight size={15} className="ml-auto text-slate-500 group-hover:translate-x-0.5 group-hover:text-blue-700" aria-hidden="true" />
    </span>
  </button>;
}
