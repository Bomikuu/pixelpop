import { useEffect, useState } from "react";
import { Activity, Scale, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../ui/alert-dialog";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Panel } from "../Panel";
import { dateLabel } from "../../lib/format";

function positive(value, label, required = false) {
  if (value === "") {
    if (required) throw new Error(`Enter a ${label.toLowerCase()}.`);
    return null;
  }
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) throw new Error(`${label} must be greater than zero.`);
  return value;
}

export default function NutritionSettings({ profile, date, weights, onSaveProfile, onSaveWeight, onDeleteWeight }) {
  const [height, setHeight] = useState("");
  const [target, setTarget] = useState("");
  const [proteinTarget, setProteinTarget] = useState("");
  const [carbsTarget, setCarbsTarget] = useState("");
  const [fatTarget, setFatTarget] = useState("");
  const [weight, setWeight] = useState("");
  const [note, setNote] = useState("");
  const [profileError, setProfileError] = useState("");
  const [weightError, setWeightError] = useState("");
  const [profileBusy, setProfileBusy] = useState(false);
  const [weightBusy, setWeightBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const reading = weights.find((row) => row.date === date);
  const readingWeight = reading?.weight_kg;
  const readingNote = reading?.note;

  useEffect(() => {
    setHeight(profile?.height_cm ?? "");
    setTarget(profile?.daily_target_kcal ?? "");
    setProteinTarget(profile?.daily_target_protein_g ?? "");
    setCarbsTarget(profile?.daily_target_carbs_g ?? "");
    setFatTarget(profile?.daily_target_fat_g ?? "");
  }, [profile?.height_cm, profile?.daily_target_kcal, profile?.daily_target_protein_g, profile?.daily_target_carbs_g, profile?.daily_target_fat_g]);
  useEffect(() => {
    setWeight(readingWeight ?? "");
    setNote(readingNote ?? "");
    setWeightError("");
  }, [date, readingWeight, readingNote]);

  async function saveProfile(event) {
    event.preventDefault();
    if (profileBusy) return;
    try {
      const body = {
        height_cm: positive(height, "Height"),
        daily_target_kcal: positive(target, "Daily calorie target", true),
        daily_target_protein_g: positive(proteinTarget, "Daily protein target", true),
        daily_target_carbs_g: positive(carbsTarget, "Daily carbs target", true),
        daily_target_fat_g: positive(fatTarget, "Daily fat target", true),
      };
      setProfileBusy(true);
      setProfileError("");
      await onSaveProfile(body);
    } catch (failure) {
      setProfileError(failure.message || "Your baseline was not saved.");
    } finally {
      setProfileBusy(false);
    }
  }

  async function saveWeight(event) {
    event.preventDefault();
    if (weightBusy) return;
    try {
      const value = positive(weight, "Weight");
      if (value === null) throw new Error("Enter a weight in kilograms.");
      setWeightBusy(true);
      setWeightError("");
      await onSaveWeight(date, { weight_kg: value, note: note.trim() });
    } catch (failure) {
      setWeightError(failure.message || "The reading was not saved.");
    } finally {
      setWeightBusy(false);
    }
  }

  async function removeWeight(event) {
    event.preventDefault();
    if (weightBusy) return;
    setWeightBusy(true);
    setWeightError("");
    try {
      await onDeleteWeight(date);
      setConfirmDelete(false);
    } catch (failure) {
      setWeightError(failure.message || "The reading was not deleted.");
    } finally {
      setWeightBusy(false);
    }
  }

  return <div className="space-y-5">
    <Panel title="Your baseline" description="Set your own daily calorie and macro targets. Height is stored for reference only.">
      <form noValidate onSubmit={saveProfile} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="nutrition-height">Height (cm)</Label><Input id="nutrition-height" type="number" min="0.1" step="0.1" value={height} onChange={(event) => { setHeight(event.target.value); setProfileError(""); }} placeholder="Optional" /></div>
          <div className="space-y-1.5"><Label htmlFor="nutrition-target">Daily target (kcal)</Label><Input id="nutrition-target" type="number" min="0.01" step="0.01" value={target} onChange={(event) => { setTarget(event.target.value); setProfileError(""); }} placeholder="Set your target" /></div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="nutrition-protein-target">Protein target (g)</Label><Input id="nutrition-protein-target" type="number" min="0.01" step="0.01" value={proteinTarget} onChange={(event) => { setProteinTarget(event.target.value); setProfileError(""); }} placeholder="Daily grams" /></div>
          <div className="space-y-1.5"><Label htmlFor="nutrition-carbs-target">Carbs target (g)</Label><Input id="nutrition-carbs-target" type="number" min="0.01" step="0.01" value={carbsTarget} onChange={(event) => { setCarbsTarget(event.target.value); setProfileError(""); }} placeholder="Daily grams" /></div>
          <div className="space-y-1.5"><Label htmlFor="nutrition-fat-target">Fat target (g)</Label><Input id="nutrition-fat-target" type="number" min="0.01" step="0.01" value={fatTarget} onChange={(event) => { setFatTarget(event.target.value); setProfileError(""); }} placeholder="Daily grams" /></div>
        </div>
        <p className="flex items-start gap-2 text-xs leading-5 text-slate-600"><Activity className="mt-0.5 size-4 shrink-0" aria-hidden="true" />Changing these targets also changes comparisons shown for past days. It does not change logged meals.</p>
        {profileError && <p role="alert" className="text-sm text-red-700">{profileError}</p>}
        <Button type="submit" variant="outline" disabled={profileBusy}>{profileBusy ? "Saving…" : "Save baseline"}</Button>
      </form>
    </Panel>
    <Panel title="Weight log" description="Record a reading whenever you measure it. Other dates stay blank.">
      <form noValidate onSubmit={saveWeight} className="space-y-3">
        <p className="text-sm font-medium text-slate-700">Reading for {dateLabel(date)}</p>
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-3">
          <div className="space-y-1.5"><Label htmlFor="nutrition-weight">Weight (kg)</Label><Input id="nutrition-weight" type="number" min="0.01" step="0.01" value={weight} onChange={(event) => { setWeight(event.target.value); setWeightError(""); }} placeholder="e.g. 72.5" /></div>
          <div className="space-y-1.5"><Label htmlFor="nutrition-weight-note">Note (optional)</Label><Input id="nutrition-weight-note" value={note} maxLength={500} onChange={(event) => setNote(event.target.value)} placeholder="Morning, after workout…" /></div>
        </div>
        {weightError && <p role="alert" className="text-sm text-red-700">{weightError}</p>}
        <div className="flex flex-wrap gap-2"><Button type="submit" variant="outline" disabled={weightBusy}><Scale className="size-4" aria-hidden="true" />{weightBusy ? "Saving…" : reading ? "Update reading" : "Save reading"}</Button>{reading && <Button type="button" variant="ghost" className="text-red-700 hover:bg-red-50 hover:text-red-800" disabled={weightBusy} onClick={() => setConfirmDelete(true)}><Trash2 className="size-4" aria-hidden="true" />Delete</Button>}</div>
      </form>
      {weights.length > 0 && <div className="mt-5 border-t border-[var(--pd-border)] pt-4"><h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">Recent readings</h3><ul className="mt-2 space-y-1 text-sm">{weights.slice(-3).reverse().map((row) => <li key={row.date} className="flex justify-between gap-3"><span className="text-slate-600">{dateLabel(row.date)}</span><span className="font-medium tabular-nums text-slate-950">{Number(row.weight_kg).toLocaleString("en-PH", { maximumFractionDigits: 2 })} kg</span></li>)}</ul></div>}
    </Panel>
    <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}><AlertDialogContent className="personal-dashboard"><AlertDialogHeader><AlertDialogTitle>Delete the weight reading for {dateLabel(date)}?</AlertDialogTitle><AlertDialogDescription>This removes this measurement from your history and trend. Your meals stay unchanged.</AlertDialogDescription></AlertDialogHeader>{weightError && <p role="alert" className="text-sm text-red-700">{weightError}</p>}<AlertDialogFooter><AlertDialogCancel disabled={weightBusy}>Keep reading</AlertDialogCancel><AlertDialogAction disabled={weightBusy} onClick={removeWeight} className="bg-red-700 text-white hover:bg-red-800">Delete reading</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}
