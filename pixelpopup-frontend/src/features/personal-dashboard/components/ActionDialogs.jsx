import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { useRecords } from "../hooks/useDashboardData";
import { dateLabel, money, words } from "../lib/format";
import { EmptyState, ErrorState } from "./Panel";

export function DeleteDialog({ target, mutate, close, notify, restoreFocus }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const archive = "active" in target.record;
  async function remove(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await mutate(
        target.resource + "/" + target.record.id + "/",
        undefined,
        "DELETE",
      );
      notify(
        archive
          ? "Record archived. Financial history is preserved."
          : "Record deleted.",
        { action: archive ? "archived" : "deleted", entity: target.resource },
      );
      close();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) close();
      }}
    >
      <AlertDialogContent
        className="personal-dashboard"
        onCloseAutoFocus={restoreFocus}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>
            {archive ? "Archive " : "Delete "}
            {target.record.name || target.record.title || target.record.person}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {archive
              ? "The record will be archived, not erased. Account balances and financial history remain included."
              : "This removes the record and recalculates affected totals. Linked financial history cannot be deleted."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <ErrorState message={error} />}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={remove}
            disabled={busy}
            className="bg-red-700 text-white hover:bg-red-800"
          >
            {busy ? "Working…" : archive ? "Archive record" : "Delete record"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function HistoryDialog({
  target,
  request,
  version,
  close,
  restoreFocus,
}) {
  const state = useRecords(
    target.resource + "/" + target.record.id + "/history/",
    request,
    version,
  );
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent
        className="personal-dashboard max-h-[85dvh] overflow-y-auto bg-white"
        onCloseAutoFocus={restoreFocus}
      >
        <DialogHeader>
          <DialogTitle>
            {target.record.name || target.record.person} history
          </DialogTitle>
          <DialogDescription>
            Latest 100 recorded movements. Historical transactions are not
            rewritten by balance corrections.
          </DialogDescription>
        </DialogHeader>
        {state.error ? (
          <ErrorState message={state.error} />
        ) : !state.data ? (
          <p role="status">Loading history…</p>
        ) : !state.data.length ? (
          <EmptyState title="No history yet" />
        ) : (
          <ul className="divide-y">
            {state.data.map((row, i) => (
              <li
                key={row.kind + row.id + "-" + i}
                className="flex justify-between gap-3 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">{row.name || words(row.kind)}</p>
                  <p className="mt-1 text-slate-600">{dateLabel(row.date)}</p>
                </div>
                <span className="tabular-nums">{money(row.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
