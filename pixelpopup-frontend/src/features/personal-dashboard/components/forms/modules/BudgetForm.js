import { field } from "../formFields";

export default function definition(record) {
  return {
    title: "Set monthly budget",
    endpoint: "settings/",
    method: "PATCH",
    fields: [
      field("monthly_budget", "Monthly budget (₱)", "number", {
        min: "0",
        step: "0.01",
        nullable: true,
        default: record?.monthly_budget || "",
      }),
    ],
  };
}
