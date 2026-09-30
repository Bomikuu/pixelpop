import { field, choices, amount, notes, date, account } from "../formFields";

export default function definition(record) {
  return {
    title: "Record money movement",
    endpoint: "movements/",
    fields: [
      field("kind", "Movement type", "select", {
        default: record?.kind || "transfer",
        options: choices([
          "transfer",
          "credit_card_payment",
          "loan_repayment",
        ]),
      }),
      amount,
      date,
      field("source", "From account", "select", {
        source: "cashAccounts",
        required: true,
        when: (v) => v.kind !== "loan_repayment",
      }),
      field("destination", "To account / card", "select", {
        source: "accounts",
        required: true,
      }),
      field("loan", "Loan", "number", {
        required: true,
        disabled: !!record?.loan,
        when: (v) => v.kind === "loan_repayment",
      }),
      notes,
    ],
  };
}
