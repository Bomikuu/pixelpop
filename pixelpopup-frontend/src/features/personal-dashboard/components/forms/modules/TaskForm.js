import { field, choices, notes, category, repeats, interval, reminder } from "../formFields";

export default function definition(record) {
  return {
    title: record?.id ? "Edit task" : "Add task",
    endpoint: "deadlines/",
    prepareBody: ({ body, record }) => { if (!record?.id) body.amount = null; },
    fields: [
      field("title", "Title", "text", { required: true }),
      field("kind", "Type", "select", {
        default: "task",
        options: choices(["task", "reminder"]),
      }),
      field("due_date", "Due date", "date", {
        required: false,
        nullable: true,
        default: "",
        hint: "Optional. Leave blank to keep this task in No date.",
      }),
      field("priority", "Priority", "select", {
        default: "medium",
        options: choices(["high", "medium", "low"]),
      }),
      field("due_time", "Due time", "time"),
      ...(!record?.id ? [repeats, interval] : []),
      category,
      reminder,
      notes,
    ],
  };
}
