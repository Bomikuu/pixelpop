import { useState } from "react";
import FormModalShell from "../../forms/FormModalShell";
import RecurringBillPreset from "../../forms/RecurringBillPreset";
import { utilityPresets } from "../../../lib/presets";
import { accountChoiceOption } from "../../AccountBalancePreview";
import useServiceForm from "./useServiceForm";
import Fields, { text, numeric, date, select } from "./ServiceFormFields";
import { option, serviceTypes, variableTypes } from "../../../subscriptions/model";
import { servicePath } from "../../../subscriptions/api";
import { today } from "../../../lib/format";

export default function SubscriptionForm({ record, dashboard, notify, onSaved, onCancel }) {
  const [preset, setPreset] = useState("custom");
  const form = useServiceForm({ initial: { title: record?.title || "", provider: record?.provider || "", plan_name: record?.plan_name || "", service_type: record?.service_type || "fixed", amount: record?.amount || "", anchor_date: record?.anchor_date || today(), frequency: record?.frequency || "monthly", interval: String(record?.interval || 1), category: record?.category ? String(record.category) : "", account: record?.account ? String(record.account) : "", monthly_budget: record?.monthly_budget ?? "", expected_usage: record?.expected_usage ?? "", expires_on: record?.expires_on || "", notes: record?.notes || "" }, dashboard, path: servicePath(record?.id), notify, onSaved });
  const fields = [text("title", "Service name", { required: true }), select("service_type", "Service type", serviceTypes, { required: true }), text("provider", "Provider"), text("plan_name", "Plan / package"),
    ...(!variableTypes.has(form.values.service_type) ? [numeric("amount", "Fixed bill amount (PHP)", { required: true, min: "0.01" })] : []),
    date("anchor_date", "First / anchor due date", { required: true }), select("frequency", "Repeat unit", ["weekly", "monthly", "quarterly", "yearly", "days", "weeks", "months", "years"].map((v) => option(v, v[0].toUpperCase() + v.slice(1)))), numeric("interval", "Every how many units?", { min: "1", step: "1", required: true }),
    select("category", "Category", [option("", "Uncategorized"), ...dashboard.data.categories.map((c) => option(c.id, c.name))]),
    select("account", "Preferred payment account", [option("", "Choose when paying"), ...dashboard.data.accounts.filter((a) => a.active && a.kind !== "fund").map(accountChoiceOption)], { source: "accounts" }),
    numeric("monthly_budget", "Monthly budget (PHP)", { hint: "Optional planning budget; does not change account balances." }), numeric("expected_usage", "Expected cycle usage", { step: "0.000001", hint: "Optional. Use the same unit as your meter." }), date("expires_on", "Expiry date (optional)"), text("notes", "Notes", { type: "textarea", maxLength: 4000 })];
  const choosePreset = (value) => {
    setPreset(value);
    const chosen = utilityPresets.find((item) => item.value === value);
    if (!chosen?.title) return;
    form.set("title", chosen.title);
    form.set("service_type", ["electricity", "water", "internet"].includes(value) ? value : chosen.amountMode === "variable" ? "variable" : "fixed");
    if (chosen.kind === "subscription") form.set("provider", chosen.label);
  };
  return <FormModalShell title={record ? "Edit service" : "Add subscription or utility"} description="Fixed services repeat their price. Variable utilities need an actual bill before payment; estimates remain planning only." {...form} onSubmit={form.submit((v) => ({ ...v, amount: variableTypes.has(v.service_type) ? null : v.amount, category: v.category ? Number(v.category) : null, account: v.account ? Number(v.account) : null, interval: Number(v.interval), monthly_budget: v.monthly_budget || null, expected_usage: v.expected_usage || null, expires_on: v.expires_on || null, ...(record ? { expected_revision: record.revision } : {}) }), ["title", "anchor_date", "interval", ...(!variableTypes.has(form.values.service_type) ? ["amount"] : [])])} onCancel={onCancel} saveLabel="Save service" scrollBody>
    {!record && <RecurringBillPreset value={preset} onChange={choosePreset} disabled={form.busy} />}
    <Fields form={form} fields={fields} />
  </FormModalShell>;
}
