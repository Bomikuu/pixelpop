import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  CalendarDays,
  Receipt,
  Zap,
  Droplets,
  Wifi,
  PawPrint,
  HeartHandshake,
} from "lucide-react";
import { choiceIcon } from "../lib/presets";

export default function RecordIdentity({ resource, row, label }) {
  const person = ["loans", "people"].includes(resource);
  const initials = String(label)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const content = [row.title, row.name, row.category_name, label]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const utility = /electric|meralco|power bill/.test(content)
    ? { icon: Zap, color: "bg-amber-50 text-amber-800" }
    : /\bwater\b/.test(content)
      ? { icon: Droplets, color: "bg-blue-50 text-blue-700" }
      : /internet|\bwifi\b|broadband/.test(content)
        ? { icon: Wifi, color: "bg-teal-50 text-teal-800" }
        : /\bpets?\b|veterinary|\bvet\b/.test(content)
          ? { icon: PawPrint, color: "bg-amber-50 text-amber-800" }
          : null;
  const Icon =
    utility?.icon ||
    (row.recipient && resource === "transactions"
      ? HeartHandshake
      : resource === "transactions"
        ? row.kind === "income"
          ? ArrowDownLeft
          : ArrowUpRight
        : resource === "movements"
          ? ["fund_contribution", "fund_withdrawal"].includes(row.kind)
            ? choiceIcon(row.kind)
            : ArrowLeftRight
          : resource === "deadlines"
            ? row.kind === "task" || row.kind === "reminder"
              ? CalendarDays
              : Receipt
            : choiceIcon(row.kind || row.name, row.category_name || row.name));
  const color =
    utility?.color ||
    (resource === "transactions"
      ? row.kind === "income"
        ? "bg-emerald-50 text-emerald-800"
        : "bg-rose-50 text-rose-800"
      : "bg-blue-50 text-blue-700");
  return (
    <span className="flex items-start gap-2.5">
      <span
        aria-hidden="true"
        className={
          "grid size-9 shrink-0 place-items-center rounded-full text-xs font-semibold " +
          color
        }
      >
        {person ? initials || "—" : <Icon size={16} />}
      </span>
      <span className="min-w-0 pt-1 font-medium leading-6">{label}</span>
    </span>
  );
}
