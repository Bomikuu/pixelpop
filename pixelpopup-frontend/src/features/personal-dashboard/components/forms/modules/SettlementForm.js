import { field, amount, date, account } from "../formFields";

export default function definition(record) {
  return {
    title:
      record?.settlement_kind === "loan_collection"
        ? "Record collection"
        : "Pay " + record?.title,
    endpoint: "deadlines/" + record.id + "/settle/",
    fields: [
      { ...amount, default: record.amount || "" },
      date,
      {
        ...account,
        cashOnly: record.settlement_kind !== "expense",
        label:
          record.settlement_kind === "loan_collection"
            ? "Receive into"
            : "Pay from",
      },
      field(
        "transaction",
        "Or link an already-recorded expense ID",
        "number",
        {
          nullable: true,
          hint: "Use this instead of adding the expense again.",
          when: () => record.settlement_kind === "expense",
        },
      ),
    ],
  };
}
