import { accountSources } from "./accountFlow";

export function validateForm({ entity, fields, values, getAccountState }) {
  const invalid = {};
  for (const field of fields) {
    const value = values[field.name]?.trim();
    const linkedExpense = entity === "settlement" && values.transaction;
    if (field.required && !value && !(linkedExpense && ["amount", "account"].includes(field.name)))
      invalid[field.name] = "Enter or select " + field.label.toLowerCase() + ".";
    if (value && field.type === "number" && (!Number.isFinite(Number(value)) || (field.min != null && Number(value) < Number(field.min))))
      invalid[field.name] = "Enter a valid amount or number.";
    if (field.max && value > field.max) invalid[field.name] = "Use today or an earlier date.";
    if (value && field.pattern && !new RegExp(field.pattern).test(value)) invalid[field.name] = field.validationMessage;
  }
  for (const field of fields.filter((item) => accountSources.has(item.source))) {
    if (getAccountState(field).blocked) invalid[field.name] = "Choose an account with enough balance or available credit.";
  }
  if (entity === "deadline" && !values.due_date && values.repeat && values.repeat !== "never")
    invalid.due_date = "Choose a due date to repeat this task.";
  if (entity === "deadline" && !values.due_date && values.due_time)
    invalid.due_date = "Choose a due date when setting a time.";
  return invalid;
}
