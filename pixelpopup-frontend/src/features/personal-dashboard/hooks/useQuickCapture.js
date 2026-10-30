import { useRef, useState } from "react";
import { decimalAmount, toMinorUnits } from "../quick-entry/money";

export function captureAmount(value) {
  const text = value.trim();
  if (!/^(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?$/.test(text)) {
    throw new Error("Enter an amount with up to two decimal places.");
  }
  const cents = toMinorUnits(text.replaceAll(",", ""));
  if (cents <= 0n || cents > 99999999999999n) {
    throw new Error("Use an amount greater than zero and no more than ₱999,999,999,999.99.");
  }
  return decimalAmount(cents);
}

function errorMessages(value) {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(errorMessages);
  return value && typeof value === "object" ? Object.values(value).flatMap(errorMessages) : [];
}

// Keep the same request identity and payload until an uncertain save is resolved.
export default function useQuickCapture({ request, onSaved }) {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const frozen = useRef(null);
  const busy = useRef(false);
  const uncertain = useRef(false);

  async function save(entry) {
    if (busy.current) return;
    const payload = frozen.current || { transactions: [{ ...entry, request_id: crypto.randomUUID() }] };
    frozen.current = payload;
    busy.current = true;
    setStatus("saving");
    setError("");
    let result;
    try {
      result = await request("transactions/quick-entry/", { method: "POST", body: payload });
    } catch (failure) {
      const rows = failure.fields?.transactions;
      const conflict = Object.values(rows || {}).some((fields) => fields?.request_id);
      if (failure.status >= 400 && failure.status < 500 && ![408, 429].includes(failure.status) && !uncertain.current && !conflict) {
        frozen.current = null;
        setStatus("idle");
        const details = errorMessages(rows?.[payload.transactions[0].request_id]);
        setError([failure.message, ...details].filter(Boolean).join(" "));
      } else {
        uncertain.current = true;
        setStatus("uncertain");
        setError("This entry may already be saved. Confirm the same entry before editing or closing to avoid saving it twice.");
      }
      return;
    } finally {
      busy.current = false;
    }
    frozen.current = null;
    uncertain.current = false;
    setStatus("idle");
    onSaved(result, payload.transactions[0]);
  }

  return { status, error, save, locked: status !== "idle", clearError: () => setError("") };
}
