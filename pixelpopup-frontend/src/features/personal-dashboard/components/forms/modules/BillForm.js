import { field, choices, amount, notes, category, repeats, interval, reminder, amountMode } from "../formFields";
import { today } from "../../../lib/format";

const billKinds = ["bill", "subscription", "payment"];

export default function definition(record) {
  return {
    title: record?.id ? "Edit bill" : "Add bill",
    endpoint: "deadlines/",
    prepareBody: ({ body, values, record }) => {
      if (!record?.id && values.amount_mode === "variable") body.amount = null;
    },
    fields: [
      field("title", "Title", "text", { required: true }),
      field("kind", "Type", "select", {
        default: "bill",
        options: choices(billKinds),
      }),
      field("settlement_kind", "Payment type", "select", {
        default: "expense",
        options: [
          { value: "expense", label: "Ordinary bill", description: "Pay a bill as an expense." },
          { value: "credit_card_payment", label: "Credit-card repayment", description: "Pay down an existing card balance." },
        ],
      }),
      field("credit_card", "Credit card", "select", {
        source: "cards",
        required: true,
        when: (values) => values.settlement_kind === "credit_card_payment",
      }),
      ...(!record?.id ? [amountMode] : []),
      {
        ...amount,
        required: false,
        hint: "Leave blank if this bill's amount is not known yet.",
        when: (values) => !!record?.id || values.amount_mode !== "variable",
      },
      field("due_date", "Due date", "date", { required: true, nullable: false, default: today() }),
      field("due_time", "Due time", "time"),
      ...(!record?.id ? [repeats, interval] : []),
      category,
      reminder,
      notes,
    ],
  };
}
