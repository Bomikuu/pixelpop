import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ListTodo } from "lucide-react";
import { Button } from "../ui/button";
import QuickEntryForm from "../components/quick-entry/QuickEntryForm";
import QuickEntryExitDialog from "../components/quick-entry/QuickEntryExitDialog";
import NutritionDateControls from "../components/nutrition/NutritionDateControls";
import { today } from "../lib/format";

export default function QuickEntryView({ dashboard, notify }) {
  const navigate = useNavigate();
  const [date, setDate] = useState(today);
  const [draftState, setDraftState] = useState({ dirty: false, locked: false });
  const [exitOpen, setExitOpen] = useState(false);
  const [destination, setDestination] = useState("/dashboard");
  function leave(target) {
    if (draftState.locked) return;
    if (draftState.dirty) { setDestination(target); setExitOpen(true); }
    else navigate(target);
  }
  return <>
    <header className="space-y-4 border-b border-[var(--pd-border)] pb-5">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" className="h-11 px-2" onClick={() => leave("/dashboard")} disabled={draftState.locked}><ArrowLeft className="size-4" aria-hidden="true" />Dashboard</Button>
        <Button variant="ghost" className="h-11 px-2" onClick={() => leave("/dashboard/quick-entry-transactions?view=unsettled")} disabled={draftState.locked}>
          <ListTodo className="size-4" aria-hidden="true" />Unsettled{dashboard.data.unsettledCount > 0 ? ` (${dashboard.data.unsettledCount})` : ""}
        </Button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="text-2xl font-semibold">Quick Entry</h1><p className="mt-1 text-sm text-slate-600">Add expenses and income instantly.</p></div>
        <div inert={draftState.locked || undefined} className="w-full sm:w-auto [&>div]:flex-nowrap [&>div>div]:min-w-0 [&>div>div]:flex-1 sm:[&>div>div]:flex-none [&_button]:min-h-11 [&_button]:shrink-0 [&_button:last-child]:px-2 [&_input]:h-11 [&_input]:text-base sm:[&_input]:text-sm"><NutritionDateControls id="quick-entry-date" date={date} onChange={setDate} label="Transaction date" /></div>
      </div>
    </header>
    <div className="mt-5">
      <QuickEntryForm dashboard={dashboard} notify={notify} date={date} onStateChange={setDraftState} />
    </div>
    <QuickEntryExitDialog open={exitOpen} onOpenChange={setExitOpen} onDiscard={() => navigate(destination)} />
  </>;
}
