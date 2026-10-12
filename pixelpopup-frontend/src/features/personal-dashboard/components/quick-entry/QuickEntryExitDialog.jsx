import { ArrowLeft, PencilLine } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "../../ui/alert-dialog";

export default function QuickEntryExitDialog({ open, onOpenChange, onDiscard }) {
  return <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent className="personal-dashboard" onCloseAutoFocus={(event) => {
      event.preventDefault();
      document.getElementById("quick-entry-source")?.focus();
    }}>
      <AlertDialogHeader>
        <AlertDialogTitle>Leave without saving?</AlertDialogTitle>
        <AlertDialogDescription>Your draft entries will be discarded. No balances have changed.</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel><PencilLine className="size-4" aria-hidden="true" />Keep entering</AlertDialogCancel>
        <AlertDialogAction onClick={onDiscard}><ArrowLeft className="size-4" aria-hidden="true" />Discard draft</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
}
