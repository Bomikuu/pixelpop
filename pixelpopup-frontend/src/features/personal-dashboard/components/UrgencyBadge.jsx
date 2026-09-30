import { AlertCircle, CalendarClock, CheckCircle2, Clock } from "lucide-react";
import { createElement } from "react";
import { Badge } from "../ui/badge";

const states = {
  upcoming: [
    "Upcoming",
    "border-slate-200 bg-slate-50 text-slate-700",
    CalendarClock,
  ],
  unscheduled: ["No date", "border-slate-200 bg-slate-50 text-slate-700", CalendarClock],
  soon: ["Due soon", "border-amber-200 bg-amber-50 text-amber-900", Clock],
  today: ["Due today", "border-amber-300 bg-amber-100 text-amber-950", Clock],
  overdue: ["Overdue", "border-red-300 bg-red-50 text-red-900", AlertCircle],
  paid: ["Paid", "border-slate-200 bg-slate-50 text-slate-600", CheckCircle2],
  completed: [
    "Completed",
    "border-slate-200 bg-slate-50 text-slate-600",
    CheckCircle2,
  ],
};
export default function UrgencyBadge({ state = "upcoming" }) {
  const [label, style, icon] = states[state] || states.upcoming;
  return (
    <Badge
      variant="outline"
      className={"gap-1 rounded-md font-medium " + style}
    >
      {createElement(icon, { size: 13, "aria-hidden": true })}
      {label}
    </Badge>
  );
}
