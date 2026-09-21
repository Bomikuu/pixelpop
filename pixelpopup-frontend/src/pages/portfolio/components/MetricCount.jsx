import { useEffect, useRef, useState } from "react";

function formatMetric(value, precision) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(value);
}

export default function MetricCount({ value, suffix = "", precision = 0, label, detail, featured = false, icon: Icon }) {
  const rootRef = useRef(null);
  const [displayValue, setDisplayValue] = useState(() => {
    if (typeof window === "undefined") return value;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches || !window.IntersectionObserver ? value : 0;
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || !window.IntersectionObserver) return undefined;

    let frameId = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const startedAt = performance.now();
      const duration = featured ? 1450 : 1150;
      const animate = (now) => {
        const progress = Math.min((now - startedAt) / duration, 1);
        const eased = 1 - ((1 - progress) ** 4);
        setDisplayValue(value * eased);
        if (progress < 1) frameId = window.requestAnimationFrame(animate);
      };
      frameId = window.requestAnimationFrame(animate);
    }, { threshold: 0.35 });

    observer.observe(root);
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frameId);
    };
  }, [featured, value]);

  const finalText = `${formatMetric(value, precision)}${suffix}`;
  return (
    <div ref={rootRef} className={featured ? "py-8 sm:py-11" : "py-7"} aria-label={`${finalText} ${label}`}>
      <div className="mb-6 flex items-center justify-between gap-4">
        {Icon ? <span className={`${featured ? "size-11" : "size-9"} grid place-items-center border border-white/15 bg-white/5 text-blue-300`} aria-hidden="true"><Icon size={featured ? 20 : 17} /></span> : <span />}
        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-500">Evidence</span>
      </div>
      <span className="sr-only">{finalText}</span>
      <strong aria-hidden="true" className={`portfolio-display portfolio-metric-value block font-semibold leading-[0.88] text-white ${featured ? "text-[clamp(4rem,8vw,7.5rem)]" : "text-[clamp(2.4rem,4vw,4rem)]"}`}>
        {formatMetric(displayValue, precision)}{suffix}
      </strong>
      <span className={`mt-5 block font-semibold ${featured ? "text-base text-white" : "text-sm text-slate-200"}`}>{label}</span>
      {detail && <span className="mt-1 block text-sm leading-6 text-slate-400">{detail}</span>}
    </div>
  );
}
