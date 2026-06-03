import React, { useEffect, useMemo, useRef, useState } from "react";

const cx = (...c) => c.filter(Boolean).join(" ");

export default function TypewriterText({
  text = "",
  className,

  // typing behavior
  speedMs = 22,
  startDelayMs = 0,
  cursor = "▌",
  showCursor = true,
  cursorBlinkMs = 450,
  paused = false,

  // interaction
  skipOnClick = true,
  onDone,
  onChar,

  // audio blips
  beepEnabled = false,
  beepEvery = 2,          // beep every N chars
  beepVolume = 0.03,
  beepFrequency = 880,
  beepDurationMs = 18,

  // rendering
  as = "div",             // "div" | "p" | "span"
  preserveNewlines = true,
}) {
  const Tag = as;

  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [cursorOn, setCursorOn] = useState(true);

  const audioCtxRef = useRef(null);
  const tickingRef = useRef(false);

  const full = useMemo(() => String(text ?? ""), [text]);
  const visible = useMemo(() => full.slice(0, idx), [full, idx]);

  // Reset when text changes
  useEffect(() => {
    setIdx(0);
    setDone(false);
  }, [full]);

  // Cursor blink
  useEffect(() => {
    if (!showCursor) return;
    const t = setInterval(() => setCursorOn((v) => !v), cursorBlinkMs);
    return () => clearInterval(t);
  }, [showCursor, cursorBlinkMs]);

  // Typing loop
  useEffect(() => {
    if (paused) return;
    if (done) return;
    if (tickingRef.current) return;

    tickingRef.current = true;

    const start = () => {
      const tick = () => {
        setIdx((prev) => {
          const next = prev + 1;

          // call per-char callback
          const ch = full[next - 1];
          if (ch !== undefined) onChar?.(ch, next - 1);

          // beep
          if (beepEnabled && (next % Math.max(1, beepEvery)) === 0) {
            tryBeep(audioCtxRef, {
              volume: beepVolume,
              frequency: beepFrequency,
              durationMs: beepDurationMs,
            });
          }

          if (next >= full.length) {
            // finish
            setDone(true);
            queueMicrotask(() => onDone?.());
            return full.length;
          }

          return next;
        });

        tickingRef.current = false;
      };

      const t = setTimeout(tick, Math.max(0, speedMs));
      return () => clearTimeout(t);
    };

    let cleanup = null;

    if (startDelayMs > 0 && idx === 0) {
      const t = setTimeout(() => {
        cleanup = start();
      }, startDelayMs);
      cleanup = () => clearTimeout(t);
    } else {
      cleanup = start();
    }

    return () => {
      tickingRef.current = false;
      if (cleanup) cleanup();
    };
  }, [
    paused,
    done,
    idx,
    full,
    speedMs,
    startDelayMs,
    onDone,
    onChar,
    beepEnabled,
    beepEvery,
    beepVolume,
    beepFrequency,
    beepDurationMs,
  ]);

  const handleClick = () => {
    if (!skipOnClick) return;
    if (done) return;

    setIdx(full.length);
    setDone(true);
    onDone?.();
  };

  return (
    <Tag
      className={cx("font-pp", className)}
      onClick={handleClick}
      style={preserveNewlines ? { whiteSpace: "pre-wrap" } : undefined}
    >
      {visible}
      {showCursor ? <span className={cx(cursorOn ? "opacity-100" : "opacity-0")}>{cursor}</span> : null}
    </Tag>
  );
}

/* --- WebAudio beep (same style as LoadingRetro / EffectsHost) --- */
function tryBeep(audioCtxRef, { volume = 0.03, frequency = 880, durationMs = 18 }) {
  try {
    let ctx = audioCtxRef.current;
    if (!ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      ctx = new AudioContext();
      audioCtxRef.current = ctx;
    }

    // Browser policy: requires user gesture before audio starts
    if (ctx.state !== "running") return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "square";
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
