import { useRef, useState } from "react";
import { Activity, CalendarDays, LayoutGrid, Library, Scale, Settings2, UtensilsCrossed } from "lucide-react";
import { Button } from "../../ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../ui/dialog";

export default function NutritionToolbar({ entryRef, onTargets, onCalendar, onMeal, onActivity, onWeight, onLibrary }) {
  const [open, setOpen] = useState(false);
  const pendingAction = useRef(null);
  const actions = [
    ["Add meal", "Enter foods and macros manually or paste meal JSON.", UtensilsCrossed, onMeal],
    ["Add activity", "Estimate active burn or enter your own calorie amount.", Activity, onActivity],
    ["Log weight", "Record or update the weight measured on this day.", Scale, onWeight],
    ["Meal library", "Review past meals, individual foods and saved presets.", Library, onLibrary],
    ["Log calendar", "Browse logged days and compare food intake with your target.", CalendarDays, onCalendar],
    ["Targets & baseline", "Change calorie and macro targets, height or goal weight.", Settings2, onTargets],
  ];
  return <Dialog open={open} onOpenChange={(value) => { if (value) pendingAction.current = null; setOpen(value); }}>
    <DialogTrigger asChild><Button ref={entryRef} variant="outline"><LayoutGrid className="size-4" />Nutrition tools</Button></DialogTrigger>
    <DialogContent className="personal-dashboard flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden sm:max-w-2xl" onCloseAutoFocus={(event) => {
      if (pendingAction.current) {
        event.preventDefault();
        const action = pendingAction.current;
        pendingAction.current = null;
        queueMicrotask(action);
      }
    }}>
      <DialogHeader className="text-left"><DialogTitle>Nutrition actions</DialogTitle><DialogDescription>Choose what to log, reuse or review for this day.</DialogDescription></DialogHeader>
      <div className="grid min-h-0 gap-3 overflow-y-auto p-0.5 sm:grid-cols-2">
        {actions.filter(([, , , action]) => action).map(([title, description, Icon, action]) => <Button key={title} type="button" variant="outline" className="h-auto items-start justify-start gap-3 whitespace-normal p-4 text-left hover:border-blue-300 hover:bg-blue-50/50" onClick={() => { pendingAction.current = action; setOpen(false); }}>
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-blue-50 text-[var(--pd-primary)]"><Icon className="size-5" aria-hidden="true" /></span>
          <span className="min-w-0"><span className="block font-semibold text-slate-950">{title}</span><span className="mt-1 block text-xs font-normal leading-5 text-slate-600">{description}</span></span>
        </Button>)}
      </div>
      <DialogFooter><DialogClose asChild><Button variant="outline">Close</Button></DialogClose></DialogFooter>
    </DialogContent>
  </Dialog>;
}
