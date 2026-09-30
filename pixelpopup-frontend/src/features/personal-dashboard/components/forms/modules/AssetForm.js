import { field, notes, date } from "../formFields";
import { assetTypes } from "../../../lib/presets";

export default function definition(record) {
  return {
    title: record ? "Edit asset valuation" : "Add asset",
    endpoint: "assets/",
    fields: [
      field("name", "Asset name", "text", { required: true }),
      field("kind", "Asset type", "select", {
        default: "other",
        options: assetTypes.map(([value, label, icon]) => ({
          value,
          label,
          icon,
        })),
      }),
      field("value", "Estimated current value (₱)", "number", {
        min: "0",
        step: "0.01",
        required: true,
      }),
      { ...date, name: "valuation_date", label: "Valuation date" },
      notes,
    ],
  };
}
