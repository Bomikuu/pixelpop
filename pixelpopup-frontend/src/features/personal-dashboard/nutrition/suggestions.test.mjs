import test from "node:test";
import assert from "node:assert/strict";
import { rankMealSuggestions } from "./suggestions.js";
const item = { name: "Food", amount: "1", unit: "portion", calories: "200", protein: "10", carbs: "30", fat: "4" };
const candidates = [1, 2, 3, 4].map((id) => ({ sourceKey: `preset-${id}`, meal_name: "Same name", items: [{ ...item }] }));
const targets = { calories: 1800, protein: 100, carbs: 200, fat: 60 };
test("no food, reached and exceeded targets do not generate suggestions", () => {
  for (const totals of [null, { calories: 1800 }, { calories: 2000 }]) assert.deepEqual(rankMealSuggestions({ totals, targets, candidates }), []);
});
test("suggestions preserve whole portions, distinct source records and stable limits", () => {
  const before = JSON.stringify(candidates);
  const result = rankMealSuggestions({ totals: { calories: 1600, protein: 90, carbs: 170, fat: 56 }, targets, candidates, limit: 99 });
  assert.equal(result.length, 3);
  assert.deepEqual(result.map((row) => row.sourceKey), ["preset-1", "preset-2", "preset-3"]);
  assert.deepEqual(result[0].items[0], item);
  assert.equal(Number(result[0].totals.calories), 200);
  assert.equal(JSON.stringify(candidates), before);
});
