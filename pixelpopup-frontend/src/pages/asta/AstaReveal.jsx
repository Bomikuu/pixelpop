import { useEffect, useRef } from "react";

export default function AstaReveal({ as = "div", className = "", children, delay = 0, ...props }) {
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return undefined;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      element.dataset.visible = "true";
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        element.dataset.visible = "true";
        observer.unobserve(element);
      },
      { threshold: 0.14, rootMargin: "0px 0px -8%" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const revealProps = {
    ref: elementRef,
    className: `asta-reveal ${className}`.trim(),
    style: { "--asta-reveal-delay": `${delay}ms` },
    ...props,
  };

  if (as === "li") return <li {...revealProps}>{children}</li>;
  if (as === "article") return <article {...revealProps}>{children}</article>;
  return <div {...revealProps}>{children}</div>;
}
