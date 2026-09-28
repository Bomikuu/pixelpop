import { Clock, History } from "lucide-react";
import { money, dateLabel } from "../../lib/format";
import { initials } from "../../lib/sharedBills";

export default function PersonPaymentSummary({ bill, person }) {
  if (!person) return null;
  const history = bill.payments.filter(
    (payment) =>
      payment.payer_id === person.id ||
      (payment.paid_to_id === person.id && payment.kind !== "contribution"),
  );
  const pending = history.filter((payment) => payment.status === "pending");
  return (
    <section
      aria-label={person.name + " payment history"}
      className="space-y-3 rounded-lg border bg-slate-50 p-4"
    >
      <p className="flex items-center gap-2 text-sm font-medium">
        <span
          aria-hidden="true"
          className="grid size-8 shrink-0 place-items-center rounded-full border bg-white text-xs font-semibold"
        >
          {initials(person.name)}
        </span>
        {person.name}’s contribution
      </p>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Agreed share", person.share],
          ["Net paid already", person.paid],
          [
            person.covered_by_group ? "Covered by volunteers" : "Still to pay",
            person.remaining,
          ],
          [
            bill.receiver_id ? "Refund owed" : "Reimbursement balance",
            person.refund_due || 0,
          ],
        ].map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-xs text-slate-600">{label}</dt>
            <dd className="mt-1 break-words text-sm font-semibold tabular-nums">
              {money(value)}
            </dd>
          </div>
        ))}
      </dl>
      {pending.length > 0 && (
        <p className="flex items-center gap-2 text-xs text-amber-800">
          <Clock size={14} aria-hidden="true" />
          {pending.length} pending {pending.length === 1 ? "report" : "reports"}
          —not included in paid amounts.
        </p>
      )}
      {history.length > 0 ? (
        <details className="border-t pt-3 text-xs">
          <summary className="cursor-pointer font-medium text-slate-700 hover:text-[var(--pd-primary)] focus-visible:outline-2 focus-visible:outline-[var(--pd-primary)]">
            View payment history ({history.length})
          </summary>
          <ul className="mt-2 max-h-40 divide-y overflow-y-auto">
            {history.map((payment) => (
              <li
                key={payment.id}
                className="flex flex-wrap justify-between gap-2 py-2"
              >
                <span>
                  {payment.kind === "refund" ? "Refund" : "Payment"} ·{" "}
                  {dateLabel(payment.date)}
                  <span className="block text-slate-600">
                    {payment.payer_name} → {payment.paid_to_name} ·{" "}
                    {payment.status}
                  </span>
                </span>
                <strong className="tabular-nums">
                  {money(payment.amount)}
                </strong>
              </li>
            ))}
          </ul>
        </details>
      ) : (
        <p className="flex items-center gap-2 text-xs text-slate-600">
          <History size={14} aria-hidden="true" />
          No payment history yet.
        </p>
      )}
      <p className="text-xs text-slate-600">
        You can still submit another payment. Excess is refundable after
        confirmation unless management records that it was waived.
      </p>
    </section>
  );
}
