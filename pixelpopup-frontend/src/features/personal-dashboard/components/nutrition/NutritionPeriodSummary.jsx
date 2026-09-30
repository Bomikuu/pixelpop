import { createElement } from "react";
import { AlertTriangle, CalendarCheck2, ChartNoAxesCombined, Dumbbell, Flame, Footprints, Minus } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../../ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { EmptyState, ErrorState, Panel } from "../Panel";
import { SummaryTilePattern } from "../SummaryTiles";
import { dateLabel } from "../../lib/format";

const nutrients = ["calories", "protein", "carbs", "fat"];
const chartConfig = { calories: { label: "Food kcal", color: "var(--chart-1)" }, activity: { label: "Active kcal", color: "#059669" } };
const number = (value, digits = 0) => new Intl.NumberFormat("en-PH", { maximumFractionDigits: digits }).format(Number(value));
const monthLabel = (value) => new Intl.DateTimeFormat("en-PH", { month: "short", year: "numeric", timeZone: "Asia/Manila" }).format(new Date(`${value}-01T12:00:00+08:00`));

function weekSummary(summary) {
  const logged = summary.days.filter((row) => row.logged);
  const totals = logged.length ? Object.fromEntries(nutrients.map((field) => [field, logged.reduce((sum, row) => sum + Number(row.totals[field]), 0)])) : null;
  return {
    rows: summary.days,
    logged_days: summary.logged_days,
    totals,
    average_calories: summary.average_calories,
    average_protein: logged.length ? totals.protein / logged.length : null,
    activity_kcal: summary.activity_kcal,
    net_calories: summary.net_calories,
    average_net_calories: summary.average_net_calories,
  };
}

function SummaryTile({ label, value, unit, icon: Icon, warning }) {
  return <div className={`group relative isolate min-w-0 overflow-hidden rounded-lg border p-3.5 transition-[border-color,background-color,transform] duration-150 hover:-translate-y-0.5 motion-reduce:transform-none ${warning ? "border-red-200 bg-red-50 hover:border-red-300 hover:bg-red-50/80" : "border-[var(--pd-border)] bg-white hover:border-blue-200 hover:bg-blue-50/40"}`}>
    <SummaryTilePattern tone={warning ? "negative" : "neutral"} />
    <span className={`relative z-10 mb-2 grid size-9 place-items-center rounded-full ${warning ? "bg-red-100 text-red-700" : "bg-blue-50 text-[var(--pd-primary)]"}`}>{createElement(Icon, { className: "size-4.5", "aria-hidden": "true" })}</span>
    <p className="relative z-10 text-xs font-medium text-slate-600">{label}</p>
    <p className={`relative z-10 mt-0.5 text-xl font-semibold tabular-nums ${warning ? "text-red-800" : "text-slate-950"}`}>{value} {unit && <span className="text-xs font-normal text-slate-600">{unit}</span>}</p>
    {warning && <p className="relative z-10 mt-1 flex items-center gap-1 text-xs font-medium text-red-800"><AlertTriangle className="size-3.5" aria-hidden="true" />Above current target</p>}
  </div>;
}

