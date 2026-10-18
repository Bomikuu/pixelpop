import { today } from "../lib/format";

export function comparisonStorageKey(service, cycle) {
  return `pd-electricity-comparison:${service.id}:${cycle.id}`;
}

export function restoreComparison(service, cycle) {
  const values = initialComparison(service, cycle);
  try {
    const saved = JSON.parse(sessionStorage.getItem(comparisonStorageKey(service, cycle)));
    if (!saved || typeof saved.values !== "object" || !saved.values) return { mode: "bills", values };
    for (const key of Object.keys(values)) {
      const value = saved.values[key];
      if (typeof value === "string" || (typeof value === "number" && Number.isFinite(value))) values[key] = value;
    }
    return { mode: saved.mode === "readings" ? "readings" : "bills", values };
  } catch {
    return { mode: "bills", values };
  }
}

export function initialComparison(service, cycle) {
  const now = today();
  const month = now.slice(0, 7);
  const [year, index] = month.split("-").map(Number);
  const nextMonth = new Date(Date.UTC(year, index, 1)).toISOString().slice(0, 10);
  const previous = [...(service.cycles || [])].filter((item) => !item.excluded && item.due_date < cycle.due_date && item.actual_amount != null)
    .sort((a, b) => b.due_date.localeCompare(a.due_date))[0];
  const tariff = service.tariffs?.find((item) => item.id === cycle.tariff_id);
  return {
    previous_bill: previous?.actual_amount ?? "", current_bill: cycle.actual_amount ?? "",
    previous_reading: "", current_reading: "",
    previous_date: cycle.period_start && cycle.period_start <= now ? cycle.period_start : `${month}-01`,
    reading_date: now, period_end: cycle.period_end && cycle.period_end >= now ? cycle.period_end : nextMonth,
    rate: tariff?.config?.flat_rate ?? "", fixed_fee: "0", other_charges: "0",
    expected_usage: service.expected_usage ?? "", budget: service.monthly_budget ?? "",
  };
}

export function comparisonPayload(mode, values) {
  const fields = mode === "bills" ? ["previous_bill", "current_bill"] : ["previous_reading", "current_reading", "previous_date", "reading_date", "period_end", "rate", "fixed_fee", "other_charges", "expected_usage", "budget"];
  return { mode, ...Object.fromEntries(fields.map((key) => [key, values[key] === "" ? null : values[key]])) };
}

export function usageTrend(result) {
  if (!result?.dates) return [];
  const at = (day) => Date.parse(`${day}T00:00:00+08:00`);
  const rows = [
    { timestamp: at(result.dates.start), label: result.dates.start, actual: 0, projected: null },
    { timestamp: at(result.dates.observed), label: result.dates.observed, actual: Number(result.usage), projected: Number(result.usage) },
  ];
  if (result.dates.end !== result.dates.observed) rows.push({ timestamp: at(result.dates.end), label: result.dates.end, actual: null, projected: Number(result.projected_usage) });
  return rows;
}
