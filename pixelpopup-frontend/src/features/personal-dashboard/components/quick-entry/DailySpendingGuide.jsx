import { useEffect, useState } from "react";
import { Gauge, Info, RefreshCw, TriangleAlert, Wallet } from "lucide-react";
import { Button } from "../../ui/button";
import { Progress } from "../../ui/progress";
import { today } from "../../lib/format";
import { formatMinorUnits, toMinorUnits } from "../../quick-entry/money";

// Round the calculated estimate only; actual transaction amounts remain exact.
function guideMinorUnits(value) {
  const match = String(value).match(/^(\d+)(?:\.(\d+))?$/);
  if (!match) return null;
  const fraction = match[2] || "";
  const cents = BigInt(match[1]) * 100n + BigInt(fraction.padEnd(2, "0").slice(0, 2));
  return cents + (fraction[2] >= "5" ? 1n : 0n);
}

export default function DailySpendingGuide({ dashboard, rows, date, status, compact = false }) {
  const day = today();
  const month = day.slice(0, 7);
  const overview = dashboard.data.overview;
  const currentOverview = overview?.selected_month === month && overview.as_of === day ? overview : null;
  const [loaded, setLoaded] = useState({ overview: null, loading: true, error: false });
  const { request, version, refresh } = dashboard;

  useEffect(() => {
    if (currentOverview) return;
    const controller = new AbortController();
    setLoaded({ overview: null, loading: true, error: false });
    request(`overview/?month=${month}`, { signal: controller.signal }).then((result) => {
      if (!controller.signal.aborted) setLoaded({ overview: result, loading: false, error: false });
    }).catch(() => {
      if (!controller.signal.aborted) setLoaded({ overview: null, loading: false, error: true });
    });
    return () => controller.abort();
  }, [currentOverview, request, version, month, day]);

  const data = currentOverview || loaded.overview;
  if (!data) return <div className="flex items-center gap-2 text-xs text-slate-600">
    <Info className="size-4 shrink-0" aria-hidden="true" />
    <span role="status">{loaded.error ? "Daily guide unavailable. You can still save transactions." : "Loading today’s daily guide…"}</span>
    {loaded.error && <Button variant="ghost" size="sm" onClick={refresh}><RefreshCw className="size-3.5" aria-hidden="true" />Retry</Button>}
  </div>;

  const guide = guideMinorUnits(data.budget?.daily);
  if (guide === null) return <p className="flex items-start gap-2 text-xs leading-5 text-slate-600"><Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><span>Set a monthly budget in dashboard Settings to see your daily spending guide. Saving is still available.</span></p>;

  const recorded = toMinorUnits(data.today.spent);
  const uncertain = status === "uncertain";
  const draft = uncertain ? 0n : rows.reduce((sum, row) => {
    if (row.kind !== "expense" || row.errors.length || !row.amount || (row.date || date) !== day) return sum;
    return sum + toMinorUnits(row.amount);
  }, 0n);
  const used = recorded + draft;
  const remaining = guide - used;
  const over = remaining < 0n;
  const percentage = guide > 0n ? Number((used > 0n ? used : 0n) * 10000n / guide) / 100 : used > 0n ? 100 : 0;
  const tone = over ? "text-red-700" : "text-emerald-700";
  const Indicator = over ? TriangleAlert : Gauge;

  if (compact) return <section className="capture-guide" data-over={over || undefined} aria-label="Today's daily spending guide">
    <span className="capture-guide-icon"><Wallet size={23} aria-hidden="true" /></span>
    <div className="capture-guide-amount"><span>{over ? "Over today's guide" : "Remaining for today"}</span><strong>{formatMinorUnits(over ? -remaining : remaining)}</strong><span>Daily budget estimate</span></div>
    <div className="capture-guide-progress"><Progress value={Math.min(100, Math.max(0, percentage))} aria-label="Today's expense progress" aria-valuetext={`${formatMinorUnits(used)} in expenses against a ${formatMinorUnits(guide)} daily guide${over ? ", over the guide" : ""}`} className={over ? "[&_[data-slot=progress-indicator]]:bg-red-500" : "[&_[data-slot=progress-indicator]]:bg-emerald-500"} /><span>{Math.round(percentage)}% used</span></div>
    <p className="sr-only">Remaining monthly budget divided by remaining days. Includes this draft's expenses for today. {uncertain ? "Unconfirmed drafts are excluded until the save is confirmed." : "Going over the guide does not prevent saving."}</p>
  </section>;

  return <section aria-label="Today’s daily spending guide" className="border border-[var(--pd-border)] bg-white p-3 sm:p-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="flex items-center gap-2 text-sm font-semibold"><Indicator className={`size-4 ${tone}`} aria-hidden="true" />Today’s daily guide</h2>
      <span className={`text-sm ${tone}`}>{formatMinorUnits(over ? -remaining : remaining)} {over ? "over the guide" : "remaining"}</span>
    </div>
    <Progress value={Math.min(100, Math.max(0, percentage))} aria-label="Today’s expense progress" aria-valuetext={`${formatMinorUnits(used)} in expenses against a ${formatMinorUnits(guide)} daily guide${over ? ", over the guide" : ""}`} className={`mt-3 h-2 rounded-none [&_[data-slot=progress-indicator]]:motion-reduce:transition-none ${over ? "bg-red-100 [&_[data-slot=progress-indicator]]:bg-red-500" : "bg-emerald-100 [&_[data-slot=progress-indicator]]:bg-emerald-500"}`} />
    <dl className="mt-3 grid grid-cols-3 gap-3 text-xs">
      <div><dt className="text-slate-600">Recorded today</dt><dd className="mt-1 tabular-nums">{formatMinorUnits(recorded)}</dd></div>
      <div><dt className="text-slate-600">Drafts for today</dt><dd className="mt-1 tabular-nums">{formatMinorUnits(draft)}</dd></div>
      <div><dt className="text-slate-600">Daily guide</dt><dd className="mt-1 tabular-nums">{formatMinorUnits(guide)}</dd></div>
    </dl>
    <p className="mt-3 flex items-start gap-1.5 text-xs leading-5 text-slate-600"><Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" /><span>{uncertain ? "Save status uncertain—drafts excluded until confirmed to avoid counting twice. " : ""}Estimate: remaining monthly budget ÷ remaining days. Only today’s expenses count here; going over won’t block saving.</span></p>
  </section>;
}
