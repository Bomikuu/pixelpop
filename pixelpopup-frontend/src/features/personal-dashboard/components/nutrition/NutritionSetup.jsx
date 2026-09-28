import { createElement, useRef, useState } from "react";
import { CircleAlert, Droplets, Dumbbell, Ruler, Scale, Target, Wheat } from "lucide-react";
import { Button } from "../../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";

const fields = [
  { key: "height_cm", label: "Height", unit: "cm", icon: Ruler, max: 999.9, step: "0.1" },
  { key: "weight_kg", label: "Current weight", unit: "kg", icon: Scale, max: 9999.99, step: "0.01" },
  { key: "daily_target_kcal", label: "Daily calorie target", unit: "kcal", icon: Target, max: 999999.99, step: "0.01" },
  { key: "daily_target_protein_g", label: "Daily protein target", unit: "g", icon: Dumbbell, max: 999999.99, step: "0.01" },
  { key: "daily_target_carbs_g", label: "Daily carbs target", unit: "g", icon: Wheat, max: 999999.99, step: "0.01" },
  { key: "daily_target_fat_g", label: "Daily fat target", unit: "g", icon: Droplets, max: 999999.99, step: "0.01" },
];

export default function NutritionSetup({ profile, onSave, onLeave }) {
  const setupFields = profile?.has_weight_entry ? fields.filter((field) => field.key !== "weight_kg") : fields;
  const [values, setValues] = useState({
    height_cm: profile?.height_cm ?? "",
    weight_kg: "",
    daily_target_kcal: profile?.daily_target_kcal ?? "",
    daily_target_protein_g: profile?.daily_target_protein_g ?? "",
    daily_target_carbs_g: profile?.daily_target_carbs_g ?? "",
    daily_target_fat_g: profile?.daily_target_fat_g ?? "",
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [busy, setBusy] = useState(false);
  const fieldRefs = useRef({});

  async function save(event) {
    event.preventDefault();
    if (busy) return;
    const nextErrors = {};
    for (const field of setupFields) {
      const number = Number(values[field.key]);
      if (!values[field.key] || !Number.isFinite(number) || number <= 0 || number > field.max) {
        nextErrors[field.key] = `Enter a ${field.label.toLowerCase()} greater than zero${number > field.max ? ` and no more than ${field.max}` : ""}.`;
      }
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      fieldRefs.current[Object.keys(nextErrors)[0]]?.focus();
      return;
    }
    setBusy(true);
    setSubmitError("");
    try {
      await onSave(values);
    } catch (error) {
      setSubmitError(error.message || "Your starting point could not be saved. Check the values and try again.");
      setBusy(false);
    }
  }

  return <Dialog open>
    <DialogContent
      className="personal-dashboard flex max-h-[90dvh] flex-col gap-0 overflow-hidden bg-white p-0 sm:max-w-2xl"
      showCloseButton={false}
      onEscapeKeyDown={(event) => event.preventDefault()}
      onInteractOutside={(event) => event.preventDefault()}
      onOpenAutoFocus={(event) => {
        event.preventDefault();
        const firstMissing = setupFields.find((field) => !values[field.key])?.key || setupFields[0].key;
        fieldRefs.current[firstMissing]?.focus();
      }}
    >
      <DialogHeader className="shrink-0 border-b border-[var(--pd-border)] px-5 py-5 sm:px-6">
        <span className="inline-flex items-center gap-1.5 self-start rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[var(--pd-primary)]"><CircleAlert className="size-3.5" aria-hidden="true" />Required for Nutrition</span>
        <DialogTitle className="text-xl leading-tight text-slate-950">Set your starting point</DialogTitle>
        <DialogDescription className="leading-relaxed">Complete these details before you can log meals and see your summaries. Set your own daily calorie and macro targets once; you can update them later.</DialogDescription>
      </DialogHeader>
      <form noValidate onSubmit={save} className="flex min-h-0 flex-col">
        <div className="min-h-0 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
          <p className="text-xs font-medium text-slate-600">All fields shown are required.</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {setupFields.map(({ key, label, unit, icon: Icon, max, step }) => <div key={key} className="rounded-lg border border-[var(--pd-border)] bg-slate-50 p-4">
              <span className="mb-3 grid size-9 place-items-center rounded-full bg-blue-50 text-[var(--pd-primary)]">{createElement(Icon, { className: "size-4", "aria-hidden": "true" })}</span>
              <Label htmlFor={`nutrition-setup-${key}`}>{label} <span className="font-normal text-slate-600">({unit})</span></Label>
              <Input ref={(node) => { fieldRefs.current[key] = node; }} id={`nutrition-setup-${key}`} type="number" inputMode="decimal" min="0.01" max={max} step={step} required value={values[key]} onChange={(event) => { setValues((current) => ({ ...current, [key]: event.target.value })); setErrors((current) => ({ ...current, [key]: "" })); }} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `nutrition-setup-${key}-error` : undefined} className="mt-2 bg-white" />
              {errors[key] && <p id={`nutrition-setup-${key}-error`} className="mt-2 text-xs text-red-700">{errors[key]}</p>}
            </div>)}
          </div>
          <p className="text-sm text-slate-600">{profile?.has_weight_entry ? "Your existing weight reading stays in place. Set the targets that work for you." : "The initial weight is recorded for today. Future weight entries are optional."}</p>
          {submitError && <p role="alert" className="text-sm text-red-700">{submitError}</p>}
        </div>
        <DialogFooter className="shrink-0 border-t border-[var(--pd-border)] bg-white px-5 py-4 sm:justify-between sm:px-6">
          <Button type="button" variant="outline" disabled={busy} onClick={onLeave}>Back to dashboard</Button>
          <Button type="submit" disabled={busy} aria-busy={busy} className="min-w-44">{busy ? "Saving starting point…" : "Save starting point"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
