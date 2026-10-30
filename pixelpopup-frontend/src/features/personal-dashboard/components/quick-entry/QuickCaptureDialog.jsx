import { useEffect, useRef, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, CirclePlus, FileText, LoaderCircle, RefreshCw, TriangleAlert, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../ui/alert-dialog";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import DeferredDashboardDialog from "../DeferredDashboardDialog";
import useQuickCapture, { captureAmount } from "../../hooks/useQuickCapture";
import { today } from "../../lib/format";
import DailySpendingGuide from "./DailySpendingGuide";
import QuickCaptureCategories from "./QuickCaptureCategories";
import "./quickCapture.css";

const loadFullQuickEntry = () => import("./QuickEntryDialog");

export default function QuickCaptureDialog({ open, onOpenChange, dashboard, notify, restoreFocus }) {
  const [full, setFull] = useState(false);
  const [kind, setKind] = useState("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState(null);
  const [note, setNote] = useState("");
  const [amountError, setAmountError] = useState("");
  const [exitTarget, setExitTarget] = useState(null);
  const amountInput = useRef(null);
  const errorMessage = useRef(null);
  const openingFull = useRef(false);
  const date = today();
  const dirty = Boolean(amount.trim() || note.trim() || categoryId != null);
  const capture = useQuickCapture({ request: dashboard.request, onSaved: (_result, entry) => {
    dashboard.refresh();
    notify(`${entry.kind === "income" ? "Income" : "Expense"} saved. Assign an account in Entry review.`, { entity: entry.kind, action: "added" });
    onOpenChange(false);
  } });
  let parsedAmount = null;
  try { parsedAmount = captureAmount(amount); } catch { /* Partial input is validated on save. */ }
  const preview = parsedAmount ? [{ kind, amount: parsedAmount, date, errors: [] }] : [];

  useEffect(() => {
    if (!dirty || full) return;
    const beforeUnload = (event) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty, full]);
  useEffect(() => { if (capture.error) errorMessage.current?.focus(); }, [capture.error]);

  function leave(target) {
    if (capture.locked) return;
    if (dirty) { setExitTarget(target); return; }
    finishLeaving(target);
  }
  function finishLeaving(target) {
    setExitTarget(null);
    if (target === "full") { openingFull.current = true; setFull(true); }
    else onOpenChange(false);
  }
  function changeKind(next) {
    if (capture.locked) return;
    setKind(next);
    setCategoryId(null);
    capture.clearError();
  }
  function submit(event) {
    event.preventDefault();
    if (capture.status === "uncertain") { capture.save(); return; }
    if (capture.locked) return;
    let value;
    try { value = captureAmount(amount); }
    catch (failure) { setAmountError(failure.message); amountInput.current?.focus(); return; }
    const category = dashboard.data.categories.find((item) => item.id === categoryId);
    capture.save({ kind, amount: value, date: today(), category: categoryId, account: null, name: note.trim() || category?.name || (kind === "income" ? "Income" : "Expense") });
  }

  if (full) return <DeferredDashboardDialog load={loadFullQuickEntry} title="Full Quick Entry" description="Preparing the multi-entry form." onClose={() => onOpenChange(false)} restoreFocus={(event) => { event.preventDefault(); restoreFocus?.(); }} dialogProps={{ open, onOpenChange, dashboard, notify, restoreFocus }} />;

  return <>
    <Dialog open={open} onOpenChange={(next) => { if (!next) leave("close"); }}>
      <DialogContent className="personal-dashboard quick-capture-dialog" showCloseButton={false} onInteractOutside={(event) => event.preventDefault()} onOpenAutoFocus={(event) => { event.preventDefault(); amountInput.current?.focus(); }} onCloseAutoFocus={(event) => { event.preventDefault(); if (!openingFull.current) restoreFocus?.(); }}>
        <div className="capture-handle" aria-hidden="true" />
        <Button type="button" variant="ghost" size="icon" className="capture-close" aria-label="Close Quick Entry" disabled={capture.locked} onClick={() => leave("close")}><X size={21} aria-hidden="true" /></Button>
        <DialogHeader className="capture-header">
          <DialogTitle>Quick Entry</DialogTitle>
          <DialogDescription>Add an expense or income for today.</DialogDescription>
          <img className="capture-artwork" src="/workspace-assets/smokey-quick-entry-v1.webp" width="264" height="320" alt="" aria-hidden="true" decoding="async" />
          <div className="capture-kind" role="group" aria-label="Transaction type">
            {[{ key: "expense", label: "Expense", Icon: ArrowUpRight }, { key: "income", label: "Income", Icon: ArrowDownLeft }].map(({ key, label, Icon }) => <button key={key} type="button" data-kind={key} aria-pressed={kind === key} disabled={capture.locked} onClick={() => changeKind(key)}><Icon size={19} aria-hidden="true" /><span>{label}</span></button>)}
          </div>
        </DialogHeader>
        <form className="capture-form" onSubmit={submit} noValidate>
          <div className="capture-scroll">
            <fieldset disabled={capture.locked}>
              <legend className="sr-only">Transaction details</legend>
              <div className="capture-amount">
                <span aria-hidden="true">₱</span><label className="sr-only" htmlFor="quick-capture-amount">Amount in Philippine pesos</label>
                <input ref={amountInput} id="quick-capture-amount" type="text" inputMode="decimal" autoComplete="off" placeholder="0" maxLength={20} value={amount} aria-invalid={Boolean(amountError) || undefined} aria-describedby={amountError ? "quick-capture-amount-error" : undefined} onChange={(event) => { setAmount(event.target.value); setAmountError(""); capture.clearError(); }} />
                {amount && <button type="button" aria-label="Clear amount" onClick={(event) => { event.preventDefault(); setAmount(""); setAmountError(""); capture.clearError(); amountInput.current?.focus(); }}><X size={19} aria-hidden="true" /></button>}
              </div>
              {amountError && <p id="quick-capture-amount-error" className="capture-error" role="alert">{amountError}</p>}
              <DailySpendingGuide compact dashboard={dashboard} rows={preview} date={date} status={capture.status} />
              <QuickCaptureCategories categories={dashboard.data.categories} kind={kind} value={categoryId} disabled={capture.locked} onChange={(value) => { setCategoryId(value); capture.clearError(); }} />
              <label className="capture-note" htmlFor="quick-capture-note"><FileText size={21} aria-hidden="true" /><span className="sr-only">Note (optional)</span><Input id="quick-capture-note" value={note} maxLength={160} placeholder="Add a note (optional)" autoComplete="off" onChange={(event) => { setNote(event.target.value); capture.clearError(); }} /></label>
            </fieldset>
            {capture.error && <p ref={errorMessage} tabIndex={-1} role="alert" className="capture-error"><TriangleAlert size={18} aria-hidden="true" />{capture.error}</p>}
            <p className="capture-account-note">Saved without an account. Assign one in Entry review.</p>
          </div>
          <footer className="capture-footer">
            <Button type="submit" className="capture-save" disabled={capture.status === "saving"} aria-busy={capture.status === "saving"}>{capture.status === "saving" ? <LoaderCircle size={21} className="motion-safe:animate-spin" aria-hidden="true" /> : capture.status === "uncertain" ? <RefreshCw size={21} aria-hidden="true" /> : <CirclePlus size={21} aria-hidden="true" />}{capture.status === "saving" ? "Saving…" : capture.status === "uncertain" ? "Confirm saved entry" : `Save ${kind}`}</Button>
            <button type="button" className="capture-full" disabled={capture.locked} onClick={() => leave("full")}>Full Quick Entry<span className="sr-only">: multiple entries, dates and accounts</span></button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
    <AlertDialog open={Boolean(exitTarget)} onOpenChange={(next) => { if (!next) setExitTarget(null); }}>
      <AlertDialogContent className="personal-dashboard" onCloseAutoFocus={(event) => { event.preventDefault(); if (!openingFull.current) amountInput.current?.focus(); }}>
        <AlertDialogHeader><AlertDialogTitle>{exitTarget === "full" ? "Open Full Quick Entry?" : "Discard this entry?"}</AlertDialogTitle><AlertDialogDescription>{exitTarget === "full" ? "Your current draft will not carry over to the multi-entry form. Discard it and continue?" : "This entry has not been saved. Keep editing or discard the draft."}</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Keep editing</AlertDialogCancel><AlertDialogAction onClick={() => finishLeaving(exitTarget)}>{exitTarget === "full" ? "Discard & open full form" : "Discard draft"}</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>;
}
