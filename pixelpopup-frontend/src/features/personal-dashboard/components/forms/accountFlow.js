export const accountSources = new Set(["accounts", "cashAccounts", "cards", "funds"]);

export function accountFlow(entity, field, values, record) {
  if (!accountSources.has(field.source) || field.name === "credit_card" || ["deadline", "schedule"].includes(entity)) return null;
  if (entity === "settlement" && values.transaction) return null;
  if (entity === "loan" && values.existing === "true") return null;
  if (["expense", "income", "giving"].includes(entity) && values.repeat && values.repeat !== "never") return null;
  if (field.name === "source") return "out";
  if (field.name === "destination") return entity === "movement" && values.kind === "credit_card_payment" ? "cardPayment" : "in";
  if (entity === "income" || (entity === "settlement" && record?.settlement_kind === "loan_collection")) return "in";
  if (entity === "movement" && values.kind === "loan_repayment") return "in";
  return "out";
}

export function accountState({ entity, field, values, record, accounts, amount, project }) {
  const direction = accountFlow(entity, field, values, record);
  const selected = accounts.find((item) => String(item.id) === String(values[field.name]));
  const existingAmount = record?.id && ["expense", "income", "giving"].includes(entity) && String(record.account) === String(selected?.id)
    ? record.amount : 0;
  const projection = direction && selected && project(selected, amount, direction, existingAmount);
  const blocked = direction === "out" && selected?.kind === "credit_card" && selected.credit_limit == null;
  return { direction, selected, existingAmount, blocked: blocked || projection?.blocked, previewVisible: Boolean(projection || blocked) };
}
