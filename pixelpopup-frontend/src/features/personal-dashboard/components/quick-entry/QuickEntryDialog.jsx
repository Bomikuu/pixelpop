import { useState } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../ui/dialog";
import { Button } from "../../ui/button";
import NutritionDateControls from "../nutrition/NutritionDateControls";
import { today } from "../../lib/format";
import QuickEntryForm from "./QuickEntryForm";
import QuickEntryExitDialog from "./QuickEntryExitDialog";

export default function QuickEntryDialog({ open, onOpenChange, dashboard, notify, restoreFocus }) {
  const [date, setDate] = useState(today);
  const [draftState, setDraftState] = useState({ dirty: false, locked: false });
  const [exitOpen, setExitOpen] = useState(false);
  function close(next) {
    if (next) { onOpenChange(true); return; }
    if (draftState.locked) return;
    if (draftState.dirty) setExitOpen(true); else onOpenChange(false);
  }
  return <>
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="personal-dashboard flex max-h-[92dvh] w-[calc(100%-1rem)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:w-[75vw] sm:max-w-5xl" showCloseButton={false} onInteractOutside={(event) => event.preventDefault()} onOpenAutoFocus={(event) => event.preventDefault()} onCloseAutoFocus={(event) => { event.preventDefault(); restoreFocus?.(); }}>
        <DialogHeader className="shrink-0 border-b border-[var(--pd-border)] p-4 text-left sm:p-5">
          <div className="flex items-start justify-between gap-3"><div><DialogTitle>Quick Entry</DialogTitle><DialogDescription className="mt-2">Record several expenses and income in one go.</DialogDescription></div><Button variant="ghost" size="icon" className="size-11 shrink-0" onClick={() => close(false)} disabled={draftState.locked} aria-label="Close Quick Entry"><X className="size-4" aria-hidden="true" /></Button></div>
          <div inert={draftState.locked || undefined} className="mt-2 [&>div]:flex-nowrap [&>div>div]:min-w-0 [&>div>div]:flex-1 sm:[&>div>div]:flex-none [&_button]:min-h-11 [&_button]:shrink-0 [&_button:last-child]:px-2 [&_input]:h-11 [&_input]:text-base sm:[&_input]:text-sm"><NutritionDateControls id="quick-entry-popup-date" date={date} onChange={setDate} label="Transaction date" /></div>
        </DialogHeader>
        <div className="min-h-0 overflow-y-auto px-4 pt-4 sm:px-5">
          <QuickEntryForm dashboard={dashboard} notify={notify} date={date} onStateChange={setDraftState} />
        </div>
      </DialogContent>
    </Dialog>
    <QuickEntryExitDialog open={exitOpen} onOpenChange={setExitOpen} onDiscard={() => { setDraftState({ dirty: false, locked: false }); onOpenChange(false); }} />
  </>;
}
