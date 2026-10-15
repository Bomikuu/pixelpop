import SummaryTiles from "../SummaryTiles";
import MoneyFlowAmount from "../MoneyFlowAmount";
import { money } from "../../lib/format";
import { comparison } from "../../subscriptions/model";

export default function SubscriptionSummary({ data }) {
  if (!data) return null;
  return <SummaryTiles items={[
    { label: "Expected this month", value: money(data.expected), icon: "deadline", hint: "Due-month confirmed bills + available estimates. Unknown costs are excluded." },
    { label: "Paid this month", value: <MoneyFlowAmount amount={data.paid} direction="out" />, icon: "expenses", hint: "Actual payment dates, counted once in Expenses.", comparison: comparison(data.paid, data.previous?.paid) },
    { label: "Confirmed / fixed remaining", value: money(data.remaining), icon: "balance", hint: "Unpaid balance of known bills due in the selected month." },
    { label: "Overdue across all months", value: money(data.overdue), icon: "debt", statusTone: Number(data.overdue) > 0 ? "negative" : "neutral" },
    { label: "Monthly fixed equivalent", value: money(data.monthly_equivalent), icon: "budget", hint: "Planning normalization only; not an extra monthly charge." },
    { label: "Annual fixed equivalent", value: money(data.annual_equivalent), icon: "funds" },
    { label: "Unknown bill amounts", value: data.unpriced, icon: "count" },
    { label: "Upcoming renewals this month", value: data.upcoming, icon: "deadline" },
  ]} />;
}
