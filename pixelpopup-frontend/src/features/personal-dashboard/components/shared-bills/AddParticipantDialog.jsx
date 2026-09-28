import { useRef, useState } from "react";
import { UserPlus } from "lucide-react";
import SharedFormFrame from "./SharedFormFrame";
import PersonPicker from "./PersonPicker";
import SelectableField from "../SelectableField";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { money, requestId } from "../../lib/format";
import { formError, splitPreview } from "../../lib/sharedBills";

export default function AddParticipantDialog({
  bill,
  dashboard,
  submit,
  close,
}) {
  const [name, setName] = useState("");
  const [mode, setMode] = useState("auto"),
    [amount, setAmount] = useState("");
  const [confirmLegacy, setConfirmLegacy] = useState(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [key] = useState(requestId);
  const saving = useRef(false),
    errorRef = useRef(null);
  const legacy = dashboard && !bill.allocation_confirmed;
  const previewRows = [
    ...bill.participants.map((person) => ({
      name: person.name,
      amount: (legacy && confirmLegacy ? person.is_me : person.share_is_fixed)
        ? String(person.share)
        : "",
    })),
    {
      name: name.trim() || "New person",
      amount: mode === "auto" ? "" : amount,
    },
  ];
  const preview =
    legacy && !confirmLegacy
      ? null
      : splitPreview(String(bill.total), previewRows);
  async function save(event) {
    event.preventDefault();
    if (saving.current) return;
    const invalid = event.currentTarget.querySelector(":invalid");
    if (invalid) {
      setError(
        invalid.validationMessage || "Enter a valid name and contribution.",
      );
      invalid.focus();
      return;
    }
    if (!preview || (mode === "fixed" && !amount)) {
      setError(
        "Choose a valid contribution. Fixed amounts must leave enough room for the remaining split.",
      );
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    if (
      bill.participants.some(
        (person) =>
          person.name.trim().toLowerCase() === name.trim().toLowerCase(),
      )
    ) {
      setError("This person is already in the event. Choose a different name.");
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      await submit({
        name: name.trim(),
        amount: mode === "auto" ? null : amount,
        request_id: key,
        ...(legacy && confirmLegacy ? { confirm_resplit_legacy: true } : {}),
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
      title="Add a person to this event"
      description="The bill total stays the same. Fixed contributions stay unchanged; automatic shares are recalculated. Earlier payments are kept and overpayments become reimbursement balances."
      busy={busy}
      dirty={Boolean(name || amount || confirmLegacy)}
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
        {legacy && (
          <label className="flex items-start gap-3 rounded-md border bg-slate-50 p-3 text-sm">
            <input
              type="checkbox"
              required
              checked={confirmLegacy}
              disabled={busy}
              onChange={(event) => setConfirmLegacy(event.target.checked)}
              className="mt-1 size-4 accent-[var(--pd-primary)]"
            />
            <span>
              This older bill did not save its split rules. Keep my current
              contribution fixed and let other participants split the remainder
              when someone joins.
            </span>
          </label>
        )}
        <div className="space-y-2">
          <Label htmlFor="join-person-name">Person's name</Label>
          <Input
            id="join-person-name"
            autoFocus
            required
            maxLength={120}
            value={name}
            disabled={busy}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        {dashboard && (
          <PersonPicker
            request={dashboard.request}
            version={dashboard.version}
            retry={dashboard.refresh}
            selected={bill.participants}
            add={setName}
            disabled={busy}
          />
        )}
        <div className="space-y-2">
          <Label htmlFor="join-share-mode">Contribution</Label>
          <SelectableField
            id="join-share-mode"
            label="Contribution rule"
            value={mode}
            onChange={setMode}
            options={[
              { value: "auto", label: "Split the remainder" },
              { value: "fixed", label: "Fixed contribution" },
            ]}
            disabled={busy}
          />
        </div>
        {mode === "fixed" && (
          <div className="space-y-2">
            <Label htmlFor="join-fixed-amount">Fixed contribution (₱)</Label>
            <Input
              id="join-fixed-amount"
              required
              type="number"
              min="0"
              step="0.01"
              disabled={busy}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </div>
        )}
        <section className="space-y-2 border-t pt-4">
          <h3 className="text-sm font-semibold">Updated contributions</h3>
          {preview ? (
            <ul className="max-h-56 space-y-2 overflow-y-auto text-sm">
              {previewRows.map((person, index) => (
                <li key={index} className="flex justify-between gap-3">
                  <span className="break-words">{person.name}</span>
                  <span className="shrink-0 tabular-nums">
                    {money(preview[index])}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-600">
              Confirm the split rule and enter a valid contribution to preview
              the new amounts.
            </p>
          )}
        </section>
        <div className="flex justify-end border-t pt-4">
          <Button
            type="submit"
            disabled={busy || bill.participants.length >= 50}
          >
            <UserPlus aria-hidden="true" />
            {busy ? "Adding…" : "Add person & update shares"}
          </Button>
        </div>
      </form>
    </SharedFormFrame>
  );
}
