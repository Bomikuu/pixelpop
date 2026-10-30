import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../personal-dashboard/ui/chart";
import { dateLabel, money, monthLabel } from "../personal-dashboard/lib/format";
import AnimatedNumber from "../personal-dashboard/components/AnimatedNumber";
import { SummaryTilePattern } from "../personal-dashboard/components/SummaryTiles";

const compactMoney = (value) => "₱" + new Intl.NumberFormat("en-PH", { notation: "compact", maximumFractionDigits: 0 }).format(value);
const colors = ["var(--site-link)", "#10b981", "#8b5cf6", "#f97316", "#38bdf8"];
const flowConfig = { income: { label: "Received income", color: "var(--money-positive)" }, expenses: { label: "Expenses", color: "var(--money-negative)" } };
const compareConfig = { from: { label: "Compare from", color: "#93b9ff" }, to: { label: "Compare to", color: "var(--site-link)" } };
const pieConfig = { amount: { label: "Expenses" } };

export function MoneyChange({ value, previous, lowerIsBetter = false }) {
  if (previous == null || value == null) return <span className="money-muted">No comparison available</span>;
  const delta = Number(value) - Number(previous);
  if (Number(previous) === 0) return <span className="money-muted">{delta === 0 ? "No change" : "No prior baseline"}</span>;
  const percent = Math.abs(delta / Number(previous) * 100);
  const tone = delta === 0 ? "neutral" : (delta < 0) === lowerIsBetter ? "positive" : "negative";
  return <span className="money-change" data-tone={tone}>{delta > 0 ? "+" : delta < 0 ? "−" : ""}{percent > 0 && percent < 0.1 ? "<0.1" : new Intl.NumberFormat("en-PH", { maximumFractionDigits: 1 }).format(percent)}%</span>;
}

