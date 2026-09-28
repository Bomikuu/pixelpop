import { useEffect, useRef, useState } from "react";
import {
  LockKeyhole,
  UserPlus,
  Plus,
  KeyRound,
  ListChecks,
  ArrowLeftRight,
  PartyPopper,
} from "lucide-react";
import { financeApi } from "../../api";
import { Button } from "../../ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "../../ui/tooltip";
import DashboardToasts from "../DashboardToasts";
import EventPinDialog from "./EventPinDialog";
import AddParticipantDialog from "./AddParticipantDialog";
import PublicPaymentDialog from "./PublicPaymentDialog";
import PublicReportReviewDialog from "./PublicReportReviewDialog";
import { formError } from "../../lib/sharedBills";
import CloseEventDialog from "./CloseEventDialog";

function tabCredential(token, value) {
  const key = "shared-event-management:" + token;
  try {
    if (value === undefined) return sessionStorage.getItem(key) || "";
    if (value) sessionStorage.setItem(key, value);
    else sessionStorage.removeItem(key);
  } catch {
    // Browsers that block storage retain management access in memory instead.
  }
  return "";
}

export default function PublicBillActions({ bill, token, changed, children }) {
  const [pin, setPin] = useState("");
  const [credential, setCredential] = useState(() => tabCredential(token));
  const unlocked = Boolean(credential);
  const [action, setAction] = useState(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [notices, setNotices] = useState([]);
  const saving = useRef(false),
    noticeId = useRef(0),
    actionTrigger = useRef(null),
    lockTrigger = useRef(null),
    unlockTrigger = useRef(null);
  const close = () => {
    setAction(null);
    requestAnimationFrame(() => {
      if (action === "review") lockTrigger.current?.focus();
      else actionTrigger.current?.focus();
    });
  };
  function lock() {
    tabCredential(token, "");
    setCredential("");
    setPin("");
  }
  useEffect(() => {
    if (!bill.has_edit_pin) {
      tabCredential(token, "");
      setCredential("");
    }
  }, [bill.has_edit_pin, token]);
  const path = "shared-bills/share/" + encodeURIComponent(token) + "/";
  const notify = (text, tone) =>
    setNotices((previous) => [
      ...previous.slice(-2),
      { id: ++noticeId.current, text, tone },
    ]);
  async function request(endpoint, body) {
    const requiresPin =
      endpoint !== "pay/" ||
      body.kind === "refund" ||
      (body.kind !== "contribution" && Boolean(body.paid_to_id));
    try {
      return await financeApi(path + endpoint, {
        method: "POST",
        credentials: "omit",
        body:
          endpoint === "unlock/"
            ? { pin }
            : requiresPin
              ? { ...body, management_token: credential }
              : body,
      });
    } catch (failure) {
      if (requiresPin && (failure.status === 403 || failure.status === 401)) {
        lock();
        setError(formError(failure));
        setAction("pin");
      }
      throw failure;
    }
  }
  async function unlock(event) {
    event.preventDefault();
    if (saving.current) return;
    const invalid = event.currentTarget.querySelector("input:invalid");
    if (invalid) {
      setError("Enter the 8-digit PIN provided by the owner.");
      invalid.focus();
      return;
    }
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await request("unlock/", {});
      tabCredential(token, result.management_token);
      setCredential(result.management_token);
      setPin("");
      setAction(null);
      notify(
        "Event management unlocked. You can add people, reimburse and review reports.",
      );
      requestAnimationFrame(() => lockTrigger.current?.focus());
    } catch (failure) {
      setError(formError(failure));
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  async function submit(endpoint, body, message, tone) {
    await request(endpoint, body);
    notify(message, tone);
    changed();
  }
  const headerActions = (
    <>
      {unlocked && (
        <Button
          variant="outline"
          onClick={(event) => {
            actionTrigger.current = event.currentTarget;
            setError("");
            setAction("join");
          }}
          disabled={bill.participants.length >= 50}
        >
          <UserPlus aria-hidden="true" />
          Add person
        </Button>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={!bill.has_edit_pin && !unlocked ? 0 : undefined}>
            <Button
              ref={unlocked ? lockTrigger : unlockTrigger}
              size="icon"
              variant="outline"
              disabled={busy || (!unlocked && !bill.has_edit_pin)}
              aria-label={unlocked ? "Lock management" : "Unlock management"}
              aria-pressed={unlocked}
              onClick={(event) => {
                if (unlocked) {
                  lock();
                  setAction(null);
                  requestAnimationFrame(() => unlockTrigger.current?.focus());
                } else {
                  actionTrigger.current = event.currentTarget;
                  setError("");
                  setAction("pin");
                }
              }}
            >
              {unlocked ? (
                <LockKeyhole aria-hidden="true" />
              ) : (
                <KeyRound aria-hidden="true" />
              )}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent
          className="personal-dashboard"
          side="bottom"
          sideOffset={6}
        >
          {unlocked
            ? "Lock management"
            : bill.has_edit_pin
              ? "Unlock management with the event PIN"
              : "The owner has not enabled PIN management yet"}
        </TooltipContent>
      </Tooltip>
    </>
  );
  const contributionActions = (
    <section
      className="flex w-full flex-wrap items-center gap-2"
      aria-label="Participate in this event"
    >
      <Button
        size="lg"
        onClick={(event) => {
          actionTrigger.current = event.currentTarget;
          setError("");
          setAction("payment");
        }}
      >
        <Plus aria-hidden="true" />
        Report payment
      </Button>
      {unlocked && (
        <Button
          variant="outline"
          size="lg"
          onClick={(event) => {
            actionTrigger.current = event.currentTarget;
            setError("");
            setAction("reimbursement");
          }}
        >
          <ArrowLeftRight aria-hidden="true" />
          Reimburse
        </Button>
      )}
      {unlocked && bill.can_mark_all_paid && (
        <Button
          variant="outline"
          size="lg"
          onClick={(event) => {
            actionTrigger.current = event.currentTarget;
            setAction("close");
          }}
        >
          <PartyPopper aria-hidden="true" />
          Mark all paid
        </Button>
      )}
      {unlocked && (
        <Button
          variant="outline"
          size="lg"
          disabled={
            !bill.payments.some((payment) => payment.status === "pending")
          }
          onClick={(event) => {
            actionTrigger.current = event.currentTarget;
            setError("");
            setAction("review");
          }}
        >
          <ListChecks aria-hidden="true" />
          Review reports (
          {
            bill.payments.filter((payment) => payment.status === "pending")
              .length
          }
          )
        </Button>
      )}
    </section>
  );
  return (
    <>
      {children({ headerActions, contributionActions })}
      {action === "pin" && !unlocked && (
        <EventPinDialog
          {...{ pin, setPin, busy, error, unlock }}
          clearError={() => setError("")}
          trigger={unlockTrigger}
          close={() => {
            close();
            setPin("");
          }}
        />
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
      {(action === "payment" || (action === "reimbursement" && unlocked)) && (
        <PublicPaymentDialog
          bill={bill}
          paymentKind={
            action === "reimbursement" ? "reimbursement" : "provider"
          }
          close={close}
          submit={(body) =>
            submit(
              "pay/",
              body,
              action === "reimbursement"
                ? "Reimbursement reported. Awaiting confirmation by the owner or a PIN holder."
                : "Payment reported. Awaiting confirmation by the owner or a PIN holder.",
            )
          }
        />
      )}
      {action === "review" && unlocked && (
        <PublicReportReviewDialog
          bill={bill}
          close={close}
          submit={(endpoint, payment) =>
            submit(
              endpoint,
              { payment_id: payment.id },
              endpoint === "approve/"
                ? payment.kind === "refund"
                  ? "Refund confirmed. The recipient’s net paid amount was reduced; private accounts were not changed."
                  : "Payment confirmed for this event. The owner’s private ledger was not changed."
                : "Report rejected. No balances were changed.",
            )
          }
        />
      )}
      {action === "close" && unlocked && (
        <CloseEventDialog
          bill={bill}
          close={close}
          submit={(body) =>
            submit(
              "close/",
              body,
              "All paid! Volunteer coverage and waived excess have been recorded. Thank you, everyone!",
              "celebrate",
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
