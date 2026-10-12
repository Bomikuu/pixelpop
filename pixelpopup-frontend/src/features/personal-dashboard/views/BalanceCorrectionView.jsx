import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, CircleCheck, Info, RefreshCw, Save, ShieldCheck, TriangleAlert } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { EmptyState, Panel } from "../components/Panel";
import AccountCardFace from "../components/AccountCardFace";
import MoneyFlowAmount from "../components/MoneyFlowAmount";
import FormModalShell from "../components/forms/FormModalShell";
import { decimalAmount, formatMinorUnits, toMinorUnits } from "../quick-entry/money";
import { dateLabel, today } from "../lib/format";

const editableAccounts = (rows) => rows.filter((account) => account.active && ["cash", "bank", "ewallet", "credit_card"].includes(account.kind));

function correction(account, value) {
  if (!String(value ?? "").trim()) return null;
  try {
    const target = toMinorUnits(value);
    const current = toMinorUnits(account.balance);
    const change = target - current;
    if (target <= -100000000000000n || target >= 100000000000000n || change <= -100000000000000n || change >= 100000000000000n)
      return { error: "Use an amount smaller than ₱1 trillion." };
    if (change === 0n) return null;
    const debt = account.kind === "credit_card" && change < 0n;
    return { account, current, target, change, debt, kind: account.kind === "credit_card" || change < 0n ? "expense" : "income", label: debt ? "Unknown debt correction" : account.kind === "credit_card" || change < 0n ? "Unknown expense" : "Unknown income" };
  } catch {
    return { error: "Enter numbers with at most two decimal places." };
  }
}

