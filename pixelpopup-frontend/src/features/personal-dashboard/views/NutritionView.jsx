import { useEffect, useRef, useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { ErrorState, Panel } from "../components/Panel";
import MealDialog from "../components/nutrition/MealDialog";
import NutritionDay from "../components/nutrition/NutritionDay";
import NutritionInsights from "../components/nutrition/NutritionInsights";
import NutritionSettings from "../components/nutrition/NutritionSettings";
import NutritionSetup from "../components/nutrition/NutritionSetup";

export default function NutritionView({ request, notify, date, onLeave }) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState({ loading: true, data: null, error: "", date: null });
  const [period, setPeriod] = useState("week");
  const [periodRetry, setPeriodRetry] = useState(0);
  const [periodState, setPeriodState] = useState({ key: "", loading: false, data: null, error: "" });
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const focusReturn = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    setState((previous) => previous.date === date
      ? { ...previous, loading: true, error: "" }
      : { loading: true, data: null, error: "", date });
    Promise.all([
      request("nutrition/profile/", { signal: controller.signal }),
      request(`nutrition/meals/?date=${date}`, { signal: controller.signal }),
      request(`nutrition/summary/?date=${date}`, { signal: controller.signal }),
    ]).then(([profile, meals, summary]) => {
      if (!controller.signal.aborted) setState({ loading: false, data: { profile, meals, summary }, error: "", date });
    }).catch((error) => {
      if (!controller.signal.aborted) setState({ loading: false, data: null, error: error.message, date });
    });
    return () => controller.abort();
  }, [date, request, version]);

  const periodKey = `${period}:${period === "month" ? date.slice(0, 7) : "all"}:${version}:${periodRetry}`;
  const setupRequired = Boolean(state.data && (
    !state.data.profile.height_cm || !state.data.profile.daily_target_kcal ||
    !state.data.profile.daily_target_protein_g || !state.data.profile.daily_target_carbs_g ||
    !state.data.profile.daily_target_fat_g || !state.data.profile.has_weight_entry
  ));
  useEffect(() => {
    if (period === "week") return undefined;
    const controller = new AbortController();
    setPeriodState({ key: periodKey, loading: true, data: null, error: "" });
    request(`nutrition/period-summary/?period=${period}&date=${date}`, { signal: controller.signal })
      .then((data) => { if (!controller.signal.aborted) setPeriodState({ key: periodKey, loading: false, data, error: "" }); })
      .catch((error) => { if (!controller.signal.aborted) setPeriodState({ key: periodKey, loading: false, data: null, error: error.message }); });
    return () => controller.abort();
  }, [date, period, periodKey, request]);

  function openMeal(meal = null) {
    focusReturn.current = document.activeElement;
    setEditing(meal || "new");
  }

  async function saveMeal(body, id) {
    await request(id ? `nutrition/meals/${id}/` : "nutrition/meals/", { method: id ? "PATCH" : "POST", body });
    setVersion((value) => value + 1);
    notify(id ? "Meal updated." : "Meal added.", { action: id ? "edited" : "added", entity: "meal" });
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
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(19rem,1fr)]">
        <NutritionDay date={date} meals={state.data.meals} profile={state.data.profile} summary={state.data.summary} onAdd={() => openMeal()} onEdit={openMeal} onDelete={(meal) => { focusReturn.current = document.activeElement; setDeleteError(""); setDeleting(meal); }} />
        <NutritionSettings profile={state.data.profile} date={date} weights={state.data.summary.weights} onSaveProfile={saveProfile} onSaveWeight={saveWeight} onDeleteWeight={deleteWeight} />
      </div>
      <NutritionInsights summary={state.data.summary} profile={state.data.profile} period={period} onPeriodChange={setPeriod} periodState={periodState.key === periodKey ? periodState : { loading: true, data: null, error: "" }} onRetry={() => setPeriodRetry((value) => value + 1)} />
      {setupRequired && <NutritionSetup profile={state.data.profile} onSave={saveSetup} onLeave={onLeave} />}
    </> : null}

    {editing && <MealDialog key={editing === "new" ? `new-${date}` : editing.id} meal={editing === "new" ? null : editing} date={date} onClose={() => setEditing(null)} onSave={saveMeal} restoreFocus={(event) => { event.preventDefault(); focusReturn.current?.isConnected && focusReturn.current.focus(); }} />}
    <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => { if (!open && !deleteBusy) setDeleting(null); }}>
      <AlertDialogContent className="personal-dashboard" onCloseAutoFocus={(event) => { event.preventDefault(); focusReturn.current?.isConnected && focusReturn.current.focus(); }}><AlertDialogHeader><AlertDialogTitle>Delete {deleting?.meal_name}?</AlertDialogTitle><AlertDialogDescription>This removes the meal and its food items from your log. Your daily totals will be recalculated.</AlertDialogDescription></AlertDialogHeader>{deleteError && <p role="alert" className="text-sm text-red-700">{deleteError}</p>}<AlertDialogFooter><AlertDialogCancel disabled={deleteBusy}>Keep meal</AlertDialogCancel><AlertDialogAction disabled={deleteBusy} onClick={deleteMeal} className="bg-red-700 text-white hover:bg-red-800">{deleteBusy ? "Deleting…" : "Delete meal"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
    </AlertDialog>
  </div>;
}
