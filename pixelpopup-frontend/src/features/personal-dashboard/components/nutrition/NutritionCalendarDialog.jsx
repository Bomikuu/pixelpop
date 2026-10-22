import { createContext, useContext, useEffect, useState } from "react";
import { AlertTriangle, Check, Minus } from "lucide-react";
import { Calendar, CalendarDayButton } from "../../ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { ErrorState } from "../Panel";
import { today } from "../../lib/format";
import { nutritionNumber as number } from "../../nutrition/dashboardModel";

const dateObject = (value) => new Date(`${value}T12:00:00`);
const dateString = (value) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
const CalendarStatus = createContext({ days: {}, loading: true });
const dayColors = {
  within_target: "border-emerald-200 bg-emerald-100 text-emerald-950 hover:bg-emerald-200 hover:text-emerald-950 data-[selected-single=true]:bg-emerald-100 data-[selected-single=true]:text-emerald-950",
  over_target: "border-red-200 bg-red-100 text-red-950 hover:bg-red-200 hover:text-red-950 data-[selected-single=true]:bg-red-100 data-[selected-single=true]:text-red-950",
};

function NutritionCalendarDay(props) {
  const { days, loading } = useContext(CalendarStatus);
  const row = days[dateString(props.day.date)];
  const status = row?.calorie_status;
  const description = loading ? "loading calorie status" : !row ? "no food logged" : `${row.meal_count} meals, ${number(row.calories, 2)} food kcal, ${status === "over_target" ? "over target" : status === "within_target" ? "at or below target" : "no calorie target set"}`;
  return <CalendarDayButton {...props} aria-label={`${props["aria-label"] || dateString(props.day.date)}, ${description}`} className={`relative border border-transparent data-[selected-single=true]:bg-white data-[selected-single=true]:text-slate-950 data-[selected-single=true]:ring-2 data-[selected-single=true]:ring-blue-600 ${dayColors[status] || ""}`}>
    {props.children}
    {status && <span className="absolute bottom-1" aria-hidden="true">{status === "over_target" ? <AlertTriangle className="size-3" /> : <Check className="size-3" />}</span>}
  </CalendarDayButton>;
}

export default function NutritionCalendarDialog({ date, request, onOpenDay, onClose, restoreFocus }) {
  const [month, setMonth] = useState(() => dateObject(date.slice(0, 7) + "-01"));
  const [retry, setRetry] = useState(0);
  const [state, setState] = useState({ key: "", data: [], target: null, error: "" });
  const monthKey = dateString(month).slice(0, 7), key = `${monthKey}:${retry}`;
  useEffect(() => {
    const controller = new AbortController();
    request(`nutrition/calendar/?month=${monthKey}`, { signal: controller.signal }).then((data) => {
      if (!controller.signal.aborted) setState({ key, data: data.days, target: data.target_kcal, error: "" });
    }).catch((failure) => {
      if (!controller.signal.aborted) setState({ key, data: [], target: null, error: failure.message });
    });
    return () => controller.abort();
  }, [request, monthKey, key]);
  const loaded = state.key === key;
  const days = Object.fromEntries(loaded ? state.data.map((row) => [row.date, row]) : []);
  return <Dialog open onOpenChange={(value) => { if (!value) onClose(); }}>
    <DialogContent className="personal-dashboard max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg" onCloseAutoFocus={restoreFocus}>
      <DialogHeader><DialogTitle>Meal log calendar</DialogTitle><DialogDescription>Choose a day to open its meals. Colors compare logged food calories with your current daily target.</DialogDescription></DialogHeader>
      {loaded && state.error ? <ErrorState message={state.error} retry={() => setRetry((value) => value + 1)} /> : <>
        <CalendarStatus.Provider value={{ days, loading: !loaded }}>
          <Calendar mode="single" showOutsideDays={false} month={month} onMonthChange={setMonth} selected={dateObject(date)} endMonth={dateObject(today())} disabled={{ after: dateObject(today()) }} onSelect={(value) => { if (value && onOpenDay) { onOpenDay(dateString(value)); onClose(); } }} components={{ DayButton: NutritionCalendarDay }} classNames={{ root: "w-full" }} className="mx-auto w-full max-w-[25rem] p-0 [--cell-size:2rem] sm:[--cell-size:3rem]" />
        </CalendarStatus.Provider>
        <ul aria-label="Calendar color legend" className="flex flex-wrap gap-x-4 gap-y-2 border-t border-[var(--pd-border)] pt-4 text-xs">
          <li className="flex items-center gap-2"><span className="grid size-6 place-items-center rounded border border-emerald-200 bg-emerald-100 text-emerald-900"><Check className="size-3.5" aria-hidden="true" /></span>At or below target</li>
          <li className="flex items-center gap-2"><span className="grid size-6 place-items-center rounded border border-red-200 bg-red-100 text-red-900"><AlertTriangle className="size-3.5" aria-hidden="true" /></span>Over target</li>
          <li className="flex items-center gap-2"><span className="grid size-6 place-items-center rounded border border-slate-200 bg-white text-slate-500"><Minus className="size-3.5" aria-hidden="true" /></span>No food log</li>
        </ul>
        {!loaded ? <p role="status" className="text-xs text-slate-500">Loading calorie statuses…</p> : <p className="text-xs leading-5 text-slate-600">{state.target != null ? `Current food target: ${number(state.target, 2)} kcal. Activity burn is not subtracted.` : "Set a daily calorie target to see green and red day indicators."} The selected day has a blue outline.</p>}
      </>}
      <div className="flex justify-end"><Button variant="outline" onClick={onClose}>Close</Button></div>
    </DialogContent>
  </Dialog>;
}
