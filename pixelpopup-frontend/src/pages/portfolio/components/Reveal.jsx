import { useEffect, useRef, useState } from "react";

export default function Reveal({ children, className = "", delay = 0, stagger = false, immediate = false }) {
  const elementRef = useRef(null);
  const [visible, setVisible] = useState(() => immediate || (
    typeof window !== "undefined"
    && (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !window.IntersectionObserver)
  ));

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (immediate || reducedMotion || !window.IntersectionObserver) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -12%" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [immediate]);

  return (
    <div
      ref={elementRef}
      className={`portfolio-reveal portfolio-reveal--delay-${delay} ${className}`}
      data-visible={visible}
      data-stagger={stagger || undefined}
    >
      {children}
    </div>
  );
}
