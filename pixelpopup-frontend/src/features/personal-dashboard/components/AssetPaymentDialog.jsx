import { useState } from "react";
import { CalendarClock, Landmark } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import SelectableField from "./SelectableField";
import AccountBalancePreview, { accountChoiceOption, accountProjection } from "./AccountBalancePreview";
import { cashKinds } from "../lib/presets";
import { dateLabel, money, requestId, today } from "../lib/format";
import { cents, formError } from "../lib/sharedBills";

const allocationFields = [
  ["principal", "Regular principal"],
  ["interest", "Interest"],
  ["fees", "Fees / insurance"],
  ["extra_principal", "Extra to principal"],
  ["advance_reserved", "Advance for future installments"],
];
const numberText = (value) => (Math.round(value * 100) / 100).toFixed(2);
const historicalDate = (value) => {
  const day = new Date(value + "T12:00:00Z");
  day.setUTCDate(day.getUTCDate() - 1);
  return day.toISOString().slice(0, 10);
};

function suggestedSplit(total, due, mode) {
  const amount = Math.max(0, total);
  const regular = due ? Math.min(amount, Number(due.remaining_due)) : 0;
  const interest = Math.min(regular, Number(due?.estimated_interest || 0));
  const excess = amount - regular;
  return {
    principal: numberText(regular - interest),
    interest: numberText(interest),
    fees: "0.00",
    extra_principal: numberText(mode === "principal" ? excess : 0),
    advance_reserved: numberText(mode === "advance" ? excess : 0),
  };
}

