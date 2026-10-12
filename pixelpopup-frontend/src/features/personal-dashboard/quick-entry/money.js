export function toMinorUnits(value) {
  // Decimal aggregates can include redundant zeros beyond cents (e.g. 100.00000000000).
  // Remove only those zeros; never round an entered amount with extra precision.
  const text = String(value ?? "0").replace(/(\.\d{2})0+$/, "$1");
  if (!/^-?\d+(?:\.\d{1,2})?$/.test(text)) throw new Error("Use a valid amount with up to two decimal places.");
  const negative = text.startsWith("-");
  const [whole, fraction = ""] = text.replace(/^-/, "").split(".");
  const result = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
  return negative ? -result : result;
}

export function decimalAmount(value) {
  const absolute = value < 0n ? -value : value;
  return `${value < 0n ? "-" : ""}${absolute / 100n}.${String(absolute % 100n).padStart(2, "0")}`;
}

export function formatMinorUnits(value) {
  const absolute = value < 0n ? -value : value;
  return `${value < 0n ? "−" : ""}₱${(absolute / 100n).toLocaleString("en-PH")}.${String(absolute % 100n).padStart(2, "0")}`;
}

export function projectBalances(rows, accounts) {
  const totals = { expenses: 0n, income: 0n, net: 0n, unassigned: { count: 0, expenses: 0n, income: 0n, net: 0n }, accounts: [] };
  const byAccount = new Map();
  for (const row of rows) {
    if (row.errors?.length || !row.amount) continue;
    const amount = toMinorUnits(row.amount);
    const key = row.kind === "income" ? "income" : "expenses";
    const change = row.kind === "income" ? amount : -amount;
    totals[key] += amount;
    totals.net += change;
    if (row.accountId == null) {
      totals.unassigned.count++;
      totals.unassigned[key] += amount;
      totals.unassigned.net += change;
    } else {
      const values = byAccount.get(String(row.accountId)) || { expenses: 0n, income: 0n };
      values[key] += amount;
      byAccount.set(String(row.accountId), values);
    }
  }
  let currentCash = 0n, cashChange = 0n;
  for (const account of accounts) {
    const current = toMinorUnits(account.balance);
    if (["cash", "bank", "ewallet"].includes(account.kind)) currentCash += current;
    const changes = byAccount.get(String(account.id));
    if (!changes) continue;
    const card = account.kind === "credit_card";
    const change = card ? changes.expenses : changes.income - changes.expenses;
    const projected = current + change;
    const limit = account.credit_limit == null ? null : toMinorUnits(account.credit_limit);
    const reserved = card ? toMinorUnits(account.additional_reservation) : 0n;
    const insufficient = changes.expenses > 0n && (card ? limit == null || projected + reserved > limit : projected < 0n);
    totals.accounts.push({ ...account, ...changes, current, change, projected, limit, reserved, insufficient, card });
    if (!card && ["cash", "bank", "ewallet"].includes(account.kind)) cashChange += change;
  }
  totals.overallCash = { current: currentCash, change: cashChange, projected: currentCash + cashChange };
  return totals;
}

// A preview-only running ledger in displayed order. Never writes account balances.
export function runningBalances(rows, accounts) {
  const ledger = new Map(accounts.map((account) => [String(account.id), toMinorUnits(account.balance)]));
  const result = new Map();
  for (const row of rows) {
    if (row.errors.length || !row.amount || row.accountId == null) continue;
    const account = accounts.find((item) => String(item.id) === String(row.accountId));
    if (!account) continue;
    const card = account.kind === "credit_card";
    const before = ledger.get(String(account.id));
    const amount = toMinorUnits(row.amount);
    const after = before + (card || row.kind === "income" ? amount : -amount);
    ledger.set(String(account.id), after);
    const limit = card && account.credit_limit != null ? toMinorUnits(account.credit_limit) : null;
    const available = card && limit != null ? limit - after - toMinorUnits(account.additional_reservation) : after;
    const baseline = card ? limit : toMinorUnits(account.balance);
    const percent = baseline > 0n ? Number((available < 0n ? 0n : available > baseline ? baseline : available) * 100n / baseline) : null;
    result.set(row.id, { account, card, before, after, available, baseline, percent, hasLimit: limit != null });
  }
  return result;
}
