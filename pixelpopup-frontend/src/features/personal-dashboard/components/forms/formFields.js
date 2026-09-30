import { today, words } from "../../lib/format";
import { Users } from "lucide-react";

export const field = (name, label, type = "text", extra = {}) => ({
  name,
  label,
  type,
  ...extra,
});
export const choices = (values) =>
  values.map((value) => ({ value, label: words(value) }));
export const amount = field("amount", "Amount (₱)", "number", {
  required: true,
  min: "0.01",
  step: "0.01",
});
export const notes = field("notes", "Notes", "textarea");
export const date = field("date", "Date", "date", {
  required: true,
  default: today(),
  max: today(),
});
export const category = field("category", "Category", "select", {
  source: "categories",
  nullable: true,
});
export const account = field("account", "Account", "select", {
  source: "accounts",
  required: true,
});
export const contact = field("contact", "Person", "select", {
  source: "contacts",
  required: true,
});
export const relationshipOptions = [
  "Mother", "Father", "Parent", "Sibling", "Partner", "Child",
  "Friend", "Colleague", "Other",
].map((value) => ({ value, label: value, icon: Users }));
export const accountDetails = [
  field("last_four", "Last 4 digits", "text", {
    when: (v) => v.kind !== "cash",
    maxLength: 4,
    inputMode: "numeric",
    placeholder: "1234",
    pattern: "^[0-9]{4}$",
    validationMessage: "Enter exactly four digits.",
    hint: "Last four digits of the card or account number only. Leave blank if not applicable.",
  }),
  field("card_expiry", "Expiry (MM/YY)", "text", {
    when: (v) => v.kind !== "cash",
    maxLength: 5,
    placeholder: "10/28",
    pattern: "^(0[1-9]|1[0-2])/[0-9]{2}$",
    validationMessage:
      "Use MM/YY with a month from 01 to 12, for example 10/28.",
    hint: "Optional. Leave blank if the account has no card expiry.",
  }),
];
export const repeats = field("repeat", "Repeat", "select", {
  default: "never",
  options: choices([
    "never",
    "weekly",
    "monthly",
    "quarterly",
    "yearly",
    "days",
    "weeks",
    "months",
    "years",
  ]),
});
export const interval = field("interval", "Repeat interval", "number", {
  min: "1",
  step: "1",
  default: "1",
  when: (v) =>
    ["days", "weeks", "months", "years"].includes(v.repeat || v.frequency),
});
export const reminder = field("reminder_days", "Reminder", "select", {
  default: "0",
  options: [0, 1, 3, 7].map((n) => ({
    value: String(n),
    label: n ? n + " day(s) before" : "On due date",
  })),
});
export const amountMode = field("amount_mode", "Bill amount", "select", {
  default: "fixed",
  options: [
    { value: "fixed", label: "Fixed amount", description: "Use the same amount for each bill." },
    { value: "variable", label: "Enter each month", description: "Enter the actual amount when each bill arrives." },
  ],
  hint: "Variable bills start unpriced each month. Enter that month's actual amount when the bill arrives.",
});
