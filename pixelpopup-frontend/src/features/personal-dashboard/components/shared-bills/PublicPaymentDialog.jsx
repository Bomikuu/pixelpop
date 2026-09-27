import { useRef, useState } from "react";
import { Check, Users, Store, ArrowLeftRight } from "lucide-react";
import SharedFormFrame from "./SharedFormFrame";
import SelectableField from "../SelectableField";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { money, requestId, today } from "../../lib/format";
import { formError } from "../../lib/sharedBills";

export default function PublicPaymentDialog({ bill, submit, close }) {
  const pending = bill.payments.filter(
    (payment) => payment.status === "pending",
  );
  const remaining = (person) =>
    Math.max(
      0,
      Number(person.remaining) -
        pending
          .filter((payment) => payment.payer_id === person.id)
          .reduce((sum, payment) => sum + Number(payment.amount), 0),
    );
  const receive = (person) =>
    Math.max(
      0,
      Number(person.to_receive) -
        pending
          .filter((payment) => payment.paid_to_id === person.id)
          .reduce((sum, payment) => sum + Number(payment.amount), 0),
    );
  const merchantRemaining = Math.max(
    0,
    Number(bill.remaining_bill) -
      pending
        .filter((payment) => !payment.paid_to_id)
        .reduce((sum, payment) => sum + Number(payment.amount), 0),
  );
  const initial =
    bill.participants.find((person) => remaining(person) > 0) ||
    bill.participants[0];
  const [payerId, setPayerId] = useState(String(initial.id));
  const [kind, setKind] = useState(
    merchantRemaining > 0 ? "provider" : "reimbursement",
  );
  const eligibleRecipients = (payer) =>
    bill.participants.filter(
      (person) => String(person.id) !== payer && receive(person) > 0,
    );
  const firstRecipient = eligibleRecipients(String(initial.id))[0];
  const [recipientId, setRecipientId] = useState(
    String(firstRecipient?.id || ""),
  );
  const [amount, setAmount] = useState(
    String(
      merchantRemaining > 0
        ? Math.min(remaining(initial), merchantRemaining)
        : Math.min(
            remaining(initial),
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
  function changePayer(value) {
    const person = bill.participants.find((row) => String(row.id) === value);
    const next = eligibleRecipients(value)[0];
    setPayerId(value);
    setRecipientId(String(next?.id || ""));
    setAmount(
      String(
        kind === "provider"
          ? Math.min(remaining(person), merchantRemaining)
          : Math.min(remaining(person), next ? receive(next) : 0),
      ),
    );
  }
  function changeKind(value) {
    setKind(value);
    const recipient =
      recipients.find((person) => String(person.id) === recipientId) ||
      recipients[0];
    setRecipientId(String(recipient?.id || ""));
    setAmount(
      String(
        value === "provider"
          ? Math.min(remaining(payer), merchantRemaining)
          : Math.min(remaining(payer), recipient ? receive(recipient) : 0),
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
        paid_to_id: kind === "provider" ? null : recipientId,
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
      title="Record a payment or reimbursement"
      description="This records an actual payment, not a money transfer through the app. The event owner must confirm it before totals or personal accounts change."
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
          <Label htmlFor="public-payer">Who is paying?</Label>
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
            disabled={busy}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="public-payment-kind">Payment type</Label>
          <SelectableField
            id="public-payment-kind"
            label="Payment type"
            options={[
              {
                value: "provider",
                label: "Pay the bill provider",
                icon: Store,
              },
              {
                value: "reimbursement",
                label: "Reimburse a person",
                icon: ArrowLeftRight,
              },
            ]}
            value={kind}
            onChange={changeKind}
            disabled={busy}
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
                setAmount(String(Math.min(remaining(payer), receive(person))));
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
          <p className="text-sm text-slate-600">
            Still payable to the bill provider:{" "}
            <strong className="tabular-nums">{money(merchantRemaining)}</strong>
            . Pending reports reserve their amounts until reviewed.
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
              (kind === "provider"
                ? merchantRemaining <= 0
                : !recipients.length)
            }
          >
            <Check aria-hidden="true" />
            {busy ? "Submitting…" : "Submit payment for confirmation"}
          </Button>
        </div>
      </form>
    </SharedFormFrame>
  );
}
