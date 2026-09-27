import { useRef, useState } from "react";
import { LockKeyhole, UserPlus, Plus, Eye, EyeOff } from "lucide-react";
import { financeApi } from "../../api";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import DashboardToasts from "../DashboardToasts";
import SharedFormFrame from "./SharedFormFrame";
import AddParticipantDialog from "./AddParticipantDialog";
import PublicPaymentDialog from "./PublicPaymentDialog";
import { formError } from "../../lib/sharedBills";

export default function PublicBillActions({ bill, token, changed }) {
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [action, setAction] = useState(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [notices, setNotices] = useState([]);
  const saving = useRef(false),
    noticeId = useRef(0),
    actionTrigger = useRef(null);
  const close = () => {
    setAction(null);
    requestAnimationFrame(() => actionTrigger.current?.focus());
  };
  const path = "shared-bills/share/" + encodeURIComponent(token) + "/";
  const notify = (text) =>
    setNotices((previous) => [
      ...previous.slice(-2),
      { id: ++noticeId.current, text },
    ]);
  async function request(endpoint, body) {
    try {
      return await financeApi(path + endpoint, {
        method: "POST",
        credentials: "omit",
        body: { ...body, pin },
      });
    } catch (failure) {
      if (failure.status === 403 || failure.status === 401) {
        setUnlocked(false);
        setPin("");
        setError(formError(failure));
      }
      throw failure;
    }
  }
  async function unlock(event) {
    event.preventDefault();
    if (saving.current) return;
    const invalid = event.currentTarget.querySelector(":invalid");
    if (invalid) {
      setError("Enter the 8-digit PIN provided by the owner.");
      invalid.focus();
      return;
    }
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      await request("unlock/", {});
      setUnlocked(true);
    } catch (failure) {
      setError(formError(failure));
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  async function submit(endpoint, body, message) {
    await request(endpoint, body);
    notify(message);
    changed();
  }
  return (
    <>
      <section
        className="flex flex-wrap items-center justify-between gap-3 border-b pb-5"
        aria-label="Participate in this event"
      >
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={!bill.has_edit_pin}
            onClick={(event) => {
              actionTrigger.current = event.currentTarget;
              setError("");
              setAction("join");
            }}
          >
            <UserPlus aria-hidden="true" />
            Add person
          </Button>
          <Button
            disabled={!bill.has_edit_pin}
            onClick={(event) => {
              actionTrigger.current = event.currentTarget;
              setError("");
              setAction("payment");
            }}
          >
            <Plus aria-hidden="true" />
            Record payment / reimbursement
          </Button>
        </div>
        {unlocked ? (
          <Button
            variant="ghost"
            onClick={() => {
              setPin("");
              setUnlocked(false);
              setAction(null);
            }}
          >
            <LockKeyhole aria-hidden="true" />
            Lock editing
          </Button>
        ) : (
          <p className="text-xs text-slate-600">
            {bill.has_edit_pin
              ? "Ask the owner for the editing PIN."
              : "The owner has not enabled PIN editing yet."}
          </p>
        )}
      </section>
      {action && !unlocked && (
        <SharedFormFrame
          title="Enter the event PIN"
          description="The owner’s PIN allows you to add people and report payments. Payment reports wait for the owner’s confirmation. The PIN is kept only until you leave or lock this page."
          busy={busy}
          dirty={false}
          close={() => {
            close();
            setPin("");
          }}
        >
          <form noValidate onSubmit={unlock} className="space-y-4">
            {error && (
              <p
                id="event-pin-error"
                role="alert"
                className="text-sm text-red-700"
              >
                {error}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="event-edit-pin">8-digit PIN</Label>
              <div className="flex gap-2">
                <Input
                  id="event-edit-pin"
                  autoFocus
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  pattern="[0-9]{8}"
                  minLength={8}
                  maxLength={8}
                  autoComplete="off"
                  required
                  disabled={busy}
                  value={pin}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "event-pin-error" : undefined}
                  onChange={(event) => {
                    setPin(event.target.value.replace(/\D/g, ""));
                    setError("");
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  aria-label={showPin ? "Hide PIN" : "Show PIN"}
                  aria-pressed={showPin}
                  onClick={() => setShowPin((value) => !value)}
                >
                  {showPin ? (
                    <EyeOff aria-hidden="true" />
                  ) : (
                    <Eye aria-hidden="true" />
                  )}
                </Button>
              </div>
            </div>
            <div className="flex justify-end">
              <Button disabled={busy}>
                <LockKeyhole aria-hidden="true" />
                {busy ? "Checking…" : "Unlock editing"}
              </Button>
            </div>
          </form>
        </SharedFormFrame>
      )}
      {action === "join" && unlocked && (
        <AddParticipantDialog
          bill={bill}
          close={close}
          submit={(body) =>
            submit(
              "participants/",
              body,
              "Person added. Contributions and reimbursement balances updated.",
            )
          }
        />
      )}
      {action === "payment" && unlocked && (
        <PublicPaymentDialog
          bill={bill}
          close={close}
          submit={(body) =>
            submit(
              "pay/",
              body,
              "Payment reported. Awaiting the owner’s confirmation.",
            )
          }
        />
      )}
      <DashboardToasts
        notices={notices}
        dismiss={(id) =>
          setNotices((previous) =>
            previous.filter((notice) => notice.id !== id),
          )
        }
      />
    </>
  );
}