export default function BalanceCorrectionView({ dashboard, notify }) {
  const [accounts, setAccounts] = useState(() => editableAccounts(dashboard.data.accounts));
  const [drafts, setDrafts] = useState({});
  const [verify, setVerify] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [reloadOpen, setReloadOpen] = useState(false);
  const attempt = useRef(null);
  const inFlight = useRef(false);
  const saveTrigger = useRef(null);
  const results = accounts.map((account) => correction(account, drafts[account.id]));
  const changes = results.filter((item) => item && !item.error);
  const invalid = results.some((item) => item?.error);
  useEffect(() => {
    const warn = (event) => { if (changes.length || invalid || uncertain) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [changes.length, invalid, uncertain]);

  async function refresh() {
    if (inFlight.current) return;
    setRefreshing(true);
    setError("");
    try {
      const response = await dashboard.request("accounts/?page_size=100");
      setAccounts(editableAccounts(response.results));
      setDrafts({});
      setSaved("");
      setUncertain(false);
      attempt.current = null;
    } catch (failure) { setError(failure.message); }
    finally { setRefreshing(false); }
  }

  async function save(event) {
    event.preventDefault();
    if (inFlight.current || invalid || !changes.length) return;
    if (!password) { setPasswordError("Enter your Django password to save these corrections."); return; }
    if (!attempt.current) attempt.current = {
      request_id: crypto.randomUUID(),
      corrections: changes.map((row) => ({ account_id: row.account.id, expected_balance: decimalAmount(row.current), corrected_balance: decimalAmount(row.target) })),
    };
    inFlight.current = true;
    setBusy(true);
    setError("");
    setPasswordError("");
    try {
      const response = await dashboard.mutate("accounts/reconcile-balances/", { ...attempt.current, password });
      const corrected = new Map(attempt.current.corrections.map((row) => [row.account_id, row.corrected_balance]));
      setAccounts((rows) => rows.map((account) => corrected.has(account.id) ? { ...account, balance: corrected.get(account.id) } : account));
      setDrafts({});
      setUncertain(false);
      attempt.current = null;
      setVerify(false);
      const message = `${response.saved_count} balance${response.saved_count === 1 ? "" : "s"} corrected${response.replayed ? " (already saved)" : ""}.`;
      setSaved(message);
      notify(message, { entity: "account", action: "corrected" });
    } catch (failure) {
      if (failure.fields?.password) setPasswordError([failure.fields.password].flat().join(" "));
      else setError(failure.message);
      // Keep the same batch identity after failure, including a wrong password on
      // an uncertain retry. Editing an unlocked amount explicitly starts a new batch.
      if (!failure.status || failure.status >= 500) setUncertain(true);
    } finally { setPassword(""); setBusy(false); inFlight.current = false; }
  }

  return <div className="space-y-4">
    <Button asChild variant="ghost"><Link to="/dashboard/settings"><ArrowLeft aria-hidden="true" />Back to Settings</Link></Button>
    <Panel title="Correct account balances" description="Enter the actual balance or card debt. Leave unchanged accounts blank." action={<Button type="button" variant="outline" disabled={busy || refreshing} onClick={() => changes.length || invalid || uncertain ? setReloadOpen(true) : refresh()}><RefreshCw className="size-4" aria-hidden="true" />{refreshing ? "Refreshing…" : "Refresh balances"}</Button>}>
      <p className="mb-4 flex items-start gap-2 text-sm leading-6 text-slate-600"><Info className="mt-1 size-4 shrink-0" aria-hidden="true" />Differences are recorded today, {dateLabel(today())}, as Unknown income/expense. A decrease in card debt is a correction—not a payment from another account. Past entries stay unchanged.</p>
      {saved && <p role="status" className="mb-4 flex gap-2 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800"><CircleCheck className="size-4 shrink-0" aria-hidden="true" />{saved}</p>}
      {error && !verify && <p role="alert" className="mb-4 flex gap-2 rounded-md bg-red-50 p-3 text-sm text-red-900"><TriangleAlert className="size-4 shrink-0" aria-hidden="true" />{error}</p>}
      {uncertain && <div role="status" className="mb-4 flex items-start gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-900"><Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><div><p>The response was interrupted. Your corrections may already be saved. Retry the same batch safely, or reload the saved balances before making other changes.</p><Button type="button" variant="outline" className="mt-2" disabled={busy || refreshing} onClick={refresh}><RefreshCw className="size-4" aria-hidden="true" />Reload saved balances</Button></div></div>}
      {!accounts.length ? <EmptyState title="No active accounts" message="Add a cash, bank, e-wallet or credit-card account first." /> : <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {accounts.map((account, index) => {
          const row = results[index];
          const label = account.kind === "credit_card" ? "Amount owed" : "Balance";
          return <section key={account.id} className="min-w-0 space-y-3 rounded-lg border border-[var(--pd-border)] bg-white p-4 transition-colors hover:border-blue-300 motion-reduce:transition-none">
            <AccountCardFace account={account} align="left" size="small" />
            <h3 className="break-words text-sm font-semibold text-slate-950">{account.name}</h3>
            <div><p className="text-xs text-slate-600">Current {label.toLowerCase()}</p><p className="mt-1 break-words text-lg font-medium tabular-nums">{formatMinorUnits(toMinorUnits(account.balance))}</p></div>
            <div className="space-y-2"><Label htmlFor={`correct-${account.id}`}>Correct {label.toLowerCase()} (₱)</Label><Input id={`correct-${account.id}`} type="number" step="0.01" placeholder={decimalAmount(toMinorUnits(account.balance))} value={drafts[account.id] ?? ""} disabled={busy || refreshing || uncertain} onChange={(event) => { setDrafts((values) => ({ ...values, [account.id]: event.target.value })); attempt.current = null; setSaved(""); setError(""); }} aria-invalid={!!row?.error} aria-describedby={row?.error ? `correct-${account.id}-error` : undefined} />{row?.error && <p id={`correct-${account.id}-error`} className="text-sm text-red-800">{row.error}</p>}</div>
            {row && !row.error && <div className="border-t border-[var(--pd-border)] pt-3"><p className="text-xs text-slate-600">{row.label}</p><p className="mt-1 text-sm">{row.debt ? <span className="tabular-nums">{formatMinorUnits(row.change)}</span> : <MoneyFlowAmount amount={decimalAmount(row.change < 0n ? -row.change : row.change)} direction={row.kind === "expense" ? "out" : "in"} />}</p><p className="mt-2 flex flex-wrap items-center gap-1 text-xs text-slate-600">{formatMinorUnits(row.current)}<ArrowRight className="size-3" aria-hidden="true" />{formatMinorUnits(row.target)}</p>{row.target < 0n && <p className="mt-2 text-xs text-amber-800">{account.kind === "credit_card" ? "This records a credit on the card, not cash income." : "This records a negative balance. It may block future payments."}</p>}</div>}
          </section>;
        })}
      </div>}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--pd-border)] pt-4"><p className="text-sm text-slate-600">{changes.length} account{changes.length === 1 ? "" : "s"} to correct · preview only</p><Button ref={saveTrigger} type="button" disabled={busy || refreshing || invalid || !changes.length} onClick={() => { setPassword(""); setPasswordError(""); setError(""); setVerify(true); }}><Save className="size-4" aria-hidden="true" />{uncertain ? "Retry save safely" : "Save all balances"}</Button></div>
    </Panel>
    <AlertDialog open={reloadOpen} onOpenChange={setReloadOpen}>
      <AlertDialogContent className="personal-dashboard"><AlertDialogHeader><AlertDialogTitle>Reload saved balances?</AlertDialogTitle><AlertDialogDescription>Your unsaved entries will be cleared and replaced with the latest balances. Any corrections already saved stay recorded.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep entries</AlertDialogCancel><AlertDialogAction onClick={refresh}><RefreshCw className="size-4" aria-hidden="true" />Reload balances</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
    </AlertDialog>
    {verify && <FormModalShell title="Verify & save balance corrections" description="Re-enter your Django password. All listed corrections are saved together, or none are saved." busy={busy} error={error} onSubmit={save} onCancel={() => { setVerify(false); setPassword(""); setPasswordError(""); }} onCloseAutoFocus={(event) => { event.preventDefault(); saveTrigger.current?.focus(); }} saveLabel={`Verify & save ${changes.length} balance${changes.length === 1 ? "" : "s"}`}>
      <ul className="max-h-60 space-y-2 overflow-y-auto">{changes.map((row) => <li key={row.account.id} className="flex flex-wrap justify-between gap-2 border-b border-[var(--pd-border)] pb-2 text-sm"><span>{row.account.name}<span className="block text-xs text-slate-600">{row.label}</span></span><span className="tabular-nums">{formatMinorUnits(row.current)} → {formatMinorUnits(row.target)}</span></li>)}</ul>
      <div className="space-y-2"><Label htmlFor="balance-verification-password" className="flex items-center gap-2"><ShieldCheck className="size-4" aria-hidden="true" />Django password *</Label><Input id="balance-verification-password" type="password" autoComplete="current-password" autoFocus maxLength={1024} value={password} disabled={busy} onChange={(event) => setPassword(event.target.value)} aria-invalid={!!passwordError} aria-describedby={passwordError ? "balance-verification-error" : undefined} />{passwordError && <p id="balance-verification-error" role="alert" className="text-sm text-red-800">{passwordError}</p>}</div>
    </FormModalShell>}
  </div>;
}
