import { field, choices, date, account, accountDetails } from "../formFields";
import { cardNetworks } from "../../../lib/presets";

export default function definition(record) {
  return {
    title: record ? "Edit account" : "Add account / card",
    endpoint: "accounts/",
    fields: [
      field("name", "Account name", "text", { required: true }),
      field("kind", "Account type", "select", {
        default: "bank",
        options: choices(["bank", "cash", "ewallet", "credit_card"]),
        disabled: !!record,
      }),
      field("institution", "Bank / institution", "institution", {
        when: (v) => v.kind !== "cash",
      }),
      ...accountDetails,
      field("card_network", "Card network", "select", {
        options: cardNetworks,
        when: (v) => v.kind !== "cash",
        hint: "Optional. Choose the logo on your card; no extra digits are needed.",
      }),
      field("credit_limit", "Credit limit (₱)", "number", {
        min: "0",
        step: "0.01",
        when: (v) => v.kind === "credit_card",
        nullable: true,
      }),
      ...(!record
        ? [
            field(
              "opening_balance",
              "Opening balance / card debt (₱)",
              "number",
              { step: "0.01", default: "0", required: true },
            ),
            { ...date, name: "opening_date", label: "Opening date" },
          ]
        : []),
    ],
  };
}
