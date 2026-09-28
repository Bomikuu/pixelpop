import { Store } from "lucide-react";
import { initials } from "../../lib/sharedBills";

export default function PaymentReceiver({ bill }) {
  return (
    <p className="mt-3 flex items-center gap-2 text-sm text-slate-600">
      <span
        aria-hidden="true"
        className="grid size-8 shrink-0 place-items-center rounded-full border bg-slate-50 text-xs font-semibold text-slate-700"
      >
        {bill.receiver_name ? (
          initials(bill.receiver_name)
        ) : (
          <Store size={16} />
        )}
      </span>
      <span>
        Payments go to{" "}
        <strong className="text-slate-900">
          {bill.receiver_name || "the bill provider"}
        </strong>
      </span>
    </p>
  );
}
