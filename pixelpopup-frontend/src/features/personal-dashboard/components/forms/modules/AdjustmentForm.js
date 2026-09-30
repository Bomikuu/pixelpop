import { field, amount, date } from "../formFields";

export default function definition(record) {
  return {
    title:
      "Correct " +
      record.name +
      (record.kind === "fund" ? " recorded value" : " balance"),
    endpoint: "accounts/" + record.id + "/adjust/",
    fields: [
      field("amount", "Signed correction (₱)", "number", {
        required: true,
        step: "0.01",
        hint: "For example, -500 decreases this balance by ₱500. Existing history stays unchanged.",
      }),
      date,
      field("reason", "Reason", "text", { required: true }),
    ],
  };
}
