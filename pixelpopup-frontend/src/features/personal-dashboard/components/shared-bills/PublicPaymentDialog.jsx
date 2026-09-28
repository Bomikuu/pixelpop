import { useRef, useState } from "react";
import { Check, Users } from "lucide-react";
import SharedFormFrame from "./SharedFormFrame";
import SelectableField from "../SelectableField";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { money, requestId, today } from "../../lib/format";
import { formError } from "../../lib/sharedBills";
import PersonPaymentSummary from "./PersonPaymentSummary";
import PaymentReceiver from "./PaymentReceiver";

const available = (value) => Math.max(0, Math.round(value * 100) / 100);

export default function PublicPaymentDialog({
  bill,
  submit,
  close,
  paymentKind = "provider",
  privateEntry = false,
}) {
  const kind = paymentKind;
  const refund = kind === "reimbursement" && Boolean(bill.receiver_id);
  const pending = bill.payments.filter(
    (payment) => payment.status === "pending",
  );
  const remaining = (person) =>
    available(
      Number(person.remaining) -
        pending
          .filter(
            (payment) =>
              payment.payer_id === person.id && payment.kind !== "refund",
          )
          .reduce((sum, payment) => sum + Number(payment.amount), 0),
    );
  const receive = (person) =>
    available(
      Number(refund ? person.refund_due : person.to_receive) -
        pending
          .filter(
            (payment) =>
              payment.paid_to_id === person.id &&
              (!refund || payment.kind === "refund"),
          )
          .reduce((sum, payment) => sum + Number(payment.amount), 0),
    );
  const refundablePool = available(
    Number(bill.merchant_paid) -
      Number(bill.total) -
      pending
        .filter((payment) => payment.kind === "refund")
        .reduce((sum, payment) => sum + Number(payment.amount), 0),
  );
  const initial =
    (refund
      ? bill.participants.find((person) => person.id === bill.receiver_id)
      : bill.participants.find((person) => remaining(person) > 0)) ||
    bill.participants[0];
  const [payerId, setPayerId] = useState(String(initial.id));
  const eligibleRecipients = (payer) =>
    bill.participants.filter(
      (person) =>
        (refund || String(person.id) !== payer) && receive(person) > 0,
    );
  const firstRecipient = eligibleRecipients(String(initial.id))[0];
  const [recipientId, setRecipientId] = useState(
    String(firstRecipient?.id || ""),
  );
  const [amount, setAmount] = useState(
    String(
      kind === "provider"
        ? Number(initial.remaining) || ""
        : Math.min(
            refund ? refundablePool : remaining(initial),
            firstRecipient ? receive(firstRecipient) : 0,
          ),
    ),
  );
  const [date, setDate] = useState(today);
  const baseline = useRef({ payerId, kind, recipientId, amount, date });
  const dirty = Object.entries({
    payerId,
    kind,
    recipientId,
    amount,
    date,
  }).some(([field, value]) => value !== baseline.current[field]);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [key] = useState(requestId);
  const saving = useRef(false),
    errorRef = useRef(null);
  const payer = bill.participants.find(
    (person) => String(person.id) === payerId,
  );
  const recipients = eligibleRecipients(payerId);
  const selectedPerson = refund
    ? bill.participants.find((person) => String(person.id) === recipientId)
    : payer;
  function changePayer(value) {
    const person = bill.participants.find((row) => String(row.id) === value);
    const next = eligibleRecipients(value)[0];
    setPayerId(value);
    setRecipientId(String(next?.id || ""));
    setAmount(
      String(
        kind === "provider"
          ? Number(person.remaining) || ""
          : Math.min(
              refund ? refundablePool : remaining(person),
              next ? receive(next) : 0,
            ),
      ),
    );
  }
  async function save(event) {
    event.preventDefault();
    if (saving.current) return;
    const invalid = event.currentTarget.querySelector(":invalid");
    if (invalid) {
      setError(invalid.validationMessage || "Enter a valid amount and date.");
      invalid.focus();
      return;
    }
    if (
      kind === "reimbursement" &&
      !recipients.some((person) => String(person.id) === recipientId)
    ) {
      setError("Choose the person receiving the reimbursement.");
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      await submit({
        payer_id: payerId,
        paid_to_id:
          kind === "provider" ? bill.receiver_id || null : recipientId,
        kind: refund
          ? "refund"
          : kind === "provider" && bill.receiver_id
            ? "contribution"
            : "payment",
        amount,
        date,
        request_id: key,
      });
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
    <SharedFormFrame
      title={
        refund
          ? "Return an overpayment"
          : kind === "reimbursement"
            ? "Report a reimbursement"
            : privateEntry
              ? "Record a payment"
              : "Report a payment"
      }
      description={
        privateEntry
          ? "Record an actual event payment. This form does not transfer money or change private accounts; personal expense recording stays separate."
          : refund
            ? "Return excess from the event receiver to the person who overpaid. Management must confirm this report before their net paid amount changes."
            : kind === "reimbursement"
              ? "Management must be unlocked to report a reimbursement to a person. The report still needs confirmation before event totals change; this does not transfer money or update private accounts."
              : "Anyone with the link can report a payment, including more than their share or the event total. The owner or a PIN holder must confirm it before totals change. This does not transfer money or update private accounts."
      }
      busy={busy}
      dirty={dirty}
      close={close}
    >
      <form noValidate onSubmit={save} className="space-y-5">
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
        <div className="space-y-2">
          <Label htmlFor="public-payer">
            {refund ? "Refund comes from" : "Who is paying?"}
          </Label>
          <SelectableField
            id="public-payer"
            label="Person paying"
            options={bill.participants.map((person) => ({
              value: String(person.id),
              label: person.name,
              icon: Users,
            }))}
            value={payerId}
            onChange={changePayer}
            disabled={busy || refund}
          />
        </div>
        {kind === "reimbursement" ? (
          <div className="space-y-2">
            <Label htmlFor="public-recipient">
              Who receives the reimbursement?
            </Label>
            <SelectableField
              id="public-recipient"
              label="Person receiving money"
              options={recipients.map((person) => ({
                value: String(person.id),
                label:
                  person.name + " · " + money(receive(person)) + " to receive",
                icon: Users,
              }))}
              value={recipientId}
              onChange={(value) => {
                setRecipientId(value);
                const person = recipients.find(
                  (row) => String(row.id) === value,
                );
                setAmount(
                  String(
                    Math.min(
                      refund ? refundablePool : remaining(payer),
                      receive(person),
                    ),
                  ),
                );
              }}
              disabled={busy}
            />
            {!recipients.length && (
              <p className="text-sm text-slate-600">
                No person has a confirmed reimbursement balance available.
              </p>
            )}
          </div>
        ) : (
          <PaymentReceiver bill={bill} />
        )}
        <PersonPaymentSummary bill={bill} person={selectedPerson} />
        {refund && (
          <p className="text-sm text-slate-600">
            Available excess to return:{" "}
            <strong className="tabular-nums">{money(refundablePool)}</strong>.
            Refunds cannot bring confirmed event funds below the total.
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="public-paid-amount">Amount (₱)</Label>
            <Input
              id="public-paid-amount"
              required
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              disabled={busy}
              onChange={(event) => setAmount(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="public-paid-date">Payment date</Label>
            <Input
              id="public-paid-date"
              required
              type="date"
              min={bill.date}
              max={today()}
              value={date}
              disabled={busy}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end border-t pt-4">
          <Button
            type="submit"
            disabled={
              busy ||
              (kind === "reimbursement" &&
                (!recipients.length || (refund && refundablePool <= 0)))
            }
          >
            <Check aria-hidden="true" />
            {busy
              ? "Submitting…"
              : privateEntry
                ? refund
                  ? "Confirm refund"
                  : "Confirm payment"
                : refund
                  ? "Submit refund for confirmation"
                  : kind === "reimbursement"
                    ? "Submit reimbursement for confirmation"
                    : "Submit payment for confirmation"}
          </Button>
        </div>
      </form>
    </SharedFormFrame>
  );
}
