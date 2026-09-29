import { useRef, useState } from "react";
import { Check, Users, Store } from "lucide-react";
import SharedFormFrame from "./SharedFormFrame";
import SelectableField from "../SelectableField";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { choiceIcon, cashKinds } from "../../lib/presets";
import { money, today, requestId } from "../../lib/format";
import { formError } from "../../lib/sharedBills";
import PersonPaymentSummary from "./PersonPaymentSummary";
import AccountBalancePreview, { accountChoiceOption, accountProjection } from "../AccountBalancePreview";

export default function BillPaymentDialog({
  bill,
  dashboard,
  close,
  notify,
  reportedPayment,
}) {
  const me = bill.participants.find((person) => person.is_me);
  const kind =
    reportedPayment?.kind || (bill.receiver_id ? "contribution" : "payment");
  const eventOnly = kind === "refund";
  const trackedAdvances = bill.participants.some(
    (person) => person.has_advance,
  );
  const ledgerReview = reportedPayment?.status === "confirmed";
  const ledgerMeShare = ledgerReview ? me.ledger_share : me.share;
  const initialPayer = reportedPayment
    ? bill.participants.find((person) => person.id === reportedPayment.payer_id)
    : Number(me.remaining) > 0
      ? me
      : bill.participants.find((person) => Number(person.remaining) > 0) || me;
  const initialRecipient = reportedPayment
    ? String(reportedPayment.paid_to_id || "")
    : kind === "contribution"
      ? String(bill.receiver_id)
      : Number(bill.remaining_bill) > 0
        ? ""
        : String(
            bill.participants.find(
              (person) =>
                Number(person.to_receive) > 0 && person.id !== initialPayer.id,
            )?.id || "",
          );
  const [payerId, setPayerId] = useState(String(initialPayer.id));
  const [paidTo, setPaidTo] = useState(initialRecipient);
  const [amount, setAmount] = useState(
    String(reportedPayment?.amount || initialPayer.remaining),
  );
  const [date, setDate] = useState(reportedPayment?.date || today);
  const [ledgerDate, setLedgerDate] = useState(reportedPayment?.date || today);
  const noOtherPayments = !bill.payments.some(
    (payment) =>
      payment.id !== reportedPayment?.id &&
      payment.status !== "rejected" &&
      (!ledgerReview || (payment.ledger_reviewed && !payment.paid_to_id)),
  );
  const initialLedger =
    !eventOnly &&
    (kind !== "contribution" ||
      Number(reportedPayment?.amount || initialPayer.remaining) <=
        Math.max(
          Number(ledgerMeShare) - Number(bill.my_recorded_expense || 0),
          0,
        )) &&
    (initialPayer.is_me ||
      (kind === "payment" &&
        initialRecipient === String(me.id) &&
        trackedAdvances));
  const [recordLedger, setRecordLedger] = useState(Boolean(initialLedger));
  const [account, setAccount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [key] = useState(requestId);
  const saving = useRef(false),
    errorRef = useRef(null);
  const payer = bill.participants.find(
    (person) => String(person.id) === payerId,
  );
  const involvesMe = payer.is_me || paidTo === String(me.id);
  const requiredLedger =
    kind === "payment" &&
    !payer.is_me &&
    paidTo === String(me.id) &&
    trackedAdvances;
  const unavailableLedger =
    eventOnly ||
    (!payer.is_me &&
      paidTo === String(me.id) &&
      (kind !== "payment" || !trackedAdvances));
  const wholeBill =
    payer.is_me &&
    !paidTo &&
    noOtherPayments &&
    Number(amount) === Number(bill.total) &&
    Number(bill.total) > Number(ledgerMeShare);
  const recipients =
    kind !== "payment"
      ? bill.participants
          .filter((person) => String(person.id) === paidTo)
          .map((person) => ({
            value: String(person.id),
            label: person.name,
            icon: Users,
          }))
      : [
          { value: "", label: "Bill provider / restaurant", icon: Store },
          ...bill.participants
            .filter(
              (person) =>
                String(person.id) !== payerId &&
                (Number(person.to_receive) > 0 ||
                  person.id === reportedPayment?.paid_to_id),
            )
            .map((person) => ({
              value: String(person.id),
              label: person.name + " · to receive " + money(person.to_receive),
              icon: Users,
            })),
        ];
  const accounts = dashboard.data.accounts
    .filter(
      (item) =>
        item.active &&
        (wholeBill || !payer.is_me
          ? cashKinds.includes(item.kind)
          : item.kind !== "fund"),
    )
    .map(accountChoiceOption);
  const selectedAccount = dashboard.data.accounts.find((item) => String(item.id) === account);
  const accountDirection = payer.is_me ? "out" : "in";
  const insufficientAccount = recordLedger && payer.is_me && (
    (selectedAccount?.kind === "credit_card" && selectedAccount.credit_limit == null) ||
    accountProjection(selectedAccount, amount, "out")?.blocked
  );
  const dirty =
    amount !== String(reportedPayment?.amount || initialPayer.remaining) ||
    payerId !== String(initialPayer.id) ||
    paidTo !== initialRecipient ||
    date !== (reportedPayment?.date || today()) ||
    account !== "" ||
    recordLedger !== Boolean(initialLedger) ||
    paymentMethod !== "bank" ||
    ledgerDate !== (reportedPayment?.date || today());
  function changePayer(value) {
    const next = bill.participants.find(
      (person) => String(person.id) === value,
    );
    const recipient =
      kind === "contribution"
        ? String(bill.receiver_id)
        : Number(bill.remaining_bill) > 0
          ? ""
          : String(
              bill.participants.find(
                (person) =>
                  Number(person.to_receive) > 0 && String(person.id) !== value,
              )?.id || "",
            );
    setPayerId(value);
    setPaidTo(recipient);
    setAmount(String(next.remaining));
    setRecordLedger(
      Boolean(
        !eventOnly &&
        ((next.is_me &&
          Number(next.remaining) <=
            Math.max(
              Number(ledgerMeShare) - Number(bill.my_recorded_expense || 0),
              0,
            )) ||
          (kind === "payment" &&
            recipient === String(me.id) &&
            trackedAdvances)),
      ),
    );
    setAccount("");
    setError("");
  }
  async function save(event) {
    event.preventDefault();
    if (saving.current) return;
    const invalid = event.currentTarget.querySelector("input:invalid");
    if (invalid) {
      setError(
        invalid.validationMessage || "Enter a valid amount and recording date.",
      );
      invalid.focus();
      return;
    }
    if (
      !recipients.some((recipient) => recipient.value === paidTo) ||
      (recordLedger &&
        involvesMe &&
        !accounts.some((item) => item.value === account))
    ) {
      setError(
        "Choose a valid recipient and an account for your ledger entry.",
      );
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    if (insufficientAccount) {
      setError("This payment exceeds the selected account's balance or available credit.");
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      const ledger = {
        account: involvesMe && recordLedger ? account || null : null,
        record_ledger: involvesMe && recordLedger,
        payment_method: paymentMethod,
        ...(reportedPayment && involvesMe && recordLedger
          ? { ledger_date: ledgerDate }
          : {}),
      };
      await dashboard.mutate(
        "shared-bills/" +
          bill.id +
          (reportedPayment
            ? "/payments/" + reportedPayment.id + "/approve/"
            : "/pay/"),
        reportedPayment
          ? ledger
          : {
              payer_id: payerId,
              paid_to_id: paidTo || null,
              kind,
              amount,
              date,
              ...ledger,
              request_id: key,
            },
      );
      notify(
        recordLedger && involvesMe
          ? "Payment and your ledger updated."
          : "Event payment reviewed. No expense or cash movement was recorded.",
        { action: "paid", entity: "shared_bill" },
      );
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
        reportedPayment
          ? ledgerReview
            ? "Review payment for your ledger"
            : "Review reported payment"
          : "Record shared-bill payment"
      }
      description={
        reportedPayment
          ? ledgerReview
            ? "This payment is already confirmed in the event. Review private account recording here; the event payment will not be counted twice."
            : "Confirm only if this payment actually happened. Reported details stay unchanged; choose whether to update your own ledger."
          : "Record an actual payment—not a promise to pay. Choose who received the money."
      }
      {...{ busy, dirty, close }}
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
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="bill-payer">Paid by</Label>
            <SelectableField
              id="bill-payer"
              label="Person who paid"
              value={payerId}
              onChange={changePayer}
              options={bill.participants.map((person) => ({
                value: String(person.id),
                label: person.name + (person.is_me ? " (You)" : ""),
                icon: Users,
              }))}
              disabled={busy || Boolean(reportedPayment)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bill-recipient">Paid to</Label>
            <SelectableField
              id="bill-recipient"
              label="Payment recipient"
              value={paidTo}
              onChange={(value) => {
                setPaidTo(value);
                setRecordLedger(
                  Boolean(
                    !eventOnly &&
                    (payer.is_me ||
                      (kind === "payment" &&
                        value === String(me.id) &&
                        trackedAdvances)),
                  ),
                );
                setAccount("");
              }}
              options={recipients}
              disabled={
                busy || Boolean(reportedPayment) || kind === "contribution"
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bill-payment-amount">Amount (₱)</Label>
            <Input
              id="bill-payment-amount"
              type="number"
              min="0.01"
              step="0.01"
              required
              value={amount}
              disabled={busy || Boolean(reportedPayment)}
              onChange={(event) => {
                setAmount(event.target.value);
                if (
                  payer.is_me &&
                  !wholeBill &&
                  Number(event.target.value) >
                    Math.max(
                      Number(ledgerMeShare) -
                        Number(bill.my_recorded_expense || 0),
                      0,
                    )
                )
                  setRecordLedger(false);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bill-payment-date">Payment date</Label>
            <Input
              id="bill-payment-date"
              type="date"
              min={bill.date}
              max={today()}
              required
              value={date}
              disabled={busy || Boolean(reportedPayment)}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>
        </div>
        <PersonPaymentSummary
          bill={bill}
          person={
            kind === "refund"
              ? bill.participants.find(
                  (person) => person.id === reportedPayment?.paid_to_id,
                )
              : payer
          }
        />
        {payer.is_me &&
          Number(amount) >
            Math.max(
              Number(ledgerMeShare) - Number(bill.my_recorded_expense || 0),
              0,
            ) &&
          !wholeBill && (
            <p className="text-sm text-slate-600">
              Overpayments are allowed. Leave ledger recording off for this
              amount; record only your own agreed expense separately, not the
              group’s extra contributions.
            </p>
          )}
        {!reportedPayment &&
          payer.is_me &&
          noOtherPayments &&
          !paidTo &&
          Number(bill.total) > Number(me.share) && (
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => {
                setAmount(String(bill.total));
                setAccount("");
              }}
            >
              I paid the whole bill upfront · {money(bill.total)}
            </Button>
          )}
        {involvesMe ? (
          <div className="space-y-4 border-t pt-4">
            <label className="flex cursor-pointer items-start gap-3 text-sm">
              <input
                className="mt-1 size-4 accent-[var(--pd-primary)]"
                type="checkbox"
                checked={recordLedger}
                disabled={busy || requiredLedger || unavailableLedger}
                onChange={(event) => setRecordLedger(event.target.checked)}
              />
              <span className="space-y-1">
                <span className="block font-medium">
                  {payer.is_me
                    ? eventOnly
                      ? "Refund · event only"
                      : "Record my payment in my ledger"
                    : kind === "contribution"
                      ? "Received contribution · event only"
                      : "Record this repayment received in my account"}
                </span>
                <span className="block text-slate-600">
                  {eventOnly
                    ? "This refund updates the event only. Review any private cash or expense adjustment separately."
                    : wholeBill
                      ? "Only " +
                        money(ledgerMeShare) +
                        " is your expense. The rest creates repayable advances, not extra spending."
                      : payer.is_me
                        ? "Only your paid contribution becomes an expense. Uncheck if it is already recorded elsewhere."
                        : requiredLedger
                          ? "This tracked advance must be collected in your account to keep both histories aligned. It is not income."
                          : kind === "contribution"
                            ? "Collected contributions are not your personal income. This records the event only; review private cash movements separately."
                            : "The original advance was not recorded in your ledger. This repayment updates the breakdown only."}
                </span>
              </span>
            </label>
            {recordLedger && (
              <div className="grid gap-4 sm:grid-cols-2">
                {reportedPayment && (
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="bill-ledger-date">
                      Private ledger recording date
                    </Label>
                    <Input
                      id="bill-ledger-date"
                      type="date"
                      required
                      min={reportedPayment.date}
                      max={today()}
                      value={ledgerDate}
                      disabled={busy}
                      onChange={(event) => setLedgerDate(event.target.value)}
                    />
                    <p className="text-xs text-slate-600">
                      The reported payment date stays unchanged. If receivables
                      were reallocated later, record the ledger entry on or
                      after that reallocation date.
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="bill-payment-account">
                    {payer.is_me ? "Paying account" : "Receiving account"}
                  </Label>
                  <SelectableField
                    id="bill-payment-account"
                    label="Account"
                    required
                    value={account}
                    onChange={setAccount}
                    options={accounts}
                    disabled={busy}
                    forceTiles
                  />
                  <AccountBalancePreview account={selectedAccount} amount={amount} direction={accountDirection} />
                  {!accounts.length && (
                    <p className="text-sm text-red-800">
                      Add an active cash, bank, or e-wallet account first.
                    </p>
                  )}
                </div>
                {payer.is_me && (
                  <div className="space-y-2">
                    <Label htmlFor="bill-payment-method">Payment method</Label>
                    <SelectableField
                      id="bill-payment-method"
                      label="Payment method"
                      value={paymentMethod}
                      onChange={setPaymentMethod}
                      options={[
                        "cash",
                        "bank",
                        "credit_card",
                        "debit_card",
                        "gcash",
                        "maya",
                        "other",
                      ].map((value) => ({
                        value,
                        label: value.replaceAll("_", " "),
                        icon: choiceIcon(value),
                      }))}
                      disabled={busy}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="border-t pt-4 text-sm text-slate-600">
            This payment stays in the shared breakdown only. It does not change
            your expenses or account balances.
          </p>
        )}
        <div className="flex justify-end border-t pt-4">
          <Button type="submit" disabled={busy || !recipients.length || insufficientAccount}>
            <Check aria-hidden="true" />
            {busy
              ? "Recording…"
              : reportedPayment
                ? ledgerReview
                  ? "Confirm ledger review"
                  : "Confirm reported payment"
                : "Confirm payment"}
          </Button>
        </div>
      </form>
    </SharedFormFrame>
  );
}
