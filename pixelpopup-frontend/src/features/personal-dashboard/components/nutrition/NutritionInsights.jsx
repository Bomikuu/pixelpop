import { useEffect, useState } from "react";
import { ChartNoAxesCombined, History, LayoutGrid } from "lucide-react";
import { Panel, ErrorState } from "../Panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { dateLabel, today } from "../../lib/format";
import { resolveAnalyticsRange, shiftDay } from "../../nutrition/dashboardModel";
import NutritionPeriodSummary from "./NutritionPeriodSummary";
import NutritionCharts from "./NutritionCharts";
import NutritionHistoryTable from "./NutritionHistoryTable";

export default function NutritionInsights({ initialDate, profile, request, refreshKey, onOpenDay }) {
  const [period, setPeriod] = useState("week"), [anchor, setAnchor] = useState(initialDate);
  const [customStart, setCustomStart] = useState(() => shiftDay(initialDate, -6)), [customEnd, setCustomEnd] = useState(initialDate);
  const [tab, setTab] = useState("overview"), [retry, setRetry] = useState(0);
  const [state, setState] = useState({ key: "", data: null, error: "" });
  let range, rangeError = "";
  try { range = resolveAnalyticsRange({ period, anchor, start: customStart, end: customEnd, today: today() }); } catch (failure) { rangeError = failure.message; }
  const start = range?.start, end = range?.end;
  const key = `${start}:${end}:${refreshKey}:${retry}`;
  useEffect(() => {
    if (!start || !end) return;
    const controller = new AbortController();
    request(`nutrition/analytics/?start=${start}&end=${end}`, { signal: controller.signal }).then((data) => { if (!controller.signal.aborted) setState({ key, data, error: "" }); }).catch((failure) => { if (!controller.signal.aborted) setState({ key, data: null, error: failure.message }); });
    return () => controller.abort();
  }, [start, end, key, request]);
  const loading = state.key !== key;
  return <Panel title="Nutrition analytics" description="Averages use food-logged days. Unlogged days aren’t zero intake.">
    <div className="mb-4 flex flex-wrap items-end gap-3"><div className="space-y-1.5"><Label htmlFor="nutrition-report-period">Period</Label><Select value={period} onValueChange={setPeriod}><SelectTrigger id="nutrition-report-period" className="w-32"><SelectValue /></SelectTrigger><SelectContent position="popper" align="start" className="personal-dashboard">{["week", "month", "custom"].map((value) => <SelectItem key={value} value={value}>{value === "week" ? "Week" : value === "month" ? "Month" : "Custom"}</SelectItem>)}</SelectContent></Select></div>
      {period === "custom" ? <><div className="space-y-1.5"><Label htmlFor="report-start">From</Label><Input className="w-40" id="report-start" type="date" max={today()} value={customStart} onChange={(event) => setCustomStart(event.target.value)} /></div><div className="space-y-1.5"><Label htmlFor="report-end">To</Label><Input className="w-40" id="report-end" type="date" max={today()} value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} /></div></> : <div className="space-y-1.5"><Label htmlFor="report-anchor">{period === "week" ? "Week ending" : "Month containing"}</Label><Input id="report-anchor" className="w-40" type="date" max={today()} value={anchor} onChange={(event) => setAnchor(event.target.value)} /></div>}
    </div>
    {rangeError ? <p role="alert" className="text-sm text-red-700">{rangeError}</p> : <><p className="mb-4 text-xs text-slate-600">{dateLabel(start)} – {dateLabel(end)}<span className="mt-1 block">Compared with {dateLabel(range.previousStart)} – {dateLabel(range.previousEnd)}</span></p>
      <Tabs value={tab} onValueChange={setTab} className="gap-4"><TabsList aria-label="Nutrition analytics views" className="max-w-full">{[["overview", "Overview", LayoutGrid], ["trends", "Trends", ChartNoAxesCombined], ["history", "History", History]].map(([value, label, Icon]) => <TabsTrigger key={value} value={value}><Icon className="size-4" />{label}</TabsTrigger>)}</TabsList>
        {loading ? <p role="status" className="min-h-64 py-8 text-sm text-slate-500">Loading report…</p> : state.error ? <ErrorState message={state.error} retry={() => setRetry((value) => value + 1)} /> : state.data && <><TabsContent value="overview"><NutritionPeriodSummary data={state.data} profile={profile} /></TabsContent><TabsContent value="trends"><div className="grid gap-5 xl:grid-cols-2">{["calories", "macros", "activity", "weight"].map((kind) => <NutritionCharts key={kind} kind={kind} days={state.data.days} weights={state.data.weights} profile={profile} />)}</div></TabsContent><TabsContent value="history"><NutritionHistoryTable rows={state.data.days} onOpenDay={onOpenDay} /></TabsContent></>}
      </Tabs>
    </>}
  </Panel>;
}
