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
        className="personal-dashboard max-h-[90dvh] overflow-y-auto bg-white sm:max-w-2xl lg:w-[75vw] lg:max-w-[75vw]"
        onInteractOutside={(event) => { if (busy || dirty || preventOutsideClose) event.preventDefault(); }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={onSubmit} className="space-y-4">
          {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-900">{error}</p>}
          {children}
          {footer || <div className="flex justify-end gap-2 border-t pt-4">
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