export default function AssetPaymentDialog({ asset, financing, accounts, initialInstallment, historical = false, mutate, close, notify }) {
  const pending = financing.schedule.filter((item) => item.status === "pending" && Number(item.remaining_due) > 0);
  const firstDue = initialInstallment && pending.find((item) => item.id === initialInstallment.id);
  const initialDue = historical ? null : firstDue || pending[0] || null;
  const initialCash = historical ? "" : initialDue?.remaining_due || "";
  const [values, setValues] = useState(() => ({
    date: historical ? historicalDate(financing.balance_as_of) : today(),
    account: String(accounts.find((account) => (historical || account.active) && cashKinds.includes(account.kind))?.id || ""),
    deadline: String(initialDue?.id || ""),
    cash_amount: initialCash,
    advance_applied: "0",
    mode: "principal",
    ...suggestedSplit(Number(initialCash || 0), initialDue, "principal"),
    notes: "",
  }));
  const [key] = useState(requestId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const selectedDue = pending.find((item) => String(item.id) === values.deadline);
  const cashCents = cents(values.cash_amount || "0");
  const creditCents = cents(values.advance_applied || "0");
  const allocated = allocationFields.reduce((sum, [name]) => sum + (cents(values[name] || "0") ?? 0), 0);
  const difference = cashCents == null || creditCents == null ? null : cashCents + creditCents - allocated;
  const selectedAccount = accounts.find((item) => String(item.id) === values.account);
  const insufficientAccount = !historical && accountProjection(selectedAccount, values.cash_amount)?.blocked;
  const accountOptions = accounts
    .filter((account) => (historical || account.active) && cashKinds.includes(account.kind))
    .map(accountChoiceOption);

  function change(name, value) {
    setError("");
    setValues((current) => {
      const next = { ...current, [name]: value };
      if (["deadline", "cash_amount", "advance_applied", "mode"].includes(name)) {
        const due = pending.find((item) => String(item.id) === next.deadline);
        return {
          ...next,
          ...suggestedSplit(Number(next.cash_amount || 0) + Number(next.advance_applied || 0), due, next.mode),
        };
      }
      return next;
    });
  }
  async function save(event) {
    event.preventDefault();
    if (busy) return;
    if (!values.account || !values.date || cashCents == null || creditCents == null || cashCents + creditCents <= 0 || difference !== 0 || allocationFields.some(([name]) => cents(values[name] || "0") == null)) {
      setError("Choose an account and date, then make the payment split equal cash plus advance credit.");
      return;
    }
    if (insufficientAccount) {
      setError("This payment exceeds the selected account's available balance.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await mutate("assets/" + asset.id + "/financing/payments/", {
        date: values.date,
        account: values.account,
        deadline: values.deadline || null,
        cash_amount: values.cash_amount || "0",
        advance_applied: values.advance_applied || "0",
        ...Object.fromEntries(allocationFields.map(([name]) => [name, values[name] || "0"])),
        historical,
        notes: values.notes,
        request_id: key,
      });
      notify(historical ? "Earlier payment added to history. Your confirmed starting balance was kept." : "Financing payment recorded. Principal and cash balances were updated.", { action: "added", entity: "asset" });
      close();
    } catch (failure) {
      setError(formError(failure));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog open onOpenChange={(open) => !open && !busy && close()}>
      <DialogContent className="personal-dashboard max-h-[90dvh] overflow-y-auto bg-white sm:max-w-2xl lg:w-[75vw] lg:max-w-[75vw]">
        <DialogHeader>
          <DialogTitle>{historical ? "Add earlier payment history" : "Record financing payment"}</DialogTitle>
          <DialogDescription>
            {historical
              ? "Use a date before the confirmed balance. This adds history only; it does not subtract cash or principal again."
              : "Start with the suggested split, then match the lender's receipt. Only confirmed principal reduces the loan balance."}
          </DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={save} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="asset-payment-date">Payment date</Label>
              <Input id="asset-payment-date" type="date" value={values.date} max={historical ? historicalDate(financing.balance_as_of) : today()} onChange={(event) => change("date", event.target.value)} disabled={busy} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset-payment-account">Account used</Label>
              <SelectableField id="asset-payment-account" label="Account used" options={accountOptions} value={values.account} onChange={(value) => change("account", value)} disabled={busy} required forceTiles />
              {!historical && <AccountBalancePreview account={selectedAccount} amount={values.cash_amount} />}
            </div>
          </div>
          {!historical && (
            <div className="space-y-2">
              <Label htmlFor="asset-payment-deadline">Installment</Label>
              <SelectableField
                id="asset-payment-deadline" label="Installment"
                options={[{ value: "", label: "Extra principal / advance only", icon: Landmark }, ...pending.map((item) => ({ value: String(item.id), label: dateLabel(item.due_date) + " · " + money(item.remaining_due), icon: CalendarClock }))]}
                value={values.deadline} onChange={(value) => change("deadline", value)} disabled={busy}
              />
              {selectedDue && <p className="text-sm text-slate-600">Still due for this installment: {money(selectedDue.remaining_due)}. Suggested interest: {money(selectedDue.estimated_interest)}.</p>}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="asset-payment-cash">Cash paid now (₱)</Label>
              <Input id="asset-payment-cash" type="number" min="0" step="0.01" value={values.cash_amount} onChange={(event) => change("cash_amount", event.target.value)} disabled={busy} />
            </div>
            {!historical && <div className="space-y-2">
              <Label htmlFor="asset-payment-credit">Use existing advance credit (₱)</Label>
              <Input id="asset-payment-credit" type="number" min="0" max={financing.advance_credit} step="0.01" value={values.advance_applied} onChange={(event) => change("advance_applied", event.target.value)} disabled={busy} />
              <p className="text-xs text-slate-600">Available credit: {money(financing.advance_credit)}. Using it does not deduct cash again.</p>
            </div>}
          </div>
          {!historical && <div className="space-y-2">
            <Label htmlFor="asset-payment-mode">Apply amount above this installment to</Label>
            <SelectableField id="asset-payment-mode" label="Apply excess to" options={[{ value: "principal", label: "Extra principal", description: "Reduce the remaining loan balance.", icon: Landmark }, { value: "advance", label: "Future installments", description: "Reserve it for upcoming dues.", icon: CalendarClock }]} value={values.mode} onChange={(value) => change("mode", value)} disabled={busy} />
          </div>}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-slate-950">Payment breakdown</h3>
            <p className="mt-1 text-sm text-slate-600">Adjust these amounts to match what the lender actually posted.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {allocationFields.filter(([name]) => !historical || name !== "advance_reserved").map(([name, label]) => (
                <div key={name} className="space-y-2">
                  <Label htmlFor={"asset-payment-" + name}>{label} (₱)</Label>
                  <Input id={"asset-payment-" + name} type="number" min="0" step="0.01" value={values[name]} onChange={(event) => change(name, event.target.value)} disabled={busy} />
                </div>
              ))}
            </div>
            <p className={"mt-3 text-sm tabular-nums " + (difference === 0 ? "text-slate-600" : "text-amber-800")} role="status">
              {difference === 0 ? "The split matches the payment." : difference == null ? "Use valid peso amounts." : "Unallocated difference: " + money(Math.abs(difference) / 100)}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="asset-payment-notes">Notes (optional)</Label>
            <Input id="asset-payment-notes" value={values.notes} maxLength={500} onChange={(event) => change("notes", event.target.value)} disabled={busy} />
          </div>
          {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={busy} onClick={close}>Cancel</Button>
            <Button type="submit" disabled={busy || !accountOptions.length || insufficientAccount}>{busy ? "Recording…" : historical ? "Add earlier history" : "Record payment"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
