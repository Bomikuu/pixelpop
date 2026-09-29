export function todayInManila() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const value = (type) => parts.find((part) => part.type === type)?.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

const dayDifference = (due, today) => Math.round((Date.parse(`${due}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);

export function actionAttention(action, today) {
  if (["completed", "moved"].includes(action.status)) return null;
  const days = action.due_date ? dayDifference(action.due_date, today) : null;
  if (action.status === "blocked") return { action, level: "urgent", reason: days !== null && days < 0 ? "Blocked and overdue" : "Blocked", days };
  if (days !== null && days < 0) return { action, level: "urgent", reason: `${Math.abs(days)} ${days === -1 ? "day" : "days"} overdue`, days };
  if (days !== null && days <= 2) return { action, level: "soon", reason: days === 0 ? "Due today" : days === 1 ? "Due tomorrow" : "Due in 2 days", days };
  return null;
}

export function attentionItems(actions, today) {
  return actions.map((action) => actionAttention(action, today)).filter(Boolean).sort((a, b) =>
    (a.level === "urgent" ? 0 : 1) - (b.level === "urgent" ? 0 : 1)
    || (a.days ?? Infinity) - (b.days ?? Infinity)
    || a.action.title.localeCompare(b.action.title)
  );
}

export function memberWorkSignal(member, actions, currentWeek, today) {
  const owned = actions.filter((action) => action.owner === member.id && action.status !== "moved");
  const attention = attentionItems(owned, today);
  const urgent = attention.filter((item) => item.level === "urgent");
  if (urgent.length) return { level: "urgent", title: "Needs follow-up", detail: `${urgent.length} blocked or overdue ${urgent.length === 1 ? "action" : "actions"}`, items: urgent };
if (attention.length) return { level: "soon", title: "Deadline approaching", detail: `${attention.length} ${attention.length === 1 ? "action needs" : "actions need"} a check-in soon`, items: attention };
  if (!currentWeek) return { level: "neutral", title: "No active week", detail: "There is no current weekly action window; historical work is listed below", items: [] };
  const thisWeek = owned.filter((action) => action.current_week === currentWeek);
  if (thisWeek.length && thisWeek.every((action) => action.status === "completed")) return { level: "good", title: "Doing well", detail: "All assigned actions this week are complete", items: [] };
  if (thisWeek.some((action) => ["completed", "in_progress"].includes(action.status))) return { level: "good", title: "On track", detail: "Progress recorded this week, with no blocked or overdue actions", items: [] };
  return { level: "neutral", title: "Not enough recorded work", detail: thisWeek.length ? "No progress has been recorded on this week's assignments yet" : "No actions assigned this week", items: [] };
}
