import { useRef, useState } from "react";
import { PartyPopper } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "../../ui/alert-dialog";
import { money, requestId } from "../../lib/format";
import { formError } from "../../lib/sharedBills";

export default function CloseEventDialog({ bill, submit, close }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [key] = useState(requestId);
  const saving = useRef(false),
    errorRef = useRef(null);
  async function save(event) {
    event.preventDefault();
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      await submit({ request_id: key });
      close();
    } catch (failure) {
      setError(formError(failure));
      requestAnimationFrame(() => errorRef.current?.focus());
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) close();
      }}
    >
      <AlertDialogContent className="personal-dashboard">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-start gap-2">
            <PartyPopper
              size={20}
              aria-hidden="true"
              className="mt-0.5 shrink-0"
            />
            <span className="min-w-0 break-words">
              Mark {bill.title} all paid?
            </span>
          </AlertDialogTitle>
          <AlertDialogDescription>
            Confirm that volunteers covered any unpaid individual shares and
            that overpayers agreed the receiver can keep{" "}
            {money(bill.reimbursement_due)} in excess. No refund is recorded.
            Payment history, expenses, receivables and private accounts stay
            unchanged; this agreement is saved in the event history.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p
            ref={errorRef}
            tabIndex={-1}
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900"
          >
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>
            Keep balances open
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={busy || !bill.can_mark_all_paid}
            onClick={save}
          >
            {busy ? "Saving…" : "Mark all paid"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
