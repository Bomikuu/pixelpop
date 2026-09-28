import { useRef, useState } from "react";
import { Check, X, Clock } from "lucide-react";
import SharedFormFrame from "./SharedFormFrame";
import { Button } from "../../ui/button";
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
import { money, dateLabel } from "../../lib/format";
import { formError, initials } from "../../lib/sharedBills";

export default function PublicReportReviewDialog({ bill, submit, close }) {
  const reports = bill.payments.filter(
    (payment) => payment.status === "pending",
  );
  const [decision, setDecision] = useState(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const saving = useRef(false),
    errorRef = useRef(null);
  async function decide(event) {
    event.preventDefault();
    if (saving.current || !decision) return;
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      await submit(decision.endpoint, decision.payment);
      setDecision(null);
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
    <>
      <SharedFormFrame
        title="Review payment reports"
        description="Confirm only payments that actually happened. Your PIN changes this event’s balances, never the owner’s private expenses or accounts."
        busy={busy}
        dirty={false}
        close={close}
      >
        {!reports.length ? (
          <p
            role="status"
            className="flex items-center gap-2 py-4 text-sm text-slate-600"
          >
            <Clock aria-hidden="true" />
            No reports awaiting confirmation.
          </p>
        ) : (
          <ul className="divide-y">
            {reports.map((payment) => (
              <li
                key={payment.id}
                className="flex flex-wrap items-center justify-between gap-4 py-4"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-semibold"
                  >
                    {initials(payment.payer_name)}
                  </span>
                  <div className="min-w-0 text-sm">
                    <p className="break-words font-medium">
                      {payment.payer_name} →{" "}
                      {payment.paid_to_name || "Bill provider"}
                    </p>
                    <p className="mt-1 text-slate-600">
                      {money(payment.amount)} · {dateLabel(payment.date)}
                      {payment.kind === "refund" && " · Overpayment refund"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => {
                      setError("");
                      setDecision({ endpoint: "reject/", payment });
                    }}
                  >
                    <X aria-hidden="true" />
                    Reject
                  </Button>
                  <Button
                    disabled={busy}
                    onClick={() => {
                      setError("");
                      setDecision({ endpoint: "approve/", payment });
                    }}
                  >
                    <Check aria-hidden="true" />
                    Confirm
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SharedFormFrame>
      <AlertDialog
        open={Boolean(decision)}
        onOpenChange={(open) => {
          if (!open && !busy) setDecision(null);
        }}
      >
        <AlertDialogContent className="personal-dashboard">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {decision?.endpoint === "approve/"
                ? decision?.payment.kind === "refund"
                  ? "Confirm this refund?"
                  : "Confirm this payment?"
                : "Reject this report?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {decision &&
                `${decision.payment.payer_name} paid ${money(decision.payment.amount)} to ${decision.payment.paid_to_name || "the bill provider"} on ${dateLabel(decision.payment.date)}. `}
              {decision?.endpoint === "approve/"
                ? "This counts in the event breakdown only. The owner will review private ledger recording separately."
                : "The report stays in history as rejected and does not count toward balances."}
              {decision?.endpoint === "approve/" &&
                decision?.payment.kind === "refund" &&
                " The refund reduces the recipient’s net contribution and the event’s funds."}
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
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={decide} disabled={busy}>
              {busy
                ? "Saving…"
                : decision?.endpoint === "approve/"
                  ? decision?.payment.kind === "refund"
                    ? "Confirm refund"
                    : "Confirm payment"
                  : "Reject report"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
