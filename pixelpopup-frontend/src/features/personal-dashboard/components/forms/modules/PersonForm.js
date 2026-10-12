import { field, notes, relationshipOptions } from "../formFields";

export default function definition(record) {
  return {
    title: record?.id ? "Edit person" : "Add person",
    endpoint: "contacts/",
    fields: [
      field("avatar_upload", "Avatar or logo", "image"),
      field("name", "Name", "text", { required: true, maxLength: 120, default: record?.person || "" }),
      field("nickname", "Nickname / identifier", "text", { maxLength: 60 }),
      field("relationship", "Relationship", "select", {
        required: true,
        options: relationshipOptions,
      }),
      field("custom_relationship", "Relationship detail", "text", {
        when: (v) => v.relationship === "Other",
        maxLength: 60,
        hint: "Optional, for example Cousin or Neighbor.",
      }),
      field("email", "Email", "email", {
        maxLength: 254, pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
        validationMessage: "Enter a valid email address, for example name@example.com.",
      }),
      field("phone", "Phone", "text", {
        inputMode: "numeric", maxLength: 15, pattern: "^[0-9]{7,15}$",
        validationMessage: "Use 7–15 digits, including the country code if needed.",
      }),
      field("organization", "Company / organization", "text", { maxLength: 120 }),
      notes,
    ],
  };
}
