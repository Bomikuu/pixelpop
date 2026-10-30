import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { today } from "../../lib/format";
import MonthPicker from "../MonthPicker";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../../ui/dialog";

function shiftDate(value, offset) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

function shiftMonth(value, offset) {
  const date = new Date(`${value}-01T12:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + offset);
  return date.toISOString().slice(0, 7);
}

export default function NutritionDateControls({ date, onChange, mode = "day", id, label, compact = false }) {
  const [open, setOpen] = useState(false);
  const monthMode = mode === "month";
  const todayValue = today();
  const latest = monthMode ? todayValue.slice(0, 7) : todayValue;
  const move = monthMode ? shiftMonth : shiftDate;
  const inputLabel = label || (monthMode ? "Summary month" : "Nutrition date");
  return <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end" data-compact={compact || undefined} aria-label={monthMode ? `Selected ${inputLabel.toLowerCase()}` : "Selected nutrition day"}>
    <Button variant="outline" size="icon" aria-label={monthMode ? "Previous month" : "Previous day"} onClick={() => onChange(move(date, -1))}><ChevronLeft className="size-4" aria-hidden="true" /></Button>
    {monthMode ? <MonthPicker id={id} month={date} currentMonth={latest} onChange={onChange} label={inputLabel} /> : compact ? <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button type="button" variant="outline" aria-label={`${inputLabel}: ${date}. Choose date.`}><CalendarDays className="size-4" aria-hidden="true" /><span>{new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`))}</span></Button></DialogTrigger>
      <DialogContent className="personal-dashboard sm:max-w-sm">
        <DialogHeader><DialogTitle>Choose nutrition date</DialogTitle><DialogDescription>View your meals and activity for today or an earlier date.</DialogDescription></DialogHeader>
        <Input id={id} type="date" aria-label={inputLabel} value={date} max={todayValue} onChange={(event) => { if (event.target.value && event.target.value <= today()) { onChange(event.target.value); setOpen(false); } }} />
        <Button type="button" variant="outline" onClick={() => { onChange(today()); setOpen(false); }}>Today</Button>
      </DialogContent>
    </Dialog> : <div className="relative w-44"><CalendarDays className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-slate-500" aria-hidden="true" /><Input id={id} type="date" aria-label={inputLabel} value={date} max={todayValue} onChange={(event) => { if (event.target.value && event.target.value <= today()) onChange(event.target.value); }} className="pl-9" /></div>}
    <Button variant="outline" size="icon" aria-label={monthMode ? "Next month" : "Next day"} disabled={date >= latest} onClick={() => { const next = move(date, 1); if (next <= latest) onChange(next); }}><ChevronRight className="size-4" aria-hidden="true" /></Button>
    {!monthMode && !compact && <Button variant="ghost" onClick={() => onChange(today())}>Today</Button>}
  </div>;
}