export function MonthlyMoneyChart({ rows, month }) {
  const hasIncome = rows.length > 0 && rows.every((row) => row.income != null);
  const values = rows.map((row) => ({ ...row, income: Number(row.income), expenses: Number(row.amount) }));
  const hasData = values.some((row) => row.expenses !== 0 || (hasIncome && row.income !== 0));
  return <section aria-labelledby="mobile-money-monthly-title">
    <div className="money-section-heading"><h2 id="mobile-money-monthly-title">Monthly overview</h2><span>{monthLabel(month)}</span></div>
    <div className="money-surface money-chart-panel">
      <div className="money-chart-legend">{Object.entries(flowConfig).filter(([key]) => key !== "income" || hasIncome).map(([key, item]) => <span key={key}><i style={{ background: item.color }} aria-hidden="true" />{item.label}</span>)}</div>
      {!hasIncome && <p className="money-muted">Daily income unavailable.</p>}
      {hasData ? <ChartContainer config={flowConfig} className="h-48 w-full">
        <BarChart accessibilityLayer data={values} barGap={1} margin={{ left: -10, right: 0, top: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={25} tickFormatter={(day) => String(Number(day))} />
          <YAxis tickLine={false} axisLine={false} tickFormatter={compactMoney} width={54} />
          <ChartTooltip content={<ChartTooltipContent labelFormatter={(_, payload) => payload?.[0]?.payload?.date ? dateLabel(payload[0].payload.date) : ""} formatter={(value, name) => <span>{flowConfig[name]?.label}: {money(value)}</span>} />} />
          {hasIncome && <Bar dataKey="income" fill="var(--color-income)" radius={[3, 3, 0, 0]} isAnimationActive={false} />}
          <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ChartContainer> : <p className="money-chart-empty">No recorded income or expenses this month.</p>}
      <details className="money-chart-data"><summary>View daily amounts</summary><div className="overflow-auto"><table><caption className="sr-only">Daily cashflow for {monthLabel(month)}</caption><thead><tr><th>Date</th>{hasIncome && <th>Received</th>}<th>Expenses</th></tr></thead><tbody>{values.map((row) => <tr key={row.date}><th>{dateLabel(row.date)}</th>{hasIncome && <td>{money(row.income)}</td>}<td>{money(row.expenses)}</td></tr>)}</tbody></table></div></details>
    </div>
  </section>;
}

export function MoneyCategoryChart({ categories, onViewAll }) {
  const positive = categories.filter((row) => Number(row.amount) > 0);
  const rows = positive.slice(0, 4).map((row) => ({ label: row.name, amount: Number(row.amount), id: row.category_id }));
  if (positive.length > 4) rows.push({ label: "Other categories", amount: positive.slice(4).reduce((sum, row) => sum + Number(row.amount), 0), id: "remaining" });
  const total = rows.reduce((sum, row) => sum + row.amount, 0);
  const hasCredits = categories.some((row) => Number(row.amount) < 0);
  return <section aria-labelledby="mobile-money-categories-title">
    <div className="money-section-heading"><h2 id="mobile-money-categories-title">Expenses by category</h2><button type="button" onClick={onViewAll}>View all <ChevronRight size={14} aria-hidden="true" /></button></div>
    <div className="money-surface money-chart-panel">
      {total > 0 ? <div className="money-category-composition">
        <div className="money-donut" aria-hidden="true"><ChartContainer config={pieConfig} className="size-full"><PieChart><Pie data={rows} dataKey="amount" nameKey="label" innerRadius="72%" outerRadius="96%" stroke="var(--site-surface)" strokeWidth={2} isAnimationActive={false}>{rows.map((row, index) => <Cell key={row.id ?? "other"} fill={colors[index % colors.length]} />)}</Pie></PieChart></ChartContainer><div><strong>{compactMoney(total)}</strong><span>{hasCredits ? "Before credits" : "Total expenses"}</span></div></div>
        <dl className="money-category-legend">{rows.map((row, index) => <div key={row.id ?? "other"}><dt><i style={{ background: colors[index % colors.length] }} aria-hidden="true" />{row.label}</dt><dd><span>{(row.amount / total * 100).toFixed(1)}%</span><strong>{money(row.amount)}</strong></dd></div>)}</dl>
      </div> : <p className="money-chart-empty">No positive category spending this month.</p>}
      {hasCredits && <p className="money-muted">Credits reduce monthly expenses and are excluded from this breakdown.</p>}
    </div>
  </section>;
}

export function MoneyMonthComparison({ history, month }) {
  const [fromMonth, setFromMonth] = useState("");
  const [toMonth, setToMonth] = useState("");
  const selected = Math.max(0, history.findIndex((row) => row.month === month));
  const from = history.find((row) => row.month === fromMonth) || history[Math.max(0, selected - 1)];
  const to = history.find((row) => row.month === toMonth) || history[selected];
  if (!from || !to) return null;
  const fields = [["income", "Income"], ["expenses", "Expenses"], ["net", "Net income"]];
  const valueOf = (row, field) => field === "income" ? Number(row.income) - Number(row.expected || 0) : Number(row[field]);
  const values = fields.map(([key, label]) => ({ label, from: valueOf(from, key), to: valueOf(to, key) }));
  return <section aria-labelledby="mobile-money-comparison-title">
    <div className="money-section-heading"><h2 id="mobile-money-comparison-title">Month-to-month comparison</h2></div>
    <div className="money-surface money-chart-panel">
      <div className="money-compare-selectors">{[["Compare from", from, setFromMonth], ["Compare to", to, setToMonth]].map(([label, row, change]) => <label key={label}>{label}<select value={row.month} onChange={(event) => change(event.target.value)}>{history.map((item) => <option key={item.month} value={item.month}>{monthLabel(item.month)}</option>)}</select></label>)}</div>
      <dl className="money-compare-totals">{fields.map(([key, label]) => <div key={key} className="group workspace-summary-tile"><SummaryTilePattern tone={key === "expenses" ? "negative" : key === "income" ? "positive" : "neutral"} /><dt>{label}</dt><dd><AnimatedNumber value={valueOf(to, key)} format={money} /></dd><dd><MoneyChange value={valueOf(to, key)} previous={valueOf(from, key)} lowerIsBetter={key === "expenses"} /></dd></div>)}</dl>
      <div className="money-chart-legend"><span><i style={{ background: compareConfig.from.color }} aria-hidden="true" />{monthLabel(from.month)}</span><span><i style={{ background: compareConfig.to.color }} aria-hidden="true" />{monthLabel(to.month)}</span></div>
      <ChartContainer config={compareConfig} className="h-44 w-full"><BarChart accessibilityLayer data={values} margin={{ left: -10, right: 0 }}><CartesianGrid vertical={false} /><XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} /><YAxis tickFormatter={compactMoney} width={54} tickLine={false} axisLine={false} /><ChartTooltip content={<ChartTooltipContent formatter={(value, name) => <span>{monthLabel(name === "from" ? from.month : to.month)}: {money(value)}</span>} />} /><Bar dataKey="from" fill="var(--color-from)" radius={[3, 3, 0, 0]} isAnimationActive={false} /><Bar dataKey="to" fill="var(--color-to)" radius={[3, 3, 0, 0]} isAnimationActive={false} /></BarChart></ChartContainer>
      <details className="money-chart-data"><summary>View comparison amounts</summary><table><thead><tr><th>Metric</th><th>{monthLabel(from.month)}</th><th>{monthLabel(to.month)}</th></tr></thead><tbody>{values.map((row) => <tr key={row.label}><th>{row.label}</th><td>{money(row.from)}</td><td>{money(row.to)}</td></tr>)}</tbody></table></details>
    </div>
  </section>;
}
