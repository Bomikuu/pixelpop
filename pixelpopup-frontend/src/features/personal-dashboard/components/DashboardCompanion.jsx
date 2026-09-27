import { useEffect, useMemo, useState } from "react";
import RoamingCatMascot from "../../../ui/mascot/RoamingCatMascot";
import { catMascotConfig } from "../../../ui/mascot/catMascotConfig";

const config = {
  ...catMascotConfig,
  supportedRoutes: ["/dashboard"],
  speechDuration: 8000,
  minimumIdleDuration: 8000,
  maximumIdleDuration: 14000,
  repositionOnScroll: false,
  repositionOnSpeech: false,
  exclusionSelectors: [
    ...catMascotConfig.exclusionSelectors,
    "[data-dashboard-sidebar]",
    ".personal-dashboard header",
    ".personal-dashboard main button",
    ".personal-dashboard table",
    ".personal-dashboard .recharts-wrapper",
    "[data-dashboard-toast]",
  ],
};

function messagesFor(tab, overdue, activity) {
  if (tab === "funds")
    return [
      "Contribute whenever you choose, Miku. Moving cash into a fund is a transfer, not an expense.",
      "These fund values are manually recorded. Use a dated correction when the provider's value changes.",
    ];
  if (tab === "people")
    return [
      "Support is a gift; lending is repayable. Keep them separate even when they go to the same person, Miku.",
      "Use the same recipient name to see your giving and loans together.",
    ];
  if (activity === "saved-expense")
    return [
      "Expense saved, Miku. Your balance and summaries now include it. I’ll keep watch while you check the numbers.",
      "Another expense recorded. Compare this month with last month to see where your spending is heading.",
    ];
  if (activity === "saved-deadline")
    return [
      "Deadline saved, Miku. Check Tasks & deadlines or Calendar to see where it fits.",
      "One less thing to keep in your head. Your deadline is recorded; mark it complete when it’s done.",
    ];
  if (activity === "expense" || ["expenses", "transactions"].includes(tab))
    return [
      "Logging an expense? Pick the account you actually paid from so your balance stays accurate.",
      "Small expenses count too, Miku. A category helps you spot patterns in the monthly charts.",
    ];
  if (overdue > 0 && ["", "deadlines", "bills", "calendar"].includes(tab))
    return [
      "Miku, some deadlines are overdue. Review the overdue items first; I’ll supervise from here.",
      "One obligation at a time. Record a payment only once so your expense total stays accurate.",
    ];
  if (
    activity === "deadline" ||
    ["deadlines", "bills", "calendar"].includes(tab)
  )
    return [
      "Water and electricity can change each month. Enter this month’s amount before recording the bill payment.",
      "Planning ahead, Miku? Give the task a due date and check Calendar for the bigger picture.",
    ];
  if (tab === "loans")
    return [
      "Money lent isn’t available cash yet. Record repayments when they actually reach your account.",
      "Keeping track of who owes what? The loan history keeps repayments attached to the right person.",
    ];
  if (tab === "accounts")
    return [
      "These balances are manually tracked, Miku. Use a correction when the recorded balance needs adjusting.",
      "Moving money between accounts? Use Transfer / card payment, not Add expense.",
    ];
  return [
    "Welcome back, Miku. Check your deadlines, then your monthly spending. I’ll handle the roaming.",
    "Want a quick check-in? Compare two months in the charts before adding your next expense.",
  ];
}

function reactionMessage({ action, entity }) {
  if (entity === "shared_bill")
    return action === "added"
      ? "Breakdown ready, Miku. Your contribution is separate from the group total; nothing has been paid yet."
      : "Payment noted in the shared breakdown, Miku. Only confirmed personal payments update your ledger.";
  if (entity === "fund_contribution")
    return "Contribution recorded, Miku. Cash moved into your fund without counting as spending.";
  if (entity === "fund_withdrawal")
    return "Withdrawal recorded, Miku. The money is back in your cash account—not new income.";
  if (entity === "giving" && action === "added")
    return "Support recorded, Miku. It counts as giving, not a loan to be repaid.";
  if (action === "collected")
    return "Collection recorded, Miku. Your loan and receiving account are updated. Glad to see that money come home.";
  if (action === "transferred")
    return "Transfer recorded, Miku. Both accounts are updated without counting it as spending.";
  if (entity === "schedule")
    return "Recurring schedule saved, Miku. Each occurrence will appear when due; no payment has been recorded yet.";
  if (action === "deleted")
    return "Record deleted, Miku. The affected totals have been recalculated. A little less clutter to patrol.";
  if (action === "archived")
    return "Archived, Miku. The financial history is still safe. I’m keeping an eye on it.";
  if (action === "completed")
    return "Task completed! One less deadline on your list, Miku. Time for a well-earned stretch.";
  if (action === "settled")
    return "Payment recorded, Miku. Your obligation and balances are updated. No need to log the same payment twice.";
  if (action === "repaid")
    return "Repayment recorded, Miku. Your loan balance and receiving account have been updated.";
  if (action === "corrected")
    return "Balance corrected, Miku. The reason is kept in history so you can trace the change.";
  if (action === "edited")
    return "Changes saved, Miku. Your record and summaries are up to date. I approve of tidy bookkeeping.";
  if (entity === "expense")
    return "Expense added, Miku. Your balance and spending totals are updated. I’ll watch the pennies.";
  if (entity === "deadline")
    return "Deadline added, Miku. It’s on your list now, not just in your head. I’ll be nearby.";
  if (entity === "loan")
    return "Loan added, Miku. Record repayments here when the money actually comes back.";
  return "Saved, Miku. Your workspace is updated. Back to my rounds!";
}

export default function DashboardCompanion({
  tab,
  overdue,
  activity,
  reaction,
}) {
  const [desktop, setDesktop] = useState(
    () => window.matchMedia("(min-width: 1024px)").matches,
  );
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const update = () => setDesktop(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const messageList = useMemo(
    () =>
      messagesFor(tab, overdue, activity).map((message, index) => ({
        id: `${tab}-${activity || "idle"}-${overdue > 0}-${index}`,
        routes: ["/dashboard*"],
        message,
        weight: 1,
      })),
    [tab, overdue, activity],
  );
  const response = useMemo(
    () =>
      reaction
        ? { id: "reaction-" + reaction.id, message: reactionMessage(reaction) }
        : null,
    [reaction],
  );
  return desktop ? (
    <RoamingCatMascot
      config={config}
      messageList={messageList}
      reaction={response}
    />
  ) : null;
}
