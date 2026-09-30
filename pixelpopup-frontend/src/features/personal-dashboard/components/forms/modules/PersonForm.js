import { field, notes, relationshipOptions } from "../formFields";

export default function definition(record) {
  return {
    title: record?.id ? "Edit person" : "Add person",
    endpoint: "contacts/",
    fields: [
      field("name", "Name", "text", { required: true, maxLength: 120 }),
      field("relationship", "Relationship", "select", {
        required: true,
        options: relationshipOptions,
      }),
      field("custom_relationship", "Relationship detail", "text", {
        when: (v) => v.relationship === "Other",
        maxLength: 60,
        hint: "Optional, for example Cousin or Neighbor.",
      }),
      notes,
    ],
  };
}
