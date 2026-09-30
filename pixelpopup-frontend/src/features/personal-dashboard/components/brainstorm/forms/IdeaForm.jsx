import FormField from "../../forms/FormField";

const statuses = ["inbox", "planned", "in_progress", "carried_over", "done", "archived"];
const urgencies = ["high", "medium", "low", "someday"];
const label = (value) => value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());

export function ideaPayload(draft, boardId) {
  return {
    board: Number(boardId), group: Number(draft.group), title: draft.title.trim(),
    description: draft.description || "", source_text: draft.source_text || "",
    urgency: draft.urgency, status: draft.status,
    tags: draft.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    reference_url: draft.reference_url || "", notes: draft.notes || "",
  };
}

export default function IdeaForm({ draft, record, groups, onChange, busy }) {
  const statusOptions = statuses.filter((item) => item !== "carried_over" || !!record?.task_id || record?.status === "carried_over");
  const field = (name, title, type = "text", extra = {}) => <FormField
    key={name} layout="plain" idPrefix="brainstorm"
    field={{ name, label: title, type, ...extra }}
    values={draft} onChange={onChange} disabled={busy}
    options={extra.options || []}
  />;
  return <div className="space-y-4">
    {field("title", "Idea title", "text", { required: true, maxLength: 160 })}
    {field("description", "Short description", "textarea", { maxLength: 4000 })}
    <div className="grid gap-4 sm:grid-cols-2">
      {field("group", "Group", "select", { required: true, options: groups.map((item) => ({ value: String(item.id), label: item.name })) })}
      {field("urgency", "Urgency", "select", { options: urgencies.map((item) => ({ value: item, label: label(item) })) })}
      {field("status", "Status", "select", { options: statusOptions.map((item) => ({ value: item, label: label(item) })) })}
      {field("tags", "Tags, separated by commas", "text", { maxLength: 660 })}
    </div>
    {field("reference_url", "Reference link", "url", { maxLength: 2048, placeholder: "https://…" })}
    {field("source_text", "Original thought", "textarea", { maxLength: 4000 })}
    {field("notes", "Private notes", "textarea", { maxLength: 4000 })}
  </div>;
}
