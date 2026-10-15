export const sectionValue = (value) => ["due", "subscriptions", "forecasts"].includes(value) ? value : "due";
export const viewValue = (value) => value === "table" ? "table" : "cards";
export const queryString = (values) => new URLSearchParams(Object.entries(values).filter(([, v]) => v !== "" && v != null)).toString();
export const manilaNow = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date()).replace(" ", "T");
export const manilaInstant = (local) => local ? `${local.length === 16 ? local + ":00" : local}+08:00` : "";
export const scenarioMultiplier = (scenario, custom = "1") => ({ normal: "1", high: "1.2", low: "0.8" })[scenario] || custom;
export function comparison(value, baseline) {
  if (value == null || baseline == null || !Number(baseline)) return undefined;
  const percent = (Number(value) - Number(baseline)) / Math.abs(Number(baseline)) * 100;
  return { text: `${Math.abs(percent).toFixed(1)}% ${percent >= 0 ? "more" : "less"} than last month`, trend: percent > 0 ? "up" : percent < 0 ? "down" : "flat", tone: "neutral" };
}
