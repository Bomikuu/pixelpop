import { field, choices, amount, notes, date, category, account, repeats, interval } from "../formFields";

export default function definition(record) {
  return {
    title: record?.id ? "Edit income" : "Add income",
    endpoint: "transactions/",
    prepareBody: ({ body }) => { body.kind = "income"; },
    fields: [
      amount,
      field("name", "Name / source", "text", { required: true }),
      { ...account, cashOnly: true, ...(record?.id && record.account == null ? { required: false, nullable: true, hint: "Leave empty to keep this entry unsettled. Choosing an account will assign the income." } : {}) },
      category,
      { ...date, max: undefined },
      field("payment_method", "Payment method", "select", {
        default: "bank",
        options: choices(["cash", "bank", "credit_card", "debit_card", "gcash", "maya", "other"]),
      }),
      field("receipt_state", "Income status", "select", {
        default: "received",
        options: choices(["received", "expected"]),
      }),
      ...(!record?.id ? [repeats, interval] : []),
      notes,
    ],
  };
}
