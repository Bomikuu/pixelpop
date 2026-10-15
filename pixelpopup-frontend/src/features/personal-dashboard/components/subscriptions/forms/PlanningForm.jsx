import FormModalShell from "../../forms/FormModalShell";
import useServiceForm from "./useServiceForm";
import Fields, { numeric, select } from "./ServiceFormFields";
import { servicePath } from "../../../subscriptions/api";
import { option, scenarioMultiplier } from "../../../subscriptions/model";

export default function PlanningForm({ service, dashboard, notify, onSaved, onCancel }) {
  const form = useServiceForm({ initial: { scenario: service.planning_assumptions?.scenario || "normal", multiplier: service.planning_assumptions?.multiplier || "1" }, dashboard, path: servicePath(service.id, "planning-assumptions/"), notify, onSaved, message: "Planning preset saved. Normal projections and actual bills are unchanged." });
  return <FormModalShell title="Save planning assumptions" description="Save a named scenario for reference. Forecast previews are explicit and never silently replace Normal, confirmed bills or recorded spending." {...form} onCancel={onCancel} saveLabel="Save planning preset" onSubmit={form.submit((v) => ({ scenario: v.scenario, multiplier: scenarioMultiplier(v.scenario, v.multiplier), expected_revision: service.revision }), form.values.scenario === "custom" ? ["multiplier"] : [])}><Fields form={form} fields={[select("scenario", "Usage scenario", [option("normal", "Normal"), option("high", "High · +20% usage"), option("low", "Low · −20% usage"), option("custom", "Custom multiplier")]), ...(form.values.scenario === "custom" ? [numeric("multiplier", "Usage multiplier", { step: "0.000001", max: "99", required: true })] : [])]} /></FormModalShell>;
}
