import test from "node:test";
import assert from "node:assert/strict";
import { sectionValue, viewValue, queryString, manilaInstant, comparison, scenarioMultiplier } from "./state.js";

test("unknown URL state has safe defaults and retains unrelated filters", () => {
  assert.equal(sectionValue("anything"), "due");
  assert.equal(viewValue("anything"), "cards");
  const query = new URLSearchParams(queryString({ month: "2026-10", q: "electricity", category: "4", page: 2 }));
  query.set("view", "table");
  assert.equal(query.get("month"), "2026-10");
  assert.equal(query.get("category"), "4");
});
test("date-time and scenario values are explicit", () => {
  assert.equal(manilaInstant("2026-10-15T09:30"), "2026-10-15T09:30:00+08:00");
  assert.equal(scenarioMultiplier("high"), "1.2");
  assert.equal(scenarioMultiplier("low"), "0.8");
});
test("unknown and zero baselines do not invent comparison badges", () => {
  assert.equal(comparison("0", "0"), undefined);
  assert.equal(comparison(null, "100"), undefined);
  assert.equal(comparison("0", "100").trend, "down");
});
