import { ChevronRight, NotebookPen } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";

const typeLabels = { workday: "Workday", day_off: "Day off", vacation: "Vacation", holiday: "Holiday" };
const dateLabel = (value) => new Intl.DateTimeFormat("en-PH", { weekday: "short", month: "short", day: "numeric", timeZone: "Asia/Manila" })
  .format(new Date(`${value}T12:00:00+08:00`));

export default function EodTable({ dates, entriesByDate, selectedDate, onSelect }) {
  return <div className="overflow-hidden border border-[var(--pd-border)] bg-white">
    <Table className="table-fixed">
      <TableHeader className="bg-slate-50">
        <TableRow className="hover:bg-slate-50">
          <TableHead scope="col" className="w-28 px-4 text-xs font-semibold text-slate-600 sm:w-36">Date</TableHead>
          <TableHead scope="col" className="px-3 text-xs font-semibold text-slate-600">Entry</TableHead>
          <TableHead scope="col" className="hidden w-28 px-3 text-xs font-semibold text-slate-600 sm:table-cell">Type</TableHead>
          <TableHead scope="col" className="hidden w-36 px-3 text-xs font-semibold text-slate-600 lg:table-cell">Items</TableHead>
          <TableHead scope="col" className="w-8 px-2"><span className="sr-only">Open details</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {dates.map((date) => {
          const entry = entriesByDate.get(date);
          const selected = selectedDate === date;
          const done = entry?.items?.length || entry?.bullet_list?.length || 0;
          const inProgress = entry?.in_progress?.length || 0;
          return <TableRow key={date} onClick={() => onSelect(date)} data-state={selected ? "selected" : undefined} className="group cursor-pointer hover:bg-blue-50/50">
            <TableCell className="px-4 py-3 align-top">
              <button type="button" onClick={(event) => { event.stopPropagation(); onSelect(date); }} aria-expanded={selected} aria-controls={selected ? "eod-detail" : undefined} className="text-left text-sm font-semibold text-slate-950 tabular-nums underline-offset-2 group-hover:text-blue-700 group-hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                {dateLabel(date)}
              </button>
            </TableCell>
            <TableCell className="min-w-0 px-3 py-3 align-top whitespace-normal">
              {entry ? <>
                <span className="block truncate text-sm font-medium text-slate-950">{entry.title || "Untitled entry"}</span>
                {entry.summary && <span className="mt-0.5 block truncate text-xs text-slate-600">{entry.summary}</span>}
                <span className="mt-1 block text-xs text-slate-500 sm:hidden">{typeLabels[entry.type] || "Workday"}{entry.type === "workday" ? ` · ${done} done${inProgress ? ` · ${inProgress} in progress` : ""}` : ""}</span>
              </> : <span className="flex items-center gap-1.5 text-sm text-slate-600"><NotebookPen size={15} className="shrink-0 text-blue-600" aria-hidden="true" />Nothing logged yet</span>}
            </TableCell>
            <TableCell className="hidden px-3 py-3 align-top text-sm text-slate-600 sm:table-cell">{entry ? typeLabels[entry.type] || "Workday" : "No entry"}</TableCell>
            <TableCell className="hidden px-3 py-3 align-top text-xs text-slate-600 lg:table-cell">{entry?.type === "workday" ? <>{done} done{inProgress > 0 && <><br />{inProgress} in progress</>}</> : "None"}</TableCell>
            <TableCell className="px-2 py-3 align-top"><ChevronRight size={16} className="mt-0.5 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-700 motion-reduce:transition-none" aria-hidden="true" /></TableCell>
          </TableRow>;
        })}
      </TableBody>
    </Table>
  </div>;
}
