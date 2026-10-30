import { useCallback } from "react";
import { useLocation, useSearchParams } from "react-router-dom";

const defaults = { q: "", category: "", period: "month", start: "", end: "", page: 1, kind: "", view: "cards" };
const periods = ["month", "today", "week", "custom", "all", "undated"];
const validDate = (value) => /^(?!0000)\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;

function readFilters(params, scope) {
  const values = Object.fromEntries(Object.entries(defaults).map(([key, fallback]) => [key, params.get(`${scope}.${key}`) ?? fallback]));
  const page = Number(values.page);
  return {
    q: String(values.q).slice(0, 160),
    category: /^\d+$/.test(values.category) ? values.category : "",
    period: periods.includes(values.period) ? values.period : "month",
    start: validDate(values.start) ? values.start : "",
    end: validDate(values.end) ? values.end : "",
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
    kind: ["income", "expense"].includes(values.kind) ? values.kind : "",
    view: values.view === "table" ? "table" : "cards",
  };
}

export default function useRecordFilters(scope) {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const setFilters = useCallback((updates, options = { replace: true }) => {
    if (typeof window !== "undefined" && window.location.pathname !== location.pathname) return;
    setParams((current) => {
      // Separate lists can commit debounced filters before the router rerenders.
      const next = new URLSearchParams(typeof window === "undefined" ? current : window.location.search);
      for (const [key, value] of Object.entries(updates)) {
        if (!Object.hasOwn(defaults, key)) continue;
        if (String(value) === String(defaults[key])) next.delete(`${scope}.${key}`);
        else next.set(`${scope}.${key}`, String(value));
      }
      return next;
    }, options);
  }, [scope, setParams, location.pathname]);
  return [readFilters(params, scope), setFilters];
}
