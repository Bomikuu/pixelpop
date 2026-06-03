import React, { useMemo } from "react";
import { useWeddingConfig } from "./useWeddingConfig";

const cx = (...c) => c.filter(Boolean).join(" ");

export default function WeddingThankYouScene({
  title = "Thank You",
  subtitle = "RSVP received",

  names = null,

  primaryText = "Back to Start",
  onPrimary,
}) {
  const { cfg } = useWeddingConfig();

  const theme = (cfg?.theme || "minimal") === "retro" ? "retro" : "minimal";

  const namesFinal = useMemo(() => {
    const fromProps = names && typeof names === "object" ? names : null;
    const fromCfg = cfg?.names && typeof cfg.names === "object" ? cfg.names : null;
    return {
      bride: fromProps?.bride ?? fromCfg?.bride ?? "Bride",
      groom: fromProps?.groom ?? fromCfg?.groom ?? "Groom",
    };
  }, [names, cfg]);

  const rsvp = cfg?.rsvp || null;

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
          <div className="p-6 sm:p-7">
            <div className="text-sm" style={{ color: tokens.subtext }}>
              We can’t wait to celebrate with you.
            </div>

            <div className="mt-4 rounded-2xl border p-4" style={{ borderColor: tokens.border }}>
              <div className="text-[11px] tracking-[0.2em] uppercase opacity-60">
                RSVP Summary
              </div>

              {rsvp ? (
                <div className="mt-2 text-sm text-neutral-800 space-y-1">
                  <div><span className="font-semibold">Name:</span> {rsvp.name || "—"}</div>
                  <div><span className="font-semibold">Attendance:</span> {rsvp.attendance || "—"}</div>
                  <div><span className="font-semibold">Guests:</span> {rsvp.guests || "—"}</div>
                  {rsvp.note ? <div><span className="font-semibold">Note:</span> {rsvp.note}</div> : null}
                </div>
              ) : (
                <div className="mt-2 text-sm text-neutral-700">
                  No RSVP details found (yet).
                </div>
              )}
            </div>
          </div>

          <div
            className="px-6 sm:px-7 py-4 border-t flex items-center justify-between"
            style={{ borderColor: tokens.border }}
          >
            <div className="text-sm" style={{ color: tokens.subtext }}>
              Theme: {theme === "retro" ? "Retro" : "Minimal"}
            </div>

            <button
              type="button"
              onClick={onPrimary}
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

        <div className="mt-6 text-xs opacity-60">
          Next: Guest Messages Scene (videos from friends abroad).
        </div>
      </div>
    </div>
  );
}
