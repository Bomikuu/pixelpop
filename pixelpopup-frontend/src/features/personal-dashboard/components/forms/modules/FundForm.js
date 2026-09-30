import { field, date, accountDetails } from "../formFields";
import { coverageTypes, fundTypes } from "../../../lib/presets";

export default function definition(record) {
  return {
    title: record?.id ? "Edit fund" : "Add benefit / investment",
    endpoint: "accounts/",
    prepareBody: ({ body }) => { body.kind = "fund"; },
    fields: [
      field("name", "Fund name", "text", { required: true }),
      field("fund_type", "Type", "select", {
        required: true,
        default: "mp2",
        options: fundTypes.filter((type) => !coverageTypes.includes(type.value)),
        disabled: !!record?.id,
      }),
      ...accountDetails,
      ...(!record?.id ? [
        field("opening_balance", "Existing recorded value (₱)", "number", {
          required: true,
          default: "0",
          min: "0",
          step: "0.01",
          hint: "Already held in this fund. This does not deduct cash again. Do not count the same holding in Assets.",
        }),
        { ...date, name: "opening_date", label: "Opening valuation date" },
      ] : []),
    ],
  };
}
