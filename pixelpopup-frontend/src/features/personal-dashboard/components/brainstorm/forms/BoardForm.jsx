import FormField from "../../forms/FormField";

export function boardPayload(draft) {
  return { name: draft.name.trim(), description: draft.description || "" };
}

export default function BoardForm({ draft, onChange, busy }) {
  return <div className="space-y-4">
    <FormField layout="plain" idPrefix="brainstorm" field={{ name: "name", label: "Name", type: "text", required: true, maxLength: 120 }}
      values={draft} onChange={onChange} disabled={busy} />
    <FormField layout="plain" idPrefix="brainstorm" field={{ name: "description", label: "Description", type: "textarea", maxLength: 4000 }}
      values={draft} onChange={onChange} disabled={busy} />
  </div>;
}
