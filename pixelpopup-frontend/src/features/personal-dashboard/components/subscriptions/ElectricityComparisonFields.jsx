import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { today } from "../../lib/format";

function ComparisonInput({ name, label, values, set, errors, required = false, type = "number", step = "0.01", hint, max }) {
  const id = `electricity-quick-${name}`;
  const error = errors?.[name];
  const errorText = Array.isArray(error) ? error.join(" ") : error;
  return <div className="min-w-0">
    <Label htmlFor={id} className="mb-2 block text-sm">{label}{required && " *"}</Label>
    <Input id={id} type={type} min={type === "number" ? "0" : undefined} step={type === "number" ? step : undefined} max={max}
      value={values[name]} onChange={(event) => set(name, event.target.value)} inputMode={type === "number" ? "decimal" : undefined}
      aria-required={required} aria-invalid={!!errorText} aria-describedby={[hint && `${id}-hint`, errorText && `${id}-error`].filter(Boolean).join(" ") || undefined} />
    {hint && <p id={`${id}-hint`} className="mt-1 text-xs leading-5 text-slate-600">{hint}</p>}
    {errorText && <p role="alert" id={`${id}-error`} className="mt-1 text-sm text-red-800">{errorText}</p>}
  </div>;
}

export default function ElectricityComparisonFields({ mode, values, set, errors }) {
  const common = { values, set, errors };
  if (mode === "bills") return <div className="grid gap-4 sm:grid-cols-2">
    <ComparisonInput {...common} name="previous_bill" label="Previous bill (PHP)" required />
    <ComparisonInput {...common} name="current_bill" label="Current bill (PHP)" required />
  </div>;
  return <div className="space-y-4">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <ComparisonInput {...common} name="previous_reading" label="Previous meter reading (kWh)" step="0.000001" required />
      <ComparisonInput {...common} name="current_reading" label="Current meter reading (kWh)" step="0.000001" required />
      <ComparisonInput {...common} name="rate" label="Energy rate (PHP / kWh)" step="0.000001" required />
      <ComparisonInput {...common} name="previous_date" label="Previous reading / cycle start" type="date" max={today()} required />
      <ComparisonInput {...common} name="reading_date" label="Current reading date" type="date" max={today()} required />
      <ComparisonInput {...common} name="period_end" label="Cycle end (exclusive)" type="date" required />
    </div>
    <details className="rounded-md border border-[var(--pd-border)] px-3 py-2">
      <summary className="cursor-pointer py-1 text-sm font-medium text-slate-700 hover:text-blue-700">Expected usage, budget & additional charges{["expected_usage", "budget", "fixed_fee", "other_charges"].some((key) => errors?.[key]) && <span className="ml-2 text-red-800">Review these fields</span>}</summary>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ComparisonInput {...common} name="expected_usage" label="Expected cycle usage (kWh)" step="0.000001" hint="Optional target for the gauge and status." />
        <ComparisonInput {...common} name="budget" label="Cycle budget (PHP)" hint="Optional; not an account spending limit." />
        <ComparisonInput {...common} name="fixed_fee" label="Fixed service fee (PHP)" />
        <ComparisonInput {...common} name="other_charges" label="Taxes & other charges (PHP)" hint="Enter a total estimate, not a percentage." />
      </div>
    </details>
    <p className="text-xs leading-5 text-slate-600">Flat-rate sandbox: only the entered rate and charges are included. Saved tiered tariffs and extra provider fees are not copied automatically.</p>
  </div>;
}
