import { createElement } from "react";
import { AlertTriangle, CalendarCheck2, ChartNoAxesCombined, Dumbbell, Flame } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../../ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { EmptyState, ErrorState, Panel } from "../Panel";
import { dateLabel } from "../../lib/format";

const nutrients = ["calories", "protein", "carbs", "fat"];
const chartConfig = { calories: { label: "Calories", color: "var(--chart-1)" } };
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
  };
}

function SummaryTile({ label, value, unit, icon: Icon, warning }) {
  return <div className={`rounded-lg border p-3.5 transition-colors ${warning ? "border-red-200 bg-red-50 hover:border-red-300" : "border-[var(--pd-border)] bg-slate-50 hover:border-blue-200 hover:bg-blue-50/40"}`}>
    <span className={`mb-2 grid size-9 place-items-center rounded-full ${warning ? "bg-red-100 text-red-700" : "bg-blue-50 text-[var(--pd-primary)]"}`}>{createElement(Icon, { className: "size-4.5", "aria-hidden": "true" })}</span>
    <p className="text-xs font-medium text-slate-600">{label}</p>
    <p className={`mt-0.5 text-xl font-semibold tabular-nums ${warning ? "text-red-800" : "text-slate-950"}`}>{value} {unit && <span className="text-xs font-normal text-slate-600">{unit}</span>}</p>
    {warning && <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-800"><AlertTriangle className="size-3.5" aria-hidden="true" />Above current target</p>}
  </div>;
}

function PeriodTable({ rows, period, target }) {
  return <div className="min-w-0 overflow-hidden rounded-lg border border-[var(--pd-border)]">
    <div className="max-h-72 overflow-auto">
      <table className="w-full min-w-[31rem] text-left text-xs">
        <caption className="sr-only">{period === "overall" ? "All recorded months" : "Daily intake"} and nutrients</caption>
        <thead className="sticky top-0 bg-slate-100 text-slate-700"><tr><th scope="col" className="px-3 py-2.5 font-semibold">{period === "overall" ? "Month" : "Date"}</th>{period === "overall" && <th scope="col" className="px-3 py-2.5 text-right font-semibold">Days</th>}<th scope="col" className="px-3 py-2.5 text-right font-semibold">kcal</th><th scope="col" className="px-3 py-2.5 text-right font-semibold">Protein</th><th scope="col" className="px-3 py-2.5 text-right font-semibold">Carbs</th><th scope="col" className="px-3 py-2.5 text-right font-semibold">Fat</th></tr></thead>
        <tbody>{rows.map((row) => {
          const calories = row.totals ? Number(row.totals.calories) : null;
          const over = calories !== null && target !== null && (period === "overall" ? calories / row.logged_days : calories) > target;
          return <tr key={row.date || row.month} className="border-t border-[var(--pd-border)] transition-colors hover:bg-blue-50/50">
            <th scope="row" className="px-3 py-2.5 font-medium whitespace-nowrap text-slate-900">{row.month ? monthLabel(row.month) : dateLabel(row.date)}</th>
            {period === "overall" && <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">{row.logged_days}</td>}
            <td className={`px-3 py-2.5 text-right font-medium tabular-nums ${over ? "text-red-800" : "text-slate-900"}`}>{calories === null ? "No entry" : <span className="inline-flex items-center justify-end gap-1">{over && <AlertTriangle className="size-3.5" aria-label="Above current target" />}{number(calories)}</span>}</td>
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
      over: calories !== null && target !== null && (row.month ? calories / row.logged_days : calories) > target,
    };
  });
  const averageOver = data?.average_calories != null && target !== null && Number(data.average_calories) > target;
  const title = period === "week" ? "Week" : period === "month" ? "Month" : "Overall";

  const content = period !== "week" && periodState.loading ? <div role="status" className="min-h-72 py-8 text-sm text-slate-600">Loading {title.toLowerCase()} summary…</div> : period !== "week" && periodState.error ? <div className="mt-4"><ErrorState message={periodState.error} retry={onRetry} /></div> : data?.logged_days ? <>
      <div className="mt-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <SummaryTile label="Total intake" value={number(data.totals.calories)} unit="kcal" icon={Flame} />
        <SummaryTile label="Daily average" value={number(data.average_calories)} unit="kcal" icon={averageOver ? AlertTriangle : ChartNoAxesCombined} warning={averageOver} />
        <SummaryTile label="Average protein" value={number(data.average_protein, 2)} unit="g/day" icon={Dumbbell} />
        <SummaryTile label="Days logged" value={number(data.logged_days)} unit={period === "week" ? "of 7" : period === "month" ? `of ${rows.length}` : "total"} icon={CalendarCheck2} />
      </div>
      <p className="mt-4 text-sm text-slate-600">{period === "overall" ? "Each bar is a recorded month. The chart shows the latest 24; the table includes every recorded month." : period === "month" ? "Each bar is one day in the selected calendar month." : "Each bar is one day in the seven days ending on the selected date."} {target !== null && (period === "overall" ? "Red marks months whose logged-day average is above your current daily target." : "Red marks days above your current daily target.")}</p>
      <div className="mt-4 grid items-start gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(19rem,1fr)]">
        <ChartContainer config={chartConfig} className="h-64 w-full min-w-0">
          <BarChart accessibilityLayer data={chartRows} margin={{ left: 0, right: 10 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={20} />
            <YAxis tickLine={false} axisLine={false} width={42} tickFormatter={(value) => number(value)} />
            <ChartTooltip content={<ChartTooltipContent labelFormatter={(_, payload) => payload?.[0]?.payload?.key ? (period === "overall" ? monthLabel(payload[0].payload.key) : dateLabel(payload[0].payload.key)) : "Calories"} />} />
            <Bar dataKey="calories" maxBarSize={38} radius={[3, 3, 0, 0]}>{chartRows.map((row) => <Cell key={row.key} fill={row.over ? "#dc2626" : "var(--color-calories)"} />)}</Bar>
          </BarChart>
        </ChartContainer>
        <PeriodTable rows={rows} period={period} target={target} />
      </div>
      {period === "overall" && <p className="mt-3 text-xs text-slate-600">Only months with recorded meals appear. Current target comparisons also apply to past entries.</p>}
    </> : <EmptyState icon={Flame} title={`No meals in this ${title.toLowerCase()} view`} message={period === "overall" ? "Log a meal to start your history." : "The summary will appear when you log a meal in this period."} />;

  return <Panel title="Intake summary" description="Averages use logged days only. Gaps are never counted as zero.">
    <Tabs value={period} onValueChange={onPeriodChange} className="gap-4">
      <TabsList aria-label="Nutrition summary period" className="w-full sm:w-auto">
        {["week", "month", "overall"].map((value) => <TabsTrigger key={value} value={value}>{value === "week" ? "Week" : value === "month" ? "Month" : "Overall"}</TabsTrigger>)}
      </TabsList>
      {["week", "month", "overall"].map((value) => <TabsContent key={value} value={value}>{period === value ? content : null}</TabsContent>)}
    </Tabs>
  </Panel>;
}
