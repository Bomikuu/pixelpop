import { useRef, useState } from "react";
import { requestId } from "../lib/format";

export const cashLoanApi = (request) => ({
  quote: (terms, signal) => request("cash-loans/quote/", { method: "POST", body: terms, signal }),
  compare: (terms, months, signal) => request("cash-loans/compare/", { method: "POST", body: { ...terms, months }, signal }),
});

export function fieldMessage(value) {
  if (!value) return "";
  return typeof value === "object" ? Object.values(value).map(fieldMessage).join(" ") : String(value);
}

// Freeze an uncertain write so retry cannot change its meaning or duplicate a payment.
export function useLoanWrite(request, onSaved) {
  const attempt = useRef(null);
  const inFlight = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState({});
  const [uncertain, setUncertain] = useState(false);
  const save = async (path, body, method = "POST") => {
    if (inFlight.current) return;
    inFlight.current = true;
    const pending = attempt.current || { path, body: { ...body, ...(method === "POST" ? { request_id: requestId() } : {}) }, method };
    attempt.current = pending;
    setBusy(true); setError(""); setFields({});
    let saved;
    try {
      saved = await request(pending.path, { method: pending.method, body: pending.body });
      attempt.current = null; setUncertain(false);
    } catch (failure) {
      setFields(failure.fields || {});
      setError(fieldMessage(failure.fields) || failure.message);
      const ambiguous = !failure.status || failure.status >= 500;
      setUncertain(ambiguous);
      if (!ambiguous) attempt.current = null;
    } finally { inFlight.current = false; setBusy(false); }
    if (saved !== undefined) onSaved(saved);
  };
  const close = (onClose) => {
    if (inFlight.current) return;
    if (attempt.current && uncertain) {
      setError("The previous save may have succeeded. Retry the same action before closing so it cannot be duplicated.");
      return;
    }
    onClose();
  };
  return { save, close, busy, error, fields, uncertain, locked: busy || uncertain };
}
