import { field, amount, notes, date } from "../formFields";

export default function definition() {
  return {
    title: "Record withdrawal",
    endpoint: "movements/",
    prepareBody: ({ body }) => { body.kind = "fund_withdrawal"; },
    fields: [
      field("source", "Fund", "select", { source: "funds", required: true }),
      field("destination", "Receive into", "select", { source: "cashAccounts", required: true }),
      amount,
      date,
      notes,
    ],
  };
}
