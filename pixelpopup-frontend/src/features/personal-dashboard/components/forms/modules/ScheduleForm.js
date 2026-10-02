import { field, choices, amount, notes, date, interval, reminder, amountMode } from "../formFields";

export default function definition(record) {
  return {
    title: "Edit recurring schedule",
    endpoint: "schedules/",
    prepareBody: ({ body, values, record }) => {
      if (values.amount_mode === "variable") body.amount = null;
      if (record?.kind !== "income") body.variable_amount = values.amount_mode === "variable";
    },
    fields: [
      field("title", "Title", "text", { required: true }),
      ...(record?.kind !== "income" && !["task", "reminder"].includes(record?.kind)
        ? [
            {
              ...amountMode,
              default: record?.variable_amount ? "variable" : "fixed",
            },
          ]
        : []),
      {
        ...amount,
        required: false,
        when: (v) => !["task", "reminder"].includes(record?.kind) && v.amount_mode !== "variable",
      },
      ...(!record?.system_key ? [field("anchor_date", "Anchor date", "date", { required: true })] : []),
      ...(["task", "reminder"].includes(record?.kind) ? [field("important", "Important reminder", "select", {
        default: "false",
        options: [
          { value: "false", label: "Standard", description: "Show in Tasks only." },
          { value: "true", label: "Important", description: "Include each due occurrence in reminders." },
        ],
      })] : []),
      ...(!record?.system_key ? [field("frequency", "Frequency", "select", {
        options: choices([
          "weekly",
          "monthly",
          "quarterly",
          "yearly",
          "days",
          "weeks",
          "months",
          "years",
        ]),
      })] : []),
      ...(!record?.system_key ? [interval] : []),
      reminder,
      notes,
      field("active", "Schedule status", "select", {
        options: [
          { value: "true", label: "Active", description: "Keep scheduling future items." },
          { value: "false", label: "Stopped", description: "Stop scheduling future items." },
        ],
      }),
    ],
  };
}
