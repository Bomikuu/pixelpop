import { useState } from "react";
import { Calculator, Pencil, Plus } from "lucide-react";
import { Button } from "../../ui/button";
import { Panel, ErrorState } from "../Panel";
import ServiceTable from "./ServiceTable";
import { servicePath } from "../../subscriptions/api";
import { money } from "../../lib/format";

export default function ApplianceList({ service, cycle, dashboard, open }) {
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const signature = JSON.stringify({ cycle: cycle?.id, appliances: service.appliances, tariff: cycle?.tariff_id });
  const estimate = async () => {
    setBusy(true); setError(""); setResult(null);
    try { const data = await dashboard.request(servicePath(service.id, "appliance-preview/"), { method: "POST", body: { cycle_id: cycle.id } }); setResult({ signature, data }); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  return <Panel title="Appliance planning" description="Watts × hours × days × quantity. These estimates do not change readings or spending." action={<div className="flex flex-wrap gap-2"><Button variant="outline" disabled={busy || !cycle?.period_start} onClick={estimate}><Calculator size={15} />{busy ? "Estimating…" : "Estimate selected period"}</Button><Button onClick={() => open("appliance")}><Plus size={15} />Add appliance</Button></div>}><ServiceTable rows={service.appliances} columns={[{ key: "name", label: "Appliance" }, { key: "watts", label: "Watts" }, { key: "hours_per_day", label: "Hours / day" }, { key: "days_used", label: "Days" }, { key: "quantity", label: "Quantity" }, { key: "active", label: "Included", render: (r) => r.active ? "Yes" : "No" }, { key: "edit", label: "Edit", render: (r) => <Button size="icon" variant="ghost" aria-label={`Edit ${r.name}`} onClick={() => open("appliance", r)}><Pencil size={15} /></Button> }]} />{error && <ErrorState message={error} />}{result?.signature === signature && <div role="status" className="mt-4 space-y-3"><p>Estimated consumption: {Number(result.data.cycle_kwh).toFixed(3)} kWh · Combined bill: {result.data.combined_cost ? money(result.data.combined_cost.total) : "Rate needed"}</p><p className="text-xs leading-6 text-slate-600">{result.data.note}</p><ServiceTable rows={result.data.rows} columns={[{ key: "name", label: "Appliance" }, { key: "cycle_kwh", label: "Estimated kWh" }, { key: "usage_cost", label: "Standalone usage cost", render: (r) => r.usage_cost == null ? "Unknown" : money(r.usage_cost) }]} /></div>}</Panel>;
}
