import { field, choices, amount, notes, date, category, account, contact } from "../formFields";

export default function definition(record) {
  return {
    title: record?.id ? "Edit expense" : "Add expense",
    endpoint: "transactions/",
    prepareBody: ({ body }) => { body.kind = "expense"; },
    fields: [
      amount,
      field("name", "Expense name", "text", { required: true }),
      account,
      ...(record?.coverage
        ? [field("coverage", "Coverage", "select", { source: "coverages", required: true })]
        : []),
      category,
      { ...contact, label: "Giving recipient (optional)", required: false, nullable: true },
      date,
      field("payment_method", "Payment method", "select", {
        default: "bank",
        options: choices(["cash", "bank", "credit_card", "debit_card", "gcash", "maya", "other"]),
      }),
      notes,
    ],
  };
}
