import React, { useEffect, useMemo, useState } from "react";
import RetroPanel from "./Panel";
import RetroInput from "./Input";
import RetroButton from "./Button";
import RetroIconButton from "./IconButton";
import { Eye, EyeOff, Lock, Unlock, KeyRound } from "lucide-react";
import { overlay } from "../overlay";

const cx = (...c) => c.filter(Boolean).join(" ");

/**
 * PasswordGatePanel
 * - Use validate(password) async/sync OR expectedPassword (client-side demo only)
 * - Built to sit inside a Window or as standalone scene content
 */
export default function PasswordGatePanel({
  // Panel
  title = "LOCKED",
  rightSlot,
  className,
  bg,
  borderColor,
  shadow,

  // Copy
  prompt = "Enter password to continue.",
  hint,
  placeholder = "••••••",
  submitText = "Unlock",
  cancelText = "Cancel",

  // Validation
  validate, // async (pwd) => { ok:boolean, message?:string }
  expectedPassword, // simple client-side (NOT secure; for demo only)

  // Handlers
  onSuccess,
  onCancel,

  // Behavior
  maxTries = 5,
  lockoutMs = 30_000, // after max tries, disable for this duration
  showTries = true,

  // Effects
  successEffects = [
    { type: "sfx", name: "success" },
    { type: "confetti", doubleBurst: true },
  ],
  errorEffects = [
    { type: "sfx", name: "error" },
    { type: "vhs", ms: 650, strength: 12, aberration: 3, noise: 0.14 },
    { type: "shake", ms: 420, intensity: 7 },
  ],

  // Styling
  controlsClassName = "mt-4 flex items-center justify-end gap-2",
  inputClassName,
  disableCancel = false,
}) {
  const [pwd, setPwd] = useState("");
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [tries, setTries] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(null); // timestamp ms

  const isLocked = useMemo(() => {
    if (!lockedUntil) return false;
    return Date.now() < lockedUntil;
  }, [lockedUntil]);

  const remainingMs = useMemo(() => {
    if (!lockedUntil) return 0;
    return Math.max(0, lockedUntil - Date.now());
  }, [lockedUntil]);

  // Tick to update remaining lockout label
  const [, forceTick] = useState(0);
  useEffect(() => {
    if (!isLocked) return;
    const t = setInterval(() => forceTick((x) => x + 1), 250);
    return () => clearInterval(t);
  }, [isLocked]);

  const triesLeft = useMemo(() => Math.max(0, maxTries - tries), [maxTries, tries]);

  const lockLabel = useMemo(() => {
    if (!isLocked) return null;
    const sec = Math.ceil(remainingMs / 1000);
    return `Locked. Try again in ${sec}s.`;
  }, [isLocked, remainingMs]);

  const canSubmit = useMemo(() => {
    if (submitting) return false;
    if (isLocked) return false;
    if (!pwd) return false;
    return true;
  }, [submitting, isLocked, pwd]);

  const runEffects = (arr) => {
    (arr || []).forEach((e) => overlay.effect(e));
  };

  const setLockout = () => {
    setLockedUntil(Date.now() + lockoutMs);
  };

  const defaultValidate = async (password) => {
    // Client-side demo validation ONLY (not secure)
    if (expectedPassword == null) return { ok: false, message: "No validator configured." };
    return { ok: password === expectedPassword, message: password === expectedPassword ? "Unlocked." : "Wrong password." };
  };

  const doValidate = validate || defaultValidate;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const res = await doValidate(pwd);

      if (res?.ok) {
        runEffects(successEffects);
        overlay.toast({ type: "success", message: res?.message || "Access granted." });
        onSuccess?.({ password: pwd });
        return;
      }

      // wrong
      const nextTries = tries + 1;
      setTries(nextTries);

      runEffects(errorEffects);
      overlay.toast({ type: "error", message: res?.message || "Wrong password." });

      if (nextTries >= maxTries) {
        setLockout();
        overlay.toast({ type: "warning", message: "Too many attempts. Temporarily locked." });
      }
    } catch (e) {
      runEffects(errorEffects);
      overlay.toast({ type: "error", message: "Validation failed. Try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RetroPanel
      title={title}
      rightSlot={rightSlot}
      className={className}
      bg={bg}
      borderColor={borderColor}
      shadow={shadow}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-pp font-extrabold text-sm md:text-base">
              {prompt}
            </div>
            {hint ? (
              <div className="mt-2 font-pp text-xs opacity-80">
                Hint: <span className="font-extrabold">{hint}</span>
              </div>
            ) : null}

            {showTries ? (
              <div className="mt-2 font-pp text-xs opacity-70">
                Attempts left: <span className="font-extrabold">{triesLeft}</span>
              </div>
            ) : null}

            {lockLabel ? (
              <div className="mt-2 font-pp text-xs font-extrabold" style={{ color: "var(--pp-danger)" }}>
                {lockLabel}
              </div>
            ) : null}
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <RetroIconButton
              title={show ? "Hide" : "Show"}
              icon={show ? <EyeOff size={18} strokeWidth={3} /> : <Eye size={18} strokeWidth={3} />}
              onClick={() => setShow((v) => !v)}
            />
            <div className="border-[3px] rounded-lg p-2" style={{ borderColor: "var(--pp-border)", boxShadow: "var(--pp-shadow)", background: "rgba(255,255,255,0.8)" }}>
              {isLocked ? <Lock size={18} strokeWidth={3} /> : <KeyRound size={18} strokeWidth={3} />}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <RetroInput
            className={inputClassName}
            label="Password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            placeholder={placeholder}
            type={show ? "text" : "password"}
            disabled={submitting || isLocked}
            rightSlot={<span className="font-pp text-xs opacity-70">{show ? "TXT" : "•••"}</span>}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
          />
        </div>

        <div className={controlsClassName}>
          {cancelText ? (
            <RetroButton
              variant="secondary"
              onClick={onCancel}
              disabled={disableCancel || submitting}
            >
              {cancelText}
            </RetroButton>
          ) : null}

          <RetroButton
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <Unlock size={16} strokeWidth={3} />
                Checking…
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <Unlock size={16} strokeWidth={3} />
                {submitText}
              </span>
            )}
          </RetroButton>
        </div>

        <div className="mt-4 font-pp text-[11px] opacity-70">
          Tip: audio effects may be silent until the user clicks once (browser autoplay policy).
        </div>
      </div>
    </RetroPanel>
  );
}
