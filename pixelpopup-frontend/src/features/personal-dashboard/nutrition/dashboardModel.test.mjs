import test from "node:test";
import assert from "node:assert/strict";
import { deriveDailyOverview, resolveAnalyticsRange, copyMealDraft, weightGoalProgress, sortHistoryRows } from "./dashboardModel.js";

const profile = { daily_target_kcal: "1800.00" };
test("unlogged food differs from a recorded zero; active burn remains visible", () => {
  assert.equal(deriveDailyOverview({ profile, summary: { day_activity_kcal: "250" } }).calories, null);
  assert.equal(deriveDailyOverview({ profile, summary: { day_totals: { calories: "0" } } }).calories, 0);
  const data = deriveDailyOverview({ profile, basis: "net", summary: { day_totals: { calories: "2000" }, day_activity_kcal: "250" } });
  assert.equal(data.calories, 1750); assert.equal(data.foodStatus, "over");
  assert.equal(deriveDailyOverview({ profile: { daily_target_kcal: 10000 }, summary: { day_totals: { calories: 9999 } } }).status, "approaching");
  assert.equal(deriveDailyOverview({ profile, basis: "net", summary: { day_totals: { calories: 0 }, day_activity_kcal: 250 } }).fill, 0);
  assert.equal(deriveDailyOverview({ profile, summary: { day_totals: { calories: 9999 } } }).fill, 100);
});
test("inclusive reports compare an equal immediately preceding period", () => {
  assert.deepEqual(resolveAnalyticsRange({ period: "week", anchor: "2026-10-21", today: "2026-10-21" }), { start: "2026-10-15", end: "2026-10-21", previousStart: "2026-10-08", previousEnd: "2026-10-14" });
  assert.deepEqual(resolveAnalyticsRange({ period: "month", anchor: "2026-10-21", today: "2026-10-21" }), { start: "2026-10-01", end: "2026-10-21", previousStart: "2026-09-10", previousEnd: "2026-09-30" });
  assert.equal(resolveAnalyticsRange({ period: "month", anchor: "2024-02-10", today: "2026-10-21" }).end, "2024-02-29");
  for (const [start, end] of [["2026-11-01", "2026-11-02"], ["2026-10-20", "2026-10-01"], ["2024-01-01", "2026-01-01"], ["2026-02-30", "2026-03-01"]]) assert.throws(() => resolveAnalyticsRange({ period: "custom", start, end, today: "2026-10-21" }));
  assert.equal(resolveAnalyticsRange({ period: "custom", start: "2024-01-01", end: "2024-12-31", today: "2026-10-21" }).end, "2024-12-31");
});
test("copies keep portions but never an ID or future source timestamp", () => {
  const source = { id: 9, date: "2026-10-20", datetime: "2026-10-20T20:00:00+08:00", meal_name: "Dinner", items: [{ id: 3, name: "Rice", amount: "100", unit: "g", calories: "130", protein: "2", carbs: "30", fat: "0" }] };
  const before = JSON.stringify(source), now = "2026-10-21T12:00:00+08:00";
  const copy = copyMealDraft(source, "2026-10-21", now);
  assert.equal(copy.datetime, now); assert.equal(copy.id, undefined); assert.equal(copy.items[0].id, undefined);
  assert.equal(copyMealDraft(source, "2026-10-19", now).datetime, "2026-10-19T20:00:00+08:00");
  assert.equal(JSON.stringify(source), before);
});
test("weight goals support gain, loss, no reading, equal and passed targets", () => {
  const reading = (weight_kg) => ({ date: "2026-10-01", weight_kg });
  assert.equal(weightGoalProgress({ baseline: null, latest: reading(70), target: 60 }), null);
  assert.equal(weightGoalProgress({ baseline: reading(80), latest: reading(75), target: 70 }).percentage, 50);
  assert.equal(weightGoalProgress({ baseline: reading(60), latest: reading(65), target: 70 }).percentage, 50);
  assert.equal(weightGoalProgress({ baseline: reading(70), latest: reading(70), target: 70 }).reached, true);
  assert.equal(weightGoalProgress({ baseline: reading(80), latest: reading(65), target: 70 }).percentage, 100);
});
test("numeric history sorting leaves missing records last without mutating rows", () => {
  const rows = [{ date: "2026-10-01", totals: null }, { date: "2026-10-02", totals: { calories: "9" } }, { date: "2026-10-03", totals: { calories: "100" } }];
  assert.equal(sortHistoryRows(rows, "calories", "asc")[0].date, "2026-10-02");
  assert.equal(sortHistoryRows(rows, "calories", "desc").at(-1).totals, null);
  assert.equal(rows[0].totals, null);
});
