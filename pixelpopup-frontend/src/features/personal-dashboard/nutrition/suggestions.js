import { calculateTotals } from "./model.js";

export function rankMealSuggestions({ totals, targets, candidates, limit = 3 }) {
  if (!totals || !Number(targets?.calories) || Number(totals.calories) >= Number(targets.calories)) return [];
  const gaps = Object.fromEntries(["calories", "protein", "carbs", "fat"].map((key) => [key, Math.max(0, Number(targets[key] || 0) - Number(totals[key] || 0))]));
  return candidates.flatMap((candidate) => {
    try {
      const nutrients = calculateTotals(candidate.items);
      if (Number(nutrients.calories) <= 0) return [];
      const score = Object.entries(gaps).reduce((sum, [key, gap]) => gap > 0 ? sum + Math.abs(gap - Number(nutrients[key])) / gap : sum, 0);
      return [{ ...candidate, totals: nutrients, gaps, score }];
    } catch { return []; }
  }).sort((a, b) => a.score - b.score || String(a.sourceKey).localeCompare(String(b.sourceKey)) || a.meal_name.localeCompare(b.meal_name)).slice(0, Math.max(0, Math.min(3, limit)));
}
