import { today, words } from "../../lib/format";
import { assetTypes, cardNetworks, coverageTypes, fundTypes } from "../../lib/presets";
import { Users } from "lucide-react";

const field = (name, label, type = "text", extra = {}) => ({
  name,
  label,
  type,
  ...extra,
});
const choices = (values) =>
  values.map((value) => ({ value, label: words(value) }));
const amount = field("amount", "Amount (₱)", "number", {
  required: true,
  min: "0.01",
  step: "0.01",
});
const notes = field("notes", "Notes", "textarea");
const date = field("date", "Date", "date", {
  required: true,
  default: today(),
  max: today(),
});
const category = field("category", "Category", "select", {
  source: "categories",
  nullable: true,
});
const account = field("account", "Account", "select", {
  source: "accounts",
  required: true,
});
const contact = field("contact", "Person", "select", {
  source: "contacts",
  required: true,
});
export const relationshipOptions = [
  "Mother", "Father", "Parent", "Sibling", "Partner", "Child",
  "Friend", "Colleague", "Other",
].map((value) => ({ value, label: value, icon: Users }));
const accountDetails = [
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
const repeats = field("repeat", "Repeat", "select", {
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
const interval = field("interval", "Repeat interval", "number", {
  min: "1",
  step: "1",
  default: "1",
  when: (v) =>
    ["days", "weeks", "months", "years"].includes(v.repeat || v.frequency),
});
const reminder = field("reminder_days", "Reminder", "select", {
  default: "0",
  options: [0, 1, 3, 7].map((n) => ({
    value: String(n),
    label: n ? n + " day(s) before" : "On due date",
  })),
});
const amountMode = field("amount_mode", "Bill amount", "select", {
  default: "fixed",
  options: [
    { value: "fixed", label: "Fixed amount" },
    { value: "variable", label: "Enter each month" },
  ],
  hint: "Variable bills start unpriced each month. Enter that month's actual amount when the bill arrives.",
});

export function formDefinition(entity, record) {
  if (entity === "person")
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
  if (entity === "giving")
    return {
      title: record?.id ? "Edit giving" : "Add giving",
      endpoint: "transactions/",
      fields: [
        { ...contact, label: "Who received it?" },
        amount,
        account,
        date,
        category,
        field("name", "Description", "text", {
          required: true,
          default: "Support / gift",
        }),
        field("payment_method", "Payment method", "select", {
          default: "bank",
          options: choices([
            "cash",
            "bank",
            "credit_card",
            "debit_card",
            "gcash",
            "maya",
            "other",
          ]),
        }),
        notes,
      ],
    };
  if (entity === "fund") {
    const coverage = coverageTypes.includes(record?.fund_type);
    return {
      title: record?.id ? coverage ? "Edit coverage" : "Edit fund" : coverage ? "Add coverage" : "Add benefit / investment",
      endpoint: "accounts/",
      fields: [
        field("name", coverage ? "Coverage name" : "Fund name", "text", { required: true }),
        field("fund_type", "Type", "select", {
          required: true,
          default: coverage ? record.fund_type : "mp2",
          options: fundTypes.filter((type) => coverageTypes.includes(type.value) === coverage),
          disabled: !!record?.id,
        }),
        ...accountDetails.map((detail) => ({
          ...detail,
          when: (values) => !coverageTypes.includes(values.fund_type),
        })),
        ...(!record?.id
          ? [
              field(
                "opening_balance",
                "Existing recorded value (₱)",
                "number",
                {
                  required: true,
                  default: "0",
                  min: "0",
                  step: "0.01",
                  hint: "Already held in this fund. This does not deduct cash again. Do not count the same holding in Assets.",
                  when: (values) => !coverageTypes.includes(values.fund_type),
                },
              ),
              {
                ...date,
                name: "opening_date",
                label: "Opening valuation date",
                when: (values) => !coverageTypes.includes(values.fund_type),
              },
            ]
          : []),
      ],
    };
  }
  if (["fund_contribution", "fund_withdrawal"].includes(entity)) {
    const contribution = entity === "fund_contribution";
    return {
      title: contribution ? "Add contribution" : "Record withdrawal",
      endpoint: "movements/",
      fields: [
        field(contribution ? "destination" : "source", "Fund", "select", {
          source: "funds",
          required: true,
        }),
        field(
          contribution ? "source" : "destination",
          contribution ? "Pay from" : "Receive into",
          "select",
          { source: "cashAccounts", required: true },
        ),
        amount,
        date,
        notes,
      ],
    };
  }
  if (entity === "expense" || entity === "income")
    return {
      title: (record?.id ? "Edit " : "Add ") + entity,
      endpoint: "transactions/",
      fields: [
        amount,
        field(
          "name",
          entity === "income" ? "Name / source" : "Expense name",
          "text",
          { required: true },
        ),
        { ...account, cashOnly: entity === "income" },
        ...(entity === "expense" && record?.coverage
          ? [field("coverage", "Coverage", "select", { source: "coverages", required: true })]
          : []),
        category,
        ...(entity === "expense"
          ? [
              { ...contact, label: "Giving recipient (optional)", required: false, nullable: true },
            ]
          : []),
        { ...date, ...(entity === "income" ? { max: undefined } : {}) },
        field("payment_method", "Payment method", "select", {
          default: "bank",
          options: choices([
            "cash",
            "bank",
            "credit_card",
            "debit_card",
            "gcash",
            "maya",
            "other",
          ]),
        }),
        ...(entity === "income"
          ? [
              field("receipt_state", "Income status", "select", {
                default: "received",
                options: choices(["received", "expected"]),
              }),
              ...(!record?.id ? [repeats, interval] : []),
            ]
          : []),
        notes,
      ],
    };
  if (entity === "deadline") {
    const taskForm = ["task", "reminder"].includes(record?.kind || "task");
    const billKinds = ["bill", "subscription", "payment"];
    return {
      title: (record?.id ? "Edit " : "Add ") + (taskForm ? "task" : "bill"),
      endpoint: "deadlines/",
      fields: [
        field("title", "Title", "text", { required: true }),
        field("kind", "Type", "select", {
          default: taskForm ? "task" : "bill",
          options: choices(taskForm ? ["task", "reminder"] : billKinds),
        }),
        field("settlement_kind", "Payment type", "select", {
          default: "expense",
          options: [
            { value: "expense", label: "Ordinary bill" },
            { value: "credit_card_payment", label: "Credit-card repayment" },
          ],
          when: (v) => billKinds.includes(v.kind),
        }),
        field("credit_card", "Credit card", "select", {
          source: "cards",
          required: true,
          when: (v) => billKinds.includes(v.kind) && v.settlement_kind === "credit_card_payment",
        }),
        ...(!record?.id
          ? [
              {
                ...amountMode,
                when: (v) => billKinds.includes(v.kind),
              },
            ]
          : []),
        {
          ...amount,
          required: false,
          hint: "Leave blank if this bill's amount is not known yet.",
          when: (v) => billKinds.includes(v.kind) && (!!record?.id || v.amount_mode !== "variable"),
        },
        field("due_date", "Due date", "date", {
          required: true,
          default: today(),
        }),
        field("due_time", "Due time", "time"),
        ...(!record?.id ? [repeats, interval] : []),
        category,
        reminder,
        notes,
      ],
    };
  }
  if (entity === "account")
    return {
      title: record ? "Edit account" : "Add account / card",
      endpoint: "accounts/",
      fields: [
        field("name", "Account name", "text", { required: true }),
        field("kind", "Account type", "select", {
          default: "bank",
          options: choices(["bank", "cash", "ewallet", "credit_card"]),
          disabled: !!record,
        }),
        field("institution", "Bank / institution", "institution", {
          when: (v) => v.kind !== "cash",
        }),
        ...accountDetails,
        field("card_network", "Card network", "select", {
          options: cardNetworks,
          when: (v) => v.kind !== "cash",
          hint: "Optional. Choose the logo on your card; no extra digits are needed.",
        }),
        field("credit_limit", "Credit limit (₱)", "number", {
          min: "0",
          step: "0.01",
          when: (v) => v.kind === "credit_card",
          nullable: true,
        }),
        ...(!record
          ? [
              field(
                "opening_balance",
                "Opening balance / card debt (₱)",
                "number",
                { step: "0.01", default: "0", required: true },
              ),
              { ...date, name: "opening_date", label: "Opening date" },
            ]
          : []),
      ],
    };
  if (entity === "asset")
    return {
      title: record ? "Edit asset valuation" : "Add asset",
      endpoint: "assets/",
      fields: [
        field("name", "Asset name", "text", { required: true }),
        field("kind", "Asset type", "select", {
          default: "other",
          options: assetTypes.map(([value, label, icon]) => ({
            value,
            label,
            icon,
          })),
        }),
        field("value", "Estimated current value (₱)", "number", {
          min: "0",
          step: "0.01",
          required: true,
        }),
        { ...date, name: "valuation_date", label: "Valuation date" },
        notes,
      ],
    };
  if (entity === "loan")
    return {
      title: record?.id ? "Edit loan details" : "Record money lent",
      endpoint: "loans/",
      fields: [
        contact,
        {
          ...amount,
          name: "principal",
          label: "Principal lent (₱)",
          disabled: !!record?.id,
        },
        { ...account, cashOnly: true, disabled: !!record?.id },
        { ...date, label: "Date lent", disabled: !!record?.id },
        field("existing", "Loan record", "select", {
          default: "false",
          disabled: !!record?.id,
          options: [
            { value: "false", label: "New disbursement — deduct from account" },
            {
              value: "true",
              label: "Existing loan — already reflected in opening balance",
            },
          ],
        }),
        field("due_date", "Repayment due date", "date", { nullable: true }),
        notes,
      ],
    };
  if (entity === "movement")
    return {
      title: "Record money movement",
      endpoint: "movements/",
      fields: [
        field("kind", "Movement type", "select", {
          default: record?.kind || "transfer",
          options: choices([
            "transfer",
            "credit_card_payment",
            "loan_repayment",
          ]),
        }),
        amount,
        field("source", "From account", "select", {
          source: "cashAccounts",
          required: true,
          when: (v) => v.kind !== "loan_repayment",
        }),
        field("destination", "To account / card", "select", {
          source: "accounts",
          required: true,
        }),
        field("loan", "Loan", "number", {
          required: true,
          disabled: !!record?.loan,
          when: (v) => v.kind === "loan_repayment",
        }),
        date,
        notes,
      ],
    };
  if (entity === "settlement")
    return {
      title:
        record?.settlement_kind === "loan_collection"
          ? "Record collection"
          : "Pay " + record?.title,
      endpoint: "deadlines/" + record.id + "/settle/",
      fields: [
        { ...amount, default: record.amount || "" },
        {
          ...account,
          cashOnly: record.settlement_kind !== "expense",
          label:
            record.settlement_kind === "loan_collection"
              ? "Receive into"
              : "Pay from",
        },
        date,
        field(
          "transaction",
          "Or link an already-recorded expense ID",
          "number",
          {
            nullable: true,
            hint: "Use this instead of adding the expense again.",
            when: () => record.settlement_kind === "expense",
          },
        ),
      ],
    };
  if (entity === "adjustment")
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
  if (entity === "budget")
    return {
      title: "Set monthly budget",
      endpoint: "settings/",
      method: "PATCH",
      fields: [
        field("monthly_budget", "Monthly budget (₱)", "number", {
          min: "0",
          step: "0.01",
          nullable: true,
          default: record?.monthly_budget || "",
        }),
      ],
    };
  if (entity === "category")
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
  if (entity === "schedule" && record?.coverage)
    return {
      title: record?.id ? "Edit premium schedule" : "Set premium schedule",
      endpoint: "schedules/",
      fields: [
        field("title", "Bill name", "text", { required: true }),
        {
          ...amountMode,
          label: "Premium amount",
          hint: "For a variable premium, enter the actual amount when you pay each bill.",
          default: record?.variable_amount ? "variable" : "fixed",
        },
        { ...amount, required: true, when: (v) => v.amount_mode !== "variable" },
        field("anchor_date", "First due date", "date", { required: true, default: today() }),
        field("frequency", "Payment frequency", "select", {
          required: true,
          default: "monthly",
          options: choices(["monthly", "quarterly"]),
        }),
        category,
        reminder,
        notes,
        ...(record?.id ? [field("active", "Schedule status", "select", {
          options: [
            { value: "true", label: "Active" },
            { value: "false", label: "Stopped" },
          ],
        })] : []),
      ],
    };
  return {
    title: "Edit recurring schedule",
    endpoint: "schedules/",
    fields: [
      field("title", "Title", "text", { required: true }),
      ...(record?.kind !== "income" && !["task", "reminder"].includes(record?.kind)
        ? [
            {
              ...amountMode,
              default: record?.variable_amount ? "variable" : "fixed",
            },
          ]
        : []),
      {
        ...amount,
        required: false,
        when: (v) => !["task", "reminder"].includes(record?.kind) && v.amount_mode !== "variable",
      },
      field("anchor_date", "Anchor date", "date", { required: true }),
      field("frequency", "Frequency", "select", {
        options: choices([
          "weekly",
          "monthly",
          "quarterly",
          "yearly",
          "days",
          "weeks",
          "months",
          "years",
        ]),
      }),
      interval,
      reminder,
      notes,
      field("active", "Schedule status", "select", {
        options: [
          { value: "true", label: "Active" },
          { value: "false", label: "Stopped" },
        ],
      }),
    ],
  };
}
