import { useEffect, useState } from "react";
import { CalendarDays, Info, RotateCcw, Zap } from "lucide-react";
import { Button } from "../../ui/button";
import { Tabs, TabsList, TabsTrigger } from "../../ui/tabs";
import { Panel, ErrorState } from "../Panel";
import { servicePath } from "../../subscriptions/api";
import { monthLabel } from "../../lib/format";
import { comparisonPayload, comparisonStorageKey, initialComparison, restoreComparison } from "../../subscriptions/electricityComparison";
import ElectricityComparisonFields from "./ElectricityComparisonFields";
import ElectricityComparisonCharts from "./ElectricityComparisonCharts";
import ElectricityEstimate from "./ElectricityEstimate";
import ElectricityGauge from "./ElectricityGauge";

export default function ElectricityOverview({ service, cycle, dashboard }) {
  const [draft, setDraft] = useState(() => restoreComparison(service, cycle));
  const { mode, values } = draft;
  const setMode = (mode) => setDraft((old) => ({ ...old, mode }));
  const setValues = (update) => setDraft((old) => ({ ...old, values: typeof update === "function" ? update(old.values) : update }));
  const [preview, setPreview] = useState(null);
  const [retry, setRetry] = useState(0);
  const signature = JSON.stringify(comparisonPayload(mode, values));
  const storageKey = comparisonStorageKey(service, cycle);
  useEffect(() => {
    try { sessionStorage.setItem(storageKey, JSON.stringify(draft)); } catch { /* The calculator still works when browser storage is unavailable. */ }
  }, [storageKey, draft]);
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setPreview({ signature, loading: true });
      try {
        const data = await dashboard.request(servicePath(service.id, "electricity-preview/"), { method: "POST", body: JSON.parse(signature), signal: controller.signal });
        if (!controller.signal.aborted) setPreview({ signature, data, loading: false });
      } catch (error) {
        if (!controller.signal.aborted) setPreview({ signature, loading: false, error: error.message, errors: error.fields || {} });
      }
    }, 350);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [signature, service.id, dashboard.request, retry]);
  const current = preview?.signature === signature ? preview : null;
  const result = current?.data?.missing?.length ? null : current?.data;
  const set = (name, value) => setValues((old) => ({ ...old, [name]: value }));
  const reset = () => { setValues(initialComparison(service, cycle)); setPreview(null); setRetry((v) => v + 1); };
  return <section className="space-y-5" aria-label="Electricity quick comparison">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Tabs value={mode} onValueChange={setMode}><TabsList aria-label="Electricity comparison mode" className="h-auto flex-wrap"><TabsTrigger value="bills" className="px-3 py-2">Compare bill amounts</TabsTrigger><TabsTrigger value="readings" className="px-3 py-2">Predict from meter readings</TabsTrigger></TabsList></Tabs>
      <Button variant="outline" onClick={reset}><RotateCcw size={15} aria-hidden="true" />Reset inputs</Button>
    </div>
    <div className="flex items-start gap-2 text-sm leading-6 text-slate-600"><Info size={17} className="mt-1 shrink-0" aria-hidden="true" /><p>Quick comparison only. Inputs are remembered in this browser tab for the session when browser storage is available. Reset inputs restores the starting values. Recorded bills, readings and account balances remain unchanged.</p></div>
    <Panel title={mode === "bills" ? "Enter the two bill amounts" : "Try an electricity prediction"} description={mode === "bills" ? "Use any two electricity bills. No meter, tariff or saved history is required." : "Enter cumulative meter values and dates. The previous reading date is the start of the cycle you want to estimate."}>
      <ElectricityComparisonFields {...{ mode, values, set }} errors={current?.errors} />
      <div role="status" aria-live="polite" className="mt-3 min-h-5 text-xs text-slate-600">{!current || current.loading ? "Updating comparison…" : current.error ? "Check the highlighted inputs." : current.data?.missing?.length ? mode === "bills" ? "Enter both bill amounts to see the difference." : "Complete the required meter fields to calculate a prediction." : "Comparison updated. No database records saved."}</div>
      {current?.error && !Object.keys(current.errors || {}).some((key) => key in values) && <ErrorState message={current.error} retry={() => setRetry((n) => n + 1)} />}
    </Panel>
    <div className="grid items-stretch gap-5 xl:grid-cols-2">
      <Panel
        title={<span className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-full bg-amber-50 text-amber-700"><Zap size={22} aria-hidden="true" /></span>
          {mode === "bills" ? "Electricity bill change" : "Meter reading & prediction"}
        </span>}
        description={mode === "bills" ? "An immediate comparison, without recording a bill." : "Track your consumption and see your projected usage for this billing period."}
        action={mode === "readings" && values.reading_date && <span className="inline-flex items-center gap-2 rounded-md border border-[var(--pd-border)] px-3 py-2 text-sm text-slate-950"><CalendarDays size={16} aria-hidden="true" />{monthLabel(values.reading_date.slice(0, 7))}</span>}
      >
        <ElectricityGauge {...{ mode, result, values }} comparison={result?.comparison} />
      </Panel>
      <ElectricityEstimate {...{ mode, result }} previousBill={values.previous_bill} />
    </div>
    <ElectricityComparisonCharts {...{ mode, result }} previousBill={values.previous_bill} />
  </section>;
}
