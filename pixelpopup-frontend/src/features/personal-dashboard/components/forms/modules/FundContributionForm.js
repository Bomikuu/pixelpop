import { field, amount, notes, date } from "../formFields";

export default function definition() {
  return {
    title: "Add contribution",
    endpoint: "movements/",
    prepareBody: ({ body }) => { body.kind = "fund_contribution"; },
    fields: [
      field("destination", "Fund", "select", { source: "funds", required: true }),
      field("source", "Pay from", "select", { source: "cashAccounts", required: true }),
      amount,
      date,
      notes,
    ],
  };
}
