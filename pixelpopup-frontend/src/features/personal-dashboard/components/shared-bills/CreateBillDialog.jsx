import { useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Button } from "../../ui/button";
import SelectableField from "../SelectableField";
import { choiceIcon } from "../../lib/presets";
import { money, requestId, today } from "../../lib/format";
import { initials, splitPreview, formError } from "../../lib/sharedBills";
import PersonPicker from "./PersonPicker";
import SharedFormFrame from "./SharedFormFrame";

export default function CreateBillDialog({
  dashboard,
  close,
  created,
  notify,
}) {
  const [title, setTitle] = useState("");
  const [total, setTotal] = useState("");
  const [date, setDate] = useState(today);
  const [category, setCategory] = useState("");
  const [participants, setParticipants] = useState([
    { name: "Miku", is_me: true, amount: "" },
  ]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [key] = useState(requestId);
  const saving = useRef(false),
    errorRef = useRef(null);
  const preview = splitPreview(total, participants);
  const dirty = Boolean(
    title ||
    total ||
    category ||
    date !== today() ||
    participants.length > 1 ||
    participants[0].amount,
  );
  const categories = [
    { value: "", label: "No category" },
    ...dashboard.data.categories.map((item) => ({
      value: String(item.id),
      label: item.name,
      icon: choiceIcon(item.name),
    })),
  ];
  async function save(event) {
    event.preventDefault();
    if (saving.current) return;
    if (!preview) {
      setError(
        "Add at least two people and make sure fixed contributions do not exceed the total. Blank amounts split the remainder.",
      );
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      const bill = await dashboard.mutate("shared-bills/", {
        title: title.trim(),
        total,
        date,
        category: category || null,
        request_id: key,
        participants: participants.map((person) => ({
          ...person,
          amount: person.amount === "" ? null : person.amount,
        })),
      });
      notify("Shared bill created. No personal expense recorded yet.", {
        action: "added",
        entity: "shared_bill",
      });
      created(bill);
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
      title="New shared bill"
      description="Set your contribution, then split the remaining amount. Creating a breakdown does not record an expense."
      {...{ busy, dirty, close }}
    >
      <form onSubmit={save} className="space-y-5">
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
        <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="shared-title">Event name</Label>
            <Input
              autoFocus
              id="shared-title"
              required
              maxLength={160}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Dinner with friends"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shared-total">Total bill (₱)</Label>
            <Input
              id="shared-total"
              required
              type="number"
              min="0.01"
              max="999999999999.99"
              step="0.01"
              value={total}
              onChange={(event) => setTotal(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shared-date">Date</Label>
            <Input
              id="shared-date"
              required
              type="date"
              max={today()}
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shared-category">Category</Label>
            <SelectableField
              id="shared-category"
              label="Category"
              options={categories}
              value={category}
              onChange={setCategory}
              disabled={busy}
            />
          </div>
        </fieldset>
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">
            Contributions · {participants.length} people
          </h3>
          <p id="contribution-help" className="text-sm text-slate-600">
            Leave an amount blank for an equal share of the remainder. Enter
            your ₱2,000 contribution to reserve it first. Extra cents go to the
            first blank participants.
          </p>
          {participants.map((person, index) => (
            <div
              key={person.name}
              className="flex flex-wrap items-center gap-3 border-b pb-3"
            >
              <span
                aria-hidden="true"
                className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-50 text-xs font-semibold text-blue-800"
              >
                {initials(person.name)}
              </span>
              <span className="min-w-24 flex-1 break-words text-sm font-medium">
                {person.name}
                {person.is_me && " (You)"}
              </span>
              <div className="w-36">
                <Label htmlFor={"share-amount-" + index} className="sr-only">
                  {person.name}'s fixed contribution
                </Label>
                <Input
                  id={"share-amount-" + index}
                  disabled={busy}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Split remainder"
                  aria-describedby="contribution-help"
                  value={person.amount}
                  onChange={(event) =>
                    setParticipants((rows) =>
                      rows.map((row, i) =>
                        i === index
                          ? { ...row, amount: event.target.value }
                          : row,
                      ),
                    )
                  }
                />
              </div>
              <span className="w-24 text-right text-sm tabular-nums">
                {preview ? money(preview[index]) : "—"}
              </span>
              {!person.is_me && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={busy}
                  aria-label={"Remove " + person.name}
                  onClick={() =>
                    setParticipants((rows) =>
                      rows.filter((row) => row !== person),
                    )
                  }
                >
                  <X />
                </Button>
              )}
            </div>
          ))}
        </section>
        {participants.length < 50 && (
          <PersonPicker
            request={dashboard.request}
            version={dashboard.version}
            retry={dashboard.refresh}
            selected={participants}
            disabled={busy}
            add={(name) =>
              setParticipants((rows) => [
                ...rows,
                { name, is_me: false, amount: "" },
              ])
            }
          />
        )}
        <div className="flex justify-end border-t pt-4">
          <Button type="submit" disabled={busy}>
            <Plus aria-hidden="true" />
            {busy ? "Creating…" : "Create breakdown"}
          </Button>
        </div>
      </form>
    </SharedFormFrame>
  );
}
