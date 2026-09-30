import { field } from "../formFields";
import { coverageTypes, fundTypes } from "../../../lib/presets";

export default function definition(record) {
  return {
    title: record?.id ? "Edit coverage" : "Add coverage",
    endpoint: "accounts/",
    prepareBody: ({ body }) => { body.kind = "fund"; body.opening_balance = 0; },
    fields: [
      field("name", "Coverage name", "text", { required: true }),
      field("fund_type", "Type", "select", {
        required: true,
        default: record?.fund_type,
        options: fundTypes.filter((type) => coverageTypes.includes(type.value)),
        disabled: !!record?.id,
      }),
    ],
  };
}
