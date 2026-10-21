import { useEffect, useState } from "react";
import { Calendar, CalendarDayButton } from "../../ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { ErrorState } from "../Panel";
import { today } from "../../lib/format";
const dateObject = (value) => new Date(`${value}T12:00:00`);
const dateString = (value) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
export default function NutritionCalendarDialog({ date, request, onOpenDay, onClose, restoreFocus }) {
  const [month, setMonth] = useState(() => dateObject(date.slice(0, 7) + "-01")), [retry, setRetry] = useState(0);
  const [state, setState] = useState({ key: "", data: [], error: "" });
  const monthKey = dateString(month).slice(0, 7), key = `${monthKey}:${retry}`;
  useEffect(() => {
    const controller = new AbortController();
    request(`nutrition/calendar/?month=${monthKey}`, { signal: controller.signal }).then((data) => { if (!controller.signal.aborted) setState({ key, data: data.days, error: "" }); }).catch((failure) => { if (!controller.signal.aborted) setState({ key, data: [], error: failure.message }); });
    return () => controller.abort();
  }, [request, monthKey, key]);
  const loaded = state.key === key, counts = Object.fromEntries(loaded ? state.data.map((row) => [row.date, row.meal_count]) : []);
  function DayButton(props) { const count = counts[dateString(props.day.date)]; return <CalendarDayButton {...props} aria-label={`${props["aria-label"] || dateString(props.day.date)}${count ? `, ${count} meals logged` : ", no meal records"}`}>{props.children}{count > 0 && <span aria-hidden="true" className="absolute bottom-1 size-1 rounded-full bg-current" />}</CalendarDayButton>; }
  return <Dialog open onOpenChange={(value) => { if (!value) onClose(); }}><DialogContent className="personal-dashboard max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-sm" onCloseAutoFocus={restoreFocus}><DialogHeader><DialogTitle>Meal log calendar</DialogTitle><DialogDescription>A dot means meals were recorded—not that a nutrition target was met. Future dates are unavailable.</DialogDescription></DialogHeader>{loaded && state.error ? <ErrorState message={state.error} retry={() => setRetry((value) => value + 1)} /> : <><Calendar mode="single" month={month} onMonthChange={setMonth} selected={dateObject(date)} endMonth={dateObject(today())} disabled={{ after: dateObject(today()) }} onSelect={(value) => { if (value && onOpenDay) { onOpenDay(dateString(value)); onClose(); } }} components={{ DayButton }} className="mx-auto" />{!loaded && <p role="status" className="text-xs text-slate-500">Loading meal markers…</p>}</>}<Button variant="outline" onClick={onClose}>Close</Button></DialogContent></Dialog>;
}
