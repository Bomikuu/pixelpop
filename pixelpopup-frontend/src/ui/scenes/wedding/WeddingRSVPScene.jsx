import React, { useMemo, useState } from "react";
import { useWeddingConfig } from "./useWeddingConfig";

const cx = (...c) => c.filter(Boolean).join(" ");

export default function WeddingRSVPScene({
  title = "RSVP",
  subtitle = "Please confirm your attendance",

  names = null,

  primaryText = "Submit",
  secondaryText = "Back",

  onDone,
  onCancel,
}) {
  const { cfg, set } = useWeddingConfig();

  const theme = (cfg?.theme || "minimal") === "retro" ? "retro" : "minimal";

  const namesFinal = useMemo(() => {
    const fromProps = names && typeof names === "object" ? names : null;
    const fromCfg = cfg?.names && typeof cfg.names === "object" ? cfg.names : null;
    return {
      bride: fromProps?.bride ?? fromCfg?.bride ?? "Bride",
      groom: fromProps?.groom ?? fromCfg?.groom ?? "Groom",
    };
  }, [names, cfg]);

  const tokens = theme === "retro"
    ? {
        border: "rgba(0,0,0,0.18)",
        panelBg: "rgba(255,255,255,0.96)",
        text: "#111827",
        subtext: "rgba(17,24,39,0.72)",
        primaryBg: "linear-gradient(135deg, #7C3AED, #22D3EE)",
        primaryText: "#051923",
      }
    : {
        border: "rgba(0,0,0,0.10)",
        panelBg: "rgba(255,255,255,0.96)",
        text: "#111827",
        subtext: "rgba(17,24,39,0.72)",
        primaryBg: "linear-gradient(135deg, #C9A76A, #E6D2A8)",
        primaryText: "#231F20",
      };

  const [form, setForm] = useState(() => ({
    name: "",
    guests: "1",
    attendance: "yes", // yes | no | maybe
    note: "",
  }));

  const update = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = () => {
    set({
      rsvp: {
        ...form,
        submittedAt: new Date().toISOString(),
      },
    });
    onDone?.();
  };

  return (
    <div className="w-full">
      <div className="max-w-4xl mx-auto px-5 py-8">
        <div className="text-xs tracking-[0.35em] uppercase opacity-70">
          {namesFinal.bride} & {namesFinal.groom}
        </div>

        <div className="mt-3 text-3xl font-semibold" style={{ color: tokens.text }}>
          {title}
        </div>
        {subtitle ? <div className="mt-2 text-sm" style={{ color: tokens.subtext }}>{subtitle}</div> : null}

        <div
          className={cx(
            "mt-6 rounded-3xl border bg-white",
            "shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
          )}
          style={{ borderColor: tokens.border, background: tokens.panelBg }}
        >
          <div className="p-6 sm:p-7 space-y-4">
            <Field label="Your Name">
              <input
                value={form.name}
                onChange={update("name")}
                className="w-full px-4 py-3 rounded-2xl border outline-none"
                style={{ borderColor: tokens.border }}
                placeholder="Full name"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Attendance">
                <select
                  value={form.attendance}
                  onChange={update("attendance")}
                  className="w-full px-4 py-3 rounded-2xl border outline-none bg-white"
                  style={{ borderColor: tokens.border }}
                >
                  <option value="yes">Yes, I’ll be there</option>
                  <option value="maybe">Maybe</option>
                  <option value="no">Sorry, can’t make it</option>
                </select>
              </Field>

              <Field label="Number of Guests">
                <input
                  value={form.guests}
                  onChange={update("guests")}
                  className="w-full px-4 py-3 rounded-2xl border outline-none"
                  style={{ borderColor: tokens.border }}
                  placeholder="1"
                />
              </Field>
            </div>

            <Field label="Message (optional)">
              <textarea
                value={form.note}
                onChange={update("note")}
                className="w-full px-4 py-3 rounded-2xl border outline-none min-h-[110px]"
                style={{ borderColor: tokens.border }}
                placeholder="Leave a short note…"
              />
            </Field>
          </div>

          <div
            className="px-6 sm:px-7 py-4 border-t flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between"
            style={{ borderColor: tokens.border }}
          >
            <div className="text-sm" style={{ color: tokens.subtext }}>
              RSVP saves locally for now.
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onCancel}
                className={cx(
                  "px-4 py-2 rounded-full border text-sm font-medium",
                  "hover:bg-neutral-50 active:translate-y-[1px] transition"
                )}
                style={{ borderColor: tokens.border, color: tokens.text }}
              >
                {secondaryText}
              </button>

              <button
                type="button"
                onClick={submit}
                className={cx(
                  "px-5 py-2 rounded-full text-sm font-semibold",
                  "shadow-[0_8px_18px_rgba(0,0,0,0.10)]",
                  "hover:translate-y-[-1px] active:translate-y-[1px] transition"
                )}
                style={{ background: tokens.primaryBg, color: tokens.primaryText }}
              >
                {primaryText}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-xs opacity-60">
          Next: we can add “Upload Guest Video” once storage is connected.
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div className="text-[11px] tracking-[0.2em] uppercase opacity-60">{label}</div>
      <div className="mt-2">{children}</div>
    </div>
  );
}
