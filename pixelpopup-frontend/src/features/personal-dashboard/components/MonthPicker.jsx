import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { monthLabel } from "../lib/format";

const months = Array.from({ length: 12 }, (_, index) =>
  new Intl.DateTimeFormat("en-PH", { month: "long" }).format(new Date(2020, index, 1))
);

export default function MonthPicker({ month, currentMonth, onChange, label = "Month", id }) {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(Number(month.slice(0, 4)));
  const latestYear = Number(currentMonth.slice(0, 4));

  return <Dialog open={open} onOpenChange={(nextOpen) => { setOpen(nextOpen); if (nextOpen) setYear(Number(month.slice(0, 4))); }}>
    <DialogTrigger asChild><Button id={id} type="button" variant="outline" className="min-w-40 justify-between gap-3" aria-label={`${label}: ${monthLabel(month)}. Choose month.`}><span>{monthLabel(month)}</span><CalendarDays size={16} aria-hidden="true" /></Button></DialogTrigger>
    <DialogContent className="personal-dashboard sm:max-w-sm" aria-describedby="dashboard-month-description">
      <DialogHeader><DialogTitle>Choose a month</DialogTitle><DialogDescription id="dashboard-month-description">Browse your workspace by month.</DialogDescription></DialogHeader>
      <div className="flex items-center justify-between border-b border-[var(--pd-border)] pb-3">
        <Button type="button" size="icon" variant="outline" onClick={() => setYear((value) => value - 1)} disabled={year <= 1} aria-label="Previous year"><ChevronLeft size={16} aria-hidden="true" /></Button>
        <span className="font-semibold tabular-nums text-slate-950">{year}</span>
        <Button type="button" size="icon" variant="outline" onClick={() => setYear((value) => value + 1)} disabled={year >= latestYear} aria-label="Next year"><ChevronRight size={16} aria-hidden="true" /></Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {months.map((label, index) => {
          const value = `${String(year).padStart(4, "0")}-${String(index + 1).padStart(2, "0")}`;
          const isSelected = value === month;
          return <button key={value} type="button" disabled={value > currentMonth} aria-current={isSelected ? "date" : undefined} onClick={() => { onChange(value); setOpen(false); }} className={`min-h-10 border px-2 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-40 ${isSelected ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"}`}>{label}</button>;
        })}
      </div>
    </DialogContent>
  </Dialog>;
}
