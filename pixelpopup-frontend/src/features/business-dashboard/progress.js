export function weeklyActionProgress(actions, week) {
  const active = actions.filter((action) => action.current_week === week && action.status !== "moved");
  const completed = active.filter((action) => action.status === "completed").length;
  return { completed, total: active.length, percent: active.length ? Math.round(completed / active.length * 100) : 0 };
}

export const checkInQuestions = [
  ["reviewed_pr", "Reviewed a PR?"],
  ["updated_documentation", "Created or updated documentation?"],
  ["sent_eod", "Sent your EOD update?"],
  ["connected_with_person", "Connected with at least one person?"],
  ["finished_tasks", "Finished today's planned tasks?"],
];

export function checkInProgress(answers) {
  const values = checkInQuestions.map(([key]) => answers?.[key] || "");
  const applicable = values.filter((value) => value !== "not_applicable").length;
  const done = values.filter((value) => value === "done").length;
  return { done, applicable, complete: applicable > 0 && done === applicable, noApplicable: applicable === 0 };
}
