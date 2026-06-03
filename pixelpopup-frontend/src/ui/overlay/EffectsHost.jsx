import React, { useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { subscribeOverlay } from "./overlayBus";
import FloatingStickerLayer from "../retro/effects/FloatingStickerLayer";

const cx = (...c) => c.filter(Boolean).join(" ");

// Default assets (optional). You can replace these later.
// If you pass bg.imageUrl, it will override.
const DEFAULT_SPACE_BG =
  `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="320" height="320">
      <rect width="100%" height="100%" fill="#031B3A"/>
      <g fill="#FFFFFF" opacity="0.9">
        <circle cx="34" cy="44" r="2"/>
        <circle cx="88" cy="62" r="1.5"/>
        <circle cx="130" cy="40" r="1.2"/>
        <circle cx="210" cy="70" r="1.8"/>
        <circle cx="280" cy="110" r="1.3"/>
        <circle cx="50" cy="180" r="1.4"/>
        <circle cx="140" cy="210" r="1.9"/>
        <circle cx="260" cy="210" r="1.2"/>
        <circle cx="300" cy="250" r="1.8"/>
        <circle cx="70" cy="270" r="1.3"/>
        <circle cx="180" cy="290" r="1.5"/>
      </g>
      <g stroke="#FFFFFF" stroke-width="2" opacity="0.9">
        <path d="M240 26 h10 M245 21 v10"/>
        <path d="M20 120 h10 M25 115 v10"/>
        <path d="M280 170 h10 M285 165 v10"/>
        <path d="M120 120 h10 M125 115 v10"/>
      </g>
    </svg>
  `)}`;

export default function EffectsHost({ className }) {
  // Screen-level effects
  const [shake, setShake] = useState(null); // { ms, intensity }
  const [flash, setFlash] = useState(null); // { ms, opacity }
  const [glitch, setGlitch] = useState(null); // { ms, strength }
  const [trail, setTrail] = useState(null); // { ms }
  const [crtOn, setCrtOn] = useState(false);

  // VHS jitter + chromatic aberration overlay
  const [vhs, setVhs] = useState(null); // { ms, strength, aberration, noise }

  // Window-level shake target
  const [windowShake, setWindowShake] = useState(null); // { selector, ms, intensity }

  // NEW: Background layer state
  // { variant: "off"|"grid"|"space"|"nyan", imageUrl?, animate?, opacity?, gridSize? }
  const [bgFx, setBgFx] = useState({
    variant: "off",
    imageUrl: "",
    animate: true,
    opacity: 1,
    gridSize: 20,
  });

  // Timers
  const flashTimer = useRef(null);
  const shakeTimer = useRef(null);
  const glitchTimer = useRef(null);
  const trailTimer = useRef(null);
  const crtTimer = useRef(null);
  const windowShakeTimer = useRef(null);
  const vhsTimer = useRef(null);

  // Cursor trail state
  const [trailDots, setTrailDots] = useState([]);
  const trailOnRef = useRef(false);

  // WebAudio SFX
  const audioCtxRef = useRef(null);

  const styleVars = useMemo(() => {
    return {
      "--pp-shake-x": shake ? `${shake.intensity || 6}px` : "0px",
      "--pp-shake-y": shake ? `${shake.intensity || 6}px` : "0px",
      "--pp-glitch-strength": glitch ? glitch.strength || 8 : 0,

      "--pp-wshake-x": windowShake ? `${windowShake.intensity || 6}px` : "0px",
      "--pp-wshake-y": windowShake ? `${windowShake.intensity || 6}px` : "0px",

      "--pp-vhs-strength": vhs ? `${vhs.strength ?? 10}px` : "0px",
      "--pp-vhs-aberr": vhs ? `${vhs.aberration ?? 2}px` : "0px",
      "--pp-vhs-noise": vhs ? `${vhs.noise ?? 0.12}` : "0",

      // background vars
      "--pp-bg-opacity": String(bgFx?.opacity ?? 1),
      "--pp-bg-grid-size": `${bgFx?.gridSize ?? 20}px`,
    };
  }, [shake, glitch, windowShake, vhs, bgFx]);

  // Listen to overlay bus events
  useEffect(() => {
    return subscribeOverlay((evt) => {
      if (!evt) return;

      if (evt.type === "effect") {
        const p = evt.payload || {};
        const type = p.type;

        if (type === "confetti") return runConfetti(p);
        if (type === "shake") return runShake(p);
        if (type === "flash") return runFlash(p);
        if (type === "glitch") return runGlitch(p);
        if (type === "cursorTrail") return runCursorTrail(p);

        if (type === "crt") return runCrt(p);
        if (type === "windowShake") return runWindowShake(p);
        if (type === "sfx") return runSfx(p);
        if (type === "vhs") return runVhs(p);

        // NEW: background variants
        if (type === "bg") return runBg(p);
      }
    });
  }, []);

  // Cursor trail mouse listener
  useEffect(() => {
    const onMove = (ev) => {
      if (!trailOnRef.current) return;

      const x = ev.clientX;
      const y = ev.clientY;
      const id = `${Date.now()}_${Math.random()}`;

      setTrailDots((prev) => {
        const next = [...prev, { id, x, y, t: Date.now() }];
        return next.slice(-22);
      });
    };

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // Cleanup old trail dots
  useEffect(() => {
    if (!trailOnRef.current) return;
    const t = setInterval(() => {
      const now = Date.now();
      setTrailDots((prev) => prev.filter((d) => now - d.t < 450));
    }, 80);
    return () => clearInterval(t);
  }, [trail]);

  // Apply window shake class to target element
  useEffect(() => {
    if (!windowShake?.selector) return;
    const el = document.querySelector(windowShake.selector);
    if (!el) return;
    el.classList.add("pp-window-shake");
    return () => el.classList.remove("pp-window-shake");
  }, [windowShake]);

  function runConfetti(p) {
    const particleCount = p.particleCount ?? 120;
    const spread = p.spread ?? 70;
    const startVelocity = p.startVelocity ?? 35;
    const decay = p.decay ?? 0.9;
    const scalar = p.scalar ?? 1;
    const origin = p.origin ?? { x: 0.5, y: 0.55 };

    confetti({ particleCount, spread, startVelocity, decay, scalar, origin });

    if (p.doubleBurst) {
      setTimeout(() => {
        confetti({
          particleCount: Math.round(particleCount * 0.7),
          spread,
          startVelocity: Math.round(startVelocity * 0.9),
          decay,
          scalar,
          origin,
        });
      }, 180);
    }
  }

  function runShake(p) {
    const ms = p.ms ?? 420;
    const intensity = p.intensity ?? 6;

    setShake({ ms, intensity });
    clearTimeout(shakeTimer.current);
    shakeTimer.current = setTimeout(() => setShake(null), ms);
  }

  function runFlash(p) {
    const ms = p.ms ?? 180;
    const opacity = p.opacity ?? 0.65;

    setFlash({ ms, opacity });
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), ms);
  }

  function runGlitch(p) {
    const ms = p.ms ?? 520;
    const strength = p.strength ?? 8;

    setGlitch({ ms, strength });
    clearTimeout(glitchTimer.current);
    glitchTimer.current = setTimeout(() => setGlitch(null), ms);
  }

  function runCursorTrail(p) {
    const ms = p.ms ?? 1500;
    setTrail({ ms });
    trailOnRef.current = true;

    clearTimeout(trailTimer.current);
    trailTimer.current = setTimeout(() => {
      trailOnRef.current = false;
      setTrail(null);
      setTrailDots([]);
    }, ms);
  }

  function runCrt(p) {
    if (p.toggle) return setCrtOn((v) => !v);
    if (typeof p.on === "boolean") setCrtOn(p.on);

    if (p.ms && p.ms > 0) {
      setCrtOn(true);
      clearTimeout(crtTimer.current);
      crtTimer.current = setTimeout(() => setCrtOn(false), p.ms);
    }
  }

  function runWindowShake(p) {
    const selector = p.selector;
    if (!selector) return;

    const ms = p.ms ?? 420;
    const intensity = p.intensity ?? 6;

    setWindowShake({ selector, ms, intensity });

    clearTimeout(windowShakeTimer.current);
    windowShakeTimer.current = setTimeout(() => {
      const el = document.querySelector(selector);
      if (el) el.classList.remove("pp-window-shake");
      setWindowShake(null);
    }, ms);
  }

  function runSfx(p) {
    const name = p.name || "beep";
    const volume = p.volume ?? 0.05;

    if (name === "success") {
      playTone(audioCtxRef, { frequency: p.baseFreq ?? 880, durationMs: 45, volume });
      setTimeout(
        () => playTone(audioCtxRef, { frequency: (p.baseFreq ?? 880) * 1.25, durationMs: 55, volume }),
        60
      );
      return;
    }

    if (name === "error") {
      playTone(audioCtxRef, {
        frequency: p.baseFreq ?? 220,
        durationMs: 90,
        volume: volume * 1.1,
        type: "square",
      });
      setTimeout(
        () =>
          playTone(audioCtxRef, {
            frequency: (p.baseFreq ?? 220) * 0.75,
            durationMs: 120,
            volume: volume * 1.1,
            type: "square",
          }),
        90
      );
      return;
    }

    playTone(audioCtxRef, {
      frequency: p.baseFreq ?? 880,
      durationMs: p.durationMs ?? 35,
      volume,
      type: "square",
    });
  }

  function runVhs(p) {
    if (p.toggle) {
      setVhs((v) => (v ? null : { ms: 1200, strength: 10, aberration: 2, noise: 0.12 }));
      return;
    }

    if (typeof p.on === "boolean") {
      if (!p.on) return setVhs(null);

      setVhs({
        ms: p.ms ?? 1200,
        strength: p.strength ?? 10,
        aberration: p.aberration ?? 2,
        noise: p.noise ?? 0.12,
      });

      if (p.ms && p.ms > 0) {
        clearTimeout(vhsTimer.current);
        vhsTimer.current = setTimeout(() => setVhs(null), p.ms);
      }
      return;
    }

    const ms = p.ms ?? 1200;
    setVhs({
      ms,
      strength: p.strength ?? 10,
      aberration: p.aberration ?? 2,
      noise: p.noise ?? 0.12,
    });

    clearTimeout(vhsTimer.current);
    vhsTimer.current = setTimeout(() => setVhs(null), ms);
  }

  // NEW: background variants
  function runBg(p) {
    // p: { variant: "off"|"grid"|"space"|"nyan", imageUrl?, animate?, opacity?, gridSize? }
    const variant = p.variant || p.mode || "grid";

    if (variant === "toggle") {
      setBgFx((prev) => {
        const next = prev?.variant === "off" ? "grid" : "off";
        return { ...(prev || {}), variant: next };
      });
      return;
    }

    setBgFx((prev) => ({
      ...(prev || {}),
      variant,
      imageUrl: typeof p.imageUrl === "string" ? p.imageUrl : prev?.imageUrl || "",
      animate: typeof p.animate === "boolean" ? p.animate : prev?.animate ?? true,
      opacity: typeof p.opacity === "number" ? p.opacity : prev?.opacity ?? 1,
      gridSize: typeof p.gridSize === "number" ? p.gridSize : prev?.gridSize ?? 20,
    }));
  }

  const bgVariant = bgFx?.variant || "off";
  const bgUrl = bgFx?.imageUrl || (bgVariant === "nyan" ? "" : DEFAULT_SPACE_BG);
  const bgAnimate = bgFx?.animate ?? true;

  return (
    <>
      {/* GLOBAL background layer (BEHIND everything) */}
      {bgVariant !== "off" ? (
        <div
          className={cx(
            "fixed inset-0 pointer-events-none z-[-1]",
            "pp-bg-layer",
            bgVariant === "grid" ? "pp-bg-grid" : "",
            bgVariant === "space" ? "pp-bg-space" : "",
            bgVariant === "nyan" ? "pp-bg-nyan" : "",
            bgAnimate ? "pp-bg-anim" : ""
          )}
          style={{
            ...(bgVariant === "space" || bgVariant === "nyan"
              ? { backgroundImage: `url("${bgUrl || DEFAULT_SPACE_BG}")` }
              : {}),
          }}
        />
      ) : null}

      {/* GLOBAL sticker layer */}
      <FloatingStickerLayer />

      {/* Screen-level transforms layer */}
      <div
        className={cx(
          "fixed inset-0 pointer-events-none z-[9998]",
          shake ? "pp-shake" : "",
          glitch ? "pp-glitch" : "",
          className
        )}
        style={styleVars}
      />

      {/* VHS overlay */}
      {vhs ? <div className="fixed inset-0 pointer-events-none z-[9996] pp-vhs" style={styleVars} /> : null}

      {/* CRT scanlines */}
      {crtOn ? <div className="fixed inset-0 pointer-events-none z-[9997] pp-crt" /> : null}

      {/* Flash overlay */}
      {flash ? (
        <div
          className="fixed inset-0 pointer-events-none z-[9999]"
          style={{
            background: "white",
            opacity: flash.opacity ?? 0.6,
            mixBlendMode: "screen",
          }}
        />
      ) : null}

      {/* Cursor trail (your existing implementation) */}
      {trail ? (
        <div className="fixed inset-0 pointer-events-none z-[9999]">
          {trailDots.map((d) => (
            <span
              key={d.id}
              className="absolute"
              style={{
                left: d.x,
                top: d.y,
                transform: "translate(-50%, -50%)",
                width: 10,
                height: 10,
                borderRadius: 999,
                border: "2px solid var(--pp-border)",
                background:
                  "repeating-linear-gradient(90deg, var(--pp-accent) 0 6px, var(--pp-accent-2) 6px 12px)",
                boxShadow: "var(--pp-shadow)",
              }}
            />
          ))}
        </div>
      ) : null}

      <style>{`
        /* ===== Background layer ===== */
        .pp-bg-layer{
          opacity: var(--pp-bg-opacity, 1);
          transform: translateZ(0);
        }

        /* Grid variant (your pp-retro-bg but global) */
        .pp-bg-grid{
          background:
            linear-gradient(transparent calc(var(--pp-bg-grid-size) - 1px), rgba(15,23,42,0.12) var(--pp-bg-grid-size)),
            linear-gradient(90deg, transparent calc(var(--pp-bg-grid-size) - 1px), rgba(15,23,42,0.12) var(--pp-bg-grid-size));
          background-size: var(--pp-bg-grid-size) var(--pp-bg-grid-size);
          background-color: var(--pp-bg, #ECE9FF);
        }

        /* Space variant */
        .pp-bg-space{
          background-color: #021227;
          background-repeat: repeat;
          background-size: 520px 520px;
          image-rendering: pixelated;
          filter: saturate(0.9) contrast(1.05);
        }

        /* Nyan variant (space + rainbow drift overlay) */
        .pp-bg-nyan{
          background-color: #021227;
          background-repeat: repeat;
          background-size: 520px 520px;
          image-rendering: pixelated;
          filter: saturate(1) contrast(1.05);
        }

        .pp-bg-nyan::before{
          content:"";
          position:absolute;
          inset:0;
          pointer-events:none;
          opacity: 0.18;
          background:
            repeating-linear-gradient(
              90deg,
              rgba(255,0,0,0.35) 0 16px,
              rgba(255,165,0,0.35) 16px 32px,
              rgba(255,255,0,0.35) 32px 48px,
              rgba(0,255,0,0.35) 48px 64px,
              rgba(0,255,255,0.35) 64px 80px,
              rgba(0,0,255,0.35) 80px 96px,
              rgba(255,0,255,0.35) 96px 112px
            );
          mix-blend-mode: screen;
        }

        .pp-bg-anim.pp-bg-space{
          animation: ppBgDrift 14s linear infinite;
        }
        .pp-bg-anim.pp-bg-nyan{
          animation: ppBgDrift 16s linear infinite;
        }
        .pp-bg-anim.pp-bg-nyan::before{
          animation: ppNyanRainbow 6s linear infinite;
        }

        @keyframes ppBgDrift{
          0% { background-position: 0 0; }
          100% { background-position: -520px -260px; }
        }
        @keyframes ppNyanRainbow{
          0% { transform: translate3d(0,0,0); }
          100% { transform: translate3d(-220px,0,0); }
        }

        /* ===== Existing effects ===== */
        .pp-shake { animation: ppShake 70ms infinite; }
        @keyframes ppShake {
          0% { transform: translate(0, 0); }
          25% { transform: translate(var(--pp-shake-x), 0); }
          50% { transform: translate(0, var(--pp-shake-y)); }
          75% { transform: translate(calc(var(--pp-shake-x) * -1), 0); }
          100% { transform: translate(0, calc(var(--pp-shake-y) * -1)); }
        }

        .pp-glitch {
          animation: ppGlitch 120ms infinite;
          backdrop-filter: contrast(1.2) saturate(1.4);
          filter: hue-rotate(12deg) contrast(1.2);
          opacity: 0.65;
          mix-blend-mode: overlay;
        }
        @keyframes ppGlitch {
          0% { transform: translate(0, 0); }
          33% { transform: translate(calc(var(--pp-glitch-strength) * 1px), 0); }
          66% { transform: translate(0, calc(var(--pp-glitch-strength) * -1px)); }
          100% { transform: translate(calc(var(--pp-glitch-strength) * -1px), 0); }
        }

        .pp-window-shake { animation: ppWShake 70ms infinite; }
        @keyframes ppWShake {
          0% { transform: translate(0, 0); }
          25% { transform: translate(var(--pp-wshake-x), 0); }
          50% { transform: translate(0, var(--pp-wshake-y)); }
          75% { transform: translate(calc(var(--pp-wshake-x) * -1), 0); }
          100% { transform: translate(0, calc(var(--pp-wshake-y) * -1)); }
        }

        .pp-crt {
          background:
            linear-gradient(to bottom, rgba(0,0,0,0.18), rgba(0,0,0,0.10)),
            repeating-linear-gradient(
              to bottom,
              rgba(0,0,0,0.12) 0px,
              rgba(0,0,0,0.12) 1px,
              rgba(255,255,255,0.02) 2px,
              rgba(255,255,255,0.02) 4px
            );
          mix-blend-mode: multiply;
          opacity: 0.7;
        }

        .pp-vhs {
          opacity: 0.55;
          mix-blend-mode: overlay;
          filter: contrast(1.15) saturate(1.25);
          animation: ppVhsJitter 90ms infinite steps(2, end);
        }

        .pp-vhs::before,
        .pp-vhs::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .pp-vhs::before {
          background:
            repeating-linear-gradient(
              to bottom,
              rgba(255,255,255,0.03) 0px,
              rgba(255,255,255,0.03) 1px,
              rgba(0,0,0,0.03) 2px,
              rgba(0,0,0,0.03) 3px
            );
          opacity: var(--pp-vhs-noise);
        }

        .pp-vhs::after {
          background:
            linear-gradient(90deg,
              rgba(255,0,70,0.18),
              rgba(0,255,255,0.18)
            );
          transform: translateX(var(--pp-vhs-aberr));
          mix-blend-mode: screen;
          opacity: 0.35;
        }

        @keyframes ppVhsJitter {
          0%   { transform: translate(0, 0); }
          20%  { transform: translate(calc(var(--pp-vhs-strength) * 0.12), 0); }
          40%  { transform: translate(calc(var(--pp-vhs-strength) * -0.10), 0); }
          60%  { transform: translate(calc(var(--pp-vhs-strength) * 0.08), 0); }
          80%  { transform: translate(calc(var(--pp-vhs-strength) * -0.06), 0); }
          100% { transform: translate(0, 0); }
        }
      `}</style>
    </>
  );
}

/* ---------- WebAudio helper ---------- */
function playTone(audioCtxRef, { frequency = 880, durationMs = 35, volume = 0.05, type = "square" }) {
  try {
    let ctx = audioCtxRef.current;
    if (!ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      ctx = new AudioContext();
      audioCtxRef.current = ctx;
    }
    if (ctx.state !== "running") return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.value = Math.max(0, Math.min(1, volume));

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
  } catch {
    // ignore
  }
}

// Keep this export because your OverlayHost uses it
export function dispatchEffect(payload) {
  // optional convenience passthrough if you also want to call without overlayBus
  window.dispatchEvent(new CustomEvent("pp_effect", { detail: payload }));
}
