import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Archive,
  ArchiveRestore,
  Receipt,
  UserPlus,
  Clock,
} from "lucide-react";
import { useRecords } from "../hooks/useDashboardData";
import { Button } from "../ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "../ui/alert-dialog";
import { ErrorState, Panel } from "../components/Panel";
import BillBreakdown from "../components/shared-bills/BillBreakdown";
import BillPaymentDialog from "../components/shared-bills/BillPaymentDialog";
import BillSharing from "../components/shared-bills/BillSharing";
import ParticipantAvatars from "../components/shared-bills/ParticipantAvatars";
import AddParticipantDialog from "../components/shared-bills/AddParticipantDialog";
import { money, dateLabel } from "../lib/format";
import { formError } from "../lib/sharedBills";

export default function SharedBillView({ billId, dashboard, month, notify }) {
  const state = useRecords(
    "shared-bills/" + billId + "/",
    dashboard.request,
    dashboard.version,
  );
  const [paymentOpen, setPaymentOpen] = useState(false),
    [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [participantOpen, setParticipantOpen] = useState(false);
  const [reportedPayment, setReportedPayment] = useState(null);
  const [rejectPayment, setRejectPayment] = useState(null);
  const heading = useRef(null),
    paymentTrigger = useRef(null);
  const bill = state.data;
  useEffect(() => {
    heading.current?.focus();
  }, [bill?.id]);
  useEffect(() => {
    if (!bill?.title) return;
    const previous = document.title;
    document.title = bill.title + " | Shared bill";
    return () => {
      document.title = previous;
    };
  }, [bill?.title]);
  async function archive(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await dashboard.mutate("shared-bills/" + bill.id + "/archive/", {
        archived: !bill.archived,
      });
      setConfirm(false);
      notify(
        bill.archived
          ? "Shared bill restored."
          : "Shared bill archived. Its share link was revoked.",
      );
    } catch (failure) {
      setError(formError(failure));
    } finally {
      setBusy(false);
    }
  }
  async function rejectReport(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await dashboard.mutate(
        "shared-bills/" +
          bill.id +
          "/payments/" +
          rejectPayment.id +
          "/reject/",
        {},
      );
      setRejectPayment(null);
      notify(
        "Payment report rejected. Balances and your ledger were not changed.",
      );
    } catch (failure) {
      setError(formError(failure));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-5">
      <Button asChild variant="ghost">
        <Link to={"/dashboard/people?view=shared&month=" + month}>
          <ArrowLeft aria-hidden="true" />
          Back to shared bills
        </Link>
      </Button>
      {state.loading ? (
        <p role="status" className="py-8 text-sm text-slate-600">
          Loading breakdown…
        </p>
      ) : state.error ? (
        <ErrorState message={state.error} retry={dashboard.refresh} />
      ) : (
        bill && (
          <>
            <header className="flex flex-wrap items-start justify-between gap-4 border-b pb-5">
              <div className="min-w-0">
                <h2
                  ref={heading}
                  tabIndex={-1}
                  className="flex items-start gap-3 break-words text-xl font-semibold"
                >
                  <Receipt
                    className="mt-1 shrink-0 text-[var(--pd-primary)]"
                    size={22}
                    aria-hidden="true"
                  />
                  {bill.title}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {dateLabel(bill.date)} · {bill.category_name}
                  {bill.archived && " · Archived"}
                </p>
                <div className="mt-3">
                  <ParticipantAvatars participants={bill.participants} />
                </div>
                <p className="mt-3 text-sm">
                  Your agreed contribution:{" "}
                  <strong className="text-[var(--pd-primary)] tabular-nums">
                    {money(bill.my_share)}
                  </strong>{" "}
                  <span className="text-slate-600">
                    · The group total is not your expense.
                  </span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {!bill.archived && (
                  <Button
                    variant="outline"
                    onClick={() => setParticipantOpen(true)}
                    disabled={bill.participants.length >= 50}
                  >
                    <UserPlus aria-hidden="true" />
                    Add person
                  </Button>
                )}
                {!bill.archived && (
                  <Button
                    ref={paymentTrigger}
                    onClick={() => setPaymentOpen(true)}
                    disabled={
                      bill.participants.every(
                        (person) => Number(person.remaining) <= 0,
                      ) && Number(bill.remaining_bill) <= 0
                    }
                  >
                    <Plus aria-hidden="true" />
                    Record payment
                  </Button>
                )}
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => setConfirm(true)}
                >
                  {bill.archived ? (
                    <ArchiveRestore aria-hidden="true" />
                  ) : (
                    <Archive aria-hidden="true" />
                  )}
                  {bill.archived ? "Restore bill" : "Archive bill"}
                </Button>
              </div>
            </header>
            {!bill.archived &&
              bill.payments.some((payment) => payment.status === "pending") && (
                <Panel
                  title="Payment reports to review"
                  description="These reports have not changed balances or your ledger. Confirm only payments that actually happened."
                >
                  <ul className="divide-y">
                    {bill.payments
                      .filter((payment) => payment.status === "pending")
                      .map((payment) => (
                        <li
                          key={payment.id}
                          className="flex flex-wrap items-center justify-between gap-3 py-3"
                        >
                          <div className="flex min-w-0 items-start gap-3">
                            <Clock
                              className="mt-1 shrink-0 text-amber-700"
                              size={18}
                              aria-hidden="true"
                            />
                            <div className="min-w-0 text-sm">
                              <p className="break-words font-medium">
                                {payment.payer_name} →{" "}
                                {payment.paid_to_name || "Bill provider"}
                              </p>
                              <p className="mt-1 text-slate-600">
                                {money(payment.amount)} ·{" "}
                                {dateLabel(payment.date)}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              disabled={busy}
                              onClick={() => {
                                setError("");
                                setRejectPayment(payment);
                              }}
                            >
                              Reject
                            </Button>
                            <Button
                              disabled={busy}
                              onClick={() => setReportedPayment(payment)}
                            >
                              Review payment
                            </Button>
                          </div>
                        </li>
                      ))}
                  </ul>
                </Panel>
              )}
            <BillBreakdown bill={bill} />
            {!bill.archived && <BillSharing {...{ bill, dashboard, notify }} />}
            {paymentOpen && (
              <BillPaymentDialog
                {...{ bill, dashboard, notify }}
                close={() => {
                  setPaymentOpen(false);
                  requestAnimationFrame(() => paymentTrigger.current?.focus());
                }}
              />
            )}
            {participantOpen && (
              <AddParticipantDialog
                {...{ bill, dashboard }}
                close={() => setParticipantOpen(false)}
                submit={async (body) => {
                  await dashboard.mutate(
                    "shared-bills/" + bill.id + "/participants/",
                    body,
                  );
                  notify(
                    "Person added. Contributions and reimbursement balances updated.",
                  );
                }}
              />
            )}
            {reportedPayment && (
              <BillPaymentDialog
                {...{ bill, dashboard, notify, reportedPayment }}
                close={() => setReportedPayment(null)}
              />
            )}
            <AlertDialog
              open={Boolean(rejectPayment)}
              onOpenChange={(open) => {
                if (!open && !busy) setRejectPayment(null);
              }}
            >
              <AlertDialogContent className="personal-dashboard">
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Reject this payment report?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    The report stays in the event history as rejected. No
                    balances or ledger entries are changed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                {error && <ErrorState message={error} />}
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={busy}>
                    Keep report
                  </AlertDialogCancel>
                  <AlertDialogAction disabled={busy} onClick={rejectReport}>
                    {busy ? "Rejecting…" : "Reject report"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <AlertDialog
              open={confirm}
              onOpenChange={(open) => {
                if (!busy) setConfirm(open);
              }}
            >
              <AlertDialogContent className="personal-dashboard">
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {bill.archived
                      ? "Restore this shared bill?"
                      : "Archive this shared bill?"}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {bill.archived
                      ? "The bill returns to your active list. Create a new share link if needed."
                      : "Financial records are kept. The bill leaves your active list and its shared link stops working."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                {error && <ErrorState message={error} />}
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
                  <AlertDialogAction disabled={busy} onClick={archive}>
                    {busy
                      ? "Saving…"
                      : bill.archived
                        ? "Restore bill"
                        : "Archive bill"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )
      )}
    </div>
  );
}
