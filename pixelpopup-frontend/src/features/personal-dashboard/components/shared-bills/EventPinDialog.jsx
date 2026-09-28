import { useRef, useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";

export default function EventPinDialog({
  pin,
  setPin,
  busy,
  error,
  clearError,
  unlock,
  close,
  trigger,
}) {
  const [visible, setVisible] = useState(false);
  const inputs = useRef([]);
  const focus = (index) => {
    inputs.current[index]?.focus();
    inputs.current[index]?.select();
  };
  function update(index, value) {
    const digits = pin.padEnd(8, " ").split("");
    digits[index] = value || " ";
    setPin(digits.join(""));
    clearError();
  }
  function paste(event, index) {
    const digits = event.clipboardData.getData("text").replace(/\D/g, "");
    if (!digits) return;
    event.preventDefault();
    const start = digits.length >= 8 ? 0 : index;
    const next = pin.padEnd(8, " ").split("");
    digits
      .slice(0, 8 - start)
      .split("")
      .forEach((digit, offset) => {
        next[start + offset] = digit;
      });
    setPin(next.join(""));
    clearError();
    focus(Math.min(start + digits.length, 7));
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) close();
      }}
    >
      <DialogContent
        className="personal-dashboard max-h-[85dvh] overflow-y-auto p-4 sm:max-w-sm sm:p-6"
        onEscapeKeyDown={(event) => {
          if (busy) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (busy) event.preventDefault();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          requestAnimationFrame(() => trigger.current?.focus());
        }}
      >
        <DialogHeader>
          <DialogTitle>Unlock event management</DialogTitle>
          <DialogDescription>
            Enter the owner’s 8-digit PIN to add people, reimburse or review
            payment reports. This does not give access to the owner’s dashboard.
          </DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={unlock} className="space-y-4">
          <fieldset disabled={busy} className="min-w-0 space-y-2">
            <legend className="mb-2 text-sm font-medium">Event PIN</legend>
            <div className="grid grid-cols-8 gap-1.5">
              {Array.from({ length: 8 }, (_, index) => (
                <Input
                  key={index}
                  ref={(element) => {
                    inputs.current[index] = element;
                  }}
                  autoFocus={index === 0}
                  type={visible ? "text" : "password"}
                  inputMode="numeric"
                  autoComplete="off"
                  required
                  pattern="[0-9]"
                  maxLength={1}
                  value={pin[index]?.trim() || ""}
                  aria-label={"PIN digit " + (index + 1) + " of 8"}
                  aria-invalid={Boolean(error)}
                  aria-describedby={
                    error ? "event-pin-error" : "event-pin-help"
                  }
                  className="h-11 min-w-0 px-0 text-center text-lg tabular-nums"
                  onFocus={(event) => event.target.select()}
                  onPaste={(event) => paste(event, index)}
                  onChange={(event) => {
                    const digit = event.target.value
                      .replace(/\D/g, "")
                      .slice(-1);
                    update(index, digit);
                    if (digit && index < 7) focus(index + 1);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Backspace") {
                      event.preventDefault();
                      const target = pin[index]?.trim()
                        ? index
                        : Math.max(0, index - 1);
                      update(target, "");
                      focus(target);
                    } else if (
                      event.key === "ArrowLeft" ||
                      event.key === "ArrowRight"
                    ) {
                      event.preventDefault();
                      focus(
                        Math.max(
                          0,
                          Math.min(
                            7,
                            index + (event.key === "ArrowLeft" ? -1 : 1),
                          ),
                        ),
                      );
                    }
                  }}
                />
              ))}
            </div>
            <p id="event-pin-help" className="text-xs text-slate-600">
              You can paste the full PIN into any box.
            </p>
          </fieldset>
          {error && (
            <p
              id="event-pin-error"
              role="alert"
              className="text-sm text-red-700"
            >
              {error}
            </p>
          )}
          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              aria-pressed={visible}
              onClick={() => setVisible((value) => !value)}
            >
              {visible ? (
                <EyeOff aria-hidden="true" />
              ) : (
                <Eye aria-hidden="true" />
              )}
              {visible ? "Hide PIN" : "Show PIN"}
            </Button>
            <Button disabled={busy}>
              <LockKeyhole aria-hidden="true" />
              {busy ? "Checking…" : "Unlock management"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
