import { TrendingDown, TrendingUp } from "lucide-react";
import { money } from "../lib/format";

export default function MoneyFlowAmount({ amount, direction, className = "" }) {
  const incoming = direction === "in";
  const zero = amount != null && amount !== "" && Number(amount) === 0;
  const Icon = incoming ? TrendingUp : TrendingDown;

  return (
    <span
      className={
        "inline-flex max-w-full items-center gap-1 font-semibold tabular-nums " +
        (zero ? "text-slate-950" : incoming ? "text-emerald-700" : "text-rose-700") +
        (className ? " " + className : "")
      }
    >
      {!zero && <Icon size={15} className="shrink-0" aria-hidden="true" />}
      {!zero && <span className="sr-only">{incoming ? "Money in: " : "Money out: "}</span>}
      <span className="min-w-0 break-all">{money(amount)}</span>
    </span>
  );
}
