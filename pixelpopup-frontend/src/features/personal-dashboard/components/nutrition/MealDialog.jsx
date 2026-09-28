import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, Utensils } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "../../ui/alert-dialog";
import { Button } from "../../ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { calculateTotals, parseMealJson } from "../../nutrition/model";
import { today } from "../../lib/format";

const emptyItem = () => ({ name: "", amount: "", unit: "g", calories: "", protein: "", carbs: "", fat: "" });
const fields = [
  ["amount", "Amount", "0.001"], ["unit", "Unit"], ["calories", "kcal", "0.01"],
  ["protein", "Protein (g)", "0.01"], ["carbs", "Carbs (g)", "0.01"], ["fat", "Fat (g)", "0.01"],
];
const numberLabel = (value) => Number(value).toLocaleString("en-PH", { maximumFractionDigits: 2 });
const manilaClock = () => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Manila", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date());

function initialDraft(meal, date) {
  return {
    date: meal?.date || date,
    time: meal?.datetime?.slice(11, 16) || manilaClock(),
    meal_name: meal?.meal_name || "",
    items: meal?.items?.map((item) => Object.fromEntries(Object.keys(emptyItem()).map((key) => [key, String(item[key] ?? "")]))) || [emptyItem()],
  };
}

export default function MealDialog({ meal, date, onClose, onSave, restoreFocus }) {
  const [initial] = useState(() => initialDraft(meal, date));
  const [draft, setDraft] = useState(initial);
  const [mode, setMode] = useState("manual");
  const [initialJson] = useState(() => meal ? JSON.stringify({ ...(meal.datetime ? { datetime: meal.datetime } : {}), meal_name: meal.meal_name, items: meal.items, totals: meal.totals }, null, 2) : "");
  const [jsonText, setJsonText] = useState(initialJson);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [discard, setDiscard] = useState(false);
  const mealNameRef = useRef(null);
  const jsonRef = useRef(null);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial) || jsonText !== initialJson;

  useEffect(() => {
    const warn = (event) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const liveTotals = (() => {
    try { return calculateTotals(draft.items); } catch { return null; }
  })();

  function closeRequested() {
    if (saving) return;
    if (dirty) setDiscard(true);
    else onClose();
  }

  function changeItem(index, key, value) {
    setDraft((current) => ({ ...current, items: current.items.map((item, position) => position === index ? { ...item, [key]: value } : item) }));
    setError("");
  }

  function previewJson() {
    try {
      const parsed = parseMealJson(jsonText, { allowUnnamed: true });
      setPreview(parsed);
      if (parsed.datetime) setDraft((current) => ({ ...current, time: parsed.datetime.slice(11, 16) }));
      setError("");
    } catch (failure) {
      setPreview(null);
      setError(failure.message);
      jsonRef.current?.focus();
    }
  }

  async function save(event) {
    event.preventDefault();
    if (saving) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) {
      setError("Choose a meal date.");
      return;
    }
    let parsed;
    try {
      if (mode === "json" && !preview) {
        setError("Preview the JSON before saving this meal.");
        jsonRef.current?.focus();
        return;
      }
      parsed = mode === "json" ? preview : parseMealJson(JSON.stringify({ meal_name: draft.meal_name, items: draft.items }));
    } catch (failure) {
      setError(failure.message);
      if (failure.message.toLowerCase().includes("meal name")) mealNameRef.current?.focus();
      else document.querySelector('[data-nutrition-item="0"] input')?.focus();
      return;
    }
    const selectedDate = draft.date;
    if (selectedDate > today()) {
      setError("Choose today or an earlier meal date.");
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(draft.time)) {
      setError("Choose the time you ate this meal.");
      return;
    }
    const time = mode === "json" && parsed.datetime && draft.time === parsed.datetime.slice(11, 16)
      ? parsed.datetime.slice(11, 19)
      : `${draft.time}:00`;
    const datetime = mode === "manual" && meal?.datetime && draft.date === meal.date && draft.time === meal.datetime.slice(11, 16)
      ? meal.datetime
      : `${selectedDate}T${time}+08:00`;
    if (!Number.isFinite(Date.parse(datetime)) || Date.parse(datetime) > Date.now()) {
      setError("A meal cannot be logged for a future time.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({ date: selectedDate, datetime, meal_name: parsed.meal_name, items: parsed.items }, meal?.id);
      onClose();
    } catch (failure) {
      const fieldText = failure.fields && typeof failure.fields === "object" ? Object.values(failure.fields).flat(Infinity).find((value) => typeof value === "string") : null;
      setError(fieldText || failure.message || "The meal was not saved. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Dialog open onOpenChange={(open) => { if (!open) closeRequested(); }}>
        <DialogContent className="personal-dashboard max-h-[85dvh] overflow-y-auto bg-white sm:max-w-[min(75vw,58rem)]" onCloseAutoFocus={restoreFocus}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Utensils className="size-5 text-[var(--pd-primary)]" aria-hidden="true" />{meal ? "Edit meal" : "Add meal"}</DialogTitle>
            <DialogDescription>Record when you ate this meal. The selected date is used; pasted JSON can supply the time.</DialogDescription>
          </DialogHeader>
          <form noValidate onSubmit={save} className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="flex flex-wrap gap-3">
                <div className="w-44 space-y-1.5"><Label htmlFor="nutrition-meal-date">Date eaten</Label><Input id="nutrition-meal-date" type="date" value={draft.date} max={today()} onChange={(event) => { setDraft((current) => ({ ...current, date: event.target.value })); setError(""); }} /></div>
                <div className="w-36 space-y-1.5"><Label htmlFor="nutrition-meal-time">Time eaten</Label><Input id="nutrition-meal-time" type="time" value={draft.time} max={draft.date === today() ? manilaClock() : undefined} onChange={(event) => { setDraft((current) => ({ ...current, time: event.target.value })); setError(""); }} /></div>
              </div>
              <div className="inline-flex rounded-md border border-[var(--pd-border)] bg-slate-50 p-1" aria-label="Entry method">
                {["manual", "json"].map((choice) => <button key={choice} type="button" aria-pressed={mode === choice} className={`rounded px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pd-primary)] ${mode === choice ? "bg-white text-[var(--pd-primary)] shadow-sm" : "text-slate-600 hover:text-slate-950"}`} onClick={() => { setMode(choice); setError(""); }}>{choice === "manual" ? "Manual entry" : "Paste JSON"}</button>)}
              </div>
            </div>
            {mode === "manual" ? (
              <div className="space-y-4">
                <div className="space-y-1.5"><Label htmlFor="nutrition-meal-name">Meal name</Label><Input ref={mealNameRef} id="nutrition-meal-name" value={draft.meal_name} maxLength={160} placeholder="Dinner, lunch, or afternoon snack" onChange={(event) => { setDraft((current) => ({ ...current, meal_name: event.target.value })); setError(""); }} /></div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-950">Food items</h3><span className="text-xs text-slate-600">{draft.items.length} of 100</span></div>
                  {draft.items.map((item, index) => <div key={index} data-nutrition-item={index} className="rounded-lg border border-[var(--pd-border)] bg-slate-50/60 p-3">
                    <div className="mb-3 flex items-center justify-between gap-2"><span className="text-sm font-medium text-slate-700">Item {index + 1}</span><Button type="button" variant="ghost" size="sm" disabled={draft.items.length === 1} aria-label={`Remove item ${index + 1}`} onClick={() => setDraft((current) => ({ ...current, items: current.items.filter((_, position) => position !== index) }))}><Trash2 className="size-4" aria-hidden="true" />Remove</Button></div>
                    <div className="space-y-1.5"><Label htmlFor={`nutrition-item-${index}-name`}>Food name</Label><Input id={`nutrition-item-${index}-name`} value={item.name} maxLength={160} placeholder="e.g. Cooked white rice" onChange={(event) => changeItem(index, "name", event.target.value)} /></div>
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{fields.map(([field, title, step]) => <div key={field} className="space-y-1.5"><Label htmlFor={`nutrition-item-${index}-${field}`}>{title}</Label><Input id={`nutrition-item-${index}-${field}`} type={step ? "number" : "text"} min={step ? field === "amount" ? "0.001" : "0" : undefined} step={step} value={item[field]} maxLength={step ? undefined : 24} onChange={(event) => changeItem(index, field, event.target.value)} /></div>)}</div>
                  </div>)}
                  <Button type="button" variant="outline" disabled={draft.items.length >= 100} onClick={() => setDraft((current) => ({ ...current, items: [...current.items, emptyItem()] }))}><Plus className="size-4" aria-hidden="true" />Add food item</Button>
                </div>
                <p className="rounded-md bg-blue-50 px-3 py-2 text-sm text-slate-700" role="status">{liveTotals ? `Meal total: ${numberLabel(liveTotals.calories)} kcal · ${numberLabel(liveTotals.protein)} g protein · ${numberLabel(liveTotals.carbs)} g carbs · ${numberLabel(liveTotals.fat)} g fat` : "Complete all nutrient fields to preview meal totals."}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <Label htmlFor="nutrition-meal-json">Meal JSON</Label>
                <Textarea ref={jsonRef} id="nutrition-meal-json" className="min-h-48 resize-none font-mono text-xs" value={jsonText} placeholder={JSON.stringify({ datetime: `${today()}T${manilaClock()}:00+08:00`, meal_name: "Dinner", items: [{ name: "Rice", amount: 250, unit: "g", calories: 325, protein: 6, carbs: 71, fat: 1 }], totals: { calories: 325, protein: 6, carbs: 71, fat: 1 } })} onChange={(event) => { setJsonText(event.target.value); setPreview(null); setError(""); }} aria-invalid={Boolean(error)} aria-describedby={error ? "nutrition-meal-error" : undefined} />
                <p className="text-xs text-slate-600">The date above stays selected. JSON datetime supplies its Asia/Manila time (+08:00); if omitted, the time above is used. An empty meal name is saved as “Meal.”</p>
                <Button type="button" variant="outline" onClick={previewJson}>Preview meal</Button>
                {preview && <div className="rounded-lg border border-[var(--pd-border)] bg-slate-50 p-3 text-sm"><p className="font-semibold text-slate-950">{preview.meal_name} · {preview.items.length} food {preview.items.length === 1 ? "item" : "items"}</p><p className="mt-1 text-slate-600">Calculated: {numberLabel(preview.calculatedTotals.calories)} kcal · {numberLabel(preview.calculatedTotals.protein)} g protein · {numberLabel(preview.calculatedTotals.carbs)} g carbs · {numberLabel(preview.calculatedTotals.fat)} g fat</p>{preview.mismatches.length > 0 && <p role="status" className="mt-2 rounded border border-amber-300 bg-amber-50 p-2 text-amber-950">Pasted {preview.mismatches.join(", ")} {preview.mismatches.length === 1 ? "total differs" : "totals differ"} from the food items. Saving will use the calculated values above.</p>}</div>}
              </div>
            )}
            {error && <p id="nutrition-meal-error" role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">{error}</p>}
            <DialogFooter><Button type="button" variant="outline" disabled={saving} onClick={closeRequested}>Cancel</Button><Button type="submit" disabled={saving} className="min-w-36">{saving ? "Saving…" : preview?.mismatches.length && mode === "json" ? "Save calculated totals" : meal ? "Save meal" : "Add meal"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog open={discard} onOpenChange={setDiscard}>
        <AlertDialogContent className="personal-dashboard"><AlertDialogHeader><AlertDialogTitle>Discard this meal draft?</AlertDialogTitle><AlertDialogDescription>Your unsaved changes will be lost.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep editing</AlertDialogCancel><AlertDialogAction onClick={onClose}>Discard draft</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </>
  );
}
