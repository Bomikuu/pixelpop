import { Progress } from "../ui/progress";
import { money } from "../lib/format";
import MoneyFlowAmount from "./MoneyFlowAmount";

export default function BudgetProgress({ label, used, limit, credit = false }) {
  if (limit == null)
    return <p className="text-sm text-slate-600">{label}: no budget set.</p>;
  const percent =
    Number(limit) > 0
      ? (Number(used) / Number(limit)) * 100
      : Number(used) > 0
        ? Infinity
        : 0;
  const state =
    percent > 100
      ? credit
        ? "Over credit limit"
        : "Over budget"
      : percent === 100
        ? "At limit"
        : percent >= 80
          ? "Approaching limit"
          : credit
            ? "Within credit limit"
            : "Within budget";
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap justify-between gap-2 text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums">
          {credit ? money(used) : <MoneyFlowAmount amount={used} direction="out" />} / {money(limit)}
        </span>
      </div>
      <Progress
        value={Math.min(percent, 100)}
        aria-label={label + ": " + state}
        className={percent >= 80 ? "[&>div]:bg-amber-600" : ""}
      />
      <p
        className={
          "text-xs " +
          (percent >= 80 ? "font-medium text-amber-900" : "text-slate-600")
        }
      >
        {state}
        {percent > 100
          ? " by " + money(Number(used) - Number(limit))
          : " — " + percent.toFixed(1) + "% used"}
      </p>
    </div>
  );
}
