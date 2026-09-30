import { field, amount, notes, date, category, reminder, amountMode } from "../formFields";
import { today } from "../../../lib/format";

export default function definition(record) {
  return {
    title: record?.id ? "Edit premium schedule" : "Set premium schedule",
    endpoint: "schedules/",
    prepareBody: ({ body, values, record }) => {
      if (values.amount_mode === "variable") body.amount = null;
      body.variable_amount = values.amount_mode === "variable";
      body.coverage = record.coverage;
      body.kind = "bill";
      body.settlement_kind = "expense";
      body.interval = 1;
    },
    fields: [
      field("title", "Bill name", "text", { required: true }),
      {
        ...amountMode,
        label: "Premium amount",
        options: [
          { value: "fixed", label: "Fixed amount", description: "Use the same premium each payment." },
          { value: "variable", label: "Enter each time", description: "Enter the premium when each payment is due." },
        ],
        hint: "For a variable premium, enter the actual amount when you pay each bill.",
        default: record?.variable_amount ? "variable" : "fixed",
      },
      { ...amount, required: true, when: (v) => v.amount_mode !== "variable" },
      field("anchor_date", "First due date", "date", { required: true, default: today() }),
      field("frequency", "Payment frequency", "select", {
        required: true,
        default: "monthly",
        options: [
          { value: "monthly", label: "Monthly", description: "Due every month." },
          { value: "quarterly", label: "Quarterly", description: "Due every three months." },
        ],
      }),
      category,
      reminder,
      notes,
      ...(record?.id ? [field("active", "Schedule status", "select", {
        options: [
          { value: "true", label: "Active", description: "Keep scheduling future payments." },
          { value: "false", label: "Stopped", description: "Stop scheduling future payments." },
        ],
      })] : []),
    ],
  };
}
