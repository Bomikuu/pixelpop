import React, { useMemo } from "react";
import { useWeddingConfig } from "./useWeddingConfig";

const cx = (...c) => c.filter(Boolean).join(" ");

export default function WeddingDetailsScene({
  title = "Wedding Details",
  names = null,

  details = null,

  primaryText = "RSVP",
  secondaryText = "Back",

  onPrimary,
  onSecondary,

  onOpenMap,
  onOpenSchedule,
  onOpenMessages,
  onOpenPersonalize,
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

  const detailsFinal = useMemo(() => {
    const d = details && typeof details === "object" ? details : {};
    return {
      date: d.date ?? "Saturday, June 15, 2026",
      time: d.time ?? "3:00 PM",
      ceremony: d.ceremony ?? "Ceremony at 3:00 PM",
      reception: d.reception ?? "Reception to follow",
      venue: d.venue ?? "Venue Name",
      address: d.address ?? "Davao City, Philippines",
      dressCode: d.dressCode ?? "Formal / Semi-formal",
      theme: d.theme ?? (theme === "retro" ? "Retro" : "Minimal Elegant"),
    };
  }, [details, theme]);

  const tokens = theme === "retro"
    ? {
        border: "rgba(0,0,0,0.18)",
        panelBg: "rgba(255,255,255,0.96)",
        label: "rgba(17,24,39,0.62)",
        text: "#111827",
        subtext: "rgba(17,24,39,0.72)",
        primaryBg: "linear-gradient(135deg, #7C3AED, #22D3EE)",
        primaryText: "#051923",
      }
    : {
        border: "rgba(0,0,0,0.08)",
        panelBg: "rgba(255,255,255,0.96)",
        label: "rgba(17,24,39,0.55)",
        text: "#111827",
        subtext: "rgba(17,24,39,0.72)",
        primaryBg: "linear-gradient(135deg, #C9A76A, #E6D2A8)",
        primaryText: "#231F20",
      };

  const showAnyQuick = Boolean(onOpenSchedule || onOpenMap || onOpenMessages || onOpenPersonalize);

  return (
    <div className="w-full">
      <div className="max-w-4xl mx-auto px-5 py-8">
        <div className="text-xs tracking-[0.35em] uppercase opacity-70">
          {namesFinal.bride} & {namesFinal.groom}
        </div>

        <div className="mt-3 text-3xl font-semibold" style={{ color: tokens.text }}>
          {title}
        </div>

        <div
          className={cx(
            "mt-5 rounded-3xl border bg-white",
            "shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
          )}
          style={{ borderColor: tokens.border, background: tokens.panelBg }}
        >
          <div className="p-6 sm:p-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Info label="Date" value={detailsFinal.date} border={tokens.border} labelColor={tokens.label} />
            <Info label="Time" value={detailsFinal.time} border={tokens.border} labelColor={tokens.label} />
            <Info label="Ceremony" value={detailsFinal.ceremony} border={tokens.border} labelColor={tokens.label} />
            <Info label="Reception" value={detailsFinal.reception} border={tokens.border} labelColor={tokens.label} />
            <Info label="Venue" value={detailsFinal.venue} border={tokens.border} labelColor={tokens.label} />
            <Info label="Address" value={detailsFinal.address} border={tokens.border} labelColor={tokens.label} />
            <Info label="Dress Code" value={detailsFinal.dressCode} border={tokens.border} labelColor={tokens.label} />
            <Info label="Theme" value={detailsFinal.theme} border={tokens.border} labelColor={tokens.label} />
          </div>

          <div
            className="px-6 sm:px-7 py-4 border-t flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between"
            style={{ borderColor: tokens.border }}
          >
            <div className="text-sm" style={{ color: tokens.subtext }}>
              {showAnyQuick ? "Quick actions available." : "—"}
            </div>

            <div className="flex items-center gap-3 flex-wrap justify-end">
              {onOpenSchedule ? (
                <button
                  type="button"
                  onClick={onOpenSchedule}
                  className={cx(
                    "px-4 py-2 rounded-full border text-sm font-medium",
                    "hover:bg-neutral-50 active:translate-y-[1px] transition"
                  )}
                  style={{ borderColor: tokens.border, color: tokens.text }}
                >
                  Schedule
                </button>
              ) : null}

              {onOpenMessages ? (
                <button
                  type="button"
                  onClick={onOpenMessages}
                  className={cx(
                    "px-4 py-2 rounded-full border text-sm font-medium",
                    "hover:bg-neutral-50 active:translate-y-[1px] transition"
                  )}
                  style={{ borderColor: tokens.border, color: tokens.text }}
                >
                  Messages
                </button>
              ) : null}

              {onOpenPersonalize ? (
                <button
                  type="button"
                  onClick={onOpenPersonalize}
                  className={cx(
                    "px-4 py-2 rounded-full border text-sm font-medium",
                    "hover:bg-neutral-50 active:translate-y-[1px] transition"
                  )}
                  style={{ borderColor: tokens.border, color: tokens.text }}
                >
                  Personalize
                </button>
              ) : null}

              {onOpenMap ? (
                <button
                  type="button"
                  onClick={onOpenMap}
                  className={cx(
                    "px-4 py-2 rounded-full border text-sm font-medium",
                    "hover:bg-neutral-50 active:translate-y-[1px] transition"
                  )}
                  style={{ borderColor: tokens.border, color: tokens.text }}
                >
                  Map
                </button>
              ) : null}

              <button
                type="button"
                onClick={onSecondary}
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
                onClick={onPrimary}
                className={cx(
                  "px-5 py-2 rounded-full text-sm font-semibold",
                  "shadow-[0_8px_18px_rgba(0,0,0,0.10)]",
                  "hover:translate-y-[-1px] active:translate-y-[1px] transition"
                )}
                style={{
                  background: tokens.primaryBg,
                  color: tokens.primaryText,
                }}
              >
                {primaryText}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-xs opacity-60">
          Tip: Schedule + Messages are separate scenes for Phase 1 polish.
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, border, labelColor }) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: border }}>
      <div className="text-[11px] tracking-[0.2em] uppercase" style={{ color: labelColor }}>
        {label}
      </div>
      <div className="mt-2 text-sm font-medium text-neutral-800">
        {value || "—"}
      </div>
    </div>
  );
}
