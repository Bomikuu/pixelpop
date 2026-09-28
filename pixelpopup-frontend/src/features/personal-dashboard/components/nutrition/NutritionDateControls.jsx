import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { today } from "../../lib/format";

function shiftDate(value, offset) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

export default function NutritionDateControls({ date, onChange }) {
  const todayValue = today();
  return <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end" aria-label="Selected nutrition day">
    <Button variant="outline" size="icon" aria-label="Previous day" onClick={() => onChange(shiftDate(date, -1))}><ChevronLeft className="size-4" aria-hidden="true" /></Button>
    <div className="relative w-44"><CalendarDays className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-slate-500" aria-hidden="true" /><Input type="date" aria-label="Nutrition date" value={date} max={todayValue} onChange={(event) => { if (event.target.value && event.target.value <= today()) onChange(event.target.value); }} className="pl-9" /></div>
    <Button variant="outline" size="icon" aria-label="Next day" disabled={date >= todayValue} onClick={() => { const next = shiftDate(date, 1); if (next <= today()) onChange(next); }}><ChevronRight className="size-4" aria-hidden="true" /></Button>
    <Button variant="ghost" onClick={() => onChange(today())}>Today</Button>
  </div>;
}
