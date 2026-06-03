import React, { useMemo } from "react";
import { useWeddingConfig } from "./useWeddingConfig";

const cx = (...c) => c.filter(Boolean).join(" ");

export default function WeddingHeroScene({
  layout = "cover+circles",

  title = "WEDDING",
  subtitle = "You’re Invited",

  names = null,
  dateLine = null,
  locationLine = null,

  photos = null, // { coverUrl, brideUrl, groomUrl }

  primaryText = "View Details",
  secondaryText = "RSVP",

  onPrimary,
  onSecondary,
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

  const dateFinal = dateLine ?? cfg?.dateLine ?? "Saturday • June 15, 2026 • 3:00 PM";
  const locFinal = locationLine ?? cfg?.locationLine ?? "Davao City • Philippines";

  const photosFinal = useMemo(() => {
    const p = photos && typeof photos === "object" ? photos : {};
    const c = cfg?.photos && typeof cfg.photos === "object" ? cfg.photos : {};
    return {
      coverUrl: p.coverUrl ?? c.coverUrl ?? "",
      brideUrl: p.brideUrl ?? c.brideUrl ?? "",
      groomUrl: p.groomUrl ?? c.groomUrl ?? "",
    };
  }, [photos, cfg]);

  const tokens = theme === "retro"
    ? {
        border: "rgba(0,0,0,0.18)",
        panelBg: "rgba(255,255,255,0.96)",
        text: "#111827",
        subtext: "rgba(17,24,39,0.72)",
        pillBg: "rgba(0,0,0,0.06)",
        primaryBg: "linear-gradient(135deg, #7C3AED, #22D3EE)",
        primaryText: "#051923",
      }
    : {
        border: "rgba(0,0,0,0.10)",
        panelBg: "rgba(255,255,255,0.96)",
        text: "#111827",
        subtext: "rgba(17,24,39,0.72)",
        pillBg: "rgba(0,0,0,0.04)",
        primaryBg: "linear-gradient(135deg, #C9A76A, #E6D2A8)",
        primaryText: "#231F20",
      };

  const hasCover = Boolean(photosFinal.coverUrl);
  const hasBride = Boolean(photosFinal.brideUrl);
  const hasGroom = Boolean(photosFinal.groomUrl);

  return (
    <div className="w-full">
      <div className="max-w-5xl mx-auto px-5 py-8">
        <div className="text-xs tracking-[0.35em] uppercase opacity-70">
          {title}
        </div>

        <div className="mt-3 text-4xl sm:text-5xl font-semibold" style={{ color: tokens.text }}>
          {subtitle}
        </div>

        <div className="mt-2 text-sm" style={{ color: tokens.subtext }}>
          {namesFinal.bride} & {namesFinal.groom}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span
            className="text-[12px] px-3 py-1 rounded-full border"
            style={{ borderColor: tokens.border, background: tokens.pillBg, color: tokens.text }}
          >
            {dateFinal}
          </span>
          <span
            className="text-[12px] px-3 py-1 rounded-full border"
            style={{ borderColor: tokens.border, background: tokens.pillBg, color: tokens.text }}
          >
            {locFinal}
          </span>
          <span
            className="text-[12px] px-3 py-1 rounded-full border"
            style={{ borderColor: tokens.border, background: tokens.pillBg, color: tokens.text }}
          >
            Theme: {theme === "retro" ? "Retro" : "Minimal"}
          </span>
        </div>

        <div
          className={cx(
            "mt-6 rounded-3xl border overflow-hidden",
            "shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
          )}
          style={{ borderColor: tokens.border, background: tokens.panelBg }}
        >
          {/* Cover */}
          <div className="relative w-full aspect-[16/8] bg-neutral-100">
            {hasCover ? (
              <img
                src={photosFinal.coverUrl}
                alt="Cover"
                className="absolute inset-0 h-full w-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-sm text-neutral-600">
                No cover photo yet
              </div>
            )}

            {layout === "cover+circles" ? (
              <div className="absolute left-4 bottom-4 flex items-end gap-3">
                <CirclePhoto label="Bride" url={photosFinal.brideUrl} fallback={namesFinal.bride} border={tokens.border} />
                <CirclePhoto label="Groom" url={photosFinal.groomUrl} fallback={namesFinal.groom} border={tokens.border} />
              </div>
            ) : null}
          </div>

          {/* Actions */}
          <div
            className="px-6 sm:px-7 py-5 border-t flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between"
            style={{ borderColor: tokens.border }}
          >
            <div className="text-sm" style={{ color: tokens.subtext }}>
              Personalization is live: edit names/photos/theme in the Personalize scene.
            </div>

            <div className="flex items-center gap-3">
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

        {/* tiny hint */}
        <div className="mt-6 text-xs opacity-60">
          Tip: Theme affects styling tokens only — layout stays the same.
        </div>
      </div>
    </div>
  );
}

function CirclePhoto({ label, url, fallback, border }) {
  const initials = String(fallback || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((x) => x[0]?.toUpperCase())
    .join("");

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="h-16 w-16 sm:h-20 sm:w-20 rounded-full overflow-hidden border bg-white"
        style={{ borderColor: border }}
      >
        {url ? (
          <img src={url} alt={label} className="h-full w-full object-cover" draggable={false} />
        ) : (
          <div className="h-full w-full grid place-items-center text-xs font-semibold text-neutral-700">
            {initials || "—"}
          </div>
        )}
      </div>
      <div className="text-[10px] tracking-[0.2em] uppercase opacity-70">{label}</div>
    </div>
  );
}
