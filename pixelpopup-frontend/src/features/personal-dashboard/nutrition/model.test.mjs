import test from "node:test";
import assert from "node:assert/strict";

import { calculateTotals, parseMealJson } from "./model.js";

const example = {
  meal_name: "Dinner",
  items: [
    { name: "Potato, no skin", amount: 150, unit: "g", calories: 130, protein: 3, carbs: 30, fat: 0 },
    { name: "Century Tuna", amount: 1, unit: "can", calories: 200, protein: 24, carbs: 2, fat: 11 },
    { name: "Cooked white rice", amount: 250, unit: "g", calories: 325, protein: 6, carbs: 71, fat: 1 },
  ],
  totals: { calories: 655, protein: 33, carbs: 103, fat: 12 },
};

test("imports one meal with its items and calculated totals", () => {
  const result = parseMealJson(JSON.stringify(example));
  assert.equal(result.meal_name, "Dinner");
  assert.equal(result.items.length, 3);
  assert.deepEqual(result.calculatedTotals, example.totals);
  assert.deepEqual(result.mismatches, []);
});

test("reads JSON datetime and accepts an empty imported meal name", () => {
  const datetime = "2026-09-28T14:17:00+08:00";
  const result = parseMealJson(JSON.stringify({ ...example, datetime, meal_name: "", estimated: true }), { allowUnnamed: true });
  assert.equal(result.datetime, datetime);
  assert.equal(result.meal_name, "Meal");
});

test("flags supplied totals more than 0.01 away", () => {
  const result = parseMealJson(JSON.stringify({ ...example, totals: { ...example.totals, calories: 656 } }));
  assert.deepEqual(result.mismatches, ["calories"]);
  assert.equal(result.calculatedTotals.calories, 655);
});

test("accepts a one-cent rounding difference", () => {
  const result = parseMealJson(JSON.stringify({ ...example, totals: { ...example.totals, fat: 12.01 } }));
  assert.deepEqual(result.mismatches, []);
});

test("rejects malformed, oversized, and partially invalid meals", () => {
  assert.throws(() => parseMealJson("{"), /valid JSON/i);
  assert.throws(() => parseMealJson(" ".repeat(65537)), /64 KiB/i);
  const invalid = structuredClone(example);
  invalid.items[1].amount = 0;
  assert.throws(() => parseMealJson(JSON.stringify(invalid)), /amount/i);
});

test("sums decimal nutrients without floating-point drift", () => {
  assert.equal(calculateTotals([{ calories: 0.1, protein: 0, carbs: 0, fat: 0 }, { calories: 0.2, protein: 0, carbs: 0, fat: 0 }]).calories, 0.3);
});
