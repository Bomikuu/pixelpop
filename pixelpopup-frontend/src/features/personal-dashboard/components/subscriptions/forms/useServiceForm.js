import { useRef, useState } from "react";

export default function useServiceForm({ initial, dashboard, path, onSaved, notify, expectedRevision, message = "Service updated." }) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState(false);
  const lock = useRef(false);
  const operation = useRef({ signature: "", key: "" });
  const initialJson = useRef(JSON.stringify(initial));
  const set = (name, value) => { setValues((old) => ({ ...old, [name]: value })); setErrors((old) => ({ ...old, [name]: "" })); };
  const submit = (prepare, required = []) => async (event) => {
    event.preventDefault();
    if (lock.current) return;
    const missing = Object.fromEntries(required.filter((key) => values[key] === "" || values[key] == null).map((key) => [key, "This field is required."]));
    setErrors(missing);
    const formElement = event.currentTarget;
    if (Object.keys(missing).length) { requestAnimationFrame(() => formElement.querySelector('[aria-invalid="true"]')?.focus()); return; }
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const body = prepare(values);
      if (path === "subscriptions/") body.request_id = true;
      if (expectedRevision != null) body.expected_revision = expectedRevision;
      const signature = JSON.stringify(body);
      if (operation.current.signature !== signature) operation.current = { signature, key: crypto.randomUUID() };
      if (body.request_id === true) body.request_id = operation.current.key;
      await dashboard.mutate(path, body);
      notify?.(message, { action: "edited", entity: "bill" });
      onSaved?.();
    } catch (problem) {
      const fields = problem.fields || {};
      setErrors(Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, Array.isArray(value) ? value.join(" ") : typeof value === "string" ? value : JSON.stringify(value)])));
      const messages = Object.entries(fields).filter(([key]) => key !== "detail").slice(0, 3).map(([key, value]) => `${key.replaceAll("_", " ")}: ${Array.isArray(value) ? value.join(" ") : typeof value === "string" ? value : JSON.stringify(value)}`);
      setError(messages.length ? messages.join(" · ") : problem.message || "Unable to save. Review the values and try again.");
      setConflict(problem.status === 409);
      requestAnimationFrame(() => formElement.querySelector('[aria-invalid="true"]')?.focus());
    } finally { lock.current = false; setBusy(false); }
  };
  const refreshSaved = async () => {
    try { await navigator.clipboard.writeText(JSON.stringify(values, null, 2)); dashboard.refresh(); setError("Your draft was copied and saved data refreshed. Cancel and reopen this form to review the latest record before reapplying your changes."); }
    catch { setError("Your draft is preserved here. Copy your values, cancel and reopen the form to review the changed record."); }
  };
  return { values, set, submit, errors, error, busy, conflict, refreshSaved, dirty: JSON.stringify(values) !== initialJson.current };
}
