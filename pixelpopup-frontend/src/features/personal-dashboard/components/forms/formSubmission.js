export function buildSubmission({ entity, record, definition, fields, values, requestId }) {
  const body = Object.fromEntries(
    fields
      .filter((field) => field.name !== "repeat" && field.name !== "amount_mode" && (entity === "schedule" || field.name !== "interval"))
      .map((field) => [
        field.name,
        values[field.name] === ""
          ? field.nullable || field.type === "number" || field.type === "time" ? null : ""
          : ["existing", "active", "important"].includes(field.name) ? values[field.name] === "true" : values[field.name],
      ]),
  );
  definition.prepareBody?.({ body, values, record });

  let path = definition.endpoint;
  let method = definition.method || (record?.id && !["settlement", "adjustment", "movement", "budget", "fund_contribution", "fund_withdrawal"].includes(entity) ? "PATCH" : "POST");
  if (method === "PATCH" && record?.id && entity !== "budget") path += record.id + "/";
  if ((!record?.id && ["expense", "income", "loan", "giving"].includes(entity)) || ["movement", "adjustment", "settlement", "fund_contribution", "fund_withdrawal"].includes(entity)) body.request_id = requestId;
  if (values.repeat && values.repeat !== "never") {
    path = "schedules/";
    method = "POST";
    const scheduled = {
      title: body.title || body.name,
      kind: entity === "income" ? "income" : body.kind,
      amount: body.amount,
      anchor_date: body.due_date || body.date,
      frequency: values.repeat,
      interval: Number(values.interval || 1),
      category: body.category || null,
      account: body.credit_card || body.account || null,
      settlement_kind: body.settlement_kind || "expense",
      due_time: body.due_time || null,
      reminder_days: body.reminder_days || 0,
      notes: body.notes,
      important: Boolean(body.important),
      variable_amount: ["bill", "subscription", "payment"].includes(body.kind) && body.amount == null,
    };
    Object.keys(body).forEach((key) => delete body[key]);
    Object.assign(body, scheduled);
  }
  const action =
    entity === "settlement" && record?.settlement_kind === "loan_collection" ? "collected"
      : entity === "movement" && values.kind === "loan_repayment" ? "repaid"
        : entity === "movement" && values.kind === "transfer" ? "transferred"
          : entity === "settlement" ? "settled"
            : entity === "repayment" ? "repaid"
              : entity === "adjustment" ? "corrected"
                : record?.id ? "edited" : "added";
  return {
    path,
    method,
    body,
    notification: {
      message: entity === "person" ? (record?.id ? "Person updated." : "Person added.") : "Saved successfully.",
      context: { entity: path === "schedules/" ? "schedule" : entity, action },
    },
  };
}
