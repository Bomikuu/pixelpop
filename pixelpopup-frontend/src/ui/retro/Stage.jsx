import React, { useEffect, useMemo } from "react";
import { overlay } from "../overlay";

const cx = (...c) => c.filter(Boolean).join(" ");

function normVariant(v) {
  if (!v) return "off";
  const x = String(v).toLowerCase();
  if (x === "none") return "off";
  return x; // grid | space | nyan | off
}

/**
 * RetroStage
 * - Wraps your app/scene
 * - Applies a "style variant" by setting CSS variables
 * - Activates EffectsHost features via overlay.effect(...) based on props
 *
 * Props:
 *  variant: "classic" | "space" | "nyan" | "dark" | "custom"
 *  bg: { mode: "grid"|"space"|"nyan"|"off", imageUrl?, animate?, opacity?, gridSize? }
 *  fx: { crt?, vhs?, cursorTrail? }  (booleans or objects)
 *
 * Notes:
 * - This component DOES NOT render EffectsHost — OverlayHost already does.
 * - It simply sends effect events so EffectsHost turns things on/off.
 */
export default function RetroStage({
  className,
  style,
  children,

  // Style variant (tokens)
  variant = "classic",

  // Background effect (handled by EffectsHost "bg")
  bg = { mode: "off" },

  // FX toggles (handled by EffectsHost)
  fx = {
    crt: false,
    vhs: false,
    cursorTrail: null, // { ms } for timed or { on:true } if you add "on" support later
  },

  // Optional: apply tokens directly
  tokens,
}) {
  const resolvedTokens = useMemo(() => {
    // Defaults (keep minimal — your app already has vars; we only override if asked)
    const presets = {
      classic: {
        "--pp-bg": "var(--pp-bg, #ECE9FF)",
        "--pp-grid": "var(--pp-grid, rgba(15,23,42,0.14))",
      },
      dark: {
        "--pp-bg": "#0b1220",
        "--pp-grid": "rgba(255,255,255,0.10)",
      },
      space: {
        "--pp-bg": "#021227",
        "--pp-grid": "rgba(255,255,255,0.10)",
      },
      nyan: {
        "--pp-bg": "#021227",
        "--pp-grid": "rgba(255,255,255,0.10)",
      },
      custom: {},
    };

    return {
      ...(presets[variant] || presets.classic),
      ...(tokens || {}),
    };
  }, [variant, tokens]);

  // Drive EffectsHost background
  useEffect(() => {
    const mode = normVariant(bg?.mode);
    overlay.effect({
      type: "bg",
      variant: mode,
      imageUrl: bg?.imageUrl,
      animate: bg?.animate,
      opacity: bg?.opacity,
      gridSize: bg?.gridSize,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bg?.mode, bg?.imageUrl, bg?.animate, bg?.opacity, bg?.gridSize]);

  // Drive CRT
  useEffect(() => {
    if (typeof fx?.crt === "boolean") {
      overlay.effect({ type: "crt", on: fx.crt });
      return;
    }
    // allow object form if you want timed CRT, ex: { ms: 1500 }
    if (fx?.crt && typeof fx.crt === "object") {
      overlay.effect({ type: "crt", ...fx.crt });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fx?.crt]);

  // Drive VHS
  useEffect(() => {
    if (typeof fx?.vhs === "boolean") {
      overlay.effect({ type: "vhs", on: fx.vhs });
      return;
    }
    if (fx?.vhs && typeof fx.vhs === "object") {
      // e.g. { on:true, strength:10, aberration:2, noise:0.12, ms:1200 }
      overlay.effect({ type: "vhs", ...fx.vhs });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fx?.vhs]);

  // Cursor trail (your current implementation is timed via ms)
  useEffect(() => {
    if (!fx?.cursorTrail) return;

    // If you pass true, use a sane default
    if (fx.cursorTrail === true) {
      overlay.effect({ type: "cursorTrail", ms: 999999999 }); // “effectively permanent”
      return;
    }

    if (typeof fx.cursorTrail === "number") {
      overlay.effect({ type: "cursorTrail", ms: fx.cursorTrail });
      return;
    }

    if (typeof fx.cursorTrail === "object") {
      overlay.effect({ type: "cursorTrail", ...fx.cursorTrail });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fx?.cursorTrail]);

  return (
    <div
      className={cx("pp-stage", className)}
      style={{
        ...resolvedTokens,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
