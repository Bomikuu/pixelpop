const personal = {
  nutrition: [
    "Meals in, movement out, Miku. Food intake and estimated activity burn stay visible separately.",
    "A meal doesn't need to be perfect to be worth recording. Check the date and time before saving.",
    "Your calorie and macro targets are yours to set. I'll keep an eye on the progress, not judge your snacks.",
  ],
  accounts: ["Which card paid, Miku? The last four digits help keep lookalikes apart.", "Transfers move your money; expenses spend it. Different paws, different jobs."],
  assets: ["The house and car belong here, Miku. Their value and any remaining financing tell different parts of the story.", "Check an asset's payment history before recording its next payment. No double counting on my watch."],
  funds: ["Saving for later is still your money, Miku. Contributions and withdrawals aren't the same as income and expenses.", "Coverage premiums are spending; recorded fund values are assets. Keep those two stories separate."],
  people: ["A gift is kindness, a loan is money expected back. Pick the right one before recording it, Miku.", "Reuse a saved person so their giving and lending history stays together. I like a tidy family tree."],
  transactions: ["Small purchases leave pawprints too. Categories make them easier to spot in the charts.", "Choose the account that actually paid, Miku. The preview will help you check the balance before saving."],
  income: ["Income belongs on the date and account that actually received it, Miku. Promised money is a different story."],
  spending: ["Follow the categories, Miku. A change in spending is easier to understand when you can see what caused it."],
  reports: ["Compare like with like, Miku. This month's totals and a previous-month baseline tell a clearer story together."],
  deadlines: ["Finish a task, pay a bill, or open the page that needs a real entry. Each deadline has its own next step.", "Variable bills need this month's actual amount. Yesterday's electricity bill isn't today's promise."],
  bills: ["Netflix, electricity, or the pets: choose the category that helps you understand the month, Miku.", "A scheduled bill isn't a payment yet. Record it when the money really leaves."],
  shared: ["Your share isn't the whole group's expense, Miku. Keep contributions and confirmed payments distinct.", "Public payment reports wait for review. A report alone doesn't mean money reached the receiver."],
  calendar: ["One date at a time, Miku. The calendar puts bills and tasks on the day they belong.", "A busy square is a cue to plan, not panic. Open an item to see what it needs."],
  brainstorm: ["Catch the idea now, polish it later. A date is optional; a good place to keep it isn't.", "Drag an idea into the group where it belongs, Miku. I'll sit still while your thoughts move."],
  eod: ["Done and In Progress tell different stories. Give each a line before you call it a day, Miku.", "An empty workday is waiting for your entry. Holidays and days off deserve their own label.", "A small honest EOD beats a perfect one you never write. What moved forward today?"],
  events: ["This is the read-only trail, Miku. Look here when you need to know what changed.", "Activity isn't automatically progress, but a clear history helps explain both."],
  settings: ["A backup is a little safety net, Miku. Keep a copy somewhere you can find it again.", "Set reminders to a rhythm you can actually follow. I'll be the quiet one in the corner."],
  default: ["Welcome back, Miku. A quick look at deadlines first, then the bigger picture.", "One useful update at a time. I'm stationed here, so your workspace gets all the room to think."],
};

const business = {
  week: ["Pick the next practical action, Miku. Small completed steps make a stronger week than a crowded list.", "Done for the day? Your EOD check-in can capture the work that actually happened."],
  roadmap: ["A plan points the way; recorded evidence shows the distance travelled. One week at a time, Miku."],
  goals: ["Give a goal an owner and a clear outcome. Shared expectations beat guesswork."],
  quality: ["Reviewed a PR today? Record the feedback and follow-through, not just the count.", "A quality rate needs real checked and eligible counts. No invented numbers from this cat."],
  metrics: ["Look for movement, Miku, then ask what changed in the work behind it. A chart is a clue, not a verdict."],
  team: ["People need context as well as metrics. Open a member to see their assigned work and recorded signals.", "Check in with someone who needs attention. A conversation can reveal what the numbers can't."],
  delegation: ["Hand over the outcome, not just the task. An owner and a tested backup make the handoff sturdier."],
  processes: ["A process earns its place when it makes the next attempt easier. Record what you tried and what you observed."],
  documentation: ["A useful document lets someone else take the next step without you. Has the backup actually tried it?"],
  evidence: ["Keep examples close to the claim, Miku. Real outcomes speak louder than a polished label."],
  reflection: ["What worked, what got stuck, and what will you change? Honest notes are easier to act on."],
  clients: ["Keep the client's facts in one place, Miku. Reuse them in the project and review the editable document drafts.", "Before sharing a document, check the names, scope, dates, and payment terms. My paws aren't a legal signature."],
  "applications/ai": ["Pick the provider, confirm its key, then check the budget before generating. No surprise AI calls from me."],
  applications: ["Lead with experience you can explain and support, Miku. Keywords help people find the evidence.", "An AI proposal is a draft, not a new fact. Review the changes before accepting them into your résumé.", "Check the monthly AI budget before generating again. A retry is still a real request."],
  default: ["Good to see you, Miku. Start with this week's priorities and anything that needs attention.", "I'm on desk duty. You handle the work; I'll help you notice what's saved and what needs another look."],
};

export function dashboardSmokeyMessages(platform, section, overdue = 0) {
  const messages = platform === "business" ? business : personal;
  if (platform === "personal" && overdue > 0 && ["", "deadlines", "bills", "calendar"].includes(section)) {
    return ["Some deadlines need attention, Miku. Open the overdue list and take the next real action.", ...(messages[section] || messages.default)];
  }
  return messages[section] || messages.default;
}

export function smokeyAcknowledgement(notice) {
  if (notice.danger || notice.tone === "error") return "That needs a second look, Miku. Here's what happened:";
  const action = notice.context?.action;
  const entity = notice.context?.entity;
  if (notice.tone === "celebrate" || action === "completed") return "Nice work, Miku! One more thing off your plate.";
  if (action === "deleted") return "A little less clutter, Miku. I'll stay right here.";
  if (action === "archived") return "Filed away, Miku. On to the next thing.";
  if (action === "edited" || action === "corrected") return "Details matter, Miku. Good catch.";
  if (entity === "meal") return "Another meal on the record, Miku. Even the snacks deserve a line.";
  if (entity === "activity") return "A little movement deserves a little credit, Miku.";
  if (entity === "eod") return "A day worth remembering, Miku. Thanks for leaving a trail.";
  if (entity === "brainstorm") return "An idea caught before it wandered off, Miku. Much better than chasing it later.";
  if (entity === "weight") return "A useful check-in, Miku. One reading is a point, not the whole trend.";
  if (entity === "shared_bill") return "Keeping the group's story separate from yours, Miku. Let's keep the breakdown clear.";
  if (["giving", "loan"].includes(entity)) return "People and money deserve clear records, Miku.";
  if (["fund_contribution", "fund_withdrawal"].includes(entity)) return "Money with a purpose, Miku. A useful little breadcrumb for later.";
  if (entity === "expense") return "Keeping track beats keeping it in your head, Miku.";
  if (entity === "deadline" || entity === "schedule") return "Future-you has one less thing to remember, Miku.";
  return ["Noted, Miku. I'm keeping watch.", "Got it, Miku. One step at a time.", "Here's the update, Miku. I'm right here."][Number(notice.id) % 3 || 0];
}
