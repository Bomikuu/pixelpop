import { useEffect, useRef, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "../../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "../../ui/alert-dialog";

export default function FormModalShell({
  title, description, error, busy = false, dirty = false, saveLabel = "Save record",
  submitDisabled = false, onSubmit, onCancel, onCloseAutoFocus, children, footer,
  extraActions, busyLabel = "Saving…", preventOutsideClose = false,
  scrollBody = false,
}) {
  const [discard, setDiscard] = useState(false);
  const draftControl = useRef(null);

  useEffect(() => {
    const unload = (event) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", unload);
    return () => window.removeEventListener("beforeunload", unload);
  }, [dirty]);

  const tryClose = () => {
    if (busy) return;
    if (dirty) {
      draftControl.current = document.activeElement;
      setDiscard(true);
    } else onCancel();
  };

  return <>
    <Dialog open onOpenChange={(open) => { if (!open) tryClose(); }}>
      <DialogContent
        onCloseAutoFocus={onCloseAutoFocus}
        className={`personal-dashboard min-w-0 grid-cols-[minmax(0,1fr)] max-h-[90dvh] bg-white sm:max-w-2xl lg:w-[75vw] lg:max-w-[75vw] ${scrollBody ? "flex flex-col gap-0 overflow-hidden p-0" : "overflow-y-auto"}`}
        onInteractOutside={(event) => { if (busy || dirty || preventOutsideClose) event.preventDefault(); }}
      >
        <DialogHeader className={scrollBody ? "min-w-0 shrink-0 border-b px-4 py-4 pr-12 text-left sm:px-6 sm:pr-12" : "min-w-0"}>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={onSubmit} className={scrollBody ? "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden" : "min-w-0 space-y-4"}>
          <div className={scrollBody ? "min-h-0 min-w-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6" : "min-w-0 space-y-4"}>
          {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-900">{error}</p>}
          {children}
          </div>
          {footer || <div className={`flex min-w-0 shrink-0 flex-wrap justify-end gap-2 border-t ${scrollBody ? "bg-white px-4 py-3 sm:px-6" : "pt-4"}`}>
            <Button type="button" variant="outline" onClick={tryClose} disabled={busy}>Cancel</Button>
            {extraActions}
            <Button type="submit" disabled={busy || submitDisabled} aria-busy={busy} className="min-w-28">
              <Save aria-hidden="true" />{busy ? busyLabel : saveLabel}
            </Button>
          </div>}
        </form>
      </DialogContent>
    </Dialog>
    <AlertDialog open={discard} onOpenChange={setDiscard}>
      <AlertDialogContent
        className="personal-dashboard"
        onCloseAutoFocus={(event) => {
          if (draftControl.current?.isConnected) {
            event.preventDefault();
            draftControl.current.focus();
          } else onCloseAutoFocus?.(event);
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
          <AlertDialogDescription>These edits have not been saved. Your existing records will stay unchanged.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep editing</AlertDialogCancel>
          <AlertDialogAction onClick={onCancel}>Discard changes</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>;
}
