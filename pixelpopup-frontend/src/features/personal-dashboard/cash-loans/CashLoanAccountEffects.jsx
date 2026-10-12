import { Info } from "lucide-react";
import { toMinorUnits, formatMinorUnits } from "../quick-entry/money";

// Read-only, exact-cent projections against the currently loaded account balances.
export default function CashLoanAccountEffects({ card, debtChange = 0n, reservationChange = 0n, receiver, proceeds = 0n }) {
  if (!card) return null;
  const debt = toMinorUnits(card.balance) + debtChange;
  const available = card.credit_limit == null ? null : (card.available_credit != null ? toMinorUnits(card.available_credit) : toMinorUnits(card.credit_limit) - toMinorUnits(card.balance)) - debtChange - reservationChange;
  return <section aria-label="Projected account effects" className="space-y-3 rounded-md border border-[var(--pd-border)] bg-white p-3 text-sm">
    <p className="flex items-center gap-2 font-medium"><Info size={16} aria-hidden="true" />Account effects if saved</p>
    <dl className="space-y-2 tabular-nums">
      <div className="flex flex-wrap justify-between gap-2"><dt className="text-slate-600">{card.name} · posted debt</dt><dd>{formatMinorUnits(debt)}</dd></div>
      {available != null && <div className="flex flex-wrap justify-between gap-2"><dt className="text-slate-600">Available credit after reservations</dt><dd className={available < 0n ? "text-red-800" : "text-slate-950"}>{formatMinorUnits(available)}</dd></div>}
      {receiver && <div className="flex flex-wrap justify-between gap-2"><dt className="text-slate-600">{receiver.name} · receiving balance</dt><dd>{formatMinorUnits(toMinorUnits(receiver.balance) + proceeds)}</dd></div>}
    </dl>
    <p className="text-xs leading-5 text-slate-600">Estimates use your current balances. The server rechecks the action date and available funds before saving.</p>
  </section>;
}
