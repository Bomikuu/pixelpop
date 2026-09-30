import { field, amount, notes, date, account, contact } from "../formFields";

export default function definition(record) {
  return {
    title: record?.id ? "Edit loan details" : "Record money lent",
    endpoint: "loans/",
    fields: [
      contact,
      {
        ...amount,
        name: "principal",
        label: "Principal lent (₱)",
        disabled: !!record?.id,
      },
      { ...date, label: "Date lent", disabled: !!record?.id },
      { ...account, cashOnly: true, disabled: !!record?.id },
      field("existing", "Loan record", "select", {
        default: "false",
        disabled: !!record?.id,
        options: [
          { value: "false", label: "New disbursement — deduct from account" },
          {
            value: "true",
            label: "Existing loan — already reflected in opening balance",
          },
        ],
      }),
      field("due_date", "Repayment due date", "date", { nullable: true }),
      notes,
    ],
  };
}
