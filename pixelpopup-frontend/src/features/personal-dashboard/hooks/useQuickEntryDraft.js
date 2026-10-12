import { useEffect, useRef, useState } from "react";
import { parseQuickEntry } from "../quick-entry/model";
import { projectBalances } from "../quick-entry/money";
import { today } from "../lib/format";

export function useQuickEntryDraft({ accounts, categories, date, request, onSaved }) {
  const [source, setSource] = useState("");
  const [rows, setRows] = useState([]);
  const [revealed, setRevealed] = useState(false);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [serverErrors, setServerErrors] = useState({});
  const rowsRef = useRef([]), frozen = useRef(null), saving = useRef(false), uncertain = useRef(false);
  const locked = status === "saving" || status === "uncertain";
  function replaceRows(next) { rowsRef.current = next; setRows(next); }
  function flush(text = source) {
    const next = parseQuickEntry(text, rowsRef.current, { accounts, categories });
    replaceRows(next);
    return next;
  }
  useEffect(() => {
    if (locked) return;
    flush();
  }, [accounts, categories, locked]);
  useEffect(() => {
    if (!source.trim()) return;
    const beforeUnload = (event) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [source]);
  function changeSource(value) {
    if (locked) return;
    setError(""); setServerErrors({}); setSource(value);
    flush(value);
    if (!value.trim()) setRevealed(false);
    else if (value.includes("\n")) setRevealed(true);
  }
  function setChoice(id, field, value) {
    if (locked) return;
    const manual = field === "date" ? "dateManual" : field === "accountId" ? "accountManual" : "categoryManual";
    const next = rowsRef.current.map((row) => row.id === id ? { ...row, [field]: value, [manual]: true } : row);
    replaceRows(next); flush(); setServerErrors({}); setError("");
  }
  function resetChoice(id, field) {
    if (locked) return;
    replaceRows(rowsRef.current.map((row) => row.id === id ? { ...row, [field === "accountId" ? "accountManual" : "categoryManual"]: false } : row));
    flush(); setServerErrors({}); setError("");
  }
  function editLine(id, raw) {
    if (locked) return;
    const row = rowsRef.current.find((item) => item.id === id);
    const lines = source.split("\n");
    lines[row.lineNumber - 1] = raw;
    const text = lines.join("\n");
    changeSource(text); flush(text);
  }
  function remove(id) {
    if (locked) return;
    const row = rowsRef.current.find((item) => item.id === id);
    const text = source.split("\n").filter((_, i) => i !== row.lineNumber - 1).join("\n");
    replaceRows(rowsRef.current.filter((item) => item.id !== id));
    changeSource(text); flush(text);
  }
  async function save() {
    if (saving.current) return;
    let payload = frozen.current;
    if (!payload) {
      const current = flush(); setRevealed(true);
      if (!current.length || current.some((row) => row.errors.length || !/^\d{4}-\d{2}-\d{2}$/.test(row.date || date) || (row.date || date) > today()) || projectBalances(current, accounts).accounts.some((a) => a.insufficient)) {
        setError("Correct the entries and account balances before saving."); return;
      }
      payload = { transactions: current.map((row) => ({ request_id: row.requestId, kind: row.kind, amount: row.amount, name: row.name, date: row.date || date, category: row.categoryId, account: row.accountId })) };
      frozen.current = payload;
    }
    saving.current = true; setStatus("saving"); setError("");
    try {
      const result = await request("transactions/quick-entry/", { method: "POST", body: payload });
      frozen.current = null; uncertain.current = false; setSource(""); replaceRows([]); setServerErrors({}); setRevealed(false); setStatus("idle");
      onSaved(result);
    } catch (failure) {
      const identifierConflict = Object.values(failure.fields?.transactions || {}).some((fields) => fields?.request_id);
      if (failure.status && failure.status < 500 && ![408, 429].includes(failure.status) && !uncertain.current && !identifierConflict) {
        frozen.current = null;
        replaceRows(rowsRef.current.map((row) => ({ ...row, requestId: crypto.randomUUID() })));
        setStatus("idle");
        // Keep errors keyed to the displayed row even after allocating fresh retry IDs.
        const errorsByRow = Object.fromEntries(rowsRef.current.map((row, i) => [row.id, failure.fields?.transactions?.[payload.transactions[i]?.request_id]]));
        setServerErrors(errorsByRow);
        setError(failure.message);
      } else {
        uncertain.current = true;
        setStatus("uncertain");
        setError("The save may have completed. Retry this exact batch to confirm it; entries are locked to prevent duplicates.");
      }
    } finally { saving.current = false; }
  }
  return { source, rows, revealed, status, error, serverErrors, locked, changeSource, setChoice, resetChoice, editLine, remove, save,
    reveal: () => { flush(); setRevealed(true); } };
}
