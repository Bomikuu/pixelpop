import { useRef, useState } from "react";
import { Check, Receipt, Users, Store } from "lucide-react";
import SharedFormFrame from "./SharedFormFrame";
import SelectableField from "../SelectableField";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { money, today } from "../../lib/format";
import { formError, splitPreview, initials } from "../../lib/sharedBills";
import { choiceIcon } from "../../lib/presets";

export default function EditBillDialog({ bill, dashboard, notify, close }) {
  const [title, setTitle] = useState(bill.title);
  const [total, setTotal] = useState(String(bill.total));
  const [date, setDate] = useState(bill.date);
  const [category, setCategory] = useState(String(bill.category || ""));
  const [receiver, setReceiver] = useState(String(bill.receiver_id || ""));
  const baseline = bill.participants.map((person) => ({
    id: person.id,
    amount: person.share_is_fixed ? String(person.share) : "",
  }));
  const [participants, setParticipants] = useState(baseline);
  const [confirmLegacy, setConfirmLegacy] = useState(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const saving = useRef(false),
    errorRef = useRef(null);
  const preview = splitPreview(total, participants);
  const hasPayments = bill.payments.some(
    (payment) => payment.status !== "rejected",
  );
  const dirty =
    title !== bill.title ||
    total !== String(bill.total) ||
    date !== bill.date ||
    category !== String(bill.category || "") ||
    receiver !== String(bill.receiver_id || "") ||
    confirmLegacy ||
    participants.some(
      (person, index) => person.amount !== baseline[index].amount,
    );
  function changeShare(index, amount) {
    setParticipants((rows) =>
      rows.map((row, i) => (i === index ? { ...row, amount } : row)),
    );
  }
  async function save(event) {
    event.preventDefault();
    if (saving.current) return;
    const invalid = event.currentTarget.querySelector("input:invalid");
    if (invalid || !preview || !title.trim()) {
      setError(
        "Enter a valid event name and contributions that add up to the total. Leave an amount blank to split the remainder.",
      );
      requestAnimationFrame(() => (invalid || errorRef.current)?.focus());
      return;
    }
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      await dashboard.mutate(
        "shared-bills/" + bill.id + "/",
        {
          title: title.trim(),
          total,
          date,
          category: category || null,
          receiver_id: receiver || null,
          participants: participants.map((person) => ({
            id: person.id,
            amount: person.amount === "" ? null : person.amount,
          })),
          ...(confirmLegacy ? { confirm_resplit_legacy: true } : {}),
        },
        "PATCH",
      );
      notify(
        "Event updated. Existing expenses and cash movements were kept unchanged.",
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
      title="Edit event"
      description="Update the event and agreed contributions—even after payments. Earlier payments stay in history; your private ledger is reviewed separately."
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
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="edit-event-title">Event name</Label>
            <Input
              id="edit-event-title"
              autoFocus
              required
              maxLength={160}
              value={title}
              disabled={busy}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-event-total">Total bill (₱)</Label>
            <Input
              id="edit-event-total"
              type="number"
              min="0.01"
              step="0.01"
              required
              value={total}
              disabled={busy || hasPayments}
              onChange={(event) => setTotal(event.target.value)}
              aria-describedby="edit-total-help"
            />
            <p id="edit-total-help" className="text-xs text-slate-600">
              {hasPayments
                ? "The total is kept once payments exist. Contributions are still editable."
                : "Fixed contributions plus the remainder must equal this total."}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-event-date">Event date</Label>
            <Input
              id="edit-event-date"
              type="date"
              required
              max={today()}
              value={date}
              disabled={busy}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="edit-event-receiver">Payment receiver</Label>
            <SelectableField
              id="edit-event-receiver"
              label="Payment receiver"
              value={receiver}
              onChange={setReceiver}
              disabled={
                busy ||
                bill.payments.some(
                  (payment) =>
                    payment.status !== "rejected" && payment.kind !== "payment",
                )
              }
              options={[
                {
                  value: "",
                  label: "Bill provider (existing advance workflow)",
                  icon: Store,
                },
                ...bill.participants.map((person) => ({
                  value: String(person.id),
                  label: person.name + (person.is_me ? " (You)" : ""),
                  icon: Users,
                })),
              ]}
            />
            <p className="text-xs text-slate-600">
              This person collects contributions and returns excess payments.
              The receiver stays fixed once contributions or refunds exist.
            </p>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="edit-event-category">Category</Label>
            <SelectableField
              id="edit-event-category"
              label="Category"
              value={category}
              onChange={setCategory}
              disabled={busy}
              options={[
                { value: "", label: "Other", icon: Receipt },
                ...dashboard.data.categories.map((item) => ({
                  value: String(item.id),
                  label: item.name,
                  icon: choiceIcon(item.name),
                })),
              ]}
            />
          </div>
        </div>
        <section className="space-y-3 border-t pt-4">
          <h3 className="text-sm font-semibold">Agreed contributions</h3>
          <p id="edit-share-help" className="text-sm text-slate-600">
            Enter a fixed amount, including zero, or leave it blank to split the
            remainder. The preview shows each person's new share.
          </p>
          {!bill.allocation_confirmed && (
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-1 size-4 accent-[var(--pd-primary)]"
                checked={confirmLegacy}
                disabled={busy}
                onChange={(event) => setConfirmLegacy(event.target.checked)}
              />
              <span>
                Use the contribution rules below for this older event.
              </span>
            </label>
          )}
          <ul className="max-h-96 divide-y overflow-y-auto">
            {participants.map((row, index) => {
              const person = bill.participants[index];
              return (
                <li
                  key={row.id}
                  className={
                    "grid items-center gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(120px,180px)_minmax(100px,140px)] " +
                    (person.is_me ? "rounded-md bg-blue-50" : "")
                  }
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700"
                    >
                      {initials(person.name)}
                    </span>
                    <span className="break-words text-sm font-medium">
                      {person.name}
                      {person.is_me && (
                        <span className="ml-2 text-xs font-semibold text-blue-700">
                          You
                        </span>
                      )}
                    </span>
                  </span>
                  <div className="space-y-1">
                    <Label htmlFor={"edit-share-" + row.id} className="text-xs">
                      Fixed amount (₱)
                    </Label>
                    <Input
                      id={"edit-share-" + row.id}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Split remainder"
                      value={row.amount}
                      disabled={busy}
                      onChange={(event) =>
                        changeShare(index, event.target.value)
                      }
                      aria-describedby="edit-share-help"
                    />
                  </div>
                  <span className="text-sm tabular-nums">
                    <span className="block text-xs text-slate-600">
                      New contribution
                    </span>
                    <strong>
                      {preview ? money(preview[index]) : "Check amounts"}
                    </strong>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
        <div className="flex justify-end border-t pt-4">
          <Button type="submit" disabled={busy}>
            <Check aria-hidden="true" />
            {busy ? "Saving…" : "Save event"}
          </Button>
        </div>
      </form>
    </SharedFormFrame>
  );
}
