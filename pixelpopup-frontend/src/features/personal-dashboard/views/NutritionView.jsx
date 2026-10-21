import { useEffect, useRef, useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { ErrorState, Panel } from "../components/Panel";
import MealDialog from "../components/nutrition/MealDialog";
import ActivityDialog from "../components/nutrition/ActivityDialog";
import NutritionDay from "../components/nutrition/NutritionDay";
import NutritionInsights from "../components/nutrition/NutritionInsights";
import NutritionSettings from "../components/nutrition/NutritionSettings";
import NutritionSetup from "../components/nutrition/NutritionSetup";
import DailyNutritionOverview from "../components/nutrition/DailyNutritionOverview";
import NutritionActivityPanel from "../components/nutrition/NutritionActivityPanel";
import NutritionWeightPanel from "../components/nutrition/NutritionWeightPanel";
import WeightDialog from "../components/nutrition/WeightDialog";
import { Activity, ChevronDown, Plus, Settings2, UtensilsCrossed } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { Button } from "../ui/button";
import MealLibraryDialog from "../components/nutrition/MealLibraryDialog";
import MealPresetDialog from "../components/nutrition/MealPresetDialog";
import { copyMealDraft } from "../nutrition/dashboardModel";

export default function NutritionView({ request, notify, date, onDateChange, onLeave }) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState({ loading: true, data: null, error: "", date: null });
  const [reportProfile, setReportProfile] = useState(null);
  const initialReportDate = useRef(date);
  const [editing, setEditing] = useState(null);
  const [mealDraft, setMealDraft] = useState(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [presetEditing, setPresetEditing] = useState(null);
  const [deletingPreset, setDeletingPreset] = useState(null);
  const [basis, setBasis] = useState("food");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [weightOpen, setWeightOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deletingActivity, setDeletingActivity] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const focusReturn = useRef(null);
  const addEntryTrigger = useRef(null);
  const restoreFocus = (event) => { event.preventDefault(); (focusReturn.current?.isConnected ? focusReturn.current : addEntryTrigger.current)?.focus(); };

  useEffect(() => {
    const controller = new AbortController();
    setState((previous) => previous.date === date
      ? { ...previous, loading: true, error: "" }
      : { loading: true, data: null, error: "", date });
    Promise.all([
      request("nutrition/profile/", { signal: controller.signal }),
      request(`nutrition/meals/?date=${date}`, { signal: controller.signal }),
      request(`nutrition/activities/?date=${date}`, { signal: controller.signal }),
      request(`nutrition/summary/?date=${date}`, { signal: controller.signal }),
    ]).then(([profile, meals, activities, summary]) => {
      if (!controller.signal.aborted) {
        setState({ loading: false, data: { profile, meals, activities, summary }, error: "", date });
        setReportProfile(profile);
      }
    }).catch((error) => {
      if (!controller.signal.aborted) setState({ loading: false, data: null, error: error.message, date });
    });
    return () => controller.abort();
  }, [date, request, version]);

  const setupRequired = Boolean(state.data && (
    !state.data.profile.height_cm || !state.data.profile.daily_target_kcal ||
    !state.data.profile.daily_target_protein_g || !state.data.profile.daily_target_carbs_g ||
    !state.data.profile.daily_target_fat_g || !state.data.profile.has_weight_entry
  ));

  function openMeal(meal = null) {
    focusReturn.current = document.activeElement;
    setMealDraft(null);
    setEditing(meal || "new");
  }

  function reuseMeal(source) {
    setMealDraft(copyMealDraft(source, date));
    setLibraryOpen(false);
    setEditing("new");
  }

  async function savePreset(body, id) {
    await request(id ? `nutrition/presets/${id}/` : "nutrition/presets/", { method: id ? "PATCH" : "POST", body });
    setVersion((value) => value + 1);
    notify(id ? "Saved meal updated." : "Meal preset saved.", { action: id ? "edited" : "added", entity: "meal" });
  }

  async function deletePreset(event) {
    event.preventDefault(); if (deleteBusy || !deletingPreset) return;
    setDeleteBusy(true); setDeleteError("");
    try { await request(`nutrition/presets/${deletingPreset.id}/`, { method: "DELETE" }); setDeletingPreset(null); setVersion((value) => value + 1); notify("Meal preset deleted.", { action: "deleted", entity: "meal" }); }
    catch (failure) { setDeleteError(failure.message); } finally { setDeleteBusy(false); }
  }

  async function saveMeal(body, id) {
    await request(id ? `nutrition/meals/${id}/` : "nutrition/meals/", { method: id ? "PATCH" : "POST", body });
    setVersion((value) => value + 1);
    notify(id ? "Meal updated." : "Meal added.", { action: id ? "edited" : "added", entity: "meal" });
  }

  async function saveActivity(body, id) {
    await request(id ? `nutrition/activities/${id}/` : "nutrition/activities/", { method: id ? "PATCH" : "POST", body });
    setVersion((value) => value + 1);
    notify(id ? "Activity updated." : "Activity added.", { action: id ? "edited" : "added", entity: "activity" });
  }

  async function deleteActivity(event) {
    event.preventDefault();
    if (deleteBusy || !deletingActivity) return;
    setDeleteBusy(true);
    setDeleteError("");
    try {
      await request(`nutrition/activities/${deletingActivity.id}/`, { method: "DELETE" });
      setDeletingActivity(null);
      setVersion((value) => value + 1);
      notify("Activity deleted.", { action: "deleted", entity: "activity" });
    } catch (error) {
      setDeleteError(error.message);
    } finally {
      setDeleteBusy(false);
    }
  }

  async function saveProfile(body) {
    await request("nutrition/profile/", { method: "PATCH", body });
    setVersion((value) => value + 1);
    notify("Nutrition baseline saved.", { action: "edited", entity: "nutrition_baseline" });
  }

  async function saveSetup(body) {
    if (state.data?.profile.has_weight_entry) {
      await request("nutrition/profile/", { method: "PATCH", body: {
        height_cm: body.height_cm,
        daily_target_kcal: body.daily_target_kcal,
        daily_target_protein_g: body.daily_target_protein_g,
        daily_target_carbs_g: body.daily_target_carbs_g,
        daily_target_fat_g: body.daily_target_fat_g,
      } });
    } else {
      await request("nutrition/setup/", { method: "POST", body });
    }
    setVersion((value) => value + 1);
    notify("Nutrition starting point saved.", { action: "added", entity: "nutrition_baseline" });
  }

  async function saveWeight(day, body) {
    await request(`nutrition/weights/${day}/`, { method: "PUT", body });
    setVersion((value) => value + 1);
    notify("Weight reading saved.", { action: "added", entity: "weight" });
  }

  async function deleteWeight(day) {
    await request(`nutrition/weights/${day}/`, { method: "DELETE" });
    setVersion((value) => value + 1);
    notify("Weight reading deleted.", { action: "deleted", entity: "weight" });
  }

  async function deleteMeal(event) {
    event.preventDefault();
    if (deleteBusy || !deleting) return;
    setDeleteBusy(true);
    setDeleteError("");
    try {
      await request(`nutrition/meals/${deleting.id}/`, { method: "DELETE" });
      setDeleting(null);
      setVersion((value) => value + 1);
      notify("Meal deleted.", { action: "deleted", entity: "meal" });
    } catch (error) {
      setDeleteError(error.message);
    } finally {
      setDeleteBusy(false);
    }
  }

  return <div className="space-y-5">
    {state.loading && state.date === date && state.data && <p role="status" className="text-xs text-slate-600">Refreshing nutrition…</p>}
    {state.loading && (!state.data || state.date !== date) ? <Panel title="Nutrition"><p role="status" className="py-8 text-sm text-slate-600">Loading meals and insights…</p></Panel> : state.error ? <ErrorState message={state.error} retry={() => setVersion((value) => value + 1)} /> : state.data ? <>
      <div className="flex flex-wrap justify-end gap-2"><Button variant="outline" onClick={() => { focusReturn.current = document.activeElement; setSettingsOpen(true); }}><Settings2 className="size-4" />Targets & baseline</Button><DropdownMenu.Root><DropdownMenu.Trigger asChild><Button ref={addEntryTrigger}><Plus className="size-4" />Add entry<ChevronDown className="size-4" /></Button></DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content align="end" sideOffset={6} className="personal-dashboard z-50 min-w-44 rounded-md border border-[var(--pd-border)] bg-white p-1 shadow-md" onCloseAutoFocus={(event) => event.preventDefault()}>{[["Meal", UtensilsCrossed], ["Activity", Activity]].map(([label, Icon]) => <DropdownMenu.Item key={label} className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm outline-none data-[highlighted]:bg-[var(--pd-soft)]" onSelect={() => { focusReturn.current = addEntryTrigger.current; if (label === "Meal") { setMealDraft(null); setEditing("new"); } else setEditingActivity("new"); }}><Icon className="size-4" />{label}</DropdownMenu.Item>)}</DropdownMenu.Content></DropdownMenu.Portal></DropdownMenu.Root></div>
      <DailyNutritionOverview summary={state.data.summary} profile={state.data.profile} basis={basis} onBasisChange={setBasis} />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <NutritionDay meals={state.data.meals} onAdd={() => openMeal()} onEdit={openMeal} onDuplicate={(meal) => { focusReturn.current = document.activeElement; reuseMeal(meal); }} onOpenLibrary={() => { focusReturn.current = document.activeElement; setLibraryOpen(true); }} onSavePreset={(meal) => { focusReturn.current = document.activeElement; setPresetEditing({ initialMeal: meal }); }} onDelete={(meal) => { focusReturn.current = document.activeElement; setDeleteError(""); setDeleting(meal); }} />
        <div className="min-w-0 space-y-5"><NutritionActivityPanel activities={state.data.activities} totalKcal={state.data.summary.day_activity_kcal} onAdd={() => { focusReturn.current = document.activeElement; setEditingActivity("new"); }} onEdit={(activity) => { focusReturn.current = document.activeElement; setEditingActivity(activity); }} onDelete={(activity) => { focusReturn.current = document.activeElement; setDeleteError(""); setDeletingActivity(activity); }} /><NutritionWeightPanel date={date} weights={state.data.summary.weights} baseline={state.data.summary.weight_baseline} targetWeight={state.data.profile.target_weight_kg} onLog={() => { focusReturn.current = document.activeElement; setWeightOpen(true); }} /></div>
      </div>
      {setupRequired && <NutritionSetup profile={state.data.profile} onSave={saveSetup} onLeave={onLeave} />}
      {settingsOpen && <NutritionSettings profile={state.data.profile} open onClose={() => setSettingsOpen(false)} onSaveProfile={saveProfile} restoreFocus={(event) => { event.preventDefault(); focusReturn.current?.isConnected && focusReturn.current.focus(); }} />}
      {weightOpen && <WeightDialog date={date} reading={state.data.summary.weights.find((row) => row.date === date)} onClose={() => setWeightOpen(false)} onSave={saveWeight} onDelete={deleteWeight} restoreFocus={(event) => { event.preventDefault(); focusReturn.current?.isConnected && focusReturn.current.focus(); }} />}
    </> : null}
    {reportProfile && <NutritionInsights initialDate={initialReportDate.current} profile={reportProfile} request={request} refreshKey={version} onOpenDay={onDateChange} />}

    {editing && <MealDialog key={editing === "new" ? `new-${date}` : editing.id} meal={editing === "new" ? null : editing} initialMealDraft={mealDraft} date={date} onClose={() => { setEditing(null); setMealDraft(null); }} onSave={saveMeal} restoreFocus={restoreFocus} />}
    {libraryOpen && <MealLibraryDialog date={date} request={request} refreshKey={version} onChooseMeal={reuseMeal} onChooseFoods={(items) => reuseMeal({ meal_name: "Meal", items })} onEditPreset={(preset) => setPresetEditing({ preset })} onCreatePreset={() => setPresetEditing({})} onDeletePreset={(preset) => { setDeleteError(""); setDeletingPreset(preset); }} onClose={() => setLibraryOpen(false)} restoreFocus={restoreFocus} />}
    {presetEditing && <MealPresetDialog preset={presetEditing.preset} initialMeal={presetEditing.initialMeal} onSave={savePreset} onClose={() => setPresetEditing(null)} restoreFocus={libraryOpen ? undefined : restoreFocus} />}
    <AlertDialog open={!!deletingPreset} onOpenChange={(open) => { if (!open && !deleteBusy) setDeletingPreset(null); }}><AlertDialogContent className="personal-dashboard"><AlertDialogHeader><AlertDialogTitle>Delete {deletingPreset?.meal_name}?</AlertDialogTitle><AlertDialogDescription>This removes the reusable preset. Logged meals stay unchanged.</AlertDialogDescription></AlertDialogHeader>{deleteError && <p role="alert" className="text-sm text-red-700">{deleteError}</p>}<AlertDialogFooter><AlertDialogCancel disabled={deleteBusy}>Keep preset</AlertDialogCancel><AlertDialogAction disabled={deleteBusy} onClick={deletePreset} className="bg-red-700 text-white hover:bg-red-800">{deleteBusy ? "Deleting…" : "Delete preset"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    {editingActivity && <ActivityDialog key={editingActivity === "new" ? `activity-new-${date}` : editingActivity.id} activity={editingActivity === "new" ? null : editingActivity} date={date} weights={state.data?.summary?.weights || []} onClose={() => setEditingActivity(null)} onSave={saveActivity} restoreFocus={(event) => { event.preventDefault(); focusReturn.current?.isConnected && focusReturn.current.focus(); }} />}
    <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => { if (!open && !deleteBusy) setDeleting(null); }}>
      <AlertDialogContent className="personal-dashboard" onCloseAutoFocus={(event) => { event.preventDefault(); focusReturn.current?.isConnected && focusReturn.current.focus(); }}><AlertDialogHeader><AlertDialogTitle>Delete {deleting?.meal_name}?</AlertDialogTitle><AlertDialogDescription>This removes the meal and its food items from your log. Your daily totals will be recalculated.</AlertDialogDescription></AlertDialogHeader>{deleteError && <p role="alert" className="text-sm text-red-700">{deleteError}</p>}<AlertDialogFooter><AlertDialogCancel disabled={deleteBusy}>Keep meal</AlertDialogCancel><AlertDialogAction disabled={deleteBusy} onClick={deleteMeal} className="bg-red-700 text-white hover:bg-red-800">{deleteBusy ? "Deleting…" : "Delete meal"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
    </AlertDialog>
    <AlertDialog open={Boolean(deletingActivity)} onOpenChange={(open) => { if (!open && !deleteBusy) setDeletingActivity(null); }}>
      <AlertDialogContent className="personal-dashboard" onCloseAutoFocus={(event) => { event.preventDefault(); focusReturn.current?.isConnected && focusReturn.current.focus(); }}><AlertDialogHeader><AlertDialogTitle>Delete {deletingActivity?.name}?</AlertDialogTitle><AlertDialogDescription>This removes the activity and recalculates estimated net calories. Meals remain unchanged.</AlertDialogDescription></AlertDialogHeader>{deleteError && <p role="alert" className="text-sm text-red-700">{deleteError}</p>}<AlertDialogFooter><AlertDialogCancel disabled={deleteBusy}>Keep activity</AlertDialogCancel><AlertDialogAction disabled={deleteBusy} onClick={deleteActivity} className="bg-red-700 text-white hover:bg-red-800">{deleteBusy ? "Deleting…" : "Delete activity"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
    </AlertDialog>
  </div>;
}
