import { test } from "node:test";
import { strict as assert } from "node:assert";
import { checkInProgress, weeklyActionProgress } from "./progress.js";

test("weekly progress excludes carried sources and is never complete with no actions", () => {
  assert.deepEqual(weeklyActionProgress([], 1), { completed: 0, total: 0, percent: 0 });
  assert.deepEqual(weeklyActionProgress([
    { current_week: 1, status: "completed" },
    { current_week: 1, status: "moved" },
    { current_week: 2, status: "not_started" },
  ], 1), { completed: 1, total: 1, percent: 100 });
});

test("check-in completion needs at least one applicable done item", () => {
  const allNotApplicable = Object.fromEntries(["reviewed_pr", "updated_documentation", "sent_eod", "connected_with_person", "finished_tasks"].map((key) => [key, "not_applicable"]));
  assert.deepEqual(checkInProgress(allNotApplicable), { done: 0, applicable: 0, complete: false, noApplicable: true });
  assert.equal(checkInProgress({ ...allNotApplicable, reviewed_pr: "done" }).complete, true);
  assert.equal(checkInProgress({ ...allNotApplicable, reviewed_pr: "not_done" }).complete, false);
  assert.equal(checkInProgress({ reviewed_pr: "done" }).complete, false);
});
