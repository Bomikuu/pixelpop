import { createElement } from "react";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  CalendarClock,
  House,
  CreditCard,
  Users,
  CheckCircle2,
  ListChecks,
} from "lucide-react";

const icons = {
  balance: Wallet,
  income: ArrowDownLeft,
  expenses: ArrowUpRight,
  budget: PiggyBank,
  deadline: CalendarClock,
  assets: House,
  debt: CreditCard,
  loans: Users,
  completed: CheckCircle2,
  count: ListChecks,
  funds: PiggyBank,
};

export default function SummaryTiles({ items }) {
  return (
    <dl className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {items.map(({ label, value, hint, icon = "count" }) => (
        <div
          key={label}
          className="group min-w-0 rounded-lg border border-[var(--pd-border)] bg-white p-4 transition-colors duration-150 hover:border-blue-200 hover:bg-blue-50/50"
        >
          <dt className="flex items-center justify-between gap-2 text-sm text-slate-600">
            {label}
            {createElement(icons[icon] || ListChecks, {
              size: 18,
              className: "shrink-0 text-[var(--pd-primary)]",
              "aria-hidden": true,
            })}
          </dt>
          <dd className="mt-3 break-words text-xl font-semibold tracking-tight text-slate-950 tabular-nums sm:text-2xl">
            {value}
          </dd>
          {hint && (
            <dd className="mt-2 text-xs leading-5 text-slate-600">{hint}</dd>
          )}
        </div>
      ))}
    </dl>
  );
}
