import { Store } from "lucide-react";
import PersonAvatar from "../PersonAvatar";

export default function PaymentReceiver({ bill, stacked = false, className = "mt-3" }) {
  const receiver = bill.participants?.find((person) => person.id === bill.receiver_id);
  return (
    <p className={`flex items-center gap-2 text-sm text-slate-600 ${className}`}>
      {bill.receiver_name ? (
        <PersonAvatar src={receiver?.avatar_url} name={bill.receiver_name} className="size-9 text-xs" />
      ) : (
      <span
        aria-hidden="true"
        className="grid size-8 shrink-0 place-items-center rounded-full border bg-slate-50 text-xs font-semibold text-slate-700"
      >
        <Store size={16} />
      </span>
      )}
      <span className="min-w-0">
        <span className={stacked ? "block text-xs" : ""}>Payments go to</span>{" "}
        <strong className={`break-words text-slate-900 ${stacked ? "block font-medium" : ""}`}>
          {bill.receiver_name || "the bill provider"}
        </strong>
      </span>
    </p>
  );
}
