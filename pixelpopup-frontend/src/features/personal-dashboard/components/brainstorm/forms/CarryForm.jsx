import FormField from "../../forms/FormField";

export function carryPayload(draft) {
  return { ...draft, category: draft.category && draft.category !== "none" ? Number(draft.category) : null, due_date: draft.due_date || null };
}

export default function CarryForm({ draft, categories, onChange, busy }) {
  const field = (name, title, type = "text", extra = {}) => <FormField
    key={name} layout="plain" idPrefix="brainstorm"
    field={{ name, label: title, type, ...extra }}
    values={draft} onChange={onChange} disabled={busy}
    options={extra.options || []}
  />;
  return <div className="space-y-4">
    {field("title", "Task title", "text", { required: true, maxLength: 160 })}
    {field("description", "Task description", "textarea", { maxLength: 4000 })}
    <div className="grid gap-4 sm:grid-cols-2">
      {field("priority", "Priority", "select", { options: ["high", "medium", "low"].map((item) => ({ value: item, label: item[0].toUpperCase() + item.slice(1) })) })}
      {field("due_date", "Due date (optional)", "date")}
    </div>
    {field("category", "Category", "select", { options: [{ value: "none", label: "None" }, ...categories.map((item) => ({ value: String(item.id), label: item.name }))] })}
  </div>;
}
