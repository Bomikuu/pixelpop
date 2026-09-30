import { AlertCircle, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { accountLabel, money } from "../lib/format";
import { choiceIcon, institutionFor } from "../lib/presets";

export function accountChoiceOption(account) {
  const debt = Number(account.balance || 0);
  const limit = account.credit_limit == null ? null : Number(account.credit_limit);
  return {
    value: String(account.id),
    account,
    label: accountLabel(account) + (account.active ? "" : " · Archived"),
    description: account.kind === "credit_card"
      ? limit == null
        ? "Credit limit not set"
        : money(Math.max(0, limit - debt)) + " available · " + money(limit) + " limit"
      : money(account.balance) + (account.kind === "fund" ? " recorded value" : " balance"),
    icon: choiceIcon(account.kind === "fund" ? account.fund_type : account.kind),
    logo: institutionFor(account.institution)?.logo,
  };
}

export function accountProjection(account, amount, direction = "out", existingAmount = 0) {
  if (!account) return null;
  const value = Number(amount);
  const current = Number(account.balance);
  if (!Number.isFinite(current) || !Number.isFinite(value) || value <= 0) return null;
  const change = value - Number(existingAmount || 0);
  if (account.kind === "credit_card") {
    if (direction === "out") {
      if (account.credit_limit == null) return { blocked: true, text: "Set this card's credit limit before paying." };
      const remaining = Number(account.credit_limit) - current - change;
      return remaining < -0.001
        ? { blocked: true, text: "Insufficient credit. This charge exceeds the card's limit." }
        : { blocked: false, text: "Projected available credit: " + money(remaining) };
    }
    const debt = current - change;
    return { blocked: false, text: "Projected card debt: " + money(debt) };
  }
  const projected = current + (direction === "out" ? -change : change);
  return projected < -0.001
    ? { blocked: true, text: "Insufficient balance. This payment would overdraw the account." }
    : { blocked: false, text: "Projected " + (account.kind === "fund" ? "recorded value" : "balance") + ": " + money(projected) };
}

export default function AccountBalancePreview({ id, account, amount, direction = "out", existingAmount = 0 }) {
  const projection = accountProjection(account, amount, direction, existingAmount);
  if (!account) return null;
  const missingLimit = account.kind === "credit_card" && direction === "out" && account.credit_limit == null;
  if (!projection && !missingLimit) return null;
  const blocked = projection?.blocked || missingLimit;
  const Icon = blocked ? AlertCircle : direction === "out" ? ArrowUpRight : ArrowDownRight;
  return (
    <p id={id} role="status" className={"mt-2 flex items-start gap-1.5 text-sm tabular-nums " + (blocked ? "text-red-800" : "text-slate-700")}>
      <Icon size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>{projection?.text || "Set this card's credit limit before paying."}</span>
    </p>
  );
}
