import { useEffect, useState } from "react";
import { Info, Save } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../ui/alert-dialog";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";

const fields = [
  ["height_cm", "Height (cm)", false, "0.1"],
  ["daily_target_kcal", "Daily calories (kcal)", true, "0.01"],
  ["daily_target_protein_g", "Protein (g)", true, "0.01"],
  ["daily_target_carbs_g", "Carbs (g)", true, "0.01"],
  ["daily_target_fat_g", "Fat (g)", true, "0.01"],
];
export default function NutritionSettings({ profile, open, onClose, onSaveProfile, restoreFocus }) {
  const editable = Object.hasOwn(profile, "target_weight_kg") ? [...fields, ["target_weight_kg", "Goal weight (kg)", false, "0.01"]] : fields;
  const initial = Object.fromEntries(editable.map(([key]) => [key, profile[key] ?? ""]));
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [discard, setDiscard] = useState(false);
  const dirty = JSON.stringify(values) !== JSON.stringify(initial);
  useEffect(() => {
    function warn(event) { if (dirty) { event.preventDefault(); event.returnValue = ""; } }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function close() { if (!busy) dirty ? setDiscard(true) : onClose(); }
  async function save(event) {
    event.preventDefault(); if (busy) return;
    const invalid = Object.fromEntries(editable.filter(([key, , required]) => values[key] === "" ? required : !Number.isFinite(Number(values[key])) || Number(values[key]) <= 0).map(([key]) => [key, "Enter a number greater than zero."]));
    setErrors(invalid);
    if (Object.keys(invalid).length) { event.currentTarget.elements.namedItem(Object.keys(invalid)[0])?.focus(); return; }
    setBusy(true); setError("");
    try { await onSaveProfile(Object.fromEntries(editable.map(([key]) => [key, values[key] === "" ? null : values[key]]))); onClose(); }
    catch (failure) {
      const fieldErrors = Object.fromEntries(editable.filter(([key]) => failure.fields?.[key]).map(([key]) => [key, [failure.fields[key]].flat().join(" ")]));
      if (Object.keys(fieldErrors).length) {
        setErrors(fieldErrors);
        requestAnimationFrame(() => document.getElementById(`target-${Object.keys(fieldErrors)[0]}`)?.focus());
      } else setError(failure.message);
    } finally { setBusy(false); }
  }
  return <><Dialog open={open} onOpenChange={(value) => { if (!value) close(); }}><DialogContent className="personal-dashboard flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden" onCloseAutoFocus={restoreFocus} onInteractOutside={(event) => { if (busy) event.preventDefault(); }} onEscapeKeyDown={(event) => { if (busy) event.preventDefault(); }}><DialogHeader><DialogTitle>Targets & baseline</DialogTitle><DialogDescription>Your own daily targets. Optional fields can be left empty.</DialogDescription></DialogHeader><form noValidate onSubmit={save} className="flex min-h-0 flex-col gap-4"><div className="min-h-0 space-y-4 overflow-y-auto px-0.5"><div className="grid gap-3 sm:grid-cols-2">{editable.map(([key, label, required, step]) => <div key={key} className="space-y-1.5"><Label htmlFor={`target-${key}`}>{label}{required && <span className="text-red-700"> *</span>}{!required && <span className="font-normal text-slate-500"> · optional</span>}</Label><Input name={key} id={`target-${key}`} type="number" min={step} step={step} value={values[key]} disabled={busy} aria-required={required} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `${key}-error` : undefined} onChange={(event) => { setValues({ ...values, [key]: event.target.value }); setErrors({ ...errors, [key]: "" }); }} />{errors[key] && <p id={`${key}-error`} className="text-xs text-red-700">{errors[key]}</p>}</div>)}</div><p className="flex items-start gap-2 text-xs leading-5 text-slate-600"><Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />Target edits also change comparisons for past days. They don’t change recorded meals or weight.</p>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}</div><DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={close}>Cancel</Button><Button type="submit" disabled={busy}><Save className="size-4" />{busy ? "Saving…" : "Save targets"}</Button></DialogFooter></form></DialogContent></Dialog>
    <AlertDialog open={discard} onOpenChange={setDiscard}><AlertDialogContent className="personal-dashboard"><AlertDialogHeader><AlertDialogTitle>Discard target changes?</AlertDialogTitle><AlertDialogDescription>Your saved targets will stay unchanged.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep editing</AlertDialogCancel><AlertDialogAction onClick={onClose}>Discard changes</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </>;
}
