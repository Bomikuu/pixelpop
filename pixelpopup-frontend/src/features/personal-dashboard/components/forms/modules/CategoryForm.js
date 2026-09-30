import { field, category } from "../formFields";

export default function definition(record) {
  return {
    title: record ? "Edit category budget" : "Add category",
    endpoint: "categories/",
    fields: [
      field("name", "Category name", "text", { required: true }),
      field("monthly_budget", "Monthly category budget (₱)", "number", {
        min: "0",
        step: "0.01",
        nullable: true,
      }),
    ],
  };
}
