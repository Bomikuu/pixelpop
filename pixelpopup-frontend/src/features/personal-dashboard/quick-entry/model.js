import { decimalAmount, toMinorUnits } from "./money";
import { transactionMerchants } from "../lib/transactionMerchants";

// Order breaks equal-length matches; longer whole phrases always win.
const expenseKeywords = [
  ["Groceries", ["sm supermarket", "supermarket", "puregold", "groceries", "grocery"]],
  ["Bills", ["water bill", "electricity", "meralco", "internet", "rent", "water"]],
  ["Subscriptions", ["chatgpt", "netflix", "spotify", "subscription"]],
  ["Food", [...transactionMerchants.filter((merchant) => merchant.category === "Food").flatMap((merchant) => merchant.aliases), "coffee", "restaurant", "chowking", "kfc", "burger", "pizza", "dinner", "lunch"]],
  ["Transportation", ["gasoline", "transport", "jeepney", "grab", "taxi", "fuel", "bus"]],
  ["Entertainment", ["movie", "cinema", "gaming", "concert"]],
  ["Health", ["medicine", "pharmacy", "doctor", "hospital"]],
  ["Shopping", ["shopping", "lazada", "shopee"]],
  ["Education", ["tuition", "course", "books"]],
  ["Family", ["mother", "father", "family"]],
];
const incomeKeywords = [
  ["Income", ["income", "salary", "freelance", "payment received", "earnings"]],
  ["Work", ["salary", "freelance", "client payment", "work", "income"]],
  ["Other", ["gift", "refund"]],
];
const aliases = { bpi: ["bank of the philippine islands"], bdo: ["banco de oro"], gcash: ["g cash"], maya: ["paymaya"], gotyme: ["go tyme"] };
export const normalize = (value) => String(value).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " ");
const contains = (text, phrase) => phrase && (` ${text} `).includes(` ${phrase} `);
const newIdentity = () => ({ id: crypto.randomUUID(), requestId: crypto.randomUUID() });

export function eligibleAccounts(accounts, kind) {
  return accounts.filter((a) => a.active && a.kind !== "fund" && !(kind === "income" && a.kind === "credit_card"));
}

function detectCategory(text, kind, categories) {
  const available = new Map(categories.map((c) => [normalize(c.name), c.id]));
  const matches = [];
  for (const [name, keywords] of kind === "income" ? incomeKeywords : expenseKeywords) {
    if (!available.has(normalize(name))) continue;
    for (const keyword of [...keywords, name]) if (contains(text, normalize(keyword))) matches.push({ id: available.get(normalize(name)), length: keyword.length });
  }
  matches.sort((a, b) => b.length - a.length);
  return matches[0]?.id ?? available.get("other") ?? available.get("others") ?? null;
}

function detectAccount(text, kind, accounts) {
  const eligible = eligibleAccounts(accounts, kind);
  const names = eligible.filter((a) => contains(text, normalize(a.name)));
  if (names.length) {
    const longest = Math.max(...names.map((a) => normalize(a.name).length));
    const best = names.filter((a) => normalize(a.name).length === longest);
    return { id: best.length === 1 ? best[0].id : null, ambiguous: best.length > 1 };
  }
  const institutions = eligible.filter((a) => {
    const institution = normalize(a.institution);
    return contains(text, institution) || Object.entries(aliases).some(([key, options]) =>
      [key, ...options].includes(institution) && [key, ...options].some((name) => contains(text, normalize(name))));
  });
  return { id: institutions.length === 1 ? institutions[0].id : null, ambiguous: institutions.length > 1 };
}

function parseLine(raw, identity, lineNumber, accounts, categories) {
  const row = { ...identity, raw, lineNumber, errors: [], hints: [] };
  const match = raw.trim().replace(/^−/, "-").match(/^([+-])\s*((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?)(?:\s+(.*))?$/u);
  if (!match) return { ...row, kind: raw.trim().startsWith("+") ? "income" : "expense", amount: null, name: "", errors: ["Start with + or − and a valid amount, e.g. -1,500.50 groceries."] };
  const kind = match[1] === "+" ? "income" : "expense";
  const amount = toMinorUnits(match[2].replaceAll(",", ""));
  if (amount === 0n || amount > 99999999999999n) row.errors.push("Use an amount greater than zero and no more than ₱999,999,999,999.99.");
  const name = (match[3] || "").trim() || (kind === "income" ? "Income" : "Expense");
  if (name.length > 160) row.errors.push("Keep the description to 160 characters.");
  const text = normalize(match[3] || "");
  const detected = detectAccount(text, kind, accounts);
  const accountId = identity.accountManual ? identity.accountId : detected.id;
  if (accountId != null && !eligibleAccounts(accounts, kind).some((a) => String(a.id) === String(accountId))) row.errors.push("Choose an eligible account for this transaction.");
  if (!identity.accountManual && detected.ambiguous) row.hints.push("More than one account matches. Choose the correct account or settle later.");
  return { ...row, kind, amount: decimalAmount(amount), name, accountId,
    categoryId: identity.categoryManual ? identity.categoryId : detectCategory(text, kind, categories) };
}

export function parseQuickEntry(source, previousRows = [], { accounts = [], categories = [] } = {}) {
  const lines = source.split("\n").map((raw, index) => ({ raw, lineNumber: index + 1 })).filter((line) => line.raw.trim());
  const identities = Array(lines.length).fill(null), used = new Set();
  let prefix = 0;
  while (prefix < lines.length && prefix < previousRows.length && lines[prefix].raw === previousRows[prefix].raw) {
    identities[prefix] = previousRows[prefix]; used.add(prefix++);
  }
  let next = lines.length - 1, old = previousRows.length - 1;
  while (next >= prefix && old >= prefix && lines[next].raw === previousRows[old].raw) {
    identities[next--] = previousRows[old]; used.add(old--);
  }
  const queues = new Map();
  previousRows.forEach((row, index) => { if (!used.has(index)) queues.set(row.raw, [...(queues.get(row.raw) || []), index]); });
  lines.forEach((line, index) => {
    if (identities[index]) return;
    const original = queues.get(line.raw)?.shift();
    if (original != null) { identities[index] = previousRows[original]; used.add(original); }
  });
  const unmatched = previousRows.filter((_, index) => !used.has(index));
  const remaining = identities.filter((value) => !value).length;
  let cursor = 0;
  return lines.map((line, index) => parseLine(line.raw,
    identities[index] || (unmatched.length === remaining ? unmatched[cursor++] : newIdentity()), line.lineNumber, accounts, categories));
}
