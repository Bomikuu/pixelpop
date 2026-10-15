import { Cable, Droplets, Globe, Receipt, Repeat, Zap } from "lucide-react";

export const serviceTypes = [
  { value: "fixed", label: "Fixed subscription", icon: Repeat },
  { value: "variable", label: "Variable bill", icon: Receipt },
  { value: "electricity", label: "Electricity", icon: Zap },
  { value: "water", label: "Water", icon: Droplets },
  { value: "internet", label: "Internet", icon: Globe },
  { value: "metered", label: "Other metered service", icon: Cable },
];
export const variableTypes = new Set(["variable", "electricity", "water", "metered"]);
export const meteredTypes = new Set(["electricity", "water", "metered", "internet"]);
export const option = (value, label) => ({ value: String(value), label });
export const titleCase = (value) => String(value || "").replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase());
export { sectionValue, viewValue, queryString, manilaNow, manilaInstant, scenarioMultiplier, comparison } from "./state";
