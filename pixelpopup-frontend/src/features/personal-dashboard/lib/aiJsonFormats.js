function formatPrompt(introduction, rules, example) {
  return [
    introduction,
    "Return only valid JSON: no Markdown fences, comments, or text outside the JSON.",
    "Use my notes below as the source. Do not invent factual details; estimate only where the rules below allow it.",
    "Rules:",
    ...rules.map((rule) => `- ${rule}`),
    "Example structure (replace the example content with my notes):",
    JSON.stringify(example, null, 2),
    "",
    "My notes:",
  ].join("\n");
}

export function eodAiFormat(groupName, date) {
  return formatPrompt("Turn my notes into EOD entries for my dashboard.", [
    `Use an existing group name. The selected group is "${groupName}"; do not invent a new group.`,
    "Use YYYY-MM-DD dates, never a future date. Put 1–100 days in the entries array.",
    "type must be one of: workday, day_off, vacation, holiday.",
    "For a workday, title and summary are required. Put completed work in items and unfinished work in in_progress; both are arrays of strings.",
    "For day_off, vacation, or holiday, title and summary are optional; leave items and in_progress empty.",
    "Do not include bullet_list or slack_message; the dashboard generates the Slack recap.",
  ], {
    group: groupName,
    entries: [{
      date,
      type: "workday",
      title: "Daily recap",
      summary: "Improved the income form and reviewed the next steps.",
      items: ["Fixed income page validation"],
      in_progress: ["Finish payment flow testing"],
    }],
  });
}

export function brainstormAiFormat() {
  return formatPrompt("Organize my ideas into boards, groups, and ideas for my Brainstorming dashboard.", [
    "Use a boards array with 1–50 boards. Each board needs a name and groups array; each group needs a name and ideas array.",
    "Each idea needs a title. Optional fields: description, source_text, urgency, status, tags, reference_url, notes.",
    "urgency must be one of: high, medium, low, someday. Default: medium.",
    "status must be one of: inbox, planned, in_progress, done, archived. Default: inbox. Do not use carried_over; that requires the app's Carry to task action.",
    "tags is an array of at most 20 strings, each up to 32 characters. reference_url must be an HTTP or HTTPS link, or an empty string.",
    "Do not create duplicate board or group names, and do not repeat an idea title on the same board.",
  ], {
    boards: [{
      name: "Project ideas",
      description: "Ideas to explore",
      groups: [{
        name: "Product",
        description: "Feature concepts",
        ideas: [{
          title: "Improve the onboarding flow",
          description: "Make the first steps clearer.",
          source_text: "",
          urgency: "medium",
          status: "inbox",
          tags: ["onboarding"],
          reference_url: "",
          notes: "",
        }],
      }],
    }],
  });
}

export function mealAiFormat(datetime) {
  return formatPrompt("Estimate one meal from my food notes for my Nutrition dashboard.", [
    "Return one meal object, not an array. meal_name and at least one item are required.",
    "datetime must use YYYY-MM-DDTHH:mm:ss+08:00 (Asia/Manila) and must not be in the future. Use the time in my notes; if none is given, use the example's current time.",
    "Each item needs name, numeric amount, unit, calories, protein, carbs, and fat. Protein, carbs, and fat are grams for that item, not per 100 g.",
    "totals is optional; if included, sum the item values. The dashboard recalculates totals from items when saving.",
    "Estimate only when needed; do not present uncertain nutrition numbers as exact measurements.",
  ], {
    datetime,
    meal_name: "Lunch",
    items: [{ name: "Cooked white rice", amount: 250, unit: "g", calories: 325, protein: 6, carbs: 71, fat: 1 }],
    totals: { calories: 325, protein: 6, carbs: 71, fat: 1 },
  });
}

export function activityAiFormat(date) {
  return formatPrompt("Turn my exercise notes into one activity JSON object for my Nutrition dashboard.", [
    "date must use YYYY-MM-DD and must not be in the future.",
    "activity_type must be one of: walking, running, cycling, swimming, strength, other.",
    "source must be estimated or manual. For estimated, provide duration_minutes or walking-session steps, and omit active_kcal; the dashboard calculates it using my weight.",
    "steps is only for walking and must be a whole number from 1 to 100000. duration_minutes must be 1 to 1440.",
    "For manual, provide active_kcal (active calories burned, not total calories) from 0.01 to 10000. activity_type other requires source manual and a name.",
    "Return one object, not an array.",
  ], {
    date,
    activity_type: "walking",
    source: "estimated",
    steps: 3000,
    duration_minutes: 30,
  });
}
