import { useEffect, useState } from "react";
import { ArrowRight, Lightbulb } from "lucide-react";
import { Button } from "../../ui/button";
import { rankMealSuggestions } from "../../nutrition/suggestions";
import { nutritionNumber as number } from "../../nutrition/dashboardModel";

export default function NutritionSuggestions({ summary, profile, meals, request, refreshKey, onChoose }) {
  const [state, setState] = useState({ data: [], error: "", loaded: false });
  const [retry, setRetry] = useState(0);
  const totals = summary.day_totals;
  const eligible = !!totals && Number(totals.calories) < Number(profile.daily_target_kcal);
  useEffect(() => {
    if (!eligible) return;
    const controller = new AbortController();
    setState({ data: [], error: "", loaded: false });
    Promise.all([request("nutrition/presets/?page_size=20", { signal: controller.signal }), request("nutrition/foods/?page_size=20", { signal: controller.signal })]).then(([presets, foods]) => {
      if (!controller.signal.aborted) setState({ error: "", loaded: true, data: [...presets.results.map((row) => ({ ...row, sourceKey: `preset-${row.id}`, sourceLabel: "Saved meal" })), ...foods.results.map((row) => ({ sourceKey: `food-${row.id}`, sourceLabel: `Recorded food · ${row.amount} ${row.unit}`, meal_name: row.name, items: [row] }))] });
    }).catch((failure) => { if (!controller.signal.aborted) setState({ data: [], error: failure.message, loaded: true }); });
    return () => controller.abort();
  }, [eligible, request, refreshKey, retry]);
  if (!totals) return null;
  const targets = { calories: profile.daily_target_kcal, protein: profile.daily_target_protein_g, carbs: profile.daily_target_carbs_g, fat: profile.daily_target_fat_g };
  const suggestions = eligible ? rankMealSuggestions({ totals, targets, candidates: state.data }) : [];
  const topMeals = [...meals].sort((a, b) => Number(b.totals.calories) - Number(a.totals.calories)).slice(0, 3);
  return <details className="border-t border-[var(--pd-border)] pt-4"><summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium"><Lightbulb className="size-4 text-amber-600" aria-hidden="true" />Recorded-food insights <span className="ml-auto text-xs font-normal text-slate-500">Show details</span></summary><div className="mt-3 space-y-3">
    <p className="text-xs text-slate-600">Largest food contributions: {topMeals.map((meal) => `${meal.meal_name} (${number(meal.totals.calories)} kcal)`).join(" · ")}</p>
    <p className="text-xs text-slate-600">{["protein", "carbs", "fat"].map((key) => { const gap = Number(targets[key]) - Number(totals[key]); return `${key}: ${number(Math.abs(gap), 2)} g ${gap < 0 ? "over" : "remaining"}`; }).join(" · ")}</p>
    {eligible && <><p className="text-xs text-slate-600">Possible options from up to 20 saved meals and 20 recent foods. These keep your recorded portions; they aren’t a prescription or a promise to meet every target.</p>{state.error ? <div role="alert" className="text-xs text-red-700">{state.error}<Button variant="ghost" size="sm" onClick={() => setRetry((value) => value + 1)}>Try again</Button></div> : !state.loaded ? <p role="status" className="text-xs text-slate-500">Loading recorded options…</p> : suggestions.length ? <ul className="divide-y divide-[var(--pd-border)]">{suggestions.map((meal) => <li key={meal.sourceKey} className="flex flex-wrap items-center gap-2 py-2"><div className="min-w-0 flex-1"><p className="break-words text-sm">{meal.meal_name}</p><p className="text-xs text-slate-500">{meal.sourceLabel} · {number(meal.totals.calories)} kcal · P {number(meal.totals.protein, 2)} / C {number(meal.totals.carbs, 2)} / F {number(meal.totals.fat, 2)} g</p></div><Button variant="outline" size="sm" onClick={() => onChoose(meal)}><ArrowRight className="size-3.5" />Review</Button></li>)}</ul> : <p className="text-xs text-slate-500">No recorded options to compare yet. Save a meal as a preset to reuse it here.</p>}</>}
  </div></details>;
}
