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
  KeyRound,
  Pencil,
  Check,
  PartyPopper,
  ArrowLeftRight,
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
import EditBillDialog from "../components/shared-bills/EditBillDialog";
import PaymentReceiver from "../components/shared-bills/PaymentReceiver";
import PublicPaymentDialog from "../components/shared-bills/PublicPaymentDialog";
import CloseEventDialog from "../components/shared-bills/CloseEventDialog";
import { money, dateLabel } from "../lib/format";
import MoneyFlowAmount from "../components/MoneyFlowAmount";
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
  const [pinOpen, setPinOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [allocationOpen, setAllocationOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false),
    [closeOpen, setCloseOpen] = useState(false);
  const heading = useRef(null),
    paymentTrigger = useRef(null),
    pinTrigger = useRef(null);
  const bill = state.data;
  const reviewReports =
    bill?.payments.filter(
      (payment) =>
        payment.status === "pending" ||
        (payment.status === "confirmed" && payment.ledger_reviewed === false),
    ) || [];
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
  async function acceptAllocation(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await dashboard.mutate(
        "shared-bills/" + bill.id + "/ledger-allocation/",
        {},
      );
      setAllocationOpen(false);
      notify(
        "Ledger shares and receivables updated. Past expenses and cash movements were kept.",
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
            <header className="flex flex-wrap items-start justify-between gap-4 rounded-xl border bg-white p-5 sm:p-6">
              <div className="flex min-w-0 flex-1 items-start gap-4">
                <span className="grid size-14 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-700 sm:size-16">
                  <Receipt size={28} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2
                    ref={heading}
                    tabIndex={-1}
                    className="break-words text-2xl font-semibold"
                  >
                    {bill.title}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    {dateLabel(bill.date)} · {bill.category_name}
                    {bill.archived && " · Archived"}
                  </p>
                  <div className="mt-3">
                    <ParticipantAvatars participants={bill.participants} />
                  </div>
                  <PaymentReceiver bill={bill} />
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
              </div>
              <div className="flex flex-wrap gap-2">
                {!bill.archived && (
                  <Button variant="outline" onClick={() => setEditOpen(true)}>
                    <Pencil aria-hidden="true" />
                    Edit event
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
                {!bill.archived && (
                  <Button
                    ref={pinTrigger}
                    variant="outline"
                    onClick={() => setPinOpen(true)}
                  >
                    <KeyRound aria-hidden="true" />
                    Editing PIN
                  </Button>
                )}
              </div>
            </header>
            {!bill.archived && bill.ledger_allocation_pending && (
              <Panel
                title="Contribution changes need ledger review"
                description="The event uses the new shares. Your recorded expenses, accounts and existing receivables still use the previously accepted ledger allocation."
              >
                <p className="text-sm text-slate-600">
                  Your new agreed share:{" "}
                  <strong className="text-blue-700 tabular-nums">
                    {money(bill.my_share)}
                  </strong>{" "}
                  · Previously accepted share:{" "}
                  <strong className="tabular-nums">
                    {money(
                      bill.participants.find((person) => person.is_me)
                        ?.ledger_share,
                    )}
                  </strong>{" "}
                  · Recorded expenses:{" "}
                  <strong className="tabular-nums">
                    <MoneyFlowAmount amount={bill.my_recorded_expense} direction="out" />
                  </strong>
                  .
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setError("");
                      setAllocationOpen(true);
                    }}
                  >
                    <Check aria-hidden="true" />
                    Review ledger shares
                  </Button>
                  <Button variant="ghost" asChild>
                    <Link to="/dashboard/transactions">
                      View recorded expenses
                    </Link>
                  </Button>
                </div>
              </Panel>
            )}
            {!bill.archived && reviewReports.length > 0 && (
              <Panel
                title="Payment reports to review"
                description="Pending reports need event confirmation. Reports already confirmed by a PIN holder count in the event, but still need your private ledger review."
              >
                <ul className="divide-y">
                  {reviewReports.map((payment) => (
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
                            {money(payment.amount)} · {dateLabel(payment.date)}
                          </p>
                          <p className="mt-1 text-xs font-medium text-amber-800">
                            {payment.status === "confirmed"
                              ? "Confirmed for event · Ledger review needed"
                              : "Awaiting event confirmation"}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {payment.status === "pending" && (
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
                        )}
                        <Button
                          disabled={busy}
                          onClick={() => setReportedPayment(payment)}
                        >
                          {payment.status === "confirmed"
                            ? "Review ledger"
                            : "Review payment"}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </Panel>
            )}
            <BillBreakdown
              bill={bill}
              actions={
                !bill.archived && (
                  <div className="flex w-full flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setParticipantOpen(true)}
                      disabled={bill.participants.length >= 50}
                    >
                      <UserPlus aria-hidden="true" />
                      Add person
                    </Button>
                    <Button
                      ref={paymentTrigger}
                      size="lg"
                      onClick={() => setPaymentOpen(true)}
                    >
                      <Plus aria-hidden="true" />
                      Record payment
                    </Button>
                    {bill.receiver_id && (
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => setRefundOpen(true)}
                      >
                        <ArrowLeftRight aria-hidden="true" />
                        Reimburse
                      </Button>
                    )}
                    {bill.can_mark_all_paid && (
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => setCloseOpen(true)}
                      >
                        <PartyPopper aria-hidden="true" />
                        Mark all paid
                      </Button>
                    )}
                  </div>
                )
              }
            />
            {!bill.archived && (
              <BillSharing
                key={bill.id}
                {...{
                  bill,
                  dashboard,
                  notify,
                  pinOpen,
                  setPinOpen,
                  pinTrigger,
                }}
              />
            )}
            {paymentOpen && (
              <BillPaymentDialog
                {...{ bill, dashboard, notify }}
                close={() => {
                  setPaymentOpen(false);
                  requestAnimationFrame(() => paymentTrigger.current?.focus());
                }}
              />
            )}
            {editOpen && (
              <EditBillDialog
                {...{ bill, dashboard, notify }}
                close={() => setEditOpen(false)}
              />
            )}
            {refundOpen && (
              <PublicPaymentDialog
                bill={bill}
                paymentKind="reimbursement"
                privateEntry
                close={() => setRefundOpen(false)}
                submit={async (body) => {
                  await dashboard.mutate(
                    "shared-bills/" + bill.id + "/pay/",
                    body,
                  );
                  notify(
                    "Overpayment refunded in the event. Private accounts were not changed.",
                  );
                }}
              />
            )}
            {closeOpen && (
              <CloseEventDialog
                bill={bill}
                close={() => setCloseOpen(false)}
                submit={async (body) => {
                  await dashboard.mutate(
                    "shared-bills/" + bill.id + "/close/",
                    body,
                  );
                  notify(
                    "All paid! Volunteer coverage and waived excess have been recorded. Thank you, everyone!",
                    {
                      tone: "celebrate",
                      action: "paid",
                      entity: "shared_bill",
                    },
                  );
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
                    "Person added. Event contributions updated; private ledger changes need your review.",
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
              open={allocationOpen}
              onOpenChange={(open) => {
                if (!busy) setAllocationOpen(open);
              }}
            >
              <AlertDialogContent className="personal-dashboard">
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Accept the updated ledger shares?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This updates the allocation of your outstanding shared-bill
                    receivables to match the current event shares. Past expense
                    entries and actual payments are not rewritten, and no cash
                    moves. Publicly confirmed reports still await separate
                    ledger review. Review Transactions separately if you need a
                    personal spending adjustment.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                {error && <ErrorState message={error} />}
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={busy}>
                    Keep current ledger shares
                  </AlertDialogCancel>
                  <AlertDialogAction disabled={busy} onClick={acceptAllocation}>
                    {busy ? "Updating…" : "Accept ledger shares"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