function PeriodTable({ rows, period, target }) {
  return <div className="min-w-0 overflow-hidden rounded-lg border border-[var(--pd-border)]">
    <div className="max-h-72 overflow-auto">
      <table className="w-full min-w-[44rem] text-left text-xs">
        <caption className="sr-only">{period === "overall" ? "All recorded months" : "Daily intake"}, activity, net, and nutrients</caption>
        <thead className="sticky top-0 bg-slate-100 text-slate-700"><tr><th scope="col" className="px-3 py-2.5 font-semibold">{period === "overall" ? "Month" : "Date"}</th>{period === "overall" && <th scope="col" className="px-3 py-2.5 text-right font-semibold">Days</th>}<th scope="col" className="px-3 py-2.5 text-right font-semibold">Food kcal</th><th scope="col" className="px-3 py-2.5 text-right font-semibold">Active kcal</th><th scope="col" className="px-3 py-2.5 text-right font-semibold">Net kcal</th><th scope="col" className="px-3 py-2.5 text-right font-semibold">Protein</th><th scope="col" className="px-3 py-2.5 text-right font-semibold">Carbs</th><th scope="col" className="px-3 py-2.5 text-right font-semibold">Fat</th></tr></thead>
        <tbody>{rows.map((row) => {
          const calories = row.totals ? Number(row.totals.calories) : null;
          const over = calories !== null && target !== null && (period === "overall" ? calories / row.logged_days : calories) > target;
          return <tr key={row.date || row.month} className="border-t border-[var(--pd-border)] transition-colors hover:bg-blue-50/50">
            <th scope="row" className="px-3 py-2.5 font-medium whitespace-nowrap text-slate-900">{row.month ? monthLabel(row.month) : dateLabel(row.date)}</th>
            {period === "overall" && <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">{row.logged_days}</td>}
            <td className={`px-3 py-2.5 text-right font-medium tabular-nums ${over ? "text-red-800" : "text-slate-900"}`}>{calories === null ? "No entry" : <span className="inline-flex items-center justify-end gap-1">{over && <AlertTriangle className="size-3.5" aria-label="Above current target" />}{number(calories)}</span>}</td>
            <td className="px-3 py-2.5 text-right tabular-nums text-emerald-800">{number(row.activity_kcal || 0)}</td>
            <td className="px-3 py-2.5 text-right tabular-nums text-slate-900">{row.net_calories == null ? "—" : number(row.net_calories)}</td>
            {nutrients.slice(1).map((field) => <td key={field} className="px-3 py-2.5 text-right tabular-nums text-slate-600">{row.totals ? `${number(row.totals[field], 2)} g` : "—"}</td>)}
          </tr>;
        })}</tbody>
      </table>
    </div>
  </div>;
}

export default function NutritionPeriodSummary({ summary, profile, period, onPeriodChange, periodState, onRetry }) {
  const data = period === "week" ? weekSummary(summary) : periodState.data;
  const target = profile?.daily_target_kcal == null ? null : Number(profile.daily_target_kcal);
  const rows = data?.rows ?? [];
  const chartRows = (period === "overall" ? rows.slice(-24) : rows).map((row) => {
    const calories = row.totals ? Number(row.totals.calories) : null;
    return {
      key: row.date || row.month,
      label: row.month ? monthLabel(row.month) : period === "week" ? new Intl.DateTimeFormat("en-PH", { weekday: "short", timeZone: "Asia/Manila" }).format(new Date(`${row.date}T12:00:00+08:00`)) : row.date.slice(-2),
      calories,
      activity: Number(row.activity_kcal || 0),
      over: calories !== null && target !== null && (row.month ? calories / row.logged_days : calories) > target,
    };
  });
  const averageOver = data?.average_calories != null && target !== null && Number(data.average_calories) > target;
  const title = period === "week" ? "Week" : period === "month" ? "Month" : "Overall";

  const content = period !== "week" && periodState.loading ? <div role="status" className="min-h-72 py-8 text-sm text-slate-600">Loading {title.toLowerCase()} summary…</div> : period !== "week" && periodState.error ? <div className="mt-4"><ErrorState message={periodState.error} retry={onRetry} /></div> : (data?.logged_days || Number(data?.activity_kcal) > 0) ? <>
      <div className="mt-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <SummaryTile label="Total food" value={data.totals ? number(data.totals.calories) : "—"} unit="kcal" icon={Flame} />
        <SummaryTile label="Active burn" value={number(data.activity_kcal || 0)} unit="kcal" icon={Footprints} />
        <SummaryTile label="Net on food-logged days" value={data.net_calories == null ? "—" : number(data.net_calories)} unit="kcal" icon={Minus} />
        <SummaryTile label="Daily food average" value={data.average_calories == null ? "—" : number(data.average_calories)} unit="kcal" icon={averageOver ? AlertTriangle : ChartNoAxesCombined} warning={averageOver} />
        <SummaryTile label="Daily net average" value={data.average_net_calories == null ? "—" : number(data.average_net_calories)} unit="kcal" icon={Minus} />
        <SummaryTile label="Average protein" value={data.average_protein == null ? "—" : number(data.average_protein, 2)} unit="g/day" icon={Dumbbell} />
        <SummaryTile label="Days logged" value={number(data.logged_days)} unit={period === "week" ? "of 7" : period === "month" ? `of ${rows.length}` : "total"} icon={CalendarCheck2} />
      </div>
      <p className="mt-4 text-sm text-slate-600">{period === "overall" ? "Each pair of bars is a recorded month. The chart shows the latest 24; the table includes every recorded month." : period === "month" ? "Each pair of bars is one day in the selected calendar month." : "Each pair of bars is one day in the seven days ending on the selected date."} Blue is food; green is logged activity. Net is only calculated on days with meals. {target !== null && (period === "overall" ? "Red food bars mark months whose logged-day average is above your current food target." : "Red food bars mark days above your current food target.")}</p>
      <div className="mt-4 grid items-start gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(19rem,1fr)]">
        <ChartContainer config={chartConfig} className="h-64 w-full min-w-0">
          <BarChart accessibilityLayer data={chartRows} margin={{ left: 0, right: 10 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={20} />
            <YAxis tickLine={false} axisLine={false} width={42} tickFormatter={(value) => number(value)} />
            <ChartTooltip content={<ChartTooltipContent labelFormatter={(_, payload) => payload?.[0]?.payload?.key ? (period === "overall" ? monthLabel(payload[0].payload.key) : dateLabel(payload[0].payload.key)) : "Calories"} />} />
            <Bar dataKey="calories" maxBarSize={38} radius={[3, 3, 0, 0]}>{chartRows.map((row) => <Cell key={row.key} fill={row.over ? "#dc2626" : "var(--color-calories)"} />)}</Bar>
            <Bar dataKey="activity" maxBarSize={38} radius={[3, 3, 0, 0]} fill="var(--color-activity)" />
          </BarChart>
        </ChartContainer>
        <PeriodTable rows={rows} period={period} target={target} />
      </div>
      {period === "overall" && <p className="mt-3 text-xs text-slate-600">Months with meals or activity appear. Activity-only dates do not count as zero food. Current target comparisons also apply to past entries.</p>}
    </> : <EmptyState icon={Flame} title={`No nutrition entries in this ${title.toLowerCase()} view`} message="Log a meal or activity to start this summary." />;

  return <Panel title="Nutrition summary" description="Food averages use meal-logged days only. Gaps are never counted as zero.">
    <Tabs value={period} onValueChange={onPeriodChange} className="gap-4">
      <TabsList aria-label="Nutrition summary period" className="w-full sm:w-auto">
        {["week", "month", "overall"].map((value) => <TabsTrigger key={value} value={value}>{value === "week" ? "Week" : value === "month" ? "Month" : "Overall"}</TabsTrigger>)}
      </TabsList>
      {["week", "month", "overall"].map((value) => <TabsContent key={value} value={value}>{period === value ? content : null}</TabsContent>)}
    </Tabs>
  </Panel>;
}
