import { useState } from "react";
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
import { formError } from "../lib/sharedBills";
import { today } from "../lib/format";

const setupFields = [
  { name: "lender", label: "Lender / financing provider", type: "text", placeholder: "Pag-IBIG, Deca, or your bank", required: true },
  { name: "opening_principal", label: "Confirmed outstanding principal (₱)", type: "number", min: "0.01", step: "0.01", required: true },
  { name: "balance_as_of", label: "Balance confirmed on", type: "date", required: true },
  { name: "next_due_date", label: "Next due date", type: "date", required: true },
  { name: "monthly_due", label: "Confirmed monthly due (₱)", type: "number", min: "0.01", step: "0.01", required: true },
  { name: "annual_rate", label: "Current annual interest rate (%)", type: "number", min: "0", step: "0.0001", required: true },
  { name: "remaining_months", label: "Installments remaining", type: "number", min: "1", max: "360", step: "1", required: true },
];
const termsFields = [
  { name: "effective_date", label: "Lender's effective date", type: "date", required: true },
  setupFields[4],
  setupFields[5],
];

export default function AssetFinancingDialog({ asset, financing, mode, mutate, close, notify }) {
  const updating = mode === "terms";
  const currentTerms = financing?.term_changes.filter((change) => change.effective_date <= today()).at(-1);
  const [values, setValues] = useState(() => ({
    lender: "",
    opening_principal: "",
    balance_as_of: today(),
    next_due_date: "",
    monthly_due: updating ? String(currentTerms?.monthly_due ?? financing.monthly_due) : "",
    annual_rate: updating ? String(currentTerms?.annual_rate ?? financing.annual_rate) : "",
    remaining_months: "60",
    effective_date: today(),
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fields = updating ? termsFields : setupFields;
  async function save(event) {
    event.preventDefault();
    if (busy) return;
    if (fields.some((field) => !String(values[field.name]).trim())) {
      setError("Fill in each financing field before saving.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await mutate(
        "assets/" + asset.id + "/financing/" + (updating ? "terms/" : ""),
        Object.fromEntries(fields.map((field) => [field.name, values[field.name]])),
      );
      notify(updating ? "Lender terms updated. Future estimates were refreshed." : "Financing added. Upcoming installments are now visible in Bills.", { action: updating ? "edited" : "added", entity: "asset" });
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
          <DialogTitle>{updating ? "Update lender terms" : "Add financing to " + asset.name}</DialogTitle>
          <DialogDescription>
            {updating
              ? "Enter only terms confirmed by your lender. Past payments stay unchanged; future projections update."
              : "Start from a lender-confirmed principal balance. Earlier payments can be added as history without changing this starting balance."}
          </DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={save} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={"asset-financing-" + field.name}>{field.label}</Label>
                <Input
                  id={"asset-financing-" + field.name}
                  type={field.type}
                  value={values[field.name]}
                  onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  maxLength={field.name === "lender" ? 120 : undefined}
                  placeholder={field.placeholder}
                  disabled={busy}
                  aria-invalid={!!error}
                />
              </div>
            ))}
          </div>
          {!updating && <p className="text-sm leading-6 text-slate-600">Up to five years of clickable installments will appear. If you already track this loan as a recurring bill, stop that schedule first to avoid duplicate dues. Interest and payoff totals are estimates, not a lender statement.</p>}
          {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={busy} onClick={close}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : updating ? "Save confirmed terms" : "Add financing"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
