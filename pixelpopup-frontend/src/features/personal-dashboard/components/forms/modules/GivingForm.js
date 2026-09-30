import { field, choices, amount, notes, date, category, account, contact } from "../formFields";

export default function definition(record) {
  return {
    title: record?.id ? "Edit giving" : "Add giving",
      endpoint: "transactions/",
      prepareBody: ({ body }) => { body.kind = "expense"; },
    fields: [
      { ...contact, label: "Who received it?" },
      amount,
      date,
      account,
      category,
      field("name", "Description", "text", {
        required: true,
        default: "Support / gift",
      }),
      field("payment_method", "Payment method", "select", {
        default: "bank",
        options: choices([
          "cash",
          "bank",
          "credit_card",
          "debit_card",
          "gcash",
          "maya",
          "other",
        ]),
      }),
      notes,
    ],
  };
}
