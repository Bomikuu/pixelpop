import React, { useEffect, useMemo, useRef, useState } from "react";
import Window from "./Window";
import RetroPanel from "./Panel";

/**
 * LoadingRetro (enhanced)
 * Adds:
 * - fake scrolling file log
 * - optional beep SFX hook (WebAudio, no deps)
 * - randomized boot codes (0xC0FFEE style)
 */
export default function LoadingRetro({
  title = "LOADING",
  subtitle = "Please wait...",
  overlay = true,

  // Layout
  className,
  windowMaxWidthClass = "max-w-lg",
  windowWidthClass = "w-full",

  // Dots animation
  baseText = "Loading",
  showDots = true,
  dotIntervalMs = 350,
  maxDots = 3,

  // Progress
  // mode: "none" | "indeterminate" | "determinate"
  progressMode = "indeterminate",
  progress = 0, // 0..100 (only for determinate)
  progressLabel,

  // Status messages
  messages = [
    "Booting PixelPopup.exe…",
    "Warming up glitter engine…",
    "Calibrating sparkles…",
    "Negotiating with the love gods…",
    "Spawning confetti…",
  ],
  rotateMessages = true,
  messageIntervalMs = 1200,

  // Fake file log
  showLog = true,
  logIntervalMs = 180,
  maxLogLines = 10,
  logTemplates = [
    "Mounting /assets/{code}.pak",
    "Reading {code}.dll",
    "Loading shader: glitter_{code}.fx",
    "Patching love_protocol_{code}.dat",
    "Indexing memories_{code}.json",
    "Spawning sprite sheet: cute_{code}.png",
    "Allocating confetti buffer {code}",
    "Verifying romance checksum {code}",
    "Initializing popup driver {code}",
  ],

  // Beep SFX
  beepEnabled = true,
  beepIntervalMs = 900,
  beepVolume = 0.05,
  beepFrequency = 880,
  beepDurationMs = 35,

  // Styling tokens
  backgroundClassName = "pp-retro-bg",
  dimClassName = "bg-black/40",
  panelBg = "rgba(255,255,255,0.85)",
}) {
  const [dots, setDots] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);
  const [bootCode, setBootCode] = useState(() => randomHexCode());
  const [logLines, setLogLines] = useState(() => initialLog(logTemplates, 4));
  const audioCtxRef = useRef(null);

  // Dots
  useEffect(() => {
    if (!showDots) return;
    const t = setInterval(() => setDots((d) => (d + 1) % (maxDots + 1)), dotIntervalMs);
    return () => clearInterval(t);
  }, [showDots, dotIntervalMs, maxDots]);

  // Rotate status messages
  useEffect(() => {
    if (!rotateMessages || !messages?.length) return;
    const t = setInterval(() => {
      setMsgIndex((i) => (i + 1) % messages.length);
    }, messageIntervalMs);
    return () => clearInterval(t);
  }, [rotateMessages, messages, messageIntervalMs]);

  // Random boot code refresh
  useEffect(() => {
    const t = setInterval(() => setBootCode(randomHexCode()), 1400);
    return () => clearInterval(t);
  }, []);

  // Fake file list scrolling
  useEffect(() => {
    if (!showLog) return;
    const t = setInterval(() => {
      setLogLines((prev) => {
        const next = [...prev, renderLogLine(logTemplates)];
        return next.slice(Math.max(0, next.length - maxLogLines));
      });
    }, logIntervalMs);
    return () => clearInterval(t);
  }, [showLog, logIntervalMs, maxLogLines, logTemplates]);

  // Beep SFX tick
  useEffect(() => {
    if (!beepEnabled) return;

    // In browsers, audio often requires a user gesture first.
    // This hook is safe; it will beep once gesture has happened.
    const t = setInterval(() => {
      tryBeep(audioCtxRef, {
        volume: beepVolume,
        frequency: beepFrequency,
        durationMs: beepDurationMs,
      });
    }, beepIntervalMs);

    return () => clearInterval(t);
  }, [beepEnabled, beepIntervalMs, beepVolume, beepFrequency, beepDurationMs]);

  const loadingText = useMemo(() => {
    const d = showDots ? ".".repeat(dots) : "";
    return `${baseText}${d}`;
  }, [baseText, dots, showDots]);

  const computedProgressLabel = useMemo(() => {
    if (progressLabel) return progressLabel;
    if (progressMode === "determinate") {
      const p = Math.max(0, Math.min(100, Number(progress) || 0));
      return `Progress: ${p}% • BOOT ${bootCode}`;
    }
    if (progressMode === "indeterminate") return `Progress: ???% • BOOT ${bootCode}`;
    return `BOOT ${bootCode}`;
  }, [progressLabel, progressMode, progress, bootCode]);

  const isOverlay = overlay;

  return (
    <div
      className={[
        isOverlay ? "fixed inset-0 z-50" : "w-full",
        backgroundClassName,
        className || "",
      ].join(" ")}
    >
      {isOverlay ? <div className={`absolute inset-0 ${dimClassName}`} /> : null}

      <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
        <Window
          title={title}
          subtitle={subtitle}
          widthClass={windowWidthClass}
          maxWidthClass={windowMaxWidthClass}
          titlebarGradient
          closable={false}
          minimizable={false}
          maximizable={false}
        >
          <div className="space-y-4">
            <RetroPanel
              title="SYSTEM STATUS"
              bg={panelBg}
              rightSlot={
                <span className="font-pp text-xs opacity-70">
                  {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              }
            >
              <div className="font-pp font-extrabold text-sm md:text-base">
                {loadingText}
              </div>

              {messages?.length ? (
                <div className="mt-2 font-pp text-sm opacity-80">
                  {messages[Math.min(msgIndex, messages.length - 1)]}
                </div>
              ) : null}

              <div className="mt-3 font-pp text-xs opacity-75">{computedProgressLabel}</div>

              {progressMode !== "none" ? (
                <div className="mt-2">
                  <ProgressBar mode={progressMode} value={progress} />
                </div>
              ) : null}
            </RetroPanel>

            {showLog ? (
              <RetroPanel title="BOOT LOG" bg={panelBg}>
                <div
                  className="font-pp text-[11px] leading-5 max-h-40 overflow-hidden"
                  style={{ color: "#0f172a" }}
                >
                  {logLines.map((line, idx) => (
                    <div key={idx} className="truncate">
                      <span className="opacity-60">[{pad2(idx + 1)}]</span>{" "}
                      <span className="font-extrabold">{line}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 font-pp text-[11px] opacity-70">
                  Tip: click anywhere once if the beep is muted (browser audio policy).
                </div>
              </RetroPanel>
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              <RetroPanel title="TIP" bg={panelBg}>
                <div className="font-pp text-xs opacity-80">
                  Press <span className="font-extrabold">YES</span> to unlock the good ending.
                </div>
              </RetroPanel>

              <RetroPanel title="FUN FACT" bg={panelBg}>
                <div className="font-pp text-xs opacity-80">
                  This UI is legally powered by glitter.
                </div>
              </RetroPanel>
            </div>
          </div>

          <style>{`
            @keyframes pp-stripes {
              0% { background-position: 0 0; }
              100% { background-position: 40px 0; }
            }
            @keyframes pp-load {
              0% { transform: translateX(-60%); }
              100% { transform: translateX(260%); }
            }
          `}</style>
        </Window>
      </div>
    </div>
  );
}

function ProgressBar({ mode = "indeterminate", value = 0 }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));

  const frameStyle = {
    borderColor: "var(--pp-border)",
    background: "rgba(255,255,255,0.75)",
    boxShadow: "var(--pp-shadow)",
  };

  const stripes = {
    backgroundImage:
      "repeating-linear-gradient(90deg, var(--pp-accent) 0 10px, var(--pp-accent-2) 10px 20px)",
    backgroundSize: "40px 100%",
    animation: "pp-stripes 550ms linear infinite",
  };

  return (
    <div className="border-[3px] rounded-lg overflow-hidden" style={frameStyle}>
      {mode === "determinate" ? (
        <div
          className="h-4"
          style={{
            width: `${pct}%`,
            ...stripes,
            transition: "width 200ms ease",
          }}
        />
      ) : (
        <div
          className="h-4"
          style={{
            width: "40%",
            ...stripes,
            animation: "pp-load 900ms linear infinite, pp-stripes 550ms linear infinite",
          }}
        />
      )}
    </div>
  );
}

/* ---------------- Helpers ---------------- */

function randomHexCode() {
  // 0x + 6 hex digits (like 0xC0FFEE)
  const n = Math.floor(Math.random() * 0xffffff);
  return "0x" + n.toString(16).toUpperCase().padStart(6, "0");
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function renderLogLine(templates) {
  const tpl = templates[Math.floor(Math.random() * templates.length)] || "Loading {code}";
  const code = randomHexCode();
  return tpl.replaceAll("{code}", code);
}

function initialLog(templates, count) {
  const arr = [];
  for (let i = 0; i < count; i++) arr.push(renderLogLine(templates));
  return arr;
}

function tryBeep(audioCtxRef, { volume = 0.05, frequency = 880, durationMs = 35 }) {
  try {
    let ctx = audioCtxRef.current;
    if (!ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      ctx = new AudioContext();
      audioCtxRef.current = ctx;
    }

    // If suspended due to no user gesture, do nothing (it will work after first click)
    if (ctx.state !== "running") return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "square"; // retro beep
    osc.frequency.value = frequency;

    gain.gain.value = Math.max(0, Math.min(1, volume));

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();

    const stopAt = ctx.currentTime + durationMs / 1000;
    osc.stop(stopAt);
  } catch {
    // ignore
  }
}
