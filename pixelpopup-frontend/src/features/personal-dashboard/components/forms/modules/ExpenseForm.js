import { field, choices, amount, notes, date, category, account } from "../formFields";

export default function definition(record) {
  return {
    title: record?.id ? "Edit expense" : "Add expense",
    endpoint: "transactions/",
    prepareBody: ({ body }) => { body.kind = "expense"; },
    fields: [
      amount,
      field("name", "Expense name", "text", { required: true }),
      record?.id && record.account == null ? { ...account, required: false, nullable: true, hint: "Leave empty to keep this entry unsettled. Choosing an account will assign the payment." } : account,
      ...(record?.coverage
        ? [field("coverage", "Coverage", "select", { source: "coverages", required: true })]
        : []),
      category,
      date,
      field("payment_method", "Payment method", "select", {
        default: "bank",
        options: choices(["cash", "bank", "credit_card", "debit_card", "gcash", "maya", "other"]),
      }),
      notes,
    ],
  };
}
