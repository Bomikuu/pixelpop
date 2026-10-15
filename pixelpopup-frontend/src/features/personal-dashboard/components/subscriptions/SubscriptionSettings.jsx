import { useState } from "react";
import { Panel } from "../Panel";
import { Button } from "../../ui/button";
import FormModalShell from "../forms/FormModalShell";
import Fields, { numeric, select } from "./forms/ServiceFormFields";
import useServiceForm from "./forms/useServiceForm";
import { servicePath } from "../../subscriptions/api";
import { meteredTypes, option } from "../../subscriptions/model";
import ServiceTable from "./ServiceTable";
import PlanningForm from "./forms/PlanningForm";

function PreferencesForm({ service, dashboard, notify, onSaved, onCancel }) {
  const prefs = service.reminder_preferences || {};
  const form = useServiceForm({ initial: { enabled: prefs.enabled === false ? "no" : "yes", reading_days: String(prefs.reading_days || ""), stale_days: String(prefs.stale_days || 7), price_increase_percent: String(prefs.price_increase_percent || 10), budget: prefs.budget === false ? "no" : "yes", expiry: prefs.expiry === false ? "no" : "yes", cycle_end: prefs.cycle_end === false ? "no" : "yes", interpolate_boundaries: service.interpolate_boundaries ? "yes" : "no", anomaly_threshold: String(service.anomaly_threshold ?? 25) }, dashboard, path: servicePath(service.id), notify, onSaved });
  const switches = ["enabled", "budget", "expiry", "cycle_end", "interpolate_boundaries"];
  return <FormModalShell title="Utility & alert preferences" description="Notifications use the existing production reminder service. Interpolation estimates boundary usage; it does not create recorded readings." {...form} onCancel={onCancel} saveLabel="Save preferences" scrollBody onSubmit={form.submit((v) => ({ expected_revision: service.revision, interpolate_boundaries: v.interpolate_boundaries === "yes", anomaly_threshold: v.anomaly_threshold, reminder_preferences: { ...Object.fromEntries(switches.filter((k) => k !== "interpolate_boundaries").map((k) => [k, v[k] === "yes"])), ...(v.reading_days ? { reading_days: Number(v.reading_days) } : {}), stale_days: Number(v.stale_days), price_increase_percent: Number(v.price_increase_percent) } }), ["stale_days", "price_increase_percent", "anomaly_threshold"])}><Fields form={form} fields={[...switches.map((k) => select(k, ({ enabled: "Service alerts", budget: "Budget crossing alerts", expiry: "Expiry alerts", cycle_end: "Cycle end alerts", interpolate_boundaries: "Allow boundary interpolation" })[k], [option("yes", "Enabled"), option("no", "Disabled")])), numeric("reading_days", "Reading reminder every N days (optional)", { min: "1", max: "365", step: "1" }), numeric("stale_days", "Stale after N days", { min: "1", max: "365", step: "1" }), numeric("price_increase_percent", "Price increase alert (%)", { min: "1", max: "365", step: "1" }), numeric("anomaly_threshold", "Usage anomaly threshold (%)")]} /></FormModalShell>;
}
export default function SubscriptionSettings({ service, dashboard, notify, open }) {
  const [dialog, setDialog] = useState(null);
  const metered = meteredTypes.has(service.service_type);
  const close = () => setDialog(null);
  const formProps = { service: dialog?.service, dashboard, notify, onSaved: close, onCancel: close };
  return <div className="space-y-5">
    <Panel title="Service settings" action={<Button variant="outline" onClick={() => open("edit")}>Edit service</Button>}>
      <dl className="grid gap-4 text-sm sm:grid-cols-2">
        <div><dt className="text-slate-600">Provider / plan</dt><dd>{service.provider || "Not specified"} {service.plan_name}</dd></div>
        <div><dt className="text-slate-600">Description</dt><dd>{service.description || service.notes || "No notes"}</dd></div>
        <div><dt className="text-slate-600">Recurrence</dt><dd>Every {service.interval} {service.frequency}</dd></div>
        <div><dt className="text-slate-600">Expires</dt><dd>{service.expires_on || "No expiry recorded"}</dd></div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setDialog({ kind: "preferences", service })}>Alerts {metered ? "& interpolation" : "& thresholds"}</Button>
        <Button variant="outline" onClick={() => setDialog({ kind: "planning", service })}>Planning assumptions</Button>
      </div>
      <p className="mt-3 text-xs text-slate-600">Forecast scenario previews never overwrite Normal. Saved preset: {service.planning_assumptions?.scenario || "none"}.</p>
    </Panel>
    {metered && <Panel title="Rate versions" action={<Button onClick={() => open("tariff")}>Add rate version</Button>}>
      <ServiceTable rows={service.tariffs} columns={[{ key: "name", label: "Rate" }, { key: "effective_date", label: "Effective from" }, { key: "config", label: "Configuration", render: (r) => <details><summary className="cursor-pointer text-blue-700">View rates & fees</summary><pre className="mt-2 max-w-sm overflow-auto text-xs">{JSON.stringify(r.config, null, 2)}</pre></details> }]} />
    </Panel>}
    {dialog?.kind === "preferences" && <PreferencesForm {...formProps} />}
    {dialog?.kind === "planning" && <PlanningForm {...formProps} />}
  </div>;
}
