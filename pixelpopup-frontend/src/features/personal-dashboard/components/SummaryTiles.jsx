import { createElement } from "react";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  CalendarClock,
  House,
  CreditCard,
  LayoutGrid,
  Landmark,
  Scale,
  Building2,
  CarFront,
  Boxes,
  Percent,
  ChartPie,
  Users,
  CheckCircle2,
  ListChecks,
  Minus,
  TrendingDown,
  TrendingUp,
  Info,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

const icons = {
  balance: Wallet,
  income: ArrowDownLeft,
  expenses: ArrowUpRight,
  budget: PiggyBank,
  deadline: CalendarClock,
  assets: House,
  debt: CreditCard,
  assetValue: LayoutGrid,
  financing: Landmark,
  assetEquity: Scale,
  realEstate: Building2,
  vehicle: CarFront,
  otherAsset: Boxes,
  equityRatio: Percent,
  debtRatio: ChartPie,
  loans: Users,
  completed: CheckCircle2,
  count: ListChecks,
  funds: PiggyBank,
};

const dotClusters = [
  [48, 32, 4, 4],
  [88, 56, 5, 4],
  [58, 104, 4, 3],
  [112, 110, 3, 3],
];
const crosses = [[118, 35], [46, 86], [132, 94], [92, 137]];

function SummaryTilePattern({ tone }) {
  const color = tone === "positive"
    ? "text-emerald-300"
    : tone === "negative"
      ? "text-red-300"
      : "text-sky-300";

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 160 160"
      preserveAspectRatio="xMidYMid slice"
      className={"pointer-events-none absolute inset-y-0 right-0 h-full w-[36%] opacity-[0.35] " + color}
    >
      {dotClusters.flatMap(([x, y, columns, rows], cluster) =>
        Array.from({ length: columns * rows }, (_, index) => (
          <circle
            key={cluster + "-" + index}
            cx={x + (index % columns) * 8}
            cy={y + Math.floor(index / columns) * 8}
            r="1.8"
            fill="currentColor"
          />
        )),
      )}
      {crosses.map(([x, y]) => (
        <path
          key={x + "-" + y}
          d={`M ${x - 3} ${y - 3} L ${x + 3} ${y + 3} M ${x + 3} ${y - 3} L ${x - 3} ${y + 3}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

function SummaryTile({ item, compact = false, tooltipWhenNoBaseline = false }) {
  const { label, value, hint, icon = "count", comparison, comparisonExpected, statusTone = "neutral", statusText } = item;
  const condensed = compact && tooltipWhenNoBaseline;
  const showInfo = condensed && (!comparison || comparison.noBaseline);
  const showComparison = comparison && !showInfo;
  const patternTone = statusTone === "negative" || comparison?.tone === "negative" ? "negative" : statusTone;
  return (
    <div
      className={
        "group relative isolate min-w-0 overflow-hidden rounded-lg border border-[var(--pd-border)] bg-white transition-colors duration-150 hover:border-blue-200 hover:bg-blue-50/50 " +
        (compact ? "p-3" : "p-4")
      }
    >
      <SummaryTilePattern tone={patternTone} />
      <dt className="relative z-10 flex items-center justify-between gap-2 text-sm text-slate-600">
        <span>{label}</span>
        <span className="flex shrink-0 items-center gap-1">
          {showInfo && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={"More about " + label}
                  className="grid size-7 cursor-pointer place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pd-primary)]"
                >
                  <Info size={15} aria-hidden="true" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                variant="light"
                side="top"
                sideOffset={6}
                className="personal-dashboard max-w-64 text-left"
              >
                {(comparison?.noBaseline || (comparisonExpected && !comparison)) && (
                  <p>{comparison?.text || "No previous-month baseline yet."}</p>
                )}
                {hint && (
                  <p className={comparison?.noBaseline || comparisonExpected ? "mt-1" : ""}>
                    {hint}
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          )}
          {createElement(icons[icon] || ListChecks, {
            size: 18,
            className: "shrink-0 text-[var(--pd-primary)]",
            "aria-hidden": true,
          })}
        </span>
      </dt>
      <dd className={"relative z-10 mt-3 break-words font-semibold tracking-tight text-slate-950 tabular-nums " + (compact ? "text-lg sm:text-xl" : "text-xl sm:text-2xl")}>
        {value}
      </dd>
      {statusText && (
        <dd className={"relative z-10 mt-2 text-xs font-medium leading-5 " + (statusTone === "negative" ? "text-rose-800" : "text-emerald-800")}>
          {statusText}
        </dd>
      )}
      {showComparison && (
        <dd
          className={
            "relative z-10 mt-2 flex items-start gap-1.5 text-xs font-medium leading-5 " +
            (comparison.tone === "positive"
              ? "text-emerald-700"
              : comparison.tone === "negative"
                ? "text-rose-700"
                : "text-slate-600")
          }
        >
          <span>{comparison.text}</span>
          {comparison.trend &&
            createElement(
              comparison.trend === "up"
                ? TrendingUp
                : comparison.trend === "down"
                  ? TrendingDown
                  : Minus,
              { size: 15, className: "mt-0.5 shrink-0", "aria-hidden": true },
            )}
        </dd>
      )}
      {hint && (
        <dd className={condensed ? "sr-only" : "relative z-10 mt-2 text-xs leading-5 text-slate-600"}>
          {hint}
        </dd>
      )}
    </div>
  );
}

export default function SummaryTiles({ items, primaryCount = 4, tooltipWhenNoBaseline = false }) {
  const secondaryCount = items.length - primaryCount;
  return (
    <div className="space-y-3">
      <dl className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {items.slice(0, primaryCount).map((item) => <SummaryTile key={item.label} item={item} />)}
      </dl>
      {secondaryCount > 0 && (
        <dl className={"grid grid-cols-2 gap-3 md:grid-cols-3 " + (secondaryCount === 6 ? "xl:grid-cols-6" : "xl:grid-cols-5")}>
          {items.slice(primaryCount).map((item) => (
            <SummaryTile
              key={item.label}
              item={item}
              compact
              tooltipWhenNoBaseline={tooltipWhenNoBaseline}
            />
          ))}
        </dl>
      )}
    </div>
  );
}
