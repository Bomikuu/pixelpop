import { useEffect, useRef } from "react";

const radius = 46;
const circumference = 2 * Math.PI * radius;

export function QuizProgressRing({ value, label, animated = false }) {
  const ring = useRef(null);
  const number = useRef(null);
  const percentage = Math.max(0, Math.min(100, value));

  useEffect(() => {
    let frame = 0;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const paint = (amount) => {
      if (number.current) number.current.textContent = `${Math.round(amount)}%`;
      if (ring.current) ring.current.style.strokeDashoffset = String(circumference * (1 - amount / 100));
    };
    if (!animated || preference.matches) { paint(percentage); return undefined; }
    paint(0);
    let start;
    const tick = (now) => {
      if (start === undefined) start = now;
      const elapsed = Math.min((now - start) / 1000, 1);
      paint(percentage * (1 - (1 - elapsed) ** 3));
      if (elapsed < 1) frame = window.requestAnimationFrame(tick);
    };
    const settle = () => { if (preference.matches) { window.cancelAnimationFrame(frame); paint(percentage); } };
    preference.addEventListener("change", settle);
    frame = window.requestAnimationFrame(tick);
    return () => { window.cancelAnimationFrame(frame); preference.removeEventListener("change", settle); };
  }, [percentage, animated]);

  return <div className={`quiz-progress-ring ${animated ? "animated" : ""}`} role="img" aria-label={`${label}: ${percentage}%`}><svg viewBox="0 0 112 112" aria-hidden="true"><circle className="quiz-ring-track" cx="56" cy="56" r={radius} /><circle ref={ring} className="quiz-ring-value" cx="56" cy="56" r={radius} strokeDasharray={circumference} strokeDashoffset={animated ? circumference : circumference * (1 - percentage / 100)} /></svg><span ref={number} aria-hidden="true">{animated ? 0 : percentage}%</span></div>;
}

export function ScoreCelebration({ celebrate }) {
  if (!celebrate) return null;
  return <div className="quiz-score-celebration" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <i key={index} style={{ "--piece-index": index, "--piece-angle": `${index * 30}deg` }} />)}</div>;
}
