import { useState } from "react";
import { Share2, Copy, Link2Off, KeyRound, Eye, EyeOff } from "lucide-react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "../../ui/alert-dialog";
import { Panel, ErrorState } from "../Panel";
import { formError } from "../../lib/sharedBills";

export default function BillSharing({ bill, dashboard, notify }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [editPin, setEditPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [confirmLegacy, setConfirmLegacy] = useState(false);
  const [replacePin, setReplacePin] = useState(false);
  const link = bill.share_token
    ? window.location.origin + "/shared-bills/" + bill.share_token
    : "";
  const expired =
    bill.share_expires_at && new Date(bill.share_expires_at) <= new Date();
  const expiresLabel = bill.share_expires_at
    ? new Intl.DateTimeFormat("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "Asia/Manila",
      }).format(new Date(bill.share_expires_at))
    : "Not set";
  async function share() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await dashboard.mutate("shared-bills/" + bill.id + "/share/", {});
      setEditPin("");
      notify(
        "Shared link created. Generate a PIN to enable public participation.",
      );
    } catch (failure) {
      setError(formError(failure));
    } finally {
      setBusy(false);
    }
  }
  async function revoke(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await dashboard.mutate("shared-bills/" + bill.id + "/revoke-share/", {});
      setEditPin("");
      setConfirm(false);
      notify("Shared link revoked.");
    } catch (failure) {
      setError(formError(failure));
    } finally {
      setBusy(false);
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      notify("Breakdown link copied.");
    } catch {
      setError(
        "Could not copy automatically. Select the link below and copy it manually.",
      );
    }
  }
  async function generatePin(event) {
    event?.preventDefault();
    if (busy || (!bill.allocation_confirmed && !confirmLegacy)) return;
    setBusy(true);
    setError("");
    try {
      const result = await dashboard.mutate(
        "shared-bills/" + bill.id + "/pin/",
        { ...(confirmLegacy ? { confirm_resplit_legacy: true } : {}) },
      );
      setEditPin(result.edit_pin);
      setShowPin(false);
      setReplacePin(false);
      notify("Editing PIN generated. Share it only with event participants.");
    } catch (failure) {
      setError(formError(failure));
    } finally {
      setBusy(false);
    }
  }
  async function copyPin() {
    try {
      await navigator.clipboard.writeText(editPin);
      notify("Event PIN copied.");
    } catch {
      setError("Could not copy the PIN. Select it and copy manually.");
    }
  }
  return (
    <Panel
      title="Share this breakdown"
      description="The link shares only this event's names, contributions, and payment history. Your accounts and private notes stay private. A separate PIN enables joining and payment reports."
    >
      {error && (
        <div className="mb-3">
          <ErrorState message={error} />
        </div>
      )}
      {link && !expired ? (
        <div className="space-y-3">
          <Label htmlFor="shared-bill-link">
            Shared link · expires {expiresLabel}
          </Label>
          <div className="flex flex-wrap gap-2">
            <Input
              id="shared-bill-link"
              readOnly
              value={link}
              className="min-w-0 flex-1"
              onFocus={(event) => event.target.select()}
            />
            <Button variant="outline" onClick={copy}>
              <Copy aria-hidden="true" />
              Copy link
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setConfirm(true)}
            >
              <Link2Off aria-hidden="true" />
              Revoke link
            </Button>
          </div>
          <div className="space-y-3 border-t pt-4">
            <p className="text-sm text-slate-600">
              PIN holders can add people, recalculate flexible shares, and
              report payments or reimbursements. Payment reports need your
              confirmation before changing totals or your ledger.
            </p>
            {!bill.allocation_confirmed && (
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 size-4 accent-[var(--pd-primary)]"
                  checked={confirmLegacy}
                  disabled={busy}
                  onChange={(event) => setConfirmLegacy(event.target.checked)}
                />
                <span>
                  This older bill did not save split rules. Keep my contribution
                  fixed; let others split the remainder when people join.
                </span>
              </label>
            )}
            <Button
              variant="outline"
              disabled={busy || (!bill.allocation_confirmed && !confirmLegacy)}
              onClick={() =>
                bill.has_edit_pin ? setReplacePin(true) : generatePin()
              }
            >
              <KeyRound aria-hidden="true" />
              {busy
                ? "Saving…"
                : bill.has_edit_pin
                  ? "Replace editing PIN"
                  : "Generate editing PIN"}
            </Button>
            {editPin && (
              <div className="space-y-2">
                <Label htmlFor="generated-event-pin">
                  New editing PIN · available only until you leave this page
                </Label>
                <div className="flex flex-wrap gap-2">
                  <Input
                    id="generated-event-pin"
                    type={showPin ? "text" : "password"}
                    readOnly
                    value={editPin}
                    autoComplete="off"
                    className="max-w-48 font-mono tracking-widest"
                    onFocus={(event) => event.target.select()}
                  />
                  <Button
                    variant="outline"
                    aria-label={
                      showPin ? "Hide editing PIN" : "Show editing PIN"
                    }
                    aria-pressed={showPin}
                    onClick={() => setShowPin((value) => !value)}
                  >
                    {showPin ? (
                      <EyeOff aria-hidden="true" />
                    ) : (
                      <Eye aria-hidden="true" />
                    )}
                    {showPin ? "Hide PIN" : "Show PIN"}
                  </Button>
                  <Button variant="outline" onClick={copyPin}>
                    <Copy aria-hidden="true" />
                    Copy PIN
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <Button disabled={busy} onClick={share}>
          <Share2 aria-hidden="true" />
          {busy
            ? "Creating link…"
            : expired
              ? "Create a new share link"
              : "Create shared link"}
        </Button>
      )}
      <AlertDialog
        open={confirm}
        onOpenChange={(open) => {
          if (!busy) setConfirm(open);
        }}
      >
        <AlertDialogContent className="personal-dashboard">
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke this shared link?</AlertDialogTitle>
            <AlertDialogDescription>
              The existing link will stop working. Your bill and payment records
              are kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Keep link</AlertDialogCancel>
            <AlertDialogAction disabled={busy} onClick={revoke}>
              {busy ? "Revoking…" : "Revoke link"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={replacePin}
        onOpenChange={(open) => {
          if (!busy) setReplacePin(open);
        }}
      >
        <AlertDialogContent className="personal-dashboard">
          <AlertDialogHeader>
            <AlertDialogTitle>Replace the editing PIN?</AlertDialogTitle>
            <AlertDialogDescription>
              The previous PIN will stop working immediately. The viewing link
              and recorded payments are kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Keep PIN</AlertDialogCancel>
            <AlertDialogAction disabled={busy} onClick={generatePin}>
              Replace PIN
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Panel>
  );
}
