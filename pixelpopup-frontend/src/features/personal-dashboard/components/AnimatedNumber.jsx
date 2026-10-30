import { useLayoutEffect, useRef } from "react";

const numberFormat = new Intl.NumberFormat("en-PH", { maximumFractionDigits: 2 });
const formatNumber = (value) => value == null ? "—" : numberFormat.format(Number(value));

export default function AnimatedNumber({ value, format = formatNumber, digits = 2, duration = 800 }) {
  const display = useRef(null);
  const target = value == null || value === "" ? null : Number(value);
  const finalText = format(value, digits);

  useLayoutEffect(() => {
    const element = display.current;
    if (!element) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame;
    let observer;
    let started = false;
    const finish = () => {
      started = true;
      cancelAnimationFrame(frame);
      observer?.disconnect();
      element.textContent = finalText;
    };
    if (target == null || !Number.isFinite(target) || target === 0 || reduced.matches) {
      finish();
      return;
    }
    element.textContent = format(0, digits);
    const start = () => {
      if (started) return;
      started = true;
      observer?.disconnect();
      const began = performance.now();
      const tick = (now) => {
        const progress = Math.min(1, (now - began) / duration);
        if (progress === 1) { finish(); return; }
        const eased = 1 - (1 - progress) ** 3;
        element.textContent = format(target * eased, digits);
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };
    const motionChanged = () => { if (reduced.matches) finish(); };
    reduced.addEventListener("change", motionChanged);
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver((entries) => { if (entries.some((entry) => entry.isIntersecting)) start(); }, { threshold: 0.1 });
      observer.observe(element);
    } else start();
    return () => {
      finish();
      reduced.removeEventListener("change", motionChanged);
    };
  }, [target, finalText, format, digits, duration]);

  return <span className="inline-grid max-w-full tabular-nums">
    <span className="invisible col-start-1 row-start-1" aria-hidden="true">{finalText}</span>
    <span ref={display} className="col-start-1 row-start-1" aria-hidden="true">{finalText}</span>
    <span className="sr-only">{finalText}</span>
  </span>;
}
