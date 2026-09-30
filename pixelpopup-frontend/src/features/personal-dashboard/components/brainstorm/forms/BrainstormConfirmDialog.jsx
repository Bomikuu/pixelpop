import { Trash2, Archive } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "../../../ui/alert-dialog";

export default function BrainstormConfirmDialog({ kind, record, busy, error, onConfirm, onCancel, onCloseAutoFocus }) {
  const deleting = kind === "delete";
  const active = record?.is_active;
  return <AlertDialog open onOpenChange={(open) => { if (!open && !busy) onCancel(); }}>
    <AlertDialogContent className="personal-dashboard" onCloseAutoFocus={onCloseAutoFocus}>
      <AlertDialogHeader>
        <AlertDialogTitle>{deleting ? "Delete idea?" : "Change board availability?"}</AlertDialogTitle>
        <AlertDialogDescription>
          {deleting ? `“${record.title}” will be removed from this board. A linked task will remain.`
            : active ? "Ideas remain saved, but this board becomes read-only until reactivated."
              : "You can add and change ideas on this board again."}
        </AlertDialogDescription>
      </AlertDialogHeader>
      {error && <p role="alert" className="border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <AlertDialogFooter>
        <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
        <AlertDialogAction disabled={busy} onClick={(event) => { event.preventDefault(); onConfirm(); }}
          className={deleting ? "bg-red-700 text-white hover:bg-red-800" : undefined}>
          {deleting ? <Trash2 size={15} /> : <Archive size={15} />}
          {busy ? "Saving…" : deleting ? "Delete idea" : active ? "Deactivate board" : "Reactivate board"}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
}
